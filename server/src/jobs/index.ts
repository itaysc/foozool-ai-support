import { startCreateTicketJob } from './create-ticket';
import { insightsScheduler } from './insights/insights-scheduler';

export const startAllJobs = () => {
    console.log('🚀 Starting all scheduled jobs...');
    
    // Start the create ticket job
    const createTicketJob = startCreateTicketJob();
    
    // Start the insights scheduler
    insightsScheduler.start();
    
    console.log('✅ All jobs initialized');
    
    return {
        createTicketJob,
        insightsScheduler
    };
};
