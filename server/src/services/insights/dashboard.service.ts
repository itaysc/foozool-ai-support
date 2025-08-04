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
  async getDashboardMetrics(organizationId: string, timeRange?: { start: string; end: string }): Promise<DashboardMetrics> {
    // Completely disable caching for dashboard
    console.log(`🔄 Caching disabled for dashboard metrics`);

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

    // Get analytics based on time range
    const analytics = await this.analyticsService.generateAnalytics(analyticsTimeRange || undefined);
    
    // Get recent analytics (last 7 days) for comparison if not using all-time
    let recentAnalytics: TicketAnalytics | null = null;
    if (analyticsTimeRange) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      recentAnalytics = await this.analyticsService.generateAnalytics({
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

    // No caching - always return fresh data
    console.log(`✅ Returning fresh dashboard metrics (no caching)`);
    return metrics;
  }

  /**
   * Generate AI-powered dashboard insights
   */
  async getDashboardInsights(organizationId: string, timeRange?: { start: string; end: string }): Promise<DashboardInsights> {
    // Disable caching for dashboard insights
    console.log(`🔄 Caching disabled for dashboard insights`);

    const metrics = await this.getDashboardMetrics(organizationId, timeRange);
    
    // Get current user ID from context
    const userId = UserContextManager.getCurrentUserId();
    if (!userId) {
      throw new Error('User context not available for LLM call');
    }

    const analytics = await this.analyticsService.generateAnalytics(timeRange);

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
      
      // No caching - always return fresh data
      console.log(`✅ Returning fresh dashboard insights (no caching)`);
      
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
  async getAlerts(organizationId: string, timeRange?: { start: string; end: string }): Promise<Array<{
    id: string;
    type: 'anomaly' | 'trend' | 'threshold' | 'insight';
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
    actionable: boolean;
  }>> {
    // Completely disable caching for dashboard
    console.log(`🔄 Caching disabled for dashboard alerts`);

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
    const recentAnalytics = await this.analyticsService.generateAnalytics({
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

    // No caching - always return fresh data
    console.log(`✅ Returning fresh dashboard alerts (no caching)`);
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
    // Completely disable caching for dashboard
    console.log(`🔄 Caching disabled for dashboard performance`);

    // Current period (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const currentPeriod = await this.analyticsService.generateAnalytics({
      start: thirtyDaysAgo.toISOString(),
      end: new Date().toISOString()
    });

    // Previous period (30-60 days ago)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const previousPeriod = await this.analyticsService.generateAnalytics({
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

    // No caching - always return fresh data
    console.log(`✅ Returning fresh dashboard performance (no caching)`);
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
   * Get time-series data for charts
   */
  async getTimeSeriesData(organizationId: string, timeRange?: { start: string; end: string }): Promise<{
    volumeData: Array<{ date: string; tickets: number }>;
    satisfactionData: Array<{ date: string; satisfaction: number }>;
  }> {
    // Completely disable caching for dashboard to ensure fresh data
    const useCache = false;
    console.log(`🔄 Caching completely disabled for dashboard`);
    
    // Skip cache entirely - always fetch fresh data
    console.log(`🔄 Skipping cache, fetching fresh time-series data`);

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
    const tickets = await this.analyticsService['getAllTicketsForOrganization'](organizationId, analyticsTimeRange);
    console.log(`📊 Found ${tickets.length} tickets for time-series analysis`);
    
    // Generate time-series data from real ticket data with adaptive granularity
    const volumeData: Array<{ date: string; tickets: number }> = [];
    const satisfactionData: Array<{ date: string; satisfaction: number }> = [];

    // Determine granularity based on time range (following common practices)
    let granularity: 'minutes' | 'hours' | 'days' = 'days';
    let intervalMinutes: number = 1440; // Default: 1 day
    let timeFormat: string = 'MMM dd';
    
    if (analyticsTimeRange) {
      const startDate = new Date(analyticsTimeRange.start);
      const endDate = new Date(analyticsTimeRange.end);
      const timeDiffMs = endDate.getTime() - startDate.getTime();
      const timeDiffMinutes = timeDiffMs / (1000 * 60);
      const timeDiffHours = timeDiffMinutes / 60;
      const timeDiffDays = timeDiffHours / 24;
      
      console.log(`⏰ Time range received:`, {
        start: analyticsTimeRange.start,
        end: analyticsTimeRange.end,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      console.log(`⏰ Time range analysis: ${timeDiffMinutes.toFixed(0)} minutes, ${timeDiffHours.toFixed(2)} hours, ${timeDiffDays.toFixed(2)} days`);
      
      // Determine optimal granularity based on time range (following common practices)
      console.log(`🔍 Granularity decision: ${timeDiffMinutes} minutes (${timeDiffMinutes <= 30 ? '≤30' : timeDiffMinutes <= 120 ? '≤120' : timeDiffMinutes <= 480 ? '≤480' : timeDiffHours <= 24 ? '≤24h' : timeDiffDays <= 7 ? '≤7d' : '>7d'})`);
      
      if (timeDiffMinutes <= 30) {
        // 30 minutes or less: 5-minute intervals
        granularity = 'minutes';
        intervalMinutes = 5;
        timeFormat = 'HH:mm';
        console.log(`📈 Using 5-minute intervals`);
      } else if (timeDiffMinutes <= 120) {
        // 2 hours or less: 15-minute intervals
        granularity = 'minutes';
        intervalMinutes = 15;
        timeFormat = 'HH:mm';
        console.log(`📈 Using 15-minute intervals`);
      } else if (timeDiffMinutes <= 480) {
        // 8 hours or less: 30-minute intervals
        granularity = 'minutes';
        intervalMinutes = 30;
        timeFormat = 'HH:mm';
        console.log(`📈 Using 30-minute intervals`);
      } else if (timeDiffHours <= 24) {
        // 24 hours or less: 1-hour intervals
        granularity = 'hours';
        intervalMinutes = 60;
        timeFormat = 'HH:mm';
        console.log(`📈 Using 1-hour intervals`);
      } else if (timeDiffDays <= 7) {
        // 7 days or less: 6-hour intervals
        granularity = 'hours';
        intervalMinutes = 360;
        timeFormat = 'MMM dd HH:mm';
        console.log(`📈 Using 6-hour intervals`);
      } else {
        // More than 7 days: daily intervals
        granularity = 'days';
        intervalMinutes = 1440;
        timeFormat = 'MMM dd';
        console.log(`📈 Using daily intervals`);
      }
    }

    // Group tickets by time granularity
    const ticketsByTime = new Map<string, any[]>();
    const satisfactionByTime = new Map<string, { positive: number; negative: number; neutral: number }>();

    tickets.forEach(ticket => {
      const createdAt = new Date(ticket.payload?.created_at || ticket.payload?.timestamp || Date.now());
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
        ticketsByTime.set(timeKey, []);
        satisfactionByTime.set(timeKey, { positive: 0, negative: 0, neutral: 0 });
      }
      
      ticketsByTime.get(timeKey)!.push(ticket);
      
      // Track sentiment for satisfaction calculation
      const sentiment = ticket.payload?.sentiment || 'neutral';
      const current = satisfactionByTime.get(timeKey)!;
      current[sentiment as keyof typeof current]++;
    });

    // Generate data points for the time range
    if (analyticsTimeRange) {
      const startDate = new Date(analyticsTimeRange.start);
      const endDate = new Date(analyticsTimeRange.end);
      const timeDiffMs = endDate.getTime() - startDate.getTime();
      const timeDiffMinutes = timeDiffMs / (1000 * 60);
      
      let currentDate = new Date(startDate);
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
        
        const timeTickets = ticketsByTime.get(timeKey) || [];
        const timeSentiment = satisfactionByTime.get(timeKey) || { positive: 0, negative: 0, neutral: 0 };
        
        // Calculate satisfaction score for this time period
        const totalTimeTickets = timeSentiment.positive + timeSentiment.negative + timeSentiment.neutral;
        const satisfaction = totalTimeTickets > 0 ? 
          (timeSentiment.positive / totalTimeTickets) * 100 : 0;
        
        volumeData.push({
          date: displayTime,
          tickets: timeTickets.length
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
        const dayTickets = ticketsByTime.get(dateKey) || [];
        const daySentiment = satisfactionByTime.get(dateKey) || { positive: 0, negative: 0, neutral: 0 };
        
        // Calculate satisfaction score for this day
        const totalDayTickets = daySentiment.positive + daySentiment.negative + daySentiment.neutral;
        const satisfaction = totalDayTickets > 0 ? 
          (daySentiment.positive / totalDayTickets) * 100 : 0;
        
        volumeData.push({
          date: dateStr,
          tickets: dayTickets.length
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