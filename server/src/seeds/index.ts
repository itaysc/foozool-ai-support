import { seedOrganizations } from "./organizations.seed";
import { seedLLMUsage } from "./LLMUsage.seed";
import { seedLLMPricings } from "./LLMPricing.seed";
import { seedUsers } from "./users.seed";
import { IUser } from "src/types";
import { seedTokens } from "./tokens.seed";
import { seedAutonomousAI } from "./autonomousAI.seed";
import { seedWebhooks } from "./webhooks.seed";
import { seedDashboardSettings } from "./dashboard-settings.seed";

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
    if (organization) {
      await seedTokens(organization._id!);
    }
    
    // Seed autonomous AI data
    await seedAutonomousAI();
    
    // Seed webhooks data
    await seedWebhooks();
    
    // Seed dashboard settings
    await seedDashboardSettings();
  }