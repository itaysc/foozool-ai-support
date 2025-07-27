import { WebhookModel, OrganizationModel } from '../schemas';
import { Types } from 'mongoose';

export const seedWebhooks = async () => {
  try {
    console.log('🌐 Seeding Webhooks data...');

    // Get the first organization (assuming it exists)
    const organization = await OrganizationModel.findOne();
    if (!organization) {
      console.log('⚠️  No organization found. Please seed organizations first.');
      return;
    }

    const organizationId = organization._id;

    // Create sample webhooks
    console.log('🔗 Creating sample webhooks...');
    const sampleWebhooks = [
      {
        name: 'Action Execution Notifications',
        description: 'Receive notifications when autonomous actions are executed',
        url: 'https://webhook.site/your-unique-url',
        events: ['action.executed'],
        isActive: true,
        maxRetries: 3,
        timeout: 10000,
        headers: {
          'User-Agent': 'Foozool-AI-Support/1.0'
        }
      },
      {
        name: 'Ticket Processing Alerts',
        description: 'Get notified when tickets are processed by AI',
        url: 'https://your-slack-webhook-url.com/slack',
        events: ['ticket.processed', 'action.executed'],
        isActive: true,
        maxRetries: 5,
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json'
        }
      },
      {
        name: 'High Priority Actions',
        description: 'Notifications for high-priority actions like refunds',
        url: 'https://your-discord-webhook-url.com/discord',
        events: ['action.executed'],
        isActive: false, // Disabled by default
        maxRetries: 3,
        timeout: 8000,
        headers: {
          'X-Custom-Header': 'HighPriority'
        }
      }
    ];

    for (const webhookData of sampleWebhooks) {
      await WebhookModel.findOneAndUpdate(
        {
          organization: organizationId,
          name: webhookData.name
        },
        {
          ...webhookData,
          organization: organizationId
        },
        { upsert: true, new: true }
      );
    }

    console.log('✅ Webhooks seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding webhooks:', error);
  }
}; 