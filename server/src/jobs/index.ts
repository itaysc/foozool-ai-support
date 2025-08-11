import { startCreateTicketJob } from './create-ticket';
import { insightsScheduler } from './insights/insights-scheduler';
import { BotMetricsService } from '../services/botPerformance/metrics.service';

export const startAllJobs = () => {
    console.log('🚀 Starting all scheduled jobs...');
    
    // Start the create ticket job
    const createTicketJob = startCreateTicketJob();
    
    // Start the insights scheduler
    insightsScheduler.start();
    
    // Initialize bot metrics service and scheduling
    BotMetricsService.initialize();
    
    console.log('✅ All jobs initialized');
    
    return {
        createTicketJob,
        insightsScheduler,
        botMetricsService: 'initialized'
    };
};
