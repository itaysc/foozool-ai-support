import cron from 'node-cron';
import { runInsightsGenerationJob } from './insights-generator.job';

/**
 * Start the insights generation job scheduler
 * Runs every 6 hours to generate insights from recent ticket vectors
 */
export const startInsightsGenerationJob = () => {
    console.log('📊 Initializing insights generation job scheduler...');
    
    // Schedule to run every 6 hours (at 00:00, 06:00, 12:00, 18:00)
    const job = cron.schedule('0 */6 * * *', async () => {
        console.log('⏰ Triggered scheduled insights generation job');
        try {
            await runInsightsGenerationJob();
        } catch (error) {
            console.error('❌ Scheduled insights generation job failed:', error);
        }
    }, {
        timezone: "UTC"
    });

    console.log('✅ Insights generation job scheduler started (runs every 6 hours)');
    
    return job;
};