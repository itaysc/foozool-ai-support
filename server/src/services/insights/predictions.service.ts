import { InsightModel } from '../../schemas/insights.schema';
import { PredictionModel } from '../../schemas/prediction.schema';
import mongoose from 'mongoose';
import crypto from 'crypto';

export interface PredictionInsight {
  ticketId: string;
  escalationRisk: 'Low' | 'Medium' | 'High';
  csatRisk: 'Low' | 'Medium' | 'High';
  longResolutionPredicted: boolean;
  confidence: number;
  createdAt: Date;
}

export interface PredictionSummary {
  totalPredictions: number;
  highEscalationRisk: number;
  highCSATRisk: number;
  escalationRiskPercentage: number;
  csatRiskPercentage: number;
  avgEscalationConfidence: number;
  avgCSATConfidence: number;
  longResolutionPredictions: number;
  longResolutionPercentage: number;
}

export interface AccuracyAnalysis {
  totalChecked: number;
  escalationAccuracy: {
    correct: number;
    total: number;
    percentage: number;
  };
  csatAccuracy: {
    correct: number;
    total: number;
    percentage: number;
  };
  overallAccuracy: number;
  confidenceBreakdown: {
    high: { correct: number; total: number; percentage: number };
    medium: { correct: number; total: number; percentage: number };
    low: { correct: number; total: number; percentage: number };
  };
  resolutionTimeAccuracy: {
    correct: number;
    total: number;
    percentage: number;
  };
  avgResolutionTime: number;
  avgPredictedLongResolutionTime: number;
}

export class PredictionInsightsService {
  /**
   * Generate a deterministic cluster ID for prediction insights
   */
  private static generateClusterId(ticketId: string, organizationId: string): string {
    const content = `prediction:${ticketId}:${organizationId}`;
    return `pred:${crypto.createHash('sha256').update(content).digest('hex').substring(0, 16)}`;
  }

  /**
   * Save prediction as an insight
   */
  static async savePredictionAsInsight(
    ticketId: string,
    organizationId: string,
    customerId: string | null,
    customerName: string | null,
    prediction: {
      predictedEscalation: { risk: 'Low' | 'Medium' | 'High'; confidence: number };
      predictedCSAT: { risk: 'Low' | 'Medium' | 'High'; confidence: number };
      longResolutionPredicted?: boolean;
      predictionConfidence?: number;
    }
  ): Promise<void> {
    const clusterId = this.generateClusterId(ticketId, organizationId);
    
    // Determine severity based on highest risk
    const escalationRisk = prediction.predictedEscalation.risk;
    const csatRisk = prediction.predictedCSAT.risk;
    const isLongResolution = prediction.longResolutionPredicted || false;
    
    let severity: 'red' | 'yellow' | 'green' = 'green';
    if (escalationRisk === 'High' || csatRisk === 'High' || isLongResolution) {
      severity = 'red';
    } else if (escalationRisk === 'Medium' || csatRisk === 'Medium') {
      severity = 'yellow';
    }

    // Create insight description
    const riskFactors: string[] = [];
    if (escalationRisk === 'High') riskFactors.push('High escalation risk');
    if (csatRisk === 'High') riskFactors.push('High CSAT risk');
    if (isLongResolution) riskFactors.push('Long resolution predicted');
    
    const issueDescription = `Ticket ${ticketId} has ${riskFactors.join(', ')}. ` +
      `Escalation risk: ${escalationRisk} (${Math.round(prediction.predictedEscalation.confidence * 100)}% confidence), ` +
      `CSAT risk: ${csatRisk} (${Math.round(prediction.predictedCSAT.confidence * 100)}% confidence)`;

    const insightData = {
      clusterId,
      organizationId: new mongoose.Types.ObjectId(organizationId),
      insightType: 'customer_success' as const,
      issueDescription,
      ticketVolume: 1,
      growthRate: 0,
      firstDetectedAt: new Date(),
      lastUpdatedAt: new Date(),
      customerId: customerId ? new mongoose.Types.ObjectId(customerId) : undefined,
      customerName,
      status: 'new' as const,
      metadata: {
        ticketId,
        predictionType: 'ticket_prediction',
        escalationRisk: prediction.predictedEscalation.risk,
        escalationConfidence: prediction.predictedEscalation.confidence,
        csatRisk: prediction.predictedCSAT.risk,
        csatConfidence: prediction.predictedCSAT.confidence,
        longResolutionPredicted: prediction.longResolutionPredicted || false,
        predictionConfidence: prediction.predictionConfidence || 0,
        severity,
        originalPrediction: prediction
      }
    };

    await InsightModel.findOneAndUpdate(
      { clusterId },
      insightData,
      { upsert: true, new: true }
    );
  }

  /**
   * Get prediction insights for an organization
   */
  static async getPredictionInsightsByOrganization(
    organizationId: string,
    customerId?: string,
    limit: number = 20
  ): Promise<PredictionInsight[]> {
    const query: any = {
      organizationId: new mongoose.Types.ObjectId(organizationId),
      insightType: 'customer_success',
      'metadata.predictionType': 'ticket_prediction'
    };

    if (customerId) {
      query.customerId = new mongoose.Types.ObjectId(customerId);
    }

    const insights = await InsightModel.find(query)
      .sort({ lastUpdatedAt: -1 })
      .limit(limit)
      .lean();

    return insights.map(insight => ({
      ticketId: insight.metadata?.ticketId || '',
      escalationRisk: insight.metadata?.escalationRisk || 'Low',
      csatRisk: insight.metadata?.csatRisk || 'Low',
      longResolutionPredicted: insight.metadata?.longResolutionPredicted || false,
      confidence: insight.metadata?.predictionConfidence || 0,
      createdAt: insight.lastUpdatedAt
    }));
  }

  /**
   * Get prediction analytics summary for an organization
   */
  static async getPredictionSummary(organizationId: string, customerId?: string): Promise<PredictionSummary> {
    const query: any = {
      organizationId: new mongoose.Types.ObjectId(organizationId),
      insightType: 'customer_success',
      'metadata.predictionType': 'ticket_prediction',
      lastUpdatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    };

    if (customerId) {
      query.customerId = new mongoose.Types.ObjectId(customerId);
    }

    const recentInsights = await InsightModel.find(query).lean();

    const totalPredictions = recentInsights.length;
    const highEscalationRisk = recentInsights.filter(i => i.metadata?.escalationRisk === 'High').length;
    const highCSATRisk = recentInsights.filter(i => i.metadata?.csatRisk === 'High').length;
    const longResolutionPredictions = recentInsights.filter(i => i.metadata?.longResolutionPredicted === true).length;
    
    const avgEscalationConfidence = totalPredictions > 0 
      ? recentInsights.reduce((sum, i) => sum + (i.metadata?.escalationConfidence || 0), 0) / totalPredictions 
      : 0;
    
    const avgCSATConfidence = totalPredictions > 0 
      ? recentInsights.reduce((sum, i) => sum + (i.metadata?.csatConfidence || 0), 0) / totalPredictions 
      : 0;

    return {
      totalPredictions,
      highEscalationRisk,
      highCSATRisk,
      escalationRiskPercentage: totalPredictions > 0 ? (highEscalationRisk / totalPredictions) * 100 : 0,
      csatRiskPercentage: totalPredictions > 0 ? (highCSATRisk / totalPredictions) * 100 : 0,
      avgEscalationConfidence: Math.round(avgEscalationConfidence * 100) / 100,
      avgCSATConfidence: Math.round(avgCSATConfidence * 100) / 100,
      longResolutionPredictions,
      longResolutionPercentage: totalPredictions > 0 ? (longResolutionPredictions / totalPredictions) * 100 : 0,
    };
  }

  /**
   * Get high-risk prediction insights for an organization
   */
  static async getHighRiskPredictionInsights(organizationId: string, customerId?: string, limit: number = 50): Promise<PredictionInsight[]> {
    const query: any = {
      organizationId: new mongoose.Types.ObjectId(organizationId),
      insightType: 'customer_success',
      'metadata.predictionType': 'ticket_prediction',
      $or: [
        { 'metadata.escalationRisk': 'High' },
        { 'metadata.csatRisk': 'High' }
      ]
    };

    if (customerId) {
      query.customerId = new mongoose.Types.ObjectId(customerId);
    }

    const highRiskInsights = await InsightModel.find(query)
      .sort({ lastUpdatedAt: -1 })
      .limit(limit)
      .lean();
      
    return highRiskInsights.map(insight => ({
      ticketId: insight.metadata?.ticketId || '',
      escalationRisk: insight.metadata?.escalationRisk || 'Low',
      csatRisk: insight.metadata?.csatRisk || 'Low',
      longResolutionPredicted: insight.metadata?.longResolutionPredicted || false,
      confidence: insight.metadata?.predictionConfidence || 0,
      createdAt: insight.lastUpdatedAt
    }));
  }

  /**
   * Migrate existing predictions to insights
   */
  static async migratePredictionsToInsights(organizationId: string): Promise<{ migrated: number; errors: number }> {
    let migrated = 0;
    let errors = 0;

    try {
      const predictions = await PredictionModel.find({ 
        organizationId: new mongoose.Types.ObjectId(organizationId) 
      }).lean();

      for (const prediction of predictions) {
        try {
          // Get customer info if available (this would need to be implemented based on your ticket schema)
          // For now, we'll use null values
          const customerId = null;
          const customerName = null;

          await this.savePredictionAsInsight(
            prediction.ticketId,
            organizationId,
            customerId,
            customerName,
            {
              predictedEscalation: prediction.predictedEscalation,
              predictedCSAT: prediction.predictedCSAT,
              longResolutionPredicted: prediction.longResolutionPredicted,
              predictionConfidence: prediction.predictionConfidence
            }
          );
          migrated++;
        } catch (error) {
          console.error(`Error migrating prediction ${prediction.ticketId}:`, error);
          errors++;
        }
      }
    } catch (error) {
      console.error('Error during prediction migration:', error);
      throw error;
    }

    return { migrated, errors };
  }

  /**
   * Get accuracy analysis for predictions (using original prediction data)
   */
  static async getAccuracyAnalysis(organizationId: string, days: number = 30): Promise<AccuracyAnalysis> {
    const dateFilter = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const predictionsWithOutcomes = await PredictionModel.find({ 
      organizationId: new mongoose.Types.ObjectId(organizationId),
      createdAt: { $gte: dateFilter },
      'actualOutcome.checkedAt': { $exists: true }
    }).lean();

    const totalChecked = predictionsWithOutcomes.length;
    
    // Calculate escalation accuracy
    const escalationPredictions = predictionsWithOutcomes.filter(p => 
      p.actualOutcome?.accuracyEscalation !== undefined
    );
    const escalationCorrect = escalationPredictions.filter(p => 
      p.actualOutcome?.accuracyEscalation === true
    ).length;
    
    // Calculate CSAT accuracy
    const csatPredictions = predictionsWithOutcomes.filter(p => 
      p.actualOutcome?.accuracyCSAT !== undefined
    );
    const csatCorrect = csatPredictions.filter(p => 
      p.actualOutcome?.accuracyCSAT === true
    ).length;

    // Calculate overall accuracy (both escalation and CSAT correct)
    const bothCorrect = predictionsWithOutcomes.filter(p => 
      p.actualOutcome?.accuracyEscalation === true && 
      p.actualOutcome?.accuracyCSAT === true
    ).length;

    // Analyze accuracy by confidence levels
    const confidenceBreakdown = {
      high: { correct: 0, total: 0, percentage: 0 },
      medium: { correct: 0, total: 0, percentage: 0 },
      low: { correct: 0, total: 0, percentage: 0 }
    };

    predictionsWithOutcomes.forEach(prediction => {
      const avgConfidence = (prediction.predictedEscalation.confidence + prediction.predictedCSAT.confidence) / 2;
      const isCorrect = prediction.actualOutcome?.accuracyEscalation === true && 
                       prediction.actualOutcome?.accuracyCSAT === true;
      
      if (avgConfidence >= 0.8) {
        confidenceBreakdown.high.total++;
        if (isCorrect) confidenceBreakdown.high.correct++;
      } else if (avgConfidence >= 0.5) {
        confidenceBreakdown.medium.total++;
        if (isCorrect) confidenceBreakdown.medium.correct++;
      } else {
        confidenceBreakdown.low.total++;
        if (isCorrect) confidenceBreakdown.low.correct++;
      }
    });

    // Calculate percentages
    confidenceBreakdown.high.percentage = confidenceBreakdown.high.total > 0 
      ? (confidenceBreakdown.high.correct / confidenceBreakdown.high.total) * 100 
      : 0;
    confidenceBreakdown.medium.percentage = confidenceBreakdown.medium.total > 0 
      ? (confidenceBreakdown.medium.correct / confidenceBreakdown.medium.total) * 100 
      : 0;
    confidenceBreakdown.low.percentage = confidenceBreakdown.low.total > 0 
      ? (confidenceBreakdown.low.correct / confidenceBreakdown.low.total) * 100 
      : 0;

    // Calculate resolution time prediction accuracy
    const longResolutionPredictions = predictionsWithOutcomes.filter(p => 
      p.longResolutionPredicted === true && p.actualOutcome?.resolutionTimeMs
    );
    const longResolutionCorrect = longResolutionPredictions.filter(p => {
      const resolutionTimeHours = (p.actualOutcome?.resolutionTimeMs || 0) / (1000 * 60 * 60);
      return p.longResolutionPredicted && resolutionTimeHours > 24; // Correct if predicted long and actually took > 24 hours
    }).length;

    // Calculate average resolution times
    const resolvedTickets = predictionsWithOutcomes.filter(p => p.actualOutcome?.resolutionTimeMs);
    const avgResolutionTime = resolvedTickets.length > 0 
      ? resolvedTickets.reduce((sum, p) => sum + (p.actualOutcome?.resolutionTimeMs || 0), 0) / resolvedTickets.length
      : 0;

    const predictedLongResolved = predictionsWithOutcomes.filter(p => 
      p.longResolutionPredicted === true && p.actualOutcome?.resolutionTimeMs
    );
    const avgPredictedLongResolutionTime = predictedLongResolved.length > 0
      ? predictedLongResolved.reduce((sum, p) => sum + (p.actualOutcome?.resolutionTimeMs || 0), 0) / predictedLongResolved.length
      : 0;

    return {
      totalChecked,
      escalationAccuracy: {
        correct: escalationCorrect,
        total: escalationPredictions.length,
        percentage: escalationPredictions.length > 0 
          ? (escalationCorrect / escalationPredictions.length) * 100 
          : 0
      },
      csatAccuracy: {
        correct: csatCorrect,
        total: csatPredictions.length,
        percentage: csatPredictions.length > 0 
          ? (csatCorrect / csatPredictions.length) * 100 
          : 0
      },
      overallAccuracy: totalChecked > 0 ? (bothCorrect / totalChecked) * 100 : 0,
      confidenceBreakdown,
      resolutionTimeAccuracy: {
        correct: longResolutionCorrect,
        total: longResolutionPredictions.length,
        percentage: longResolutionPredictions.length > 0 
          ? (longResolutionCorrect / longResolutionPredictions.length) * 100 
          : 0
      },
      avgResolutionTime: Math.round(avgResolutionTime / (1000 * 60 * 60) * 100) / 100, // Convert to hours
      avgPredictedLongResolutionTime: Math.round(avgPredictedLongResolutionTime / (1000 * 60 * 60) * 100) / 100, // Convert to hours
    };
  }
}
