import { AnomalyModel } from '../../schemas/anomaly.schema';
import { VolumeAnomaly, SentimentAnomaly } from './index';

export interface AnomalyFilter {
  organizationId: string;
  status?: string;
  type?: string;
  severity?: string;
  hours?: number | string;
}

export interface AnomalyPagination {
  limit: number;
  offset: number;
}

export interface AnomalyStats {
  totalActive: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  recentActivity: number;
  timeWindow: string;
}

export interface AnomalyAction {
  userId: string;
  notes?: string;
}

export class AnomalyService {
  /**
   * Get anomalies with filtering and pagination
   */
  async getAnomalies(filter: AnomalyFilter, pagination: AnomalyPagination) {
    const { organizationId, status, type, severity, hours } = filter;
    const { limit, offset } = pagination;

    // Build filter
    const queryFilter: any = { organizationId };
    
    if (status && status !== 'all') {
      queryFilter.status = status;
    }
    
    if (type) {
      queryFilter.type = type;
    }
    
    if (severity) {
      queryFilter.severity = severity;
    }

    // Time filter
    if (hours && hours !== 'all') {
      const hoursNum = typeof hours === 'string' ? parseInt(hours) : hours;
      queryFilter.createdAt = { $gte: new Date(Date.now() - hoursNum * 60 * 60 * 1000) };
    }

    // Get anomalies with pagination
    const anomalies = await AnomalyModel.find(queryFilter)
      .sort({ severity: -1, createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .populate('organizationId', 'name');

    // Get total count for pagination
    const totalCount = await AnomalyModel.countDocuments(queryFilter);

    return {
      anomalies,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: totalCount > offset + anomalies.length
      }
    };
  }

  /**
   * Get anomaly statistics for an organization
   */
  async getAnomalyStats(organizationId: string, hours: number = 24): Promise<AnomalyStats> {
    const hoursNum = parseInt(hours.toString());

    const [totalActive, bySeverity, byType, recentActivity] = await Promise.all([
      AnomalyModel.countDocuments({ 
        organizationId, 
        status: 'active' 
      }),
      AnomalyModel.aggregate([
        { $match: { organizationId, status: 'active' } },
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ]),
      AnomalyModel.aggregate([
        { $match: { organizationId, status: 'active' } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      AnomalyModel.countDocuments({
        organizationId,
        createdAt: { $gte: new Date(Date.now() - hoursNum * 60 * 60 * 1000) }
      })
    ]);

    const severityStats = bySeverity.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as Record<string, number>);

    const typeStats = byType.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalActive,
      bySeverity: severityStats,
      byType: typeStats,
      recentActivity,
      timeWindow: `${hoursNum}h`
    };
  }

  /**
   * Get a specific anomaly by ID
   */
  async getAnomalyById(id: string, organizationId: string) {
    return await AnomalyModel.findOne({ 
      _id: id, 
      organizationId 
    }).populate('organizationId', 'name');
  }

  /**
   * Acknowledge an anomaly
   */
  async acknowledgeAnomaly(id: string, organizationId: string, action: AnomalyAction) {
    const anomaly = await AnomalyModel.findOne({ 
      _id: id, 
      organizationId 
    });

    if (!anomaly) {
      throw new Error('Anomaly not found');
    }

    anomaly.status = 'acknowledged';
    anomaly.acknowledgedBy = action.userId;
    anomaly.acknowledgedAt = new Date();
    await anomaly.save();

    return anomaly;
  }

  /**
   * Resolve an anomaly
   */
  async resolveAnomaly(id: string, organizationId: string, action: AnomalyAction) {
    const anomaly = await AnomalyModel.findOne({ 
      _id: id, 
      organizationId 
    });

    if (!anomaly) {
      throw new Error('Anomaly not found');
    }

    anomaly.status = 'resolved';
    anomaly.resolvedBy = action.userId;
    anomaly.resolvedAt = new Date();
    if (action.notes) anomaly.resolutionNotes = action.notes;
    await anomaly.save();

    return anomaly;
  }

  /**
   * Mark an anomaly as false positive
   */
  async markAsFalsePositive(id: string, organizationId: string, action: AnomalyAction) {
    const anomaly = await AnomalyModel.findOne({ 
      _id: id, 
      organizationId 
    });

    if (!anomaly) {
      throw new Error('Anomaly not found');
    }

    anomaly.status = 'false_positive';
    anomaly.resolvedBy = action.userId;
    anomaly.resolvedAt = new Date();
    if (action.notes) anomaly.resolutionNotes = action.notes;
    await anomaly.save();

    return anomaly;
  }

  /**
   * Store new anomalies from detection results
   */
  async storeAnomalies(anomalies: (VolumeAnomaly | SentimentAnomaly)[], organizationId: string) {
    let newAnomaliesStored = 0;

    for (const anomaly of anomalies) {
      try {
        // Check if we already have a similar anomaly for this organization
        const existingAnomaly = await AnomalyModel.findOne({
          organizationId,
          type: 'currentValue' in anomaly ? 'volume' : 'sentiment',
          status: { $in: ['active', 'acknowledged'] },
          createdAt: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) } // Last 2 hours
        });

        if (existingAnomaly) {
          // Update existing anomaly if severity has changed
          if (existingAnomaly.severity !== anomaly.severity) {
            existingAnomaly.severity = anomaly.severity;
            existingAnomaly.metadata.confidence = anomaly.confidence;
            existingAnomaly.updatedAt = new Date();
            await existingAnomaly.save();
          }
          continue; // Skip storing duplicate
        }

        // Store new anomaly
        const anomalyType = 'currentValue' in anomaly ? 'volume' : 'sentiment';
        const metadata: any = {
          confidence: anomaly.confidence,
          timeWindow: '24h',
          affectedMetrics: [anomalyType === 'volume' ? 'ticket_volume' : 'sentiment_score']
        };

        // Add type-specific properties
        if (anomalyType === 'volume' && 'currentValue' in anomaly) {
          metadata.currentValue = anomaly.currentValue;
          metadata.expectedValue = anomaly.expectedValue;
          metadata.zScore = anomaly.zScore;
        } else if (anomalyType === 'sentiment' && 'currentSentiment' in anomaly) {
          metadata.currentSentiment = anomaly.currentSentiment;
          metadata.baselineSentiment = anomaly.baselineSentiment;
          metadata.shiftMagnitude = anomaly.shiftMagnitude;
        }

        await AnomalyModel.create({
          type: anomalyType,
          severity: anomaly.severity,
          organizationId,
          timestamp: anomaly.timestamp,
          description: anomaly.description,
          metadata
        });

        newAnomaliesStored++;
      } catch (error) {
        console.error(`Error storing anomaly:`, error);
      }
    }

    return newAnomaliesStored;
  }

  /**
   * Clean up old anomalies
   */
  async cleanupOldAnomalies(daysOld: number = 7) {
    const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    const result = await AnomalyModel.deleteMany({
      createdAt: { $lt: cutoff }
    });
    return result.deletedCount;
  }
}

export default AnomalyService;
