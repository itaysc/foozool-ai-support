import { 
  IInsight, 
  IInsightAnalysisInput, 
  IInsightAnalysisResult, 
  ITicketAnalytics,
  InsightType, 
  InsightSeverity, 
  InsightStatus, 
  InsightTrend,
  InsightCategory 
} from '@common/types';
import { analyzeTicketsForInsights } from '../call-python';
import { ticketAnalyticsService } from '../ticket-analytics';
import * as insightDAL from '../../dal/insight.dal';

export class InsightsService {
  
  /**
   * Process a new ticket and potentially generate insights
   */
  async processNewTicket(ticketData: {
    ticketId: string;
    subject: string;
    description: string;
    organization?: string;
    productId?: string;
    tags?: string[];
    satisfactionRating?: number;
  }): Promise<IInsightAnalysisResult | null> {
    try {
      // Get recent ticket analytics for analysis (last 30 days)
      const recentAnalytics = await ticketAnalyticsService.getAnalyticsForInsights({
        organization: ticketData.organization,
        daysBack: 30,
        limit: 1000
      });

      // Convert analytics data to insight analysis input format
      const ticketsForAnalysis: IInsightAnalysisInput[] = [
        ...recentAnalytics.map(analytics => ({
          ticketId: analytics.externalTicketId,
          subject: `${analytics.category} ${analytics.keywords.join(' ')}`, // Reconstruct subject from keywords
          description: `${analytics.sentiment} ${analytics.topics.join(' ')} ${analytics.keywords.join(' ')}`, // Reconstruct description from analytics
          organization: analytics.organization,
          productId: analytics.productId,
          tags: [...analytics.topics, ...analytics.keywords], // Use topics and keywords as tags
          createdAt: new Date(analytics.createdAt),
          satisfactionRating: analytics.satisfactionRating
        })),
        {
          ticketId: ticketData.ticketId,
          subject: ticketData.subject,
          description: ticketData.description,
          organization: ticketData.organization,
          productId: ticketData.productId,
          tags: ticketData.tags || [],
          createdAt: new Date(),
          satisfactionRating: ticketData.satisfactionRating
        }
      ];

      // Analyze tickets for insights if we have enough data
      if (ticketsForAnalysis.length >= 5) {
        const analysisResult = await analyzeTicketsForInsights(ticketsForAnalysis);
        await this.processAnalysisResult(analysisResult);
        return analysisResult;
      }
      
      return null;
    } catch (error) {
      console.error('Error processing ticket for insights:', error);
      return null;
    }
  }

  /**
   * Process ML analysis results and create/update insights
   */
  private async processAnalysisResult(analysisResult: IInsightAnalysisResult): Promise<void> {
    for (const insightData of analysisResult.insights) {
      if (!insightData.type || !insightData.title || !insightData.ticketIds?.length) {
        continue; // Skip invalid insights
      }

      try {
        // Check if similar insight already exists
        const existingInsight = await this.findSimilarInsight(insightData);
        
        if (existingInsight) {
          // Update existing insight
          await this.updateExistingInsight(existingInsight, insightData);
        } else {
          // Create new insight
          await this.createNewInsight(insightData);
        }
      } catch (error) {
        console.error('Error processing individual insight:', error);
      }
    }
  }

  /**
   * Find similar existing insight
   */
  private async findSimilarInsight(insightData: Partial<IInsight>): Promise<IInsight | null> {
    const query: any = {
      type: insightData.type,
      status: { $in: [InsightStatus.ACTIVE, InsightStatus.INVESTIGATING] }
    };

    // Add product/organization filters if available
    if (insightData.productId) {
      query.productId = insightData.productId;
    }
    if (insightData.organization) {
      query.organization = insightData.organization;
    }

    // Look for insights with overlapping keywords or similar titles
    if (insightData.keywords?.length) {
      query.$or = [
        { keywords: { $in: insightData.keywords } },
        { title: { $regex: insightData.keywords.join('|'), $options: 'i' } }
      ];
    }

    return await insightDAL.findSimilarInsight(query);
  }

  /**
   * Update existing insight with new data
   */
  private async updateExistingInsight(existingInsight: IInsight, newData: Partial<IInsight>): Promise<void> {
    const updateData: any = {
      frequency: (existingInsight.frequency || 0) + (newData.frequency || 1),
      lastUpdated: new Date(),
      dateRange: {
        start: existingInsight.dateRange.start,
        end: new Date()
      }
    };

    // Update confidence (weighted average)
    if (newData.confidence) {
      const existingWeight = existingInsight.frequency || 1;
      const newWeight = newData.frequency || 1;
      const totalWeight = existingWeight + newWeight;
      updateData.confidence = 
        ((existingInsight.confidence * existingWeight) + (newData.confidence * newWeight)) / totalWeight;
    }

    // Merge ticket IDs
    if (newData.ticketIds?.length) {
      const existingTicketIds = existingInsight.ticketIds || [];
      const newTicketIds = newData.ticketIds.filter(id => !existingTicketIds.includes(id));
      updateData.ticketIds = [...existingTicketIds, ...newTicketIds];
    }

    // Merge keywords
    if (newData.keywords?.length) {
      const existingKeywords = existingInsight.keywords || [];
      const newKeywords = newData.keywords.filter(kw => !existingKeywords.includes(kw));
      updateData.keywords = [...existingKeywords, ...newKeywords].slice(0, 20); // Limit to 20 keywords
    }

    // Update severity if new data suggests higher severity
    if (newData.severity && this.getSeverityWeight(newData.severity) > this.getSeverityWeight(existingInsight.severity)) {
      updateData.severity = newData.severity;
    }

    // Determine trend
    updateData.trend = this.calculateTrend(existingInsight);

    await insightDAL.updateById(existingInsight._id!, updateData);
  }

  /**
   * Create a new insight
   */
  private async createNewInsight(insightData: Partial<IInsight>): Promise<void> {
    const now = new Date();
    
    const insight: Partial<IInsight> = {
      type: insightData.type!,
      title: insightData.title!,
      description: insightData.description || `Insight detected: ${insightData.title}`,
      severity: insightData.severity || InsightSeverity.MEDIUM,
      status: InsightStatus.ACTIVE,
      confidence: insightData.confidence || 0.5,
      frequency: insightData.frequency || 1,
      trend: InsightTrend.STABLE,
      organization: insightData.organization,
      productId: insightData.productId,
      category: insightData.category || this.mapTypeToCategory(insightData.type!),
      tags: [],
      ticketIds: insightData.ticketIds || [],
      keywords: insightData.keywords || [],
      patterns: insightData.patterns || [],
      firstDetected: now,
      lastUpdated: now,
      dateRange: {
        start: now,
        end: now
      },
      actionRequired: this.shouldRequireAction(insightData.severity || InsightSeverity.MEDIUM)
    };

    await insightDAL.create(insight);
  }

  /**
   * Get all active insights with optional filters
   */
  async getInsights(filters: {
    organization?: string;
    productId?: string;
    severity?: InsightSeverity;
    category?: InsightCategory;
    status?: InsightStatus;
    limit?: number;
    skip?: number;
  } = {}): Promise<{ insights: IInsight[]; total: number }> {
    return await insightDAL.getActiveInsightsByFilters(filters);
  }

  /**
   * Get insight by ID
   */
  async getInsightById(id: string): Promise<IInsight | null> {
    return await insightDAL.findById(id);
  }

  /**
   * Update insight status and actions
   */
  async updateInsightStatus(
    insightId: string, 
    status: InsightStatus, 
    actionData?: {
      type: string;
      description: string;
      performedBy: string;
    }
  ): Promise<IInsight | null> {
    const actionDataWithDate = actionData ? {
      ...actionData,
      performedAt: new Date()
    } : undefined;

    return await insightDAL.updateStatus(insightId, status, actionDataWithDate);
  }

  // Helper methods
  private getSeverityWeight(severity: InsightSeverity): number {
    switch (severity) {
      case InsightSeverity.LOW: return 1;
      case InsightSeverity.MEDIUM: return 2;
      case InsightSeverity.HIGH: return 3;
      case InsightSeverity.CRITICAL: return 4;
      default: return 2;
    }
  }

  private calculateTrend(insight: IInsight): InsightTrend {
    // Simple trend calculation based on frequency growth
    const daysSinceFirst = Math.max(1, Math.floor(
      (new Date().getTime() - new Date(insight.firstDetected).getTime()) / (1000 * 60 * 60 * 24)
    ));
    const avgFrequencyPerDay = insight.frequency / daysSinceFirst;
    
    if (avgFrequencyPerDay > 2) return InsightTrend.INCREASING;
    if (avgFrequencyPerDay < 0.5) return InsightTrend.DECREASING;
    return InsightTrend.STABLE;
  }

  private mapTypeToCategory(type: InsightType): InsightCategory {
    switch (type) {
      case InsightType.PRODUCT_COMPLAINT:
      case InsightType.BUG_PATTERN:
        return InsightCategory.PRODUCT_QUALITY;
      case InsightType.INFORMATION_GAP:
        return InsightCategory.DOCUMENTATION;
      case InsightType.FEATURE_REQUEST:
        return InsightCategory.FEATURE_REQUESTS;
      case InsightType.SATISFACTION_TREND:
        return InsightCategory.CUSTOMER_SATISFACTION;
      default:
        return InsightCategory.OPERATIONAL;
    }
  }

  private shouldRequireAction(severity: InsightSeverity): boolean {
    return severity === InsightSeverity.HIGH || severity === InsightSeverity.CRITICAL;
  }
}

export const insightsService = new InsightsService(); 