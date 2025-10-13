import { CustomerModel } from '../../schemas';
import { UserContextManager } from '../../context/userContext';
import { 
  generateCustomerSuccessInsights, 
  getAllSavedCustomerSuccessInsights 
} from './customer-success';
import { CustomerSuccessInsightsResult, AllCustomerSuccessInsightsResult } from './types';

/**
 * Get customer success insights for a specific customer (from persisted data only)
 */
export async function getCustomerSuccessInsights(customerId: string): Promise<CustomerSuccessInsightsResult> {
  const organizationId = UserContextManager.getCurrentOrganizationId();
  
  if (!organizationId) {
    return { status: 400, error: 'Organization ID not found in user context' };
  }

  try {
    // DB-only fetch: return all saved customer success insights (no on-demand generation here)
    const savedInsights = await getAllSavedCustomerSuccessInsights(customerId);
    const freshInsights: any[] = [];
    const allInsights = savedInsights;
    
    return { 
      status: 200, 
      payload: {
        freshInsights,
        savedInsights,
        allInsights
      }
    };
  } catch (err) {
    console.error('Error fetching CS insights:', err);
    return { status: 500, error: 'Internal server error' };
  }
}

/**
 * Generate and persist customer success insights on-demand (for job execution)
 */
export async function generateAndSaveCustomerSuccessInsights(customerId: string): Promise<CustomerSuccessInsightsResult> {
  const organizationId = UserContextManager.getCurrentOrganizationId();
  
  if (!organizationId) {
    return { status: 400, error: 'Organization ID not found in user context' };
  }

  try {
    // Generate fresh insights and persist them to database
    const freshInsights = await generateCustomerSuccessInsights(customerId);
    
    // Return the generated insights (they are now persisted)
    return {
      status: 200,
      payload: {
        freshInsights,
        savedInsights: freshInsights, // Same as fresh since they're now persisted
        allInsights: freshInsights
      }
    };
  } catch (err) {
    console.error('Error generating and saving CS insights:', err);
    return { status: 500, error: 'Internal server error' };
  }
}

/**
 * Get customer success insights for all customers in the organization
 */
export async function getAllCustomerSuccessInsights(): Promise<AllCustomerSuccessInsightsResult> {
  const organizationId = UserContextManager.getCurrentOrganizationId();
  
  if (!organizationId) {
    return { status: 400, error: 'Organization ID not found in user context' };
  }

  try {
    const customers = await CustomerModel.find({ organizationId })
      .select({ _id: 1, name: 1, logo: 1 })
      .lean();

    const results: Array<{ customerId: string; customerName?: string; insights: any[] }> = [];
    for (const c of customers) {
      // DB-only fetch: all saved customer success insights per customer (no on-demand generation)
      const insights = await getAllSavedCustomerSuccessInsights(String(c._id));
      console.log(`Customer ${c.name} (${c._id}) has ${insights.length} insights`);
      // Ensure each insight has the customer information
      const insightsWithCustomerInfo = insights.map(insight => ({
        ...insight,
        customerId: String(c._id),
        customerName: c.name,
        customerLogo: c.logo
      }));
      results.push({ customerId: String(c._id), customerName: c.name, insights: insightsWithCustomerInfo });
    }

    console.log(`Total customers with insights: ${results.length}`);
    console.log(`Total insights across all customers: ${results.reduce((sum, r) => sum + r.insights.length, 0)}`);
    return { status: 200, payload: results };
  } catch (err) {
    console.error('Error generating CS insights for all customers:', err);
    return { status: 500, error: 'Internal server error' };
  }
}

