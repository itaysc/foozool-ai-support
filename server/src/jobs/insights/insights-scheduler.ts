import * as cron from 'node-cron';
import { dailyAnalyticsJob } from './daily-analytics.job';
import { weeklyInsightsJob } from './weekly-insights.job';
import { monthlyCleanupJob } from './monthly-cleanup.job';
import config from '../../config';

interface JobSchedule {
  name: string;
  cronPattern: string;
  description: string;
  enabled: boolean;
}

interface InsightsSchedulerConfig {
  timezone?: string;
  jobs: JobSchedule[];
}

export class InsightsScheduler {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private config: InsightsSchedulerConfig;

  constructor(configOverride?: Partial<InsightsSchedulerConfig>) {
    this.config = {
      timezone: 'UTC',
      jobs: [
        {
          name: 'daily-analytics',
          cronPattern: config.INSIGHTS_DAILY_ANALYTICS_CRON || '0 6 * * *', // Every day at 6 AM
          description: 'Generate daily analytics and insights',
          enabled: true
        },
        {
          name: 'weekly-insights',
          cronPattern: config.INSIGHTS_WEEKLY_INSIGHTS_CRON || '0 2 * * 0', // Every Sunday at 2 AM
          description: 'Generate comprehensive weekly insights',
          enabled: true
        },
        {
          name: 'monthly-cleanup',
          cronPattern: config.INSIGHTS_MONTHLY_CLEANUP_CRON || '0 3 1 * *', // First day of month at 3 AM
          description: 'Clean up old insights (archive 90+ days old)',
          enabled: true
        }
      ],
      ...configOverride
    };
  }

  /**
   * Start all scheduled jobs
   */
  start(): void {
    console.log('🚀 Starting Insights Scheduler...');
    
    this.config.jobs.forEach(job => {
      if (job.enabled) {
        this.scheduleJob(job);
      }
    });

    console.log(`✅ Insights Scheduler started with ${this.jobs.size} active jobs`);
    this.logSchedule();
  }

  /**
   * Stop all scheduled jobs
   */
  stop(): void {
    console.log('🛑 Stopping Insights Scheduler...');
    
    this.jobs.forEach((task, name) => {
      task.stop();
      console.log(`   - Stopped job: ${name}`);
    });
    
    this.jobs.clear();
    console.log('✅ All jobs stopped');
  }

  /**
   * Schedule a single job
   */
  private scheduleJob(job: JobSchedule): void {
    const task = cron.schedule(job.cronPattern, async () => {
      try {
        console.log(`🔄 Starting job: ${job.name} - ${job.description}`);
        
        switch (job.name) {
          case 'daily-analytics':
            await this.runDailyAnalytics();
            break;
          case 'weekly-insights':
            await this.runWeeklyInsights();
            break;
          case 'monthly-cleanup':
            await this.runMonthlyCleanup();
            break;
          default:
            console.warn(`⚠️ Unknown job type: ${job.name}`);
        }
        
      } catch (error) {
        console.error(`❌ Error in job ${job.name}:`, error);
      }
    }, {
      timezone: this.config.timezone
    });

    this.jobs.set(job.name, task);
    console.log(`   - Scheduled: ${job.name} (${job.cronPattern})`);
  }

  /**
   * Run daily analytics job
   */
  private async runDailyAnalytics(): Promise<void> {
    await dailyAnalyticsJob.execute();
  }

  /**
   * Run weekly insights job
   */
  private async runWeeklyInsights(): Promise<void> {
    await weeklyInsightsJob.execute();
  }

  /**
   * Run monthly cleanup job
   */
  private async runMonthlyCleanup(): Promise<void> {
    await monthlyCleanupJob.execute();
  }

  /**
   * Log the current schedule
   */
  private logSchedule(): void {
    console.log('📅 Current Insights Schedule:');
    this.config.jobs.forEach(job => {
      if (job.enabled) {
        console.log(`   - ${job.name}: ${job.cronPattern} (${job.description})`);
      }
    });
  }

  /**
   * Get job status
   */
  getJobStatus(): Array<{
    name: string;
    enabled: boolean;
    running: boolean;
  }> {
    return this.config.jobs.map(job => ({
      name: job.name,
      enabled: job.enabled,
      running: this.jobs.has(job.name)
    }));
  }

  /**
   * Manually trigger a job
   */
  async triggerJob(jobName: string): Promise<boolean> {
    const job = this.config.jobs.find(j => j.name === jobName);
    if (!job) {
      console.error(`❌ Job not found: ${jobName}`);
      return false;
    }

    try {
      console.log(`🔄 Manually triggering job: ${jobName}`);
      
      switch (jobName) {
        case 'daily-analytics':
          await this.runDailyAnalytics();
          break;
        case 'weekly-insights':
          await this.runWeeklyInsights();
          break;
        case 'monthly-cleanup':
          await this.runMonthlyCleanup();
          break;
        default:
          console.error(`❌ Unknown job type: ${jobName}`);
          return false;
      }
      
      console.log(`✅ Job ${jobName} completed successfully`);
      return true;
      
    } catch (error) {
      console.error(`❌ Error triggering job ${jobName}:`, error);
      return false;
    }
  }

  /**
   * Update job configuration
   */
  updateJobConfig(jobName: string, updates: Partial<JobSchedule>): boolean {
    const jobIndex = this.config.jobs.findIndex(j => j.name === jobName);
    if (jobIndex === -1) {
      console.error(`❌ Job not found: ${jobName}`);
      return false;
    }

    // Stop existing job if it's running
    const existingTask = this.jobs.get(jobName);
    if (existingTask) {
      existingTask.stop();
      this.jobs.delete(jobName);
    }

    // Update job configuration
    this.config.jobs[jobIndex] = { ...this.config.jobs[jobIndex], ...updates };

    // Reschedule if enabled
    if (this.config.jobs[jobIndex].enabled) {
      this.scheduleJob(this.config.jobs[jobIndex]);
    }

    console.log(`✅ Updated job configuration for: ${jobName}`);
    return true;
  }
}

// Export singleton instance
export const insightsScheduler = new InsightsScheduler(); 