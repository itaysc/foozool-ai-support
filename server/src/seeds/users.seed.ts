import { UserModel, SeedTrackModel } from "../schemas";
import { RoleModel } from "../schemas/role.schema";
import { IUser } from "../types";
const usersSeed = [
  {
    firstName: 'Itay',
    lastName: 'Schmidt',
    email: 'itayschmidt@gmail.com',
    password: '123789',
    registered: true,
    department: 'IT',
    group: 'admin',
    permissions: ['roles:read', 'permissions:assign'],
  },
];

export async function seedUsers(organizationId: string, recommendedLLMId: string): Promise<IUser[] | null> {
    try {
      const usersSeeded = await SeedTrackModel.findOne({ name: 'users', status: 'success' });
      if (usersSeeded) {
        return null;
      }
      const users: IUser[] = [];
      // Lookup admin role id (if seeded)
      const adminRole = await RoleModel.findOne({ name: 'admin' }).lean();
      const usersSeedWithOrganization = usersSeed.map(user => ({ 
        ...user, 
        organization: organizationId,
        roles: adminRole ? [adminRole._id] : [],
      }));
      for (const user of usersSeedWithOrganization) {
        const toAdd = new UserModel({
          ...user,
          llmModel: recommendedLLMId,
        });
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