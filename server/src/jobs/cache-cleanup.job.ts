import * as cron from 'node-cron';
import { CacheInvalidationService } from '../services/cache/cacheInvalidation.service';

export class CacheCleanupJob {
  private static instance: CacheCleanupJob;
  private cacheInvalidationService: CacheInvalidationService;
  private cleanupTask: cron.ScheduledTask | null = null;

  private constructor() {
    this.cacheInvalidationService = CacheInvalidationService.getInstance();
  }

  public static getInstance(): CacheCleanupJob {
    if (!CacheCleanupJob.instance) {
      CacheCleanupJob.instance = new CacheCleanupJob();
    }
    return CacheCleanupJob.instance;
  }

  /**
   * Start the cache cleanup job
   * Runs daily at 2 AM to clean up expired caches
   */
  public start(): void {
    if (this.cleanupTask) {
      console.log('Cache cleanup job is already running');
      return;
    }

    // Run daily at 2 AM
    this.cleanupTask = cron.schedule('0 2 * * *', async () => {
      console.log('🧹 Starting scheduled cache cleanup...');
      try {
        await this.cacheInvalidationService.scheduleCleanup();
        console.log('✅ Scheduled cache cleanup completed successfully');
      } catch (error) {
        console.error('❌ Scheduled cache cleanup failed:', error);
      }
    }, {
      timezone: 'UTC'
    });

    console.log('✅ Cache cleanup job started - will run daily at 2 AM UTC');
  }

  /**
   * Stop the cache cleanup job
   */
  public stop(): void {
    if (this.cleanupTask) {
      this.cleanupTask.stop();
      this.cleanupTask = null;
      console.log('🛑 Cache cleanup job stopped');
    }
  }

  /**
   * Run cleanup immediately (for testing or manual execution)
   */
  public async runCleanupNow(): Promise<void> {
    console.log('🧹 Running immediate cache cleanup...');
    try {
      await this.cacheInvalidationService.scheduleCleanup();
      console.log('✅ Immediate cache cleanup completed successfully');
    } catch (error) {
      console.error('❌ Immediate cache cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Get job status
   */
  public getStatus(): { running: boolean; nextRun?: Date } {
    return {
      running: this.cleanupTask !== null
    };
  }
}
