import { IOrganization } from "../types";
import { OrganizationModel, SeedTrackModel } from "../schemas";

const organizationsSeed: IOrganization[] = [
  {
    name: 'demo organization',
    details: 'Selling electronic goods such as phones, tablets, consoles, batteries and more',
    signature: 'demo',
    url: 'https://demo.com',
    contact: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      notes: 'John Doe is the CEO of the company',
    },
    tags: ['demo', 'demo organization'],
    notes: ['This is a demo organization'],
    externalId: 'demo-organization',
    crmType: 'zendesk', // Default to Zendesk for demo
    crmConfig: {
      // Demo Zendesk configuration
      url: process.env.ZENDESK_URL || 'https://demo.zendesk.com',
      username: process.env.ZENDESK_USERNAME || 'demo@example.com',
      token: process.env.ZENDESK_TOKEN || 'demo-token'
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export async function seedOrganizations(): Promise<IOrganization | null> {
    try {
      const org = await OrganizationModel.findOne({}).lean();
      const organizationsSeeded = await SeedTrackModel.findOne({ name: 'organizations', status: 'completed' }).lean();
      if (organizationsSeeded) {
        const org = await OrganizationModel.findOne({ name: 'demo organization' }).lean();
        return org;
      }
      const result = await OrganizationModel.insertMany(organizationsSeed);
      console.log(`Inserted ${result.length} organizations`);
      await SeedTrackModel.create({ name: 'organizations', date: new Date(), status: 'completed' });
      return result[0];
    } catch (error) {
      console.error('Error seeding organizations:', error);
      return null;
    }
  }