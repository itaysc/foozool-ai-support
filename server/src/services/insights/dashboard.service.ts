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
  futurePredictions: Array<{
    title: string;
    prediction: string;
    reasoning: string;
    suggestedActions: string[];
    confidence: 'high' | 'medium' | 'low';
    category: 'ticket_volume' | 'csat' | 'profit_impact' | 'external_event' | 'product_issue' | 'market_change';
    timeframe: string;
    impact: 'positive' | 'negative' | 'neutral';
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
  async getDashboardMetrics(organizationId: string, timeRange?: { start: string; end: string }): Promise<DashboardMetrics> {
    // Check if caching should be used based on user context
    const useCache = UserContextManager.getUseCache();
    console.log(`🔄 Dashboard metrics caching: ${useCache ? 'enabled' : 'disabled'}`);

    // Use provided time range or fall back to organization settings
    let analyticsTimeRange: { start: string; end: string } | undefined = timeRange;
    
    if (!analyticsTimeRange) {
      // Get organization dashboard settings
      const dashboardSettings = await dashboardSettingsService.getDashboardSettings(organizationId);
      const defaultSettings = dashboardSettingsService.getDefaultSettings();
      const settings = dashboardSettings || defaultSettings;

      // Calculate time range based on settings
      const calculatedTimeRange = dashboardSettingsService.calculateTimeRange(settings);
      analyticsTimeRange = calculatedTimeRange || undefined;
    }
    
    console.log(`🔍 Using analytics time range for org ${organizationId}:`, analyticsTimeRange ? `${analyticsTimeRange.start} to ${analyticsTimeRange.end}` : 'all time');

    // Get analytics based on time range - this is the main data source
    const analytics = await this.analyticsService.generateAnalytics(analyticsTimeRange || undefined);
    
    // Only calculate recent analytics if we have a specific time range and it's not too short
    let recentAnalytics: TicketAnalytics | null = null;
    if (analyticsTimeRange) {
      const startDate = new Date(analyticsTimeRange.start);
      const endDate = new Date(analyticsTimeRange.end);
      const timeDiffDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      
      // Only calculate recent tickets if the time range is more than 7 days
      if (timeDiffDays > 7) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentTimeRange = {
          start: sevenDaysAgo.toISOString(),
          end: new Date().toISOString()
        };
        console.log(`📅 Calculating recent tickets for last 7 days: ${recentTimeRange.start} to ${recentTimeRange.end}`);
        recentAnalytics = await this.analyticsService.generateAnalytics(recentTimeRange);
        console.log(`📊 Recent tickets (7 days): ${recentAnalytics.totalTickets}`);
      } else {
        // For short time ranges, use the same data
        recentAnalytics = analytics;
      }
    }

    // Get active insights count - this is a lightweight database query
    const [activeInsights, highPriorityInsights] = await Promise.all([
      InsightModel.countDocuments({ status: 'active' }),
      InsightModel.countDocuments({ 
        status: 'active',
        severity: { $in: ['high', 'critical'] }
      })
    ]);

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
    
    console.log(`🔍 Final topIntents array:`, topIntents);

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

    return metrics;
  }

  /**
   * Generate AI-powered dashboard insights
   */
  async getDashboardInsights(organizationId: string, timeRange?: { start: string; end: string }): Promise<DashboardInsights> {
    // Check if caching should be used based on user context
    const useCache = UserContextManager.getUseCache();
    console.log(`🔄 Dashboard insights caching: ${useCache ? 'enabled' : 'disabled'}`);

    const metrics = await this.getDashboardMetrics(organizationId, timeRange);
    
    // Get current user ID from context
    const userId = UserContextManager.getCurrentUserId();
    if (!userId) {
      throw new Error('User context not available for LLM call');
    }

    const analytics = await this.analyticsService.generateAnalytics(timeRange);

    // Get news data for the organization
    let newsData: {
      news: Array<{
        title: string;
        content: string;
        pubDate: string;
        source: string;
      }>;
      summary: string;
      actionItems: Array<{
        title: string;
        description: string;
        priority: string;
        category: string;
        impact: string;
        suggestedActions: string[];
      }>;
      rssUrl?: string;
    } | null = null;
    try {
      const { newsService } = await import('../news');
      newsData = await newsService.getNewsForOrganization(organizationId);
      console.log(`📰 Fetched ${newsData.news.length} news items for predictions`);
    } catch (error) {
      console.warn('⚠️ Failed to fetch news data for predictions:', error);
      newsData = { news: [], summary: 'No news data available', actionItems: [] };
    }

    // Generate AI insights using LLM with focus on future predictions
    const prompt = `
You are a strategic business analyst specializing in customer support and business intelligence. Analyze the following data to generate actionable future predictions that will help the organization prepare for upcoming challenges and opportunities.

**IMPORTANT: You must respond with ONLY valid JSON. Do not include any explanatory text before or after the JSON.**

**Current Metrics Summary:**
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

**Relevant News Summary:**
${newsData?.summary || 'No news data available'}

**News Action Items:**
${JSON.stringify(newsData?.actionItems || [], null, 2)}

**REQUIRED OUTPUT FORMAT (JSON ONLY):**
{
  "futurePredictions": [
    {
      "title": "Predicted: [Specific Prediction]",
      "prediction": "Clear, specific prediction about what will happen",
      "reasoning": "Data-driven explanation of why this prediction is made",
      "suggestedActions": ["Action 1", "Action 2", "Action 3"],
      "confidence": "high|medium|low",
      "category": "ticket_volume|csat|profit_impact|external_event|product_issue|market_change",
      "timeframe": "next week|next month|next quarter|next 6 months",
      "impact": "positive|negative|neutral"
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

**PREDICTION GUIDELINES:**

Focus on predictions that will impact:
1. **Customer Satisfaction (CSAT)** - Changes in customer sentiment, satisfaction scores, or support quality
2. **Ticket Volume** - Expected increases/decreases in support requests, specific types of tickets
3. **Business Impact** - Effects on profits, costs, operations, or market position
4. **External Factors** - Geopolitical events, competitor actions, market changes, regulatory changes
5. **Product Issues** - Quality problems, supply chain issues, delivery delays, product recalls

**EXAMPLES OF GOOD PREDICTIONS:**
- "Expect 25% increase in billing tickets next month due to annual subscription renewals"
- "CSAT will likely drop 10% in Q2 due to recent product update causing confusion"
- "Competitor's service outage will lead to 40% surge in new customer sign-ups"
- "Supply chain disruption will cause 15% increase in delivery delay complaints"
- "New regulation will require 30% more compliance-related support requests"

**REASONING REQUIREMENTS:**
- Reference specific data points from metrics, analytics, or news
- Connect current trends to future outcomes
- Explain the causal relationship between current data and predictions
- Include confidence level based on data strength

**SUGGESTED ACTIONS:**
- Be specific and actionable
- Focus on proactive measures
- Include both immediate and strategic actions
- Consider resource allocation and timing

**CRITICAL: Respond with ONLY the JSON object above. No additional text, no explanations, no markdown formatting.**
`;

    const response = await callLLM({
      userId: userId,
      prompt,
      model: 'mistralai/Mistral-7B-Instruct-v0.1',
      maxTokens: 4000,
      temperature: 0.2,
      isChat: true,
      systemMsg: 'You are an expert business analyst specializing in predictive analytics. You must ALWAYS respond with valid JSON only. Never include explanatory text, markdown, or any other formatting. Your response must be parseable by JSON.parse(). Focus on actionable, data-driven predictions that help businesses prepare for future challenges and opportunities.',
    });

    try {
      const responseText = response.data ? sanitizeText(response.data) : '';
      
      // Try to extract JSON from the response
      const jsonText = extractJSONFromText(responseText);
      
      const result = JSON.parse(jsonText);
      
      // Ensure the structure is correct
      if (!result.futurePredictions) {
        result.futurePredictions = [];
      }
      if (!result.trends) {
        result.trends = [];
      }
      if (!result.recommendations) {
        result.recommendations = [];
      }
      
      // No caching - always return fresh data
      console.log(`✅ Returning fresh dashboard insights with ${result.futurePredictions.length} future predictions`);
      
      return result;
    } catch (error) {
      console.error('Error parsing dashboard insights:', error);
      console.error('Raw LLM response:', response.data);
      console.error('Sanitized response:', response.data ? sanitizeText(response.data) : 'No data');
      
      // Return default structure if parsing fails
      return {
        futurePredictions: [],
        trends: [],
        recommendations: []
      };
    }
  }

  /**
   * Get real-time alerts and notifications
   */
  async getAlerts(organizationId: string, timeRange?: { start: string; end: string }): Promise<Array<{
    id: string;
    type: 'anomaly' | 'trend' | 'threshold' | 'insight';
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
    actionable: boolean;
  }>> {
    // Check if caching should be used based on user context
    const useCache = UserContextManager.getUseCache();
    console.log(`🔄 Dashboard alerts caching: ${useCache ? 'enabled' : 'disabled'}`);

    const alerts: Array<{
      id: string;
      type: 'anomaly' | 'trend' | 'threshold' | 'insight';
      title: string;
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      timestamp: Date;
      actionable: boolean;
    }> = [];

    // Use provided time range or default to last 7 days for alerts
    let alertTimeRange: { start: string; end: string };
    if (timeRange) {
      alertTimeRange = timeRange;
      console.log(`🚨 Alert check: Using provided time range: ${alertTimeRange.start} to ${alertTimeRange.end}`);
    } else {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      alertTimeRange = {
        start: sevenDaysAgo.toISOString(),
        end: new Date().toISOString()
      };
      console.log(`🚨 Alert check: Using default 7-day range: ${alertTimeRange.start} to ${alertTimeRange.end}`);
    }

    // Get analytics for the alert time range
    const recentAnalytics = await this.analyticsService.generateAnalytics(alertTimeRange);
    console.log(`🚨 Alert check: Recent tickets count: ${recentAnalytics.totalTickets}`);

    // Calculate time range duration for adaptive thresholds
    const startDate = new Date(alertTimeRange.start);
    const endDate = new Date(alertTimeRange.end);
    const timeDiffDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    
    // Adaptive volume threshold based on time range duration
    const baseVolumeThreshold = 100; // Base threshold for 7 days
    const volumeThreshold = Math.ceil((baseVolumeThreshold / 7) * timeDiffDays);
    
    if (recentAnalytics.totalTickets > volumeThreshold) {
      console.log(`🚨 Creating volume spike alert for ${recentAnalytics.totalTickets} tickets (threshold: ${volumeThreshold})`);
      
      // Determine severity based on volume and time range
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
      const ticketsPerDay = recentAnalytics.totalTickets / timeDiffDays;
      
      if (ticketsPerDay > 150) {
        severity = 'critical';
      } else if (ticketsPerDay > 75) {
        severity = 'high';
      } else if (ticketsPerDay > 30) {
        severity = 'medium';
      } else {
        severity = 'low';
      }
      
      alerts.push({
        id: `volume-spike-${Date.now()}`,
        type: 'anomaly',
        title: 'High Ticket Volume Detected',
        description: `${recentAnalytics.totalTickets} tickets in the last ${timeDiffDays.toFixed(1)} days (${ticketsPerDay.toFixed(1)} per day). Consider increasing support capacity.`,
        severity,
        timestamp: new Date(),
        actionable: true
      });
    } else {
      console.log(`✅ Ticket volume (${recentAnalytics.totalTickets}) is within normal range (threshold: ${volumeThreshold})`);
    }

    // Check for negative sentiment spike
    const negativePercentage = recentAnalytics.totalTickets > 0 ? 
      (recentAnalytics.sentimentDistribution.negative / recentAnalytics.totalTickets) * 100 : 0;
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

    // Check for new insights in the same time range
    const recentInsights = await InsightModel.find({
      createdAt: { $gte: startDate, $lte: endDate },
      severity: { $in: ['high', 'critical'] }
    });

    recentInsights.forEach(insight => {
      alerts.push({
        id: `insight-${insight._id}`,
        type: 'insight',
        title: `New ${insight.severity} Priority Insight`,
        description: insight.title,
        severity: insight.severity as 'low' | 'medium' | 'high' | 'critical',
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

    // No caching - always return fresh data
    console.log(`✅ Returning fresh dashboard alerts (no caching)`);
    return sortedAlerts;
  }

  /**
   * Get performance comparison with previous periods
   */
  async getPerformanceComparison(organizationId: string, timeRange?: { start: string; end: string }): Promise<{
    currentPeriod: DashboardMetrics;
    previousPeriod: DashboardMetrics;
    improvements: Array<{ metric: string; change: number; direction: 'improved' | 'declined' }>;
  }> {
    // Check if caching should be used based on user context
    const useCache = UserContextManager.getUseCache();
    console.log(`🔄 Dashboard performance caching: ${useCache ? 'enabled' : 'disabled'}`);

    // Use provided time range or fall back to organization settings
    let analyticsTimeRange: { start: string; end: string } | undefined = timeRange;
    
    if (!analyticsTimeRange) {
      // Get organization dashboard settings
      const dashboardSettings = await dashboardSettingsService.getDashboardSettings(organizationId);
      const defaultSettings = dashboardSettingsService.getDefaultSettings();
      const settings = dashboardSettings || defaultSettings;

      // Calculate time range based on settings
      const calculatedTimeRange = dashboardSettingsService.calculateTimeRange(settings);
      analyticsTimeRange = calculatedTimeRange || undefined;
    }

    if (!analyticsTimeRange) {
      // If no time range is available, return empty comparison
      return {
        currentPeriod: await this.getDashboardMetrics(organizationId),
        previousPeriod: await this.getDashboardMetrics(organizationId),
        improvements: []
      };
    }

    // Calculate current period based on provided time range
    const currentPeriodStart = new Date(analyticsTimeRange.start);
    const currentPeriodEnd = new Date(analyticsTimeRange.end);
    const currentPeriodDuration = currentPeriodEnd.getTime() - currentPeriodStart.getTime();

    // Calculate previous period with same duration
    const previousPeriodEnd = new Date(currentPeriodStart);
    const previousPeriodStart = new Date(currentPeriodStart.getTime() - currentPeriodDuration);

    console.log(`📊 Performance comparison periods:`, {
      current: { start: currentPeriodStart.toISOString(), end: currentPeriodEnd.toISOString() },
      previous: { start: previousPeriodStart.toISOString(), end: previousPeriodEnd.toISOString() }
    });

    // Get analytics for both periods
    const currentPeriod = await this.analyticsService.generateAnalytics({
      start: currentPeriodStart.toISOString(),
      end: currentPeriodEnd.toISOString()
    });

    const previousPeriod = await this.analyticsService.generateAnalytics({
      start: previousPeriodStart.toISOString(),
      end: previousPeriodEnd.toISOString()
    });

    // Calculate improvements based on anomaly detection
    const improvements: Array<{ metric: string; change: number; direction: 'improved' | 'declined' }> = [];
    
    // Volume change anomaly detection
    const volumeChange = currentPeriod.totalTickets - previousPeriod.totalTickets;
    const volumeChangePercentage = previousPeriod.totalTickets > 0 ? 
      (volumeChange / previousPeriod.totalTickets) * 100 : 0;
    
    // Only flag as anomaly if change is significant (>20% change)
    if (Math.abs(volumeChangePercentage) > 20) {
      improvements.push({
        metric: 'Ticket Volume',
        change: Math.abs(volumeChangePercentage),
        direction: volumeChange > 0 ? 'declined' : 'improved'
      });
    }

    // Sentiment improvement anomaly detection
    const currentNegativeRate = currentPeriod.totalTickets > 0 ? 
      (currentPeriod.sentimentDistribution.negative / currentPeriod.totalTickets) * 100 : 0;
    const previousNegativeRate = previousPeriod.totalTickets > 0 ? 
      (previousPeriod.sentimentDistribution.negative / previousPeriod.totalTickets) * 100 : 0;
    
    const sentimentChange = Math.abs(currentNegativeRate - previousNegativeRate);
    // Only flag as anomaly if sentiment change is significant (>10% change)
    if (sentimentChange > 10) {
      improvements.push({
        metric: 'Negative Sentiment',
        change: sentimentChange,
        direction: currentNegativeRate < previousNegativeRate ? 'improved' : 'declined'
      });
    }

    const performanceData = {
      currentPeriod: await this.getDashboardMetrics(organizationId, {
        start: currentPeriodStart.toISOString(),
        end: currentPeriodEnd.toISOString()
      }),
      previousPeriod: await this.getDashboardMetrics(organizationId, {
        start: previousPeriodStart.toISOString(),
        end: previousPeriodEnd.toISOString()
      }),
      improvements
    };

    console.log(`✅ Returning dashboard performance data (caching: ${useCache ? 'enabled' : 'disabled'})`);
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
        `dashboard:performance:${organizationId}`,
        `analytics:${organizationId}` // Also clear analytics cache
      ];
      
      await Promise.all(keys.map(key => redis.del(key)));
      console.log(`✅ Cleared dashboard cache for org ${organizationId}`);
    } catch (err) {
      console.error('❌ Failed to clear dashboard cache:', err);
    }
  }

  /**
   * Debug function to check what's in Qdrant for an organization
   */
  async debugOrganizationData(organizationId: string): Promise<{
    qdrantTickets: number;
    redisCache: unknown;
    organizationExists: boolean;
  }> {
    try {
      // Check Qdrant tickets
      const analytics = await this.analyticsService.generateAnalytics();
      const qdrantTickets = analytics.totalTickets;
      
      // Check Redis cache
      let redisCache = null;
      try {
        const redis = await getRedisClient();
        const cached = await redis.get(`analytics:${organizationId}`);
        if (cached) {
          redisCache = JSON.parse(cached);
        }
      } catch (err) {
        console.error('Redis error in debug:', err);
      }
      
      // Check if organization exists (you might need to implement this based on your org model)
      const organizationExists = true; // Placeholder - implement based on your org model
      
      return {
        qdrantTickets,
        redisCache,
        organizationExists
      };
    } catch (error) {
      console.error('Error in debug function:', error);
      throw error;
    }
  }

  /**
   * Get time-series data for charts
   */
  async getTimeSeriesData(organizationId: string, timeRange?: { start: string; end: string }): Promise<{
    volumeData: Array<{ date: string; tickets: number }>;
    satisfactionData: Array<{ date: string; satisfaction: number }>;
  }> {
    // Check if caching should be used based on user context
    const useCache = UserContextManager.getUseCache();
    console.log(`🔄 Dashboard time-series caching: ${useCache ? 'enabled' : 'disabled'}`);
    
    if (!useCache) {
      console.log(`🔄 Skipping cache, fetching fresh time-series data`);
    }

    // Use provided time range or fall back to organization settings
    let analyticsTimeRange: { start: string; end: string } | undefined = timeRange;
    
    if (!analyticsTimeRange) {
      // Get organization dashboard settings
      const dashboardSettings = await dashboardSettingsService.getDashboardSettings(organizationId);
      const defaultSettings = dashboardSettingsService.getDefaultSettings();
      const settings = dashboardSettings || defaultSettings;

      // Calculate time range based on settings
      const calculatedTimeRange = dashboardSettingsService.calculateTimeRange(settings);
      analyticsTimeRange = calculatedTimeRange || undefined;
    }

    // Get real ticket data from Qdrant for time-series analysis
    console.log(`🔄 Fetching tickets for time range:`, analyticsTimeRange);
    const tickets = await this.analyticsService['getAllTicketsForOrganization'](analyticsTimeRange);
    console.log(`📊 Found ${tickets.length} tickets for time-series analysis`);
    
    // Generate time-series data from real ticket data with adaptive granularity
    const volumeData: Array<{ date: string; tickets: number }> = [];
    const satisfactionData: Array<{ date: string; satisfaction: number }> = [];

    // Determine granularity based on time range (following common practices)
    let granularity: 'minutes' | 'hours' | 'days' = 'days';
    let intervalMinutes: number = 1440; // Default: 1 day
    
    if (analyticsTimeRange) {
      const startDate = new Date(analyticsTimeRange.start);
      const endDate = new Date(analyticsTimeRange.end);
      const timeDiffMs = endDate.getTime() - startDate.getTime();
      const timeDiffMinutes = timeDiffMs / (1000 * 60);
      const timeDiffHours = timeDiffMinutes / 60;
      const timeDiffDays = timeDiffHours / 24;
      
      console.log(`⏰ Time range analysis: ${timeDiffMinutes.toFixed(0)} minutes, ${timeDiffHours.toFixed(2)} hours, ${timeDiffDays.toFixed(2)} days`);
      
      // Determine optimal granularity based on time range (following common practices)
      if (timeDiffMinutes <= 30) {
        // 30 minutes or less: 5-minute intervals
        granularity = 'minutes';
        intervalMinutes = 5;
        console.log(`📈 Using 5-minute intervals`);
      } else if (timeDiffMinutes <= 120) {
        // 2 hours or less: 15-minute intervals
        granularity = 'minutes';
        intervalMinutes = 15;
        console.log(`📈 Using 15-minute intervals`);
      } else if (timeDiffMinutes <= 480) {
        // 8 hours or less: 30-minute intervals
        granularity = 'minutes';
        intervalMinutes = 30;
        console.log(`📈 Using 30-minute intervals`);
      } else if (timeDiffHours <= 24) {
        // 24 hours or less: 1-hour intervals
        granularity = 'hours';
        intervalMinutes = 60;
        console.log(`📈 Using 1-hour intervals`);
      } else if (timeDiffDays <= 7) {
        // 7 days or less: 6-hour intervals
        granularity = 'hours';
        intervalMinutes = 360;
        console.log(`📈 Using 6-hour intervals`);
      } else {
        // More than 7 days: daily intervals
        granularity = 'days';
        intervalMinutes = 1440;
        console.log(`📈 Using daily intervals`);
      }
    }

    // Pre-process tickets for better performance
    const ticketsByTime = new Map<string, { 
      tickets: Array<{
        payload?: {
          created_at?: number;
          timestamp?: number;
          sentiment?: string;
        };
      }>; 
      sentiment: { positive: number; negative: number; neutral: number } 
    }>();
    
    // Group tickets by time granularity in a single pass
    tickets.forEach(ticket => {
      const createdAtRaw = ticket.payload?.created_at || ticket.payload?.timestamp;
      const createdAt = createdAtRaw && typeof createdAtRaw === 'number' ? new Date(createdAtRaw) : new Date();
      let timeKey: string;
      
      if (granularity === 'minutes') {
        // Group by custom minute intervals
        const totalMinutes = createdAt.getHours() * 60 + createdAt.getMinutes();
        const intervalIndex = Math.floor(totalMinutes / intervalMinutes);
        const timeSlot = new Date(createdAt);
        timeSlot.setHours(Math.floor(intervalIndex * intervalMinutes / 60));
        timeSlot.setMinutes((intervalIndex * intervalMinutes) % 60, 0, 0);
        timeKey = timeSlot.toISOString();
      } else if (granularity === 'hours') {
        if (intervalMinutes === 60) {
          // Group by hour
          const timeSlot = new Date(createdAt);
          timeSlot.setMinutes(0, 0, 0);
          timeKey = timeSlot.toISOString();
        } else {
          // Group by custom hour intervals (e.g., 6-hour intervals)
          const totalHours = createdAt.getHours() + createdAt.getDate() * 24;
          const intervalIndex = Math.floor(totalHours / (intervalMinutes / 60));
          const timeSlot = new Date(createdAt);
          timeSlot.setDate(Math.floor(intervalIndex * (intervalMinutes / 60) / 24) + 1);
          timeSlot.setHours((intervalIndex * (intervalMinutes / 60)) % 24, 0, 0);
          timeKey = timeSlot.toISOString();
        }
      } else {
        // Group by day
        timeKey = createdAt.toISOString().split('T')[0];
      }
      
      if (!ticketsByTime.has(timeKey)) {
        ticketsByTime.set(timeKey, { 
          tickets: [], 
          sentiment: { positive: 0, negative: 0, neutral: 0 } 
        });
      }
      
      const timeSlot = ticketsByTime.get(timeKey)!;
      timeSlot.tickets.push(ticket);
      
      // Track sentiment for satisfaction calculation
      const sentiment = ticket.payload?.sentiment || 'neutral';
      timeSlot.sentiment[sentiment as keyof typeof timeSlot.sentiment]++;
    });

    // Generate data points for the time range
    if (analyticsTimeRange) {
      const startDate = new Date(analyticsTimeRange.start);
      const endDate = new Date(analyticsTimeRange.end);
      const timeDiffMs = endDate.getTime() - startDate.getTime();
      const timeDiffMinutes = timeDiffMs / (1000 * 60);
      
      const currentDate = new Date(startDate);
      const maxPoints = Math.ceil(timeDiffMinutes / intervalMinutes) + 1;
      let pointCount = 0;
      
      while (currentDate <= endDate && pointCount < maxPoints) {
        let timeKey: string;
        let displayTime: string;
        
        if (granularity === 'minutes') {
          // Create custom minute intervals
          const totalMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();
          const intervalIndex = Math.floor(totalMinutes / intervalMinutes);
          const timeSlot = new Date(currentDate);
          timeSlot.setHours(Math.floor(intervalIndex * intervalMinutes / 60));
          timeSlot.setMinutes((intervalIndex * intervalMinutes) % 60, 0, 0);
          timeKey = timeSlot.toISOString();
          
          // Format display time based on interval
          if (intervalMinutes < 60) {
            displayTime = timeSlot.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            });
          } else {
            displayTime = timeSlot.toLocaleTimeString('en-US', { 
              hour: '2-digit',
              hour12: false 
            });
          }
        } else if (granularity === 'hours') {
          if (intervalMinutes === 60) {
            // Create hourly intervals
            const timeSlot = new Date(currentDate);
            timeSlot.setMinutes(0, 0, 0);
            timeKey = timeSlot.toISOString();
            displayTime = timeSlot.toLocaleTimeString('en-US', { 
              hour: '2-digit',
              hour12: false 
            });
          } else {
            // Create custom hour intervals (e.g., 6-hour intervals)
            const totalHours = currentDate.getHours() + currentDate.getDate() * 24;
            const intervalIndex = Math.floor(totalHours / (intervalMinutes / 60));
            const timeSlot = new Date(currentDate);
            timeSlot.setDate(Math.floor(intervalIndex * (intervalMinutes / 60) / 24) + 1);
            timeSlot.setHours((intervalIndex * (intervalMinutes / 60)) % 24, 0, 0);
            timeKey = timeSlot.toISOString();
            displayTime = timeSlot.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            }) + ' ' + timeSlot.toLocaleTimeString('en-US', { 
              hour: '2-digit',
              hour12: false 
            });
          }
        } else {
          // Create daily intervals
          timeKey = currentDate.toISOString().split('T')[0];
          displayTime = currentDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          });
        }
        
        const timeSlot = ticketsByTime.get(timeKey) || { tickets: [], sentiment: { positive: 0, negative: 0, neutral: 0 } };
        
        // Calculate satisfaction score for this time period
        const totalTimeTickets = timeSlot.sentiment.positive + timeSlot.sentiment.negative + timeSlot.sentiment.neutral;
        const satisfaction = totalTimeTickets > 0 ? 
          (timeSlot.sentiment.positive / totalTimeTickets) * 100 : 0;
        
        volumeData.push({
          date: displayTime,
          tickets: timeSlot.tickets.length
        });
        
        satisfactionData.push({
          date: displayTime,
          satisfaction: Math.round(satisfaction)
        });
        
        // Move to next time interval
        if (granularity === 'minutes') {
          currentDate.setMinutes(currentDate.getMinutes() + intervalMinutes);
        } else if (granularity === 'hours') {
          currentDate.setHours(currentDate.getHours() + (intervalMinutes / 60));
        } else {
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        pointCount++;
      }
    } else {
      // If no time range, create a simple 7-day view with daily granularity
      for (let i = 6; i >= 0; i--) {
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() - i);
        
        const dateStr = currentDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
        
        const dateKey = currentDate.toISOString().split('T')[0];
        const timeSlot = ticketsByTime.get(dateKey) || { tickets: [], sentiment: { positive: 0, negative: 0, neutral: 0 } };
        
        // Calculate satisfaction score for this day
        const totalDayTickets = timeSlot.sentiment.positive + timeSlot.sentiment.negative + timeSlot.sentiment.neutral;
        const satisfaction = totalDayTickets > 0 ? 
          (timeSlot.sentiment.positive / totalDayTickets) * 100 : 0;
        
        volumeData.push({
          date: dateStr,
          tickets: timeSlot.tickets.length
        });
        
        satisfactionData.push({
          date: dateStr,
          satisfaction: Math.round(satisfaction)
        });
      }
    }

    const timeSeriesData = {
      volumeData,
      satisfactionData
    };

    console.log(`📊 Generated time-series data:`, {
      volumeDataPoints: volumeData.length,
      satisfactionDataPoints: satisfactionData.length,
      granularity,
      timeRange: analyticsTimeRange
    });

    // No caching - always return fresh data
    console.log(`✅ Returning fresh time-series data (no caching)`);

    return timeSeriesData;
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