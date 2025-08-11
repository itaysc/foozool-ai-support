import { startCreateTicketJob } from './create-ticket';
import { startInsightsGenerationJob } from './insights-scheduler';


export const startAllJobs = () => {
    console.log('🚀 Starting all scheduled jobs...');
    
    // Start the create ticket job
    const createTicketJob = startCreateTicketJob();
    
    // Start the insights generation job
    const insightsJob = startInsightsGenerationJob();
    
    console.log('✅ All jobs initialized');
    
    return {
        createTicketJob,
        insightsJob
    };
};
