import { UserModel, SeedTrackModel } from "src/schemas";
import { IUser } from "@common/types";
const usersSeed = [
  {
    firstName: 'Itay',
    lastName: 'Schmidt',
    email: 'itayschmidt@gmail.com',
    password: '123789',
    registered: true,
    department: 'IT',
    group: 'admin',
    roles: ['admin'],
    scopes: ['admin'],
  },
];

export async function seedUsers(organizationId: string, recommendedLLMId: string): Promise<IUser[] | null> {
    try {
      const usersSeeded = await SeedTrackModel.findOne({ name: 'users', status: 'success' });
      if (usersSeeded) {
        return null;
      }
      const users: IUser[] = [];
      const usersSeedWithOrganization = usersSeed.map(user => ({ ...user, organization: organizationId }));
      for (const user of usersSeedWithOrganization) {
        const toAdd = new UserModel({...user, llmModel: recommendedLLMId});
        const addedUser: any = await toAdd.save();
        users.push(addedUser);
      }
      console.log(`Inserted ${usersSeedWithOrganization.length} users`);
      await SeedTrackModel.create({ name: 'users', date: new Date(), status: 'success' });
      return users;
    } catch (error) {
      console.error('Error seeding users:', error);
      return null;
    } 
  }