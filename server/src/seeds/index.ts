import { seedUsers } from './users.seed';
import { seedOrganizations } from './organizations.seed';
import { seedLLMUsage } from './LLMUsage.seed';
import { seedLLMPricings } from './LLMPricing.seed';
import { seedCRMs } from './crm.seed';
import { seedThresholdMisses } from './thresholdMiss.seed';
import AddIndustriesSeed from './AddIndustries.seed';
import { seedRoles } from './roles.seed';

export async function seed() {
  try {
    console.log('Starting database seeding...');
    
    // Seed CRMs first
    await seedCRMs();
    
    // Seed roles and permissions (idempotent)
    await seedRoles();

    // Seed organizations
    const organization = await seedOrganizations();
    
    // Seed LLM pricing
    const recommendedLLMId = await seedLLMPricings();
    
    // Seed users
    let users: any[] | null = null;
    if (organization && recommendedLLMId) {
      users = await seedUsers(organization._id!, recommendedLLMId);
    }
    
    // Seed LLM usage
    if (users) {
      await seedLLMUsage(users);
    }
    
    // Seed threshold misses for testing
    await seedThresholdMisses();
    // Seed global industries (idempotent)
    await AddIndustriesSeed();
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error during database seeding:', error);
    throw error;
  }
}