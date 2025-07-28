import { QdrantAnalyticsService } from './qdrantAnalytics.service';
import { OrganizationModel } from '../../schemas/organization.schema';
import { InsightModel } from '../../schemas/insight.schema';
import { callLLM } from '../together.ai';
import { v4 as uuidv4 } from 'uuid';

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
      console.log(`Starting insights generation for organization ${organizationId}`);

      // Generate insights based on configuration
      const result = await this.analyticsService.generateInsights({
        organizationId,
        timeRange: config?.timeRange,
        includeTrends: config?.includeTrends ?? true,
        includeAnomalies: config?.includeAnomalies ?? true,
        includeTopIssues: config?.includeTopIssues ?? true
      });

      insightsGenerated = result.insights.length;

      // Generate additional AI-powered insights
      const aiInsights = await this.generateAIInsights(organizationId, result.analytics);
      if (aiInsights.length > 0) {
        await InsightModel.insertMany(aiInsights);
        insightsGenerated += aiInsights.length;
      }

      console.log(`Successfully generated ${insightsGenerated} insights for organization ${organizationId}`);

      return {
        success: true,
        insightsGenerated,
        errors
      };

    } catch (error) {
      const errorMessage = `Error generating insights for organization ${organizationId}: ${error}`;
      console.error(errorMessage);
      errors.push(errorMessage);

      return {
        success: false,
        insightsGenerated,
        errors
      };
    }
  }

  /**
   * Generate insights for all organizations
   */
  async generateInsightsForAllOrganizations(): Promise<InsightsGenerationResult> {
    const errors: string[] = [];
    let successfulOrganizations = 0;
    let totalInsightsGenerated = 0;

    try {
      // Get all organizations
      const organizations = await OrganizationModel.find({});
      console.log(`Found ${organizations.length} organizations for insights generation`);

      for (const organization of organizations) {
        try {
          const result = await this.generateInsightsForOrganization(organization._id.toString(), {
            includeTrends: true,
            includeAnomalies: true,
            includeTopIssues: true
          });

          if (result.success) {
            successfulOrganizations++;
            totalInsightsGenerated += result.insightsGenerated;
          }

          errors.push(...result.errors);

        } catch (error) {
          const errorMessage = `Error processing organization ${organization._id}: ${error}`;
          console.error(errorMessage);
          errors.push(errorMessage);
        }
      }

      console.log(`Insights generation completed. ${successfulOrganizations}/${organizations.length} organizations processed successfully. ${totalInsightsGenerated} total insights generated.`);

      return {
        success: successfulOrganizations > 0,
        insightsGenerated: totalInsightsGenerated,
        organizationsProcessed: successfulOrganizations,
        totalOrganizations: organizations.length,
        errors
      };

    } catch (error) {
      const errorMessage = `Error in insights generation: ${error}`;
      console.error(errorMessage);
      errors.push(errorMessage);

      return {
        success: false,
        insightsGenerated: 0,
        organizationsProcessed: 0,
        totalOrganizations: 0,
        errors
      };
    }
  }

  /**
   * Generate daily analytics for all organizations
   */
  async generateDailyAnalytics(): Promise<InsightsGenerationResult> {
    console.log('🔄 Starting daily analytics generation...');
    const result = await this.generateInsightsForAllOrganizations();
    console.log(`✅ Daily analytics completed: ${result.insightsGenerated} insights generated for ${result.organizationsProcessed}/${result.totalOrganizations} organizations`);
    
    if (result.errors.length > 0) {
      console.warn(`⚠️ Daily analytics had ${result.errors.length} errors:`, result.errors);
    }

    return result;
  }

  /**
   * Generate weekly insights for all organizations
   */
  async generateWeeklyInsights(): Promise<InsightsGenerationResult> {
    console.log('🔄 Starting weekly insights generation...');
    const result = await this.generateInsightsForAllOrganizations();
    console.log(`✅ Weekly insights completed: ${result.insightsGenerated} insights generated for ${result.organizationsProcessed}/${result.totalOrganizations} organizations`);
    
    if (result.errors.length > 0) {
      console.warn(`⚠️ Weekly insights had ${result.errors.length} errors:`, result.errors);
    }

    return result;
  }

  /**
   * Clean up old insights (archive insights older than 90 days)
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
  private async generateAIInsights(organizationId: string, analytics: any): Promise<any[]> {
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
        userId: 'system',
        prompt,
        model: 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo',
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
} 