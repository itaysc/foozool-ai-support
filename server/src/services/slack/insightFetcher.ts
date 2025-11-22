import { CustomerModel } from '../../schemas';
import { getAllSavedCustomerSuccessInsights } from '../insights/customer-success';
import { 
  convertNPSInsightsToUnified, 
  convertCSATInsightsToUnified,
  deduplicateInsightsByPeriod 
} from './insightFormatters';

/**
 * Fetch all insights for an organization (Customer Success, NPS, CSAT)
 * 
 * @param organizationId - The organization ID
 * @param customerIds - Optional array of customer IDs to filter. If undefined/null, fetches for all customers
 */
export async function fetchAllInsightsForOrganization(
  organizationId: string,
  customerIds?: string[]
): Promise<any[]> {
  const unifiedInsights: any[] = [];

  try {
    // Build customer query filter
    const customerFilter: any = { organizationId };
    if (customerIds && customerIds.length > 0) {
      customerFilter._id = { $in: customerIds };
    }

    // Get customers for the organization (filtered if customerIds provided)
    const customers = await CustomerModel.find(customerFilter)
      .select({ _id: 1, name: 1, logo: 1 })
      .lean();

    // Get Customer Success insights for all customers
    for (const customer of customers) {
      const csInsights = await getAllSavedCustomerSuccessInsights(String(customer._id));
      const insightsWithCustomerInfo = csInsights.map(insight => ({
        ...insight,
        customerId: String(customer._id),
        customerName: customer.name,
        customerLogo: customer.logo,
        insightType: 'customer_success'
      }));
      unifiedInsights.push(...insightsWithCustomerInfo);
    }

    // Get NPS and CSAT insights
    const { SurveysService } = await import('../surveys');
    const surveysService = SurveysService.getInstance();

    for (const customer of customers) {
      // Get NPS insights
      const npsInsights = await surveysService.getSurveyInsights(organizationId, 'nps', String(customer._id));
      if (npsInsights) {
        const npsUnifiedInsights = convertNPSInsightsToUnified(npsInsights, String(customer._id), customer.name);
        unifiedInsights.push(...npsUnifiedInsights);
      }

      // Get CSAT insights
      const csatInsights = await surveysService.getSurveyInsights(organizationId, 'csat', String(customer._id));
      if (csatInsights) {
        const csatUnifiedInsights = convertCSATInsightsToUnified(csatInsights, String(customer._id), customer.name);
        unifiedInsights.push(...csatUnifiedInsights);
      }
    }

    // Deduplicate insights
    const deduplicatedInsights = deduplicateInsightsByPeriod(unifiedInsights);

    // Sort by creation date (newest first)
    deduplicatedInsights.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.processedAt || 0);
      const dateB = new Date(b.createdAt || b.processedAt || 0);
      return dateB.getTime() - dateA.getTime();
    });

    return deduplicatedInsights;
  } catch (error: any) {
    console.error('Error fetching insights for organization:', error);
    return [];
  }
}

