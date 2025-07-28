import { InsightsOrchestratorService } from '../../services/insights/insightsOrchestrator.service';

export class MonthlyCleanupJob {
  private orchestratorService: InsightsOrchestratorService;

  constructor() {
    this.orchestratorService = new InsightsOrchestratorService();
  }

  /**
   * Execute monthly cleanup of old insights
   */
  async execute(): Promise<{
    success: boolean;
    archivedCount: number;
    errors: string[];
  }> {
    console.log('🔄 Starting monthly insights cleanup...');
    
    try {
      const result = await this.orchestratorService.cleanupOldInsights();
      
      console.log(`✅ Monthly cleanup completed: ${result.archivedCount} insights archived`);
      
      if (result.errors.length > 0) {
        console.warn(`⚠️ Monthly cleanup had ${result.errors.length} errors:`, result.errors);
      }

      return {
        success: result.errors.length === 0,
        archivedCount: result.archivedCount,
        errors: result.errors
      };

    } catch (error) {
      console.error('❌ Error in monthly cleanup job:', error);
      return {
        success: false,
        archivedCount: 0,
        errors: [(error as Error).message]
      };
    }
  }
}

// Export singleton instance
export const monthlyCleanupJob = new MonthlyCleanupJob(); 