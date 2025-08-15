import { ICRM } from "../types/crm";
import { CRMModel, SeedTrackModel } from "../schemas";

const crmSeed: ICRM[] = [
  {
    name: 'Zendesk',
    type: 'zendesk',
    displayName: 'Zendesk Support',
    description: 'Zendesk Support is a customer service and engagement platform',
    isActive: true,
    configSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', format: 'uri' },
        username: { type: 'string' },
        token: { type: 'string' },
        webhookToken: { type: 'string' }
      },
      required: ['url', 'username', 'token']
    },
    webhookConfig: {
      supportedEvents: ['ticket_created', 'status_changed'],
      payloadSchema: {
        type: 'object',
        properties: {
          event_type: { type: 'string' },
          ticket_id: { type: 'string' },
          subject: { type: 'string' },
          status: { type: 'string' },
          description: { type: 'string' },
          priority: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          created_at: { type: 'string' },
          external_id: { type: 'string' },
          requester: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              email: { type: 'string', format: 'email' }
            }
          },
          custom_fields: { type: 'object' },
          via: { type: 'string' }
        },
        required: ['event_type', 'ticket_id', 'subject', 'status', 'description', 'external_id']
      },
      headersSchema: {
        type: 'object',
        properties: {
          'x-token-type': { type: 'string' },
          'x-organization-id': { type: 'string' },
          'x-user-id': { type: 'string' },
          'authorization': { type: 'string' }
        },
        required: ['x-token-type', 'x-organization-id', 'x-user-id', 'authorization']
      }
    },
    apiConfig: {
      baseUrl: 'https://api.zendesk.com/v2',
      authenticationType: 'basic',
      requiredHeaders: ['Authorization', 'Content-Type']
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Salesforce',
    type: 'salesforce',
    displayName: 'Salesforce Service Cloud',
    description: 'Salesforce Service Cloud is a customer service platform',
    isActive: true,
    configSchema: {
      type: 'object',
      properties: {
        instanceUrl: { type: 'string', format: 'uri' },
        accessToken: { type: 'string' },
        apiVersion: { type: 'string' }
      },
      required: ['instanceUrl', 'accessToken', 'apiVersion']
    },
    webhookConfig: {
      supportedEvents: ['case_created', 'case_updated'],
      payloadSchema: {
        type: 'object',
        properties: {
          event_type: { type: 'string' },
          case_id: { type: 'string' },
          subject: { type: 'string' },
          status: { type: 'string' },
          description: { type: 'string' },
          priority: { type: 'string' },
          created_date: { type: 'string' },
          contact: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              email: { type: 'string', format: 'email' }
            }
          }
        },
        required: ['event_type', 'case_id', 'subject', 'status', 'description']
      },
      headersSchema: {
        type: 'object',
        properties: {
          'x-token-type': { type: 'string' },
          'x-organization-id': { type: 'string' },
          'x-user-id': { type: 'string' },
          'authorization': { type: 'string' }
        },
        required: ['x-token-type', 'x-organization-id', 'x-user-id', 'authorization']
      }
    },
    apiConfig: {
      baseUrl: 'https://api.salesforce.com/services/data',
      authenticationType: 'bearer',
      requiredHeaders: ['Authorization', 'Content-Type']
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

export async function seedCRMs(): Promise<ICRM[]> {
  try {
    const crmsSeeded = await SeedTrackModel.findOne({ name: 'crms', status: 'completed' }).lean();
    if (crmsSeeded) {
      console.log('CRMs already seeded, skipping...');
      return await CRMModel.find({}).lean();
    }

    const result = await CRMModel.insertMany(crmSeed);
    console.log(`Inserted ${result.length} CRMs`);
    
    await SeedTrackModel.create({ 
      name: 'crms', 
      date: new Date(), 
      status: 'completed' 
    });
    
    return result;
  } catch (error) {
    console.error('Error seeding CRMs:', error);
    throw error;
  }
}
