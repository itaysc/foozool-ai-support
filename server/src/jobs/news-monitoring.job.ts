import { OrganizationModel } from '../schemas/organization.schema';
import { newsService } from '../services/news';

export class NewsMonitoringJob {
  private isRunning = false;

  /**
   * Execute the news monitoring job
   */
  async execute(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ News monitoring job is already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('🔄 Starting daily news monitoring job...');

    try {
      // Get all organizations
      const organizations = await OrganizationModel.find({});
      console.log(`📊 Processing news for ${organizations.length} organizations`);

      let successCount = 0;
      let errorCount = 0;

      // Process each organization
      for (const organization of organizations) {
        try {
          console.log(`📰 Processing news for organization: ${organization.name} (${organization._id})`);
          
          // Get news for the organization (this will cache the results)
          // The service will handle the case where there's no user context
          const newsData = await newsService.getNewsForOrganization(organization._id.toString());
          
          console.log(`✅ Processed news for ${organization.name}:`, {
            newsCount: newsData.news.length,
            actionItemsCount: newsData.actionItems.length,
            hasSummary: !!newsData.summary
          });
          
          successCount++;
          
          // Add a small delay to avoid overwhelming external APIs
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`❌ Error processing news for organization ${organization.name}:`, error);
          errorCount++;
        }
      }

      console.log(`✅ News monitoring job completed:`, {
        totalOrganizations: organizations.length,
        successful: successCount,
        errors: errorCount
      });

    } catch (error) {
      console.error('❌ Error in news monitoring job:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get job status
   */
  getStatus(): { isRunning: boolean } {
    return { isRunning: this.isRunning };
  }

}

export const newsMonitoringJob = new NewsMonitoringJob(); 