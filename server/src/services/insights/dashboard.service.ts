import { QdrantAnalyticsService } from './qdrantAnalytics.service';
import { InsightModel } from '../../schemas/insight.schema';
import { callLLM } from '../together.ai';
import type { VolumeTrend, SatisfactionTrend, TicketAnalytics } from '../../types/insights';
import { UserContextManager } from '../../context/userContext';
import sanitizeText, { extractJSONFromText } from 'src/utils/text-sanitize';
import { getRedisClient } from '../redis/client';
import dashboardSettingsService from '../organizations/dashboard-settings.service';

interface DashboardMetrics {
  totalTickets: number;
  recentTickets: number; // Last 7 days
  sentimentBreakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
  topIntents: Array<{ intent: string; count: number; percentage: number }>;
  topTags: Array<{ tag: string; count: number; percentage: number }>;
  volumeTrend: VolumeTrend;
  satisfactionTrend: SatisfactionTrend;
  activeInsights: number;
  highPriorityInsights: number;
  averageResponseTime?: number; // If you track this
  customerSatisfactionScore?: number; // If you track this
}

interface DashboardInsights {
  topIssues: Array<{
    title: string;
    description: string;
    severity: string;
    confidence: number;
    affectedTickets: number;
  }>;
  trends: Array<{
    title: string;
    description: string;
    trend: string;
    impact: string;
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    priority: string;
    actionItems: string[];
  }>;
}

export class DashboardService {
  private analyticsService: QdrantAnalyticsService;

  constructor() {
    this.analyticsService = new QdrantAnalyticsService();
  }

  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics(organizationId: string, useCache: boolean = true): Promise<DashboardMetrics> {
    const redisKey = `dashboard:metrics:${organizationId}`;
    
    // Try to get from cache first if caching is enabled
    if (useCache) {
      try {
        const redis = await getRedisClient();
        const cached = await redis.get(redisKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed && typeof parsed.totalTickets === 'number') {
              console.log(`✅ Returning dashboard metrics for org ${organizationId} from Redis cache`);
              return parsed;
            } else {
              console.warn('⚠️ Cached dashboard metrics is invalid, regenerating...');
            }
          } catch (err) {
            console.error('❌ Error parsing cached dashboard metrics:', err);
          }
        }
      } catch (err) {
        console.error('❌ Redis error (fetching dashboard metrics):', err);
      }
    }

    // Get current user ID from context
    const userId = UserContextManager.getCurrentUserId();
    if (!userId) {
      throw new Error('User context not available for analytics');
    }

    // Get organization dashboard settings
    const dashboardSettings = await dashboardSettingsService.getDashboardSettings(organizationId);
    const defaultSettings = dashboardSettingsService.getDefaultSettings();
    const settings = dashboardSettings || defaultSettings;

    // Calculate time range based on settings
    const timeRange = dashboardSettingsService.calculateTimeRange(settings);
    
    console.log(`🔍 Using analytics time range for org ${organizationId}:`, timeRange ? `${timeRange.start} to ${timeRange.end}` : 'all time');

    // Get analytics based on organization settings
    const analytics = await this.analyticsService.generateAnalytics(organizationId, userId, timeRange || undefined);
    
    // Get recent analytics (last 7 days) for comparison if not using all-time
    let recentAnalytics: TicketAnalytics | null = null;
    if (timeRange) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      recentAnalytics = await this.analyticsService.generateAnalytics(organizationId, userId, {
        start: sevenDaysAgo.toISOString(),
        end: new Date().toISOString()
      });
    }

    // Get active insights count
    const activeInsights = await InsightModel.countDocuments({ status: 'active' });
    const highPriorityInsights = await InsightModel.countDocuments({ 
      status: 'active',
      severity: { $in: ['high', 'critical'] }
    });

    // Calculate top intents with percentages
    const totalTickets = analytics.totalTickets;
    const topIntents = Object.entries(analytics.intentDistribution)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([intent, count]) => ({
        intent,
        count: count as number,
        percentage: totalTickets > 0 ? ((count as number) / totalTickets) * 100 : 0
      }));

    // Calculate top tags with percentages
    const totalTagUsage = Object.values(analytics.tagFrequency).reduce((sum, count) => sum + (count as number), 0);
    const topTags = Object.entries(analytics.tagFrequency)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([tag, count]) => ({
        tag,
        count: count as number,
        percentage: totalTagUsage > 0 ? ((count as number) / totalTagUsage) * 100 : 0
      }));

    const metrics: DashboardMetrics = {
      totalTickets: analytics.totalTickets,
      recentTickets: recentAnalytics?.totalTickets || 0,
      sentimentBreakdown: analytics.sentimentDistribution,
      topIntents,
      topTags,
      volumeTrend: analytics.trends.volumeTrend,
      satisfactionTrend: analytics.trends.satisfactionTrend,
      activeInsights,
      highPriorityInsights
    };

    // Cache the result if caching is enabled
    if (useCache) {
      try {
        const redis = await getRedisClient();
        await redis.set(redisKey, JSON.stringify(metrics), { EX: 3600 }); // Cache for 1 hour
        console.log(`✅ Cached dashboard metrics for org ${organizationId}`);
      } catch (err) {
        console.error('❌ Failed to cache dashboard metrics in Redis:', err);
      }
    }

    return metrics;
  }

  /**
   * Generate AI-powered dashboard insights
   */
  async getDashboardInsights(organizationId: string, useCache: boolean = true): Promise<DashboardInsights> {
    const redisKey = `dashboard:insights:${organizationId}`;
    
    // Try to get from cache first if caching is enabled
    if (useCache) {
      try {
        const redis = await getRedisClient();
        const cached = await redis.get(redisKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed && Array.isArray(parsed.topIssues)) {
              console.log(`✅ Returning dashboard insights for org ${organizationId} from Redis cache`);
              return parsed;
            } else {
              console.warn('⚠️ Cached dashboard insights is invalid, regenerating...');
            }
          } catch (err) {
            console.error('❌ Error parsing cached dashboard insights:', err);
          }
        }
      } catch (err) {
        console.error('❌ Redis error (fetching dashboard insights):', err);
      }
    }

    const metrics = await this.getDashboardMetrics(organizationId);
    
    // Get current user ID from context
    const userId = UserContextManager.getCurrentUserId();
    if (!userId) {
      throw new Error('User context not available for LLM call');
    }

    const analytics = await this.analyticsService.generateAnalytics(organizationId, userId);

    // Generate AI insights using LLM
    const prompt = `
You are a data analyst specializing in customer support analytics. Analyze the following support metrics and generate actionable insights.

**IMPORTANT: You must respond with ONLY valid JSON. Do not include any explanatory text before or after the JSON.**

**Metrics Summary:**
- Total Tickets: ${metrics.totalTickets}
- Recent Tickets (7 days): ${metrics.recentTickets}
- Sentiment Breakdown: ${JSON.stringify(metrics.sentimentBreakdown)}
- Top Intents: ${JSON.stringify(metrics.topIntents)}
- Top Tags: ${JSON.stringify(metrics.topTags)}
- Volume Trend: ${metrics.volumeTrend}
- Satisfaction Trend: ${metrics.satisfactionTrend}
- Active Insights: ${metrics.activeInsights}
- High Priority Insights: ${metrics.highPriorityInsights}

**Analytics Data:**
${JSON.stringify(analytics, null, 2)}

**REQUIRED OUTPUT FORMAT (JSON ONLY):**
{
  "topIssues": [
    {
      "title": "Brief issue title",
      "description": "Detailed description of the issue",
      "severity": "low|medium|high|critical",
      "confidence": 0.0-1.0,
      "affectedTickets": number
    }
  ],
  "trends": [
    {
      "title": "Trend title",
      "description": "Description of the trend",
      "trend": "increasing|decreasing|stable",
      "impact": "positive|negative|neutral"
    }
  ],
  "recommendations": [
    {
      "title": "Recommendation title",
      "description": "Detailed recommendation",
      "priority": "low|medium|high|critical",
      "actionItems": ["Action 1", "Action 2", "Action 3"]
    }
  ]
}

**CRITICAL: Respond with ONLY the JSON object above. No additional text, no explanations, no markdown formatting.**
`;

    const response = await callLLM({
      userId: userId, // Use actual user ID from context
      prompt,
      model: 'mistralai/Mistral-7B-Instruct-v0.1',
      maxTokens: 3000,
      temperature: 0.2,
      isChat: true,
      systemMsg: 'You are an expert data analyst. You must ALWAYS respond with valid JSON only. Never include explanatory text, markdown, or any other formatting. Your response must be parseable by JSON.parse().',
    });

    try {
      const responseText = response.data ? sanitizeText(response.data) : '';
      console.log('LLM Response:', responseText);
      
      // Try to extract JSON from the response
      const jsonText = extractJSONFromText(responseText);
      console.log('Extracted JSON text:', jsonText);
      
      const result = JSON.parse(jsonText);
      
          // Cache the result if caching is enabled
    if (useCache) {
      try {
        const redis = await getRedisClient();
        await redis.set(redisKey, JSON.stringify(result), { EX: 7200 }); // Cache for 2 hours (insights change less frequently)
        console.log(`✅ Cached dashboard insights for org ${organizationId}`);
      } catch (err) {
        console.error('❌ Failed to cache dashboard insights in Redis:', err);
      }
    }
      
      return result;
    } catch (error) {
      console.error('Error parsing dashboard insights:', error);
      console.error('Raw LLM response:', response.data);
      console.error('Sanitized response:', response.data ? sanitizeText(response.data) : 'No data');
      
      // Return default structure if parsing fails
      return {
        topIssues: [],
        trends: [],
        recommendations: []
      };
    }
  }

  /**
   * Get real-time alerts and notifications
   */
  async getAlerts(organizationId: string, useCache: boolean = true): Promise<Array<{
    id: string;
    type: 'anomaly' | 'trend' | 'threshold' | 'insight';
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
    actionable: boolean;
  }>> {
    const redisKey = `dashboard:alerts:${organizationId}`;
    
    // Try to get from cache first if caching is enabled (alerts are cached for shorter time as they're more dynamic)
    if (useCache) {
      try {
        const redis = await getRedisClient();
        const cached = await redis.get(redisKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed && Array.isArray(parsed)) {
              console.log(`✅ Returning dashboard alerts for org ${organizationId} from Redis cache`);
              return parsed.map(alert => ({
                ...alert,
                timestamp: new Date(alert.timestamp) // Convert back to Date object
              }));
            } else {
              console.warn('⚠️ Cached dashboard alerts is invalid, regenerating...');
            }
          } catch (err) {
            console.error('❌ Error parsing cached dashboard alerts:', err);
          }
        }
      } catch (err) {
        console.error('❌ Redis error (fetching dashboard alerts):', err);
      }
    }

    // Get current user ID from context
    const userId = UserContextManager.getCurrentUserId();
    if (!userId) {
      throw new Error('User context not available for analytics');
    }

    const alerts: Array<{
      id: string;
      type: 'anomaly' | 'trend' | 'threshold' | 'insight';
      title: string;
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      timestamp: Date;
      actionable: boolean;
    }> = [];

    // Get recent analytics
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentAnalytics = await this.analyticsService.generateAnalytics(organizationId, userId, {
      start: sevenDaysAgo.toISOString(),
      end: new Date().toISOString()
    });

    // Check for volume spikes
    if (recentAnalytics.totalTickets > 50) { // Adjust threshold as needed
      alerts.push({
        id: `volume-spike-${Date.now()}`,
        type: 'anomaly',
        title: 'High Ticket Volume Detected',
        description: `${recentAnalytics.totalTickets} tickets in the last 7 days. Consider increasing support capacity.`,
        severity: 'medium',
        timestamp: new Date(),
        actionable: true
      });
    }

    // Check for negative sentiment spike
    const negativePercentage = (recentAnalytics.sentimentDistribution.negative / recentAnalytics.totalTickets) * 100;
    if (negativePercentage > 40) {
      alerts.push({
        id: `sentiment-alert-${Date.now()}`,
        type: 'trend',
        title: 'High Negative Sentiment',
        description: `${negativePercentage.toFixed(1)}% of recent tickets have negative sentiment. Immediate attention required.`,
        severity: 'high',
        timestamp: new Date(),
        actionable: true
      });
    }

    // Check for new insights
    const recentInsights = await InsightModel.find({
      createdAt: { $gte: sevenDaysAgo },
      severity: { $in: ['high', 'critical'] }
    });

    recentInsights.forEach(insight => {
      alerts.push({
        id: `insight-${insight._id}`,
        type: 'insight',
        title: `New ${insight.severity} Priority Insight`,
        description: insight.title,
        severity: insight.severity as any,
        timestamp: insight.createdAt,
        actionable: true
      });
    });

    const sortedAlerts = alerts.sort((a, b) => {
      // Sort by severity (critical > high > medium > low)
      const severityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      
      // Then by timestamp (newest first)
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    // Cache the result
    try {
      const redis = await getRedisClient();
      await redis.set(redisKey, JSON.stringify(sortedAlerts), { EX: 1800 }); // Cache for 30 minutes (alerts are more dynamic)
      console.log(`✅ Cached dashboard alerts for org ${organizationId}`);
    } catch (err) {
      console.error('❌ Failed to cache dashboard alerts in Redis:', err);
    }

    return sortedAlerts;
  }

  /**
   * Get performance comparison with previous periods
   */
  async getPerformanceComparison(organizationId: string): Promise<{
    currentPeriod: DashboardMetrics;
    previousPeriod: DashboardMetrics;
    improvements: Array<{ metric: string; change: number; direction: 'improved' | 'declined' }>;
  }> {
    const redisKey = `dashboard:performance:${organizationId}`;
    
    // Try to get from cache first
    try {
      const redis = await getRedisClient();
      const cached = await redis.get(redisKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.currentPeriod && parsed.previousPeriod) {
            console.log(`✅ Returning dashboard performance for org ${organizationId} from Redis cache`);
            return {
              ...parsed,
              currentPeriod: {
                ...parsed.currentPeriod,
                // Convert any date strings back to Date objects if needed
              },
              previousPeriod: {
                ...parsed.previousPeriod,
                // Convert any date strings back to Date objects if needed
              }
            };
          } else {
            console.warn('⚠️ Cached dashboard performance is invalid, regenerating...');
          }
        } catch (err) {
          console.error('❌ Error parsing cached dashboard performance:', err);
        }
      }
    } catch (err) {
      console.error('❌ Redis error (fetching dashboard performance):', err);
    }

    // Get current user ID from context
    const userId = UserContextManager.getCurrentUserId();
    if (!userId) {
      throw new Error('User context not available for analytics');
    }

    // Current period (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const currentPeriod = await this.analyticsService.generateAnalytics(organizationId, userId, {
      start: thirtyDaysAgo.toISOString(),
      end: new Date().toISOString()
    });

    // Previous period (30-60 days ago)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const previousPeriod = await this.analyticsService.generateAnalytics(organizationId, userId, {
      start: sixtyDaysAgo.toISOString(),
      end: thirtyDaysAgo.toISOString()
    });

    // Calculate improvements
    const improvements: Array<{ metric: string; change: number; direction: 'improved' | 'declined' }> = [];
    
    // Volume change
    const volumeChange = currentPeriod.totalTickets - previousPeriod.totalTickets;
    if (Math.abs(volumeChange) > 0) {
      improvements.push({
        metric: 'Ticket Volume',
        change: Math.abs(volumeChange),
        direction: volumeChange > 0 ? 'declined' : 'improved'
      });
    }

    // Sentiment improvement
    const currentNegativeRate = currentPeriod.totalTickets > 0 ? 
      (currentPeriod.sentimentDistribution.negative / currentPeriod.totalTickets) * 100 : 0;
    const previousNegativeRate = previousPeriod.totalTickets > 0 ? 
      (previousPeriod.sentimentDistribution.negative / previousPeriod.totalTickets) * 100 : 0;
    
    if (Math.abs(currentNegativeRate - previousNegativeRate) > 5) {
      improvements.push({
        metric: 'Negative Sentiment',
        change: Math.abs(currentNegativeRate - previousNegativeRate),
        direction: currentNegativeRate < previousNegativeRate ? 'improved' : 'declined'
      });
    }

    const performanceData = {
      currentPeriod: await this.getDashboardMetrics(organizationId),
      previousPeriod: await this.getDashboardMetrics(organizationId), // Simplified for now
      improvements
    };

    // Cache the result
    try {
      const redis = await getRedisClient();
      await redis.set(redisKey, JSON.stringify(performanceData), { EX: 7200 }); // Cache for 2 hours
      console.log(`✅ Cached dashboard performance for org ${organizationId}`);
    } catch (err) {
      console.error('❌ Failed to cache dashboard performance in Redis:', err);
    }

    return performanceData;
  }

  /**
   * Clear all dashboard cache for an organization
   */
  async clearDashboardCache(organizationId: string): Promise<void> {
    try {
      const redis = await getRedisClient();
      const keys = [
        `dashboard:metrics:${organizationId}`,
        `dashboard:insights:${organizationId}`,
        `dashboard:alerts:${organizationId}`,
        `dashboard:performance:${organizationId}`
      ];
      
      await Promise.all(keys.map(key => redis.del(key)));
      console.log(`✅ Cleared dashboard cache for org ${organizationId}`);
    } catch (err) {
      console.error('❌ Failed to clear dashboard cache:', err);
    }
  }

  /**
   * Clear specific dashboard cache type for an organization
   */
  async clearDashboardCacheByType(organizationId: string, type: 'metrics' | 'insights' | 'alerts' | 'performance'): Promise<void> {
    try {
      const redis = await getRedisClient();
      const key = `dashboard:${type}:${organizationId}`;
      await redis.del(key);
      console.log(`✅ Cleared dashboard ${type} cache for org ${organizationId}`);
    } catch (err) {
      console.error(`❌ Failed to clear dashboard ${type} cache:`, err);
    }
  }
} 