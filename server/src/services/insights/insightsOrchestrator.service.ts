import { QdrantAnalyticsService } from './qdrantAnalytics.service';
import { InsightModel } from '../../schemas/insight.schema';
import { callLLM } from '../together.ai';
import { v4 as uuidv4 } from 'uuid';
import type { TicketAnalytics, TicketInsight } from 'src/types/insights';
import { UserContextManager } from '../../context/userContext';

interface InsightsGenerationResult {
  success: boolean;
  insightsGenerated: number;
  organizationsProcessed: number;
  totalOrganizations: number;
  errors: string[];
}

interface CleanupResult {
  archivedCount: number;
  errors: string[];
}

export class InsightsOrchestratorService {
  private analyticsService: QdrantAnalyticsService;

  constructor() {
    this.analyticsService = new QdrantAnalyticsService();
  }

  /**
   * Generate insights for a specific organization
   */
  async generateInsightsForOrganization(organizationId: string, config?: {
    timeRange?: { start: string; end: string };
    includeTrends?: boolean;
    includeAnomalies?: boolean;
    includeTopIssues?: boolean;
  }): Promise<{
    success: boolean;
    insightsGenerated: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let insightsGenerated = 0;

    try {
      console.log(`🔄 Generating insights for organization: ${organizationId}`);

      // Get current user ID from context
      const userId = UserContextManager.getCurrentUserId();
      if (!userId) {
        console.warn('User context not available for insights generation, using system fallback');
      }

      // Generate analytics
      const analytics = await this.analyticsService.generateAnalytics(config?.timeRange);

      if (analytics.totalTickets === 0) {
        console.log(`⚠️ No tickets found for organization: ${organizationId}`);
        return { success: true, insightsGenerated: 0, errors: [] };
      }

      // Generate insights based on analytics
      const insights = await this.generateInsightsFromAnalytics(analytics, organizationId);

      // Save insights to database
      if (insights.length > 0) {
        await InsightModel.insertMany(insights);
        insightsGenerated = insights.length;
        console.log(`✅ Generated ${insightsGenerated} insights for organization: ${organizationId}`);
      }

    } catch (error) {
      const errorMessage = `Error generating insights for organization ${organizationId}: ${error}`;
      console.error(errorMessage);
      errors.push(errorMessage);
    }

    return {
      success: errors.length === 0,
      insightsGenerated,
      errors
    };
  }

  /**
   * Generate insights for all organizations
   */
  async generateInsightsForAllOrganizations(): Promise<InsightsGenerationResult> {
    const errors: string[] = [];
    let insightsGenerated = 0;
    let organizationsProcessed = 0;
    let totalOrganizations = 0;

    try {
      console.log('🔄 Starting insights generation for all organizations...');

      // Get current user ID from context
      const userId = UserContextManager.getCurrentUserId();
      if (!userId) {
        console.warn('User context not available for insights generation, using system fallback');
      }

      // This would typically fetch all organizations from your database
      // For now, we'll use a placeholder
      const organizations = ['default']; // Replace with actual organization fetching logic
      totalOrganizations = organizations.length;

      for (const organizationId of organizations) {
        try {
          const result = await this.generateInsightsForOrganization(organizationId);
          insightsGenerated += result.insightsGenerated;
          organizationsProcessed++;
          
          if (!result.success) {
            errors.push(...result.errors);
          }
        } catch (error) {
          const errorMessage = `Error processing organization ${organizationId}: ${error}`;
          console.error(errorMessage);
          errors.push(errorMessage);
        }
      }

      console.log(`✅ Completed insights generation: ${insightsGenerated} insights generated for ${organizationsProcessed}/${totalOrganizations} organizations`);

    } catch (error) {
      const errorMessage = `Error in insights generation process: ${error}`;
      console.error(errorMessage);
      errors.push(errorMessage);
    }

    return {
      success: errors.length === 0,
      insightsGenerated,
      organizationsProcessed,
      totalOrganizations,
      errors
    };
  }

  /**
   * Generate daily analytics and insights
   */
  async generateDailyAnalytics(): Promise<InsightsGenerationResult> {
    console.log('🔄 Starting daily analytics generation...');
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    return this.generateInsightsForAllOrganizations();
  }

  /**
   * Generate weekly insights summary
   */
  async generateWeeklyInsights(): Promise<InsightsGenerationResult> {
    console.log('🔄 Starting weekly insights generation...');
    
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    return this.generateInsightsForAllOrganizations();
  }

  /**
   * Clean up old insights (archive them)
   */
  async cleanupOldInsights(): Promise<CleanupResult> {
    const errors: string[] = [];
    let archivedCount = 0;

    try {
      console.log('🔄 Starting insights cleanup...');
      
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const result = await InsightModel.updateMany(
        {
          createdAt: { $lt: ninetyDaysAgo },
          status: 'active'
        },
        {
          $set: { status: 'archived', updatedAt: new Date() }
        }
      );

      archivedCount = result.modifiedCount;
      console.log(`✅ Monthly cleanup completed: ${archivedCount} insights archived`);

    } catch (error) {
      const errorMessage = `Error cleaning up old insights: ${error}`;
      console.error(errorMessage);
      errors.push(errorMessage);
    }

    return {
      archivedCount,
      errors
    };
  }

  /**
   * Generate AI-powered insights using LLM
   */
  private async generateAIInsights(organizationId: string, analytics: TicketAnalytics): Promise<TicketInsight[]> {
    // Get current user ID from context
    const userId = UserContextManager.getCurrentUserId();
    if (!userId) {
      console.warn('User context not available for AI insights generation, using system fallback');
    }

    const prompt = `
Analyze the following support analytics data and generate additional AI-powered insights:

**Analytics Summary:**
- Total Tickets: ${analytics.totalTickets}
- Sentiment Distribution: ${JSON.stringify(analytics.sentimentDistribution)}
- Intent Distribution: ${JSON.stringify(analytics.intentDistribution)}
- Tag Frequency: ${JSON.stringify(analytics.tagFrequency)}
- Trends: ${JSON.stringify(analytics.trends)}
- Anomalies: ${JSON.stringify(analytics.anomalies)}

Generate 3-5 additional insights in the following JSON format:
{
  "insights": [
    {
      "category": "one of: product_feedback, missing_documentation, potential_bug, user_experience, anomaly, trend, customer_satisfaction",
      "severity": "one of: low, medium, high, critical",
      "title": "short descriptive title",
      "description": "detailed description with actionable recommendations",
      "confidence": number between 0 and 1,
      "keyTopics": ["topic1", "topic2"],
      "suggestedImprovement": "specific action item"
    }
  ]
}

Focus on insights that would be valuable for:
1. Product improvement
2. Customer satisfaction
3. Support process optimization
4. Business growth opportunities
`;

    try {
      const response = await callLLM({
        userId: userId || 'system', // Use actual user ID or fallback to system
        prompt,
        model: 'mistralai/Mistral-7B-Instruct-v0.1',
        maxTokens: 2000,
        temperature: 0.3,
        isChat: true,
        systemMsg: 'You are an expert at analyzing support data and generating actionable business insights.',
      });

      const result = JSON.parse(response.data || '{"insights": []}');
      
      return result.insights.map((insight: any) => ({
        ...insight,
        id: uuidv4(),
        ticketIds: [],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

    } catch (error) {
      console.error('Error generating AI insights:', error);
      return [];
    }
  }

  /**
   * Generate insights from analytics data
   */
  private async generateInsightsFromAnalytics(analytics: TicketAnalytics, organizationId: string): Promise<TicketInsight[]> {
    const insights: TicketInsight[] = [];

    // Generate AI-powered insights
    const aiInsights = await this.generateAIInsights(organizationId, analytics);
    insights.push(...aiInsights);

    return insights;
  }
} 