import { IOrganization } from "@common/types";
import { OrganizationModel, SeedTrackModel } from "src/schemas";

const organizationsSeed: IOrganization[] = [
  {
    name: 'demo',
    details: 'Electronics and more',
    signature: 'demo',
    url: 'https://demo.com',
    contact: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      notes: 'John Doe is the CEO of the company',
    },
    tags: ['electronics', 'electronics and more'],
    notes: ['This is a demo organization'],
    externalId: 'demo',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export async function seedOrganizations(): Promise<IOrganization | null> {
    try {
      const org = await OrganizationModel.findOne({}).lean();
      const organizationsSeeded = await SeedTrackModel.findOne({ name: 'organizations', status: 'completed' }).lean();
      if (organizationsSeeded) {
        const org = await OrganizationModel.findOne({ name: 'Test Organization' }).lean();
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