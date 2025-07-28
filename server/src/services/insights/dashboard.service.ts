import { QdrantAnalyticsService } from './qdrantAnalytics.service';
import { InsightModel } from '../../schemas/insight.schema';
import { callLLM } from '../together.ai';

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
  volumeTrend: 'increasing' | 'decreasing' | 'stable';
  satisfactionTrend: 'increasing' | 'decreasing' | 'stable';
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
  async getDashboardMetrics(organizationId: string): Promise<DashboardMetrics> {
    // Get analytics for different time periods
    const allTimeAnalytics = await this.analyticsService.generateAnalytics(organizationId);
    
    // Get recent analytics (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentAnalytics = await this.analyticsService.generateAnalytics(organizationId, {
      start: sevenDaysAgo.toISOString(),
      end: new Date().toISOString()
    });

    // Get active insights count
    const activeInsights = await InsightModel.countDocuments({ status: 'active' });
    const highPriorityInsights = await InsightModel.countDocuments({ 
      status: 'active',
      severity: { $in: ['high', 'critical'] }
    });

    // Calculate top intents with percentages
    const totalTickets = allTimeAnalytics.totalTickets;
    const topIntents = Object.entries(allTimeAnalytics.intentDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([intent, count]) => ({
        intent,
        count,
        percentage: totalTickets > 0 ? (count / totalTickets) * 100 : 0
      }));

    // Calculate top tags with percentages
    const totalTagUsage = Object.values(allTimeAnalytics.tagFrequency).reduce((sum, count) => sum + count, 0);
    const topTags = Object.entries(allTimeAnalytics.tagFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([tag, count]) => ({
        tag,
        count,
        percentage: totalTagUsage > 0 ? (count / totalTagUsage) * 100 : 0
      }));

    return {
      totalTickets: allTimeAnalytics.totalTickets,
      recentTickets: recentAnalytics.totalTickets,
      sentimentBreakdown: allTimeAnalytics.sentimentDistribution,
      topIntents,
      topTags,
      volumeTrend: allTimeAnalytics.trends.volumeTrend,
      satisfactionTrend: allTimeAnalytics.trends.satisfactionTrend,
      activeInsights,
      highPriorityInsights
    };
  }

  /**
   * Generate AI-powered dashboard insights
   */
  async getDashboardInsights(organizationId: string): Promise<DashboardInsights> {
    const metrics = await this.getDashboardMetrics(organizationId);
    const analytics = await this.analyticsService.generateAnalytics(organizationId);

    // Generate AI insights using LLM
    const prompt = `
Analyze the following support metrics and generate actionable insights:

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

Generate insights in the following JSON format:
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

Focus on actionable insights that would help improve customer support and product quality.
`;

    const response = await callLLM({
      userId: 'system',
      prompt,
      model: 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo',
      maxTokens: 3000,
      temperature: 0.2,
      isChat: true,
      systemMsg: 'You are an expert at analyzing support metrics and generating actionable business insights.',
    });

    try {
      const result = JSON.parse(response.data || '{"topIssues": [], "trends": [], "recommendations": []}');
      return result;
    } catch (error) {
      console.error('Error parsing dashboard insights:', error);
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
  async getAlerts(organizationId: string): Promise<Array<{
    id: string;
    type: 'anomaly' | 'trend' | 'threshold' | 'insight';
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
    actionable: boolean;
  }>> {
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
    const recentAnalytics = await this.analyticsService.generateAnalytics(organizationId, {
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

    return alerts.sort((a, b) => {
      // Sort by severity (critical > high > medium > low)
      const severityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      
      // Then by timestamp (newest first)
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }

  /**
   * Get performance comparison with previous periods
   */
  async getPerformanceComparison(organizationId: string): Promise<{
    currentPeriod: DashboardMetrics;
    previousPeriod: DashboardMetrics;
    improvements: Array<{ metric: string; change: number; direction: 'improved' | 'declined' }>;
  }> {
    // Current period (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const currentPeriod = await this.analyticsService.generateAnalytics(organizationId, {
      start: thirtyDaysAgo.toISOString(),
      end: new Date().toISOString()
    });

    // Previous period (30-60 days ago)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const previousPeriod = await this.analyticsService.generateAnalytics(organizationId, {
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

    return {
      currentPeriod: await this.getDashboardMetrics(organizationId),
      previousPeriod: await this.getDashboardMetrics(organizationId), // Simplified for now
      improvements
    };
  }
} 