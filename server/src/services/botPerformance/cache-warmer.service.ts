import { BotPerformanceCacheService } from './cache.service';
import { BotMetricsService } from './metrics.service';
import { BotPerformanceTracker } from './tracking.service';
import { BotAnalyticsService } from './analytics.service';
import { OrganizationModel } from '../../schemas';

export class BotCacheWarmerService {
  /**
   * Warm cache for all organizations with fresh data
   */
  static async warmAllOrganizationsCache(): Promise<void> {
    try {
      console.log('🔥 Starting cache warming for all organizations...');
      
      const organizations = await OrganizationModel.find({}, '_id').lean();
      
      for (const org of organizations) {
        try {
          await this.warmOrganizationCache(org._id.toString());
        } catch (error) {
          console.error(`❌ Failed to warm cache for org ${org._id}:`, error);
        }
      }
      
      console.log(`🔥 Cache warming completed for ${organizations.length} organizations`);
    } catch (error) {
      console.error('❌ Cache warming failed:', error);
    }
  }

  /**
   * Warm cache for a specific organization
   */
  static async warmOrganizationCache(organizationId: string): Promise<void> {
    try {
      console.log(`🔥 Warming cache for organization ${organizationId}...`);
      
      // Common time ranges to pre-cache
      const timeRanges = [
        { days: 7, label: '7 days' },
        { days: 30, label: '30 days' },
        { days: 90, label: '90 days' }
      ];
      
      // Warm dashboard data for different time ranges
      const dashboardPromises = timeRanges.map(async (range) => {
        try {
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(endDate.getDate() - range.days);
          
          const dashboardData = await BotMetricsService.getDashboardData(organizationId, startDate, endDate);
          await BotPerformanceCacheService.set('dashboard', organizationId, dashboardData, { days: range.days });
          
          console.log(`📦 Cached dashboard data for ${range.label} (org: ${organizationId})`);
        } catch (error) {
          console.error(`❌ Failed to cache dashboard for ${range.label}:`, error);
        }
      });
      
      // Warm analytics data
      const analyticsPromises = timeRanges.map(async (range) => {
        try {
          const analytics = await BotAnalyticsService.generateAnalytics(organizationId, range.days);
          await BotPerformanceCacheService.set('analytics', organizationId, analytics, { days: range.days });
          
          console.log(`📦 Cached analytics for ${range.label} (org: ${organizationId})`);
        } catch (error) {
          console.error(`❌ Failed to cache analytics for ${range.label}:`, error);
        }
      });
      
      // Warm benchmarks (doesn't depend on time range)
      const benchmarkPromise = (async () => {
        try {
          const benchmarks = await BotAnalyticsService.getBenchmarkComparison(organizationId);
          await BotPerformanceCacheService.set('benchmarks', organizationId, benchmarks);
          
          console.log(`📦 Cached benchmarks (org: ${organizationId})`);
        } catch (error) {
          console.error(`❌ Failed to cache benchmarks:`, error);
        }
      })();
      
      // Warm summary data for default range (7 days)
      const summaryPromise = (async () => {
        try {
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(endDate.getDate() - 7);
          
          const summary = await BotPerformanceTracker.getPerformanceSummary(organizationId, startDate, endDate);
          const cacheParams = { 
            startDate: startDate.toISOString().split('T')[0], 
            endDate: endDate.toISOString().split('T')[0] 
          };
          await BotPerformanceCacheService.set('summary', organizationId, summary, cacheParams);
          
          console.log(`📦 Cached summary data (org: ${organizationId})`);
        } catch (error) {
          console.error(`❌ Failed to cache summary:`, error);
        }
      })();
      
      // Execute all caching operations in parallel
      await Promise.all([
        ...dashboardPromises,
        ...analyticsPromises,
        benchmarkPromise,
        summaryPromise
      ]);
      
      console.log(`✅ Cache warming completed for organization ${organizationId}`);
    } catch (error) {
      console.error(`❌ Cache warming failed for org ${organizationId}:`, error);
      throw error;
    }
  }

  /**
   * Warm popular cache entries (called after metrics calculation)
   */
  static async warmPopularEntries(organizationId: string): Promise<void> {
    try {
      console.log(`🔥 Warming popular cache entries for org ${organizationId}...`);
      
      // Warm the most commonly requested data
      const promises = [
        // Dashboard for 30 days (most common request)
        (async () => {
          try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - 30);
            
            const dashboardData = await BotMetricsService.getDashboardData(organizationId, startDate, endDate);
            await BotPerformanceCacheService.set('dashboard', organizationId, dashboardData, { days: 30 });
          } catch (error) {
            console.error('❌ Failed to warm dashboard cache:', error);
          }
        })(),
        
        // Analytics for 30 days
        (async () => {
          try {
            const analytics = await BotAnalyticsService.generateAnalytics(organizationId, 30);
            await BotPerformanceCacheService.set('analytics', organizationId, analytics, { days: 30 });
          } catch (error) {
            console.error('❌ Failed to warm analytics cache:', error);
          }
        })(),
        
        // Benchmarks
        (async () => {
          try {
            const benchmarks = await BotAnalyticsService.getBenchmarkComparison(organizationId);
            await BotPerformanceCacheService.set('benchmarks', organizationId, benchmarks);
          } catch (error) {
            console.error('❌ Failed to warm benchmarks cache:', error);
          }
        })()
      ];
      
      await Promise.all(promises);
      console.log(`✅ Popular cache entries warmed for org ${organizationId}`);
    } catch (error) {
      console.error(`❌ Failed to warm popular entries for org ${organizationId}:`, error);
    }
  }

  /**
   * Schedule cache warming (can be called from cron jobs)
   */
  static scheduleWarmup(): void {
    // This would typically be called from the jobs system
    console.log('🕐 Cache warming scheduler initialized');
    
    // Example: You could add this to your existing cron job schedule
    // This is just a placeholder - actual scheduling should be done in the jobs system
  }

  /**
   * Get cache warming statistics
   */
  static async getWarmingStats(): Promise<{
    totalOrganizations: number;
    cacheStats: any;
    lastWarmingTime?: Date;
  }> {
    try {
      const totalOrgs = await OrganizationModel.countDocuments();
      const cacheStats = await BotPerformanceCacheService.getCacheStats();
      
      return {
        totalOrganizations: totalOrgs,
        cacheStats,
        lastWarmingTime: new Date() // You could store this in Redis or database
      };
    } catch (error) {
      console.error('❌ Failed to get warming stats:', error);
      return {
        totalOrganizations: 0,
        cacheStats: { totalKeys: 0, keysByType: {} }
      };
    }
  }
}