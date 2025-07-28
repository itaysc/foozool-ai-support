import { InsightsOrchestratorService } from '../../services/insights/insightsOrchestrator.service';

export class DailyAnalyticsJob {
  private orchestratorService: InsightsOrchestratorService;

  constructor() {
    this.orchestratorService = new InsightsOrchestratorService();
  }

  /**
   * Execute daily analytics generation
   */
  async execute(): Promise<{
    success: boolean;
    insightsGenerated: number;
    organizationsProcessed: number;
    totalOrganizations: number;
    errors: string[];
  }> {
    console.log('🔄 Starting daily analytics generation...');
    
    try {
      const result = await this.orchestratorService.generateDailyAnalytics();
      
      console.log(`✅ Daily analytics completed: ${result.insightsGenerated} insights generated for ${result.organizationsProcessed}/${result.totalOrganizations} organizations`);
      
      if (result.errors.length > 0) {
        console.warn(`⚠️ Daily analytics had ${result.errors.length} errors:`, result.errors);
      }

      return result;

    } catch (error) {
      console.error('❌ Error in daily analytics job:', error);
      return {
        success: false,
        insightsGenerated: 0,
        organizationsProcessed: 0,
        totalOrganizations: 0,
        errors: [(error as Error).message]
      };
    }
  }
}

// Export singleton instance
export const dailyAnalyticsJob = new DailyAnalyticsJob(); 