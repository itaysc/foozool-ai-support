import { InsightsOrchestratorService } from '../../services/insights/insightsOrchestrator.service';

export class WeeklyInsightsJob {
  private orchestratorService: InsightsOrchestratorService;

  constructor() {
    this.orchestratorService = new InsightsOrchestratorService();
  }

  /**
   * Execute weekly insights generation
   */
  async execute(): Promise<{
    success: boolean;
    insightsGenerated: number;
    organizationsProcessed: number;
    totalOrganizations: number;
    errors: string[];
  }> {
    console.log('🔄 Starting weekly insights generation...');
    
    try {
      const result = await this.orchestratorService.generateWeeklyInsights();
      
      console.log(`✅ Weekly insights completed: ${result.insightsGenerated} insights generated for ${result.organizationsProcessed}/${result.totalOrganizations} organizations`);
      
      if (result.errors.length > 0) {
        console.warn(`⚠️ Weekly insights had ${result.errors.length} errors:`, result.errors);
      }

      return result;

    } catch (error) {
      console.error('❌ Error in weekly insights job:', error);
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
export const weeklyInsightsJob = new WeeklyInsightsJob(); 