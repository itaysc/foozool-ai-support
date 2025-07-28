import QdrantService from '../../qdrant/service';
import { ticketCollectionConfig } from '../../qdrant/schemas/ticket';
import { InsightModel } from '../../schemas/insight.schema';
import { v4 as uuidv4 } from 'uuid';
import type { TicketAnalytics, InsightGenerationRequest } from 'src/types/insights';
import { getRedisClient } from '../redis/client';

export class QdrantAnalyticsService {
  private qdrantService: QdrantService;

  constructor() {
    this.qdrantService = new QdrantService();
  }

  /**
   * Extract all tickets for an organization from Qdrant
   */
  private async getAllTicketsForOrganization(organizationId: string, timeRange?: { start: string; end: string }): Promise<any[]> {
    let filter: Record<string, any> = {
      must: [
        {
          key: 'organization',
          match: { value: organizationId }
        }
      ]
    };

    // Add time filter if provided
    if (timeRange) {
      filter.must.push({
        key: 'created_at',
        range: {
          gte: timeRange.start,
          lte: timeRange.end
        }
      });
    }

    const tickets = await this.qdrantService.client.scroll(ticketCollectionConfig.name, {
      limit: 10000, // Adjust based on your needs
      filter,
      with_payload: true,
      with_vector: false,
    });

    return tickets.points || [];
  }

  /**
   * Generate comprehensive analytics from Qdrant data
   */
  async generateAnalytics(organizationId: string, timeRange?: { start: string; end: string }): Promise<TicketAnalytics> {
    const redisKey = `analytics:${organizationId}`;
    try {
      const redis = await getRedisClient();
      const cached = await redis.get(redisKey);
      if (cached) {
        console.log(`✅ Returning analytics for org ${organizationId} from Redis cache`);
        return JSON.parse(cached);
      }
    } catch (err) {
      console.error('❌ Redis error (fetching analytics):', err);
    }

    // If not cached, generate analytics as before
    const tickets = await this.getAllTicketsForOrganization(organizationId, timeRange);
    if (tickets.length === 0) {
      const emptyAnalytics: TicketAnalytics = {
        totalTickets: 0,
        timeRange: timeRange || { start: new Date().toISOString(), end: new Date().toISOString() },
        sentimentDistribution: { positive: 0, negative: 0, neutral: 0 },
        intentDistribution: {},
        tagFrequency: {},
        topSubjects: [],
        trends: { volumeTrend: 'stable', satisfactionTrend: 'stable', percentageChange: 0 },
        anomalies: []
      };
      // Cache the empty result as well
      try {
        const redis = await getRedisClient();
        await redis.set(redisKey, JSON.stringify(emptyAnalytics), { EX: 86400 });
      } catch (err) {
        console.error('❌ Failed to cache empty analytics in Redis:', err);
      }
      return emptyAnalytics;
    }

    // Calculate sentiment distribution
    const sentimentCounts = tickets.reduce((acc, ticket) => {
      const sentiment = ticket.payload?.sentiment || 'neutral';
      acc[sentiment] = (acc[sentiment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate intent distribution
    const intentCounts = tickets.reduce((acc, ticket) => {
      const intent = ticket.payload?.intent || 'unknown';
      acc[intent] = (acc[intent] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate tag frequency
    const tagCounts: Record<string, number> = {};
    tickets.forEach(ticket => {
      const tags = ticket.payload?.tags || [];
      tags.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    // Get top subjects (if available in payload)
    const subjectCounts: Record<string, number> = {};
    tickets.forEach(ticket => {
      const subject = ticket.payload?.subject;
      if (subject) {
        subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
      }
    });

    const topSubjects = Object.entries(subjectCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([subject, count]) => ({ subject, count }));

    // Calculate trends (simplified - you might want to implement more sophisticated trend analysis)
    const volumeTrend = this.calculateVolumeTrend(tickets);
    const satisfactionTrend = this.calculateSatisfactionTrend(tickets);

    // Detect anomalies
    const anomalies = await this.detectAnomalies(tickets, organizationId);

    const analytics: TicketAnalytics = {
      totalTickets: tickets.length,
      timeRange: timeRange || { start: new Date().toISOString(), end: new Date().toISOString() },
      sentimentDistribution: {
        positive: sentimentCounts.positive || 0,
        negative: sentimentCounts.negative || 0,
        neutral: sentimentCounts.neutral || 0
      },
      intentDistribution: intentCounts,
      tagFrequency: tagCounts,
      topSubjects,
      trends: {
        volumeTrend,
        satisfactionTrend,
        percentageChange: this.calculatePercentageChange(tickets)
      },
      anomalies
    };

    // Store analytics in Redis
    try {
      const redis = await getRedisClient();
      await redis.set(redisKey, JSON.stringify(analytics), { EX: 86400 }); // 1 day expiry
      console.log(`♻️  Cached analytics for org ${organizationId} in Redis`);
    } catch (err) {
      console.error('❌ Failed to cache analytics in Redis:', err);
    }

    return analytics;
  }

  /**
   * Generate AI-powered insights from analytics data
   */
  async generateInsights(request: InsightGenerationRequest): Promise<any> {
    const analytics = await this.generateAnalytics(request.organizationId, request.timeRange);
    
    if (analytics.totalTickets === 0) {
      return {
        insights: [],
        summary: {
          totalInsights: 0,
          message: 'No tickets found for the specified time range'
        }
      };
    }

    const insights: any[] = [];

    // Generate insights based on request parameters
    if (request.includeTopIssues) {
      insights.push(...await this.generateTopIssuesInsights(analytics));
    }

    if (request.includeTrends) {
      insights.push(...await this.generateTrendInsights(analytics));
    }

    if (request.includeAnomalies) {
      insights.push(...await this.generateAnomalyInsights(analytics));
    }

    // Save insights to database
    if (insights.length > 0) {
      await InsightModel.insertMany(insights);
    }

    return {
      insights,
      analytics,
      summary: {
        totalInsights: insights.length,
        highSeverityCount: insights.filter(i => i.severity === 'high' || i.severity === 'critical').length,
        categories: insights.reduce((acc, insight) => {
          acc[insight.category] = (acc[insight.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    };
  }

  /**
   * Generate insights about top issues and trends
   */
  private async generateTopIssuesInsights(analytics: TicketAnalytics): Promise<any[]> {
    const insights: any[] = [];

    // Top intents insight
    const topIntents = Object.entries(analytics.intentDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    if (topIntents.length > 0) {
      insights.push({
        id: uuidv4(),
        category: 'trend',
        severity: 'medium',
        title: 'Most Common Customer Intents',
        description: `The most common customer intents are: ${topIntents.map(([intent, count]) => `${intent} (${count} tickets)`).join(', ')}. This indicates the primary areas where customers need support.`,
        confidence: 0.8,
        ticketIds: [],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        keyTopics: topIntents.map(([intent]) => intent),
        frequency: topIntents[0][1]
      });
    }

    // Sentiment insight
    const totalTickets = analytics.totalTickets;
    const negativePercentage = (analytics.sentimentDistribution.negative / totalTickets) * 100;
    
    if (negativePercentage > 30) {
      insights.push({
        id: uuidv4(),
        category: 'customer_satisfaction',
        severity: 'high',
        title: 'High Negative Sentiment Detected',
        description: `${negativePercentage.toFixed(1)}% of tickets have negative sentiment. This indicates potential customer satisfaction issues that need immediate attention.`,
        confidence: 0.9,
        ticketIds: [],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        satisfactionScore: negativePercentage,
        sentiment: 'negative'
      });
    }

    // Top tags insight
    const topTags = Object.entries(analytics.tagFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    if (topTags.length > 0) {
      insights.push({
        id: uuidv4(),
        category: 'trend',
        severity: 'low',
        title: 'Most Common Ticket Tags',
        description: `The most frequently used tags are: ${topTags.map(([tag, count]) => `${tag} (${count} times)`).join(', ')}. This helps identify common themes in support requests.`,
        confidence: 0.7,
        ticketIds: [],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        keyTopics: topTags.map(([tag]) => tag)
      });
    }

    return insights;
  }

  /**
   * Generate trend-based insights
   */
  private async generateTrendInsights(analytics: TicketAnalytics): Promise<any[]> {
    const insights: any[] = [];

    // Volume trend insight
    if (analytics.trends.volumeTrend !== 'stable') {
      insights.push({
        id: uuidv4(),
        category: 'trend',
        severity: analytics.trends.volumeTrend === 'increasing' ? 'medium' : 'low',
        title: `Support Volume ${analytics.trends.volumeTrend === 'increasing' ? 'Increasing' : 'Decreasing'}`,
        description: `Support ticket volume is ${analytics.trends.volumeTrend}. ${analytics.trends.percentageChange > 0 ? 'This may indicate growing user adoption or emerging issues.' : 'This may indicate improved product stability or reduced user activity.'}`,
        confidence: 0.8,
        ticketIds: [],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        trend: analytics.trends.volumeTrend,
        trendType: 'support_volume',
        percentageChange: analytics.trends.percentageChange
      });
    }

    // Satisfaction trend insight
    if (analytics.trends.satisfactionTrend !== 'stable') {
      insights.push({
        id: uuidv4(),
        category: 'customer_satisfaction',
        severity: analytics.trends.satisfactionTrend === 'decreasing' ? 'high' : 'medium',
        title: `Customer Satisfaction ${analytics.trends.satisfactionTrend === 'decreasing' ? 'Declining' : 'Improving'}`,
        description: `Customer satisfaction is ${analytics.trends.satisfactionTrend}. ${analytics.trends.satisfactionTrend === 'decreasing' ? 'This requires immediate attention to identify and address root causes.' : 'This indicates positive improvements in support quality or product stability.'}`,
        confidence: 0.8,
        ticketIds: [],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        trend: analytics.trends.satisfactionTrend,
        trendType: 'user_satisfaction'
      });
    }

    return insights;
  }

  /**
   * Generate anomaly-based insights
   */
  private async generateAnomalyInsights(analytics: TicketAnalytics): Promise<any[]> {
    return analytics.anomalies.map(anomaly => ({
      id: uuidv4(),
      category: 'anomaly',
      severity: anomaly.severity,
      title: `Anomaly Detected: ${anomaly.type.replace('_', ' ').toUpperCase()}`,
      description: anomaly.description,
      confidence: anomaly.confidence,
      ticketIds: [],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  }

  /**
   * Detect anomalies in ticket data
   */
  private async detectAnomalies(tickets: any[], organizationId: string): Promise<any[]> {
    const anomalies: any[] = [];

    // Simple anomaly detection - you might want to implement more sophisticated algorithms
    const totalTickets = tickets.length;
    const negativeTickets = tickets.filter(t => t.payload?.sentiment === 'negative').length;
    const negativePercentage = (negativeTickets / totalTickets) * 100;

    // High negative sentiment anomaly
    if (negativePercentage > 50) {
      anomalies.push({
        type: 'sentiment_shift',
        description: `Unusually high negative sentiment detected: ${negativePercentage.toFixed(1)}% of tickets are negative`,
        severity: 'high',
        confidence: 0.9
      });
    }

    // Volume spike detection (simplified)
    const recentTickets = tickets.filter(t => {
      const createdAt = new Date(t.payload?.created_at);
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return createdAt > oneWeekAgo;
    });

    if (recentTickets.length > totalTickets * 0.3) {
      anomalies.push({
        type: 'volume_spike',
        description: `Recent spike in ticket volume detected: ${recentTickets.length} tickets in the last week`,
        severity: 'medium',
        confidence: 0.7
      });
    }

    return anomalies;
  }

  /**
   * Calculate volume trend
   */
  private calculateVolumeTrend(tickets: any[]): 'increasing' | 'decreasing' | 'stable' {
    // Simplified trend calculation - you might want to implement more sophisticated analysis
    const sortedTickets = tickets.sort((a, b) => 
      new Date(a.payload?.created_at).getTime() - new Date(b.payload?.created_at).getTime()
    );

    const midPoint = Math.floor(sortedTickets.length / 2);
    const firstHalf = sortedTickets.slice(0, midPoint).length;
    const secondHalf = sortedTickets.slice(midPoint).length;

    if (secondHalf > firstHalf * 1.2) return 'increasing';
    if (firstHalf > secondHalf * 1.2) return 'decreasing';
    return 'stable';
  }

  /**
   * Calculate satisfaction trend
   */
  private calculateSatisfactionTrend(tickets: any[]): 'increasing' | 'decreasing' | 'stable' {
    const sortedTickets = tickets.sort((a, b) => 
      new Date(a.payload?.created_at).getTime() - new Date(b.payload?.created_at).getTime()
    );

    const midPoint = Math.floor(sortedTickets.length / 2);
    const firstHalf = sortedTickets.slice(0, midPoint);
    const secondHalf = sortedTickets.slice(midPoint);

    const firstHalfNegative = firstHalf.filter(t => t.payload?.sentiment === 'negative').length;
    const secondHalfNegative = secondHalf.filter(t => t.payload?.sentiment === 'negative').length;

    const firstHalfNegativeRate = firstHalfNegative / firstHalf.length;
    const secondHalfNegativeRate = secondHalfNegative / secondHalf.length;

    if (secondHalfNegativeRate < firstHalfNegativeRate * 0.8) return 'increasing';
    if (secondHalfNegativeRate > firstHalfNegativeRate * 1.2) return 'decreasing';
    return 'stable';
  }

  /**
   * Calculate percentage change
   */
  private calculatePercentageChange(tickets: any[]): number {
    const sortedTickets = tickets.sort((a, b) => 
      new Date(a.payload?.created_at).getTime() - new Date(b.payload?.created_at).getTime()
    );

    const midPoint = Math.floor(sortedTickets.length / 2);
    const firstHalf = sortedTickets.slice(0, midPoint).length;
    const secondHalf = sortedTickets.slice(midPoint).length;

    if (firstHalf === 0) return 0;
    return ((secondHalf - firstHalf) / firstHalf) * 100;
  }
} 