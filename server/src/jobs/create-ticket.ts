import cron from 'node-cron';
import Config from '../config';
import { createTicket } from '../services/faker/create-ticket';

export const startCreateTicketJob = () => {
    // Check if the job should be activated
    if (Config.ACTIVATE_CREATE_TICKET_JOB !== 'true') {
        console.log('🚫 Create ticket job is disabled (ACTIVATE_CREATE_TICKET_JOB is not set to "true")');
        return;
    }

    // Get the interval from config, default to every hour if not set
    const interval = Config.CREATE_TICKET_JOB_INTERVAL || '0 */1 * * *';
    
    console.log(`🔄 Starting create ticket job with interval: ${interval}`);
    
    // Schedule the job
    const job = cron.schedule(interval, async () => {
        try {
            console.log('📝 Creating ticket via scheduled job...');
            const ticket = await createTicket();
            console.log(`✅ Ticket created successfully: ${ticket.ticket.external_id}`);
        } catch (error) {
            console.error('❌ Error creating ticket via scheduled job:', error);
        }
    }, {
        timezone: 'UTC'
    });

    console.log('✅ Create ticket job scheduled successfully');
    
    return job;
};
