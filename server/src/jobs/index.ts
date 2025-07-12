import { startCreateTicketJob } from './create-ticket';

export const startAllJobs = () => {
    console.log('🚀 Starting all scheduled jobs...');
    
    // Start the create ticket job
    const createTicketJob = startCreateTicketJob();
    
    console.log('✅ All jobs initialized');
    
    return {
        createTicketJob
    };
};
