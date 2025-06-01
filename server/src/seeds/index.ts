import { seedOrganizations } from "./organizations.seed";
import { seedLLMUsage } from "./LLMUsage.seed";
import { seedLLMPricings } from "./LLMPricing.seed";
import { seedUsers } from "./users.seed";
import { IUser } from "@common/types";

export default async function seed() {
    const organization = await seedOrganizations();
    const recommendedLLMId = await seedLLMPricings();
    let users: IUser[] | null = null;
    if (organization && recommendedLLMId) {
      users = await seedUsers(organization._id!, recommendedLLMId);
    }
    if (users) {
      await seedLLMUsage(users);
    }
  }