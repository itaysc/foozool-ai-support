import { startCreateTicketJob } from './create-ticket';
import { startInsightsGenerationJob } from './insights-scheduler';
import { CacheCleanupJob } from './cache-cleanup.job';


export const startAllJobs = () => {
    console.log('🚀 Starting all scheduled jobs...');
    
    // Start the create ticket job
    const createTicketJob = startCreateTicketJob();
    
    // Start the insights generation job
    const insightsJob = startInsightsGenerationJob();
    
    // Start the cache cleanup job
    const cacheCleanupJob = CacheCleanupJob.getInstance();
    cacheCleanupJob.start();
    
    console.log('✅ All jobs initialized');
    
    return {
        createTicketJob,
        insightsJob,
        cacheCleanupJob
    };
};
