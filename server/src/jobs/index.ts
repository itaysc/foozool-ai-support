import { startCreateTicketJob } from './create-ticket';


export const startAllJobs = () => {
    console.log('🚀 Starting all scheduled jobs...');
    
    // Start the create ticket job
    const createTicketJob = startCreateTicketJob();
    
    // Insights functionality removed
    
    console.log('✅ All jobs initialized');
    
    return {
        createTicketJob
    };
};
