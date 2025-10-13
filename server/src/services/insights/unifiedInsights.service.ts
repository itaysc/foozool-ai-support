import { CustomerModel } from '../../schemas';
import { UserContextManager } from '../../context/userContext';
import { getAllSavedCustomerSuccessInsights } from './customer-success';

/**
 * Helper function to deduplicate insights keeping only the latest by period
 * Groups insights by content (message, type, severity, category, customerId) 
 * and keeps only the insight with the latest createdAt date
 */
function deduplicateInsightsByPeriod(insights: any[]): any[] {
  // Create a map to group insights by their unique content
  const insightGroups = new Map<string, any[]>();
  
  for (const insight of insights) {
    // Create a unique key based on the content fields (excluding date/period)
    const key = JSON.stringify({
      type: insight.type,
      message: insight.message,
      severity: insight.severity,
      category: insight.category,
      customerId: insight.customerId,
      // Include insightType to differentiate between different insight sources
      insightType: insight.insightType
    });
    
    if (!insightGroups.has(key)) {
      insightGroups.set(key, []);
    }
    insightGroups.get(key)!.push(insight);
  }
  
  // For each group, keep only the insight with the latest createdAt
  const deduplicatedInsights: any[] = [];
  for (const [key, group] of insightGroups) {
    if (group.length === 1) {
      // No duplicates, just add the single insight
      deduplicatedInsights.push(group[0]);
    } else {
      // Sort by createdAt (most recent first) and take the first one
      const sortedGroup = group.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.processedAt || 0);
        const dateB = new Date(b.createdAt || b.processedAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
      deduplicatedInsights.push(sortedGroup[0]);
      
      // Log deduplication for debugging
      console.log(`[Insights Deduplication] Removed ${group.length - 1} duplicate(s) for insight: ${sortedGroup[0].message?.substring(0, 50)}...`);
    }
  }
  
  return deduplicatedInsights;
}

/**
 * Convert NPS insights to unified format
 */
function convertNPSInsightsToUnified(npsInsights: any, customerId: string, customerName?: string): any[] {
  const insights: any[] = [];
  
  // Create insights from NPS data
  if (npsInsights.insights && npsInsights.insights.length > 0) {
    npsInsights.insights.forEach((insight: string, index: number) => {
      insights.push({
        id: `nps_${customerId}_${index}_${Date.now()}`,
        type: 'nps_insight',
        message: insight,
        severity: npsInsights.currentNPS < 0 ? 'red' : npsInsights.currentNPS < 50 ? 'yellow' : 'info',
        category: 'customer_success',
        meta: {
          npsScore: npsInsights.currentNPS,
          npsChange: npsInsights.npsChange,
          responseRate: npsInsights.responseRate,
          totalResponses: npsInsights.totalResponses,
          processedAt: npsInsights.processedAt
        },
        status: 'new',
        createdAt: npsInsights.processedAt?.toISOString() || new Date().toISOString(),
        customerId: customerId,
        customerName: customerName || 'Unknown Customer',
        insightType: 'nps_analysis'
      });
    });
  }

  // Create insights from recommendations
  if (npsInsights.recommendations && npsInsights.recommendations.length > 0) {
    npsInsights.recommendations.forEach((recommendation: string, index: number) => {
      insights.push({
        id: `nps_rec_${customerId}_${index}_${Date.now()}`,
        type: 'nps_recommendation',
        message: recommendation,
        severity: 'info',
        category: 'opportunity',
        meta: {
          npsScore: npsInsights.currentNPS,
          npsChange: npsInsights.npsChange,
          responseRate: npsInsights.responseRate,
          totalResponses: npsInsights.totalResponses,
          processedAt: npsInsights.processedAt
        },
        status: 'new',
        createdAt: npsInsights.processedAt?.toISOString() || new Date().toISOString(),
        customerId: customerId,
        customerName: customerName || 'Unknown Customer',
        insightType: 'nps_analysis'
      });
    });
  }

  return insights;
}

/**
 * Convert CSAT insights to unified format
 */
function convertCSATInsightsToUnified(csatInsights: any, customerId: string, customerName?: string): any[] {
  const insights: any[] = [];
  
  // Create insights from CSAT data
  if (csatInsights.insights && csatInsights.insights.length > 0) {
    csatInsights.insights.forEach((insight: string, index: number) => {
      insights.push({
        id: `csat_${customerId}_${index}_${Date.now()}`,
        type: 'csat_insight',
        message: insight,
        severity: csatInsights.currentCSAT < 3 ? 'red' : csatInsights.currentCSAT < 4 ? 'yellow' : 'info',
        category: 'customer_success',
        meta: {
          csatScore: csatInsights.currentCSAT,
          csatChange: csatInsights.csatChange,
          responseRate: csatInsights.responseRate,
          totalResponses: csatInsights.totalResponses,
          processedAt: csatInsights.processedAt
        },
        status: 'new',
        createdAt: csatInsights.processedAt?.toISOString() || new Date().toISOString(),
        customerId: customerId,
        customerName: customerName || 'Unknown Customer',
        insightType: 'customer_satisfaction'
      });
    });
  }

  // Create insights from recommendations
  if (csatInsights.recommendations && csatInsights.recommendations.length > 0) {
    csatInsights.recommendations.forEach((recommendation: string, index: number) => {
      insights.push({
        id: `csat_rec_${customerId}_${index}_${Date.now()}`,
        type: 'csat_recommendation',
        message: recommendation,
        severity: 'info',
        category: 'opportunity',
        meta: {
          csatScore: csatInsights.currentCSAT,
          csatChange: csatInsights.csatChange,
          responseRate: csatInsights.responseRate,
          totalResponses: csatInsights.totalResponses,
          processedAt: csatInsights.processedAt
        },
        status: 'new',
        createdAt: csatInsights.processedAt?.toISOString() || new Date().toISOString(),
        customerId: customerId,
        customerName: customerName || 'Unknown Customer',
        insightType: 'customer_satisfaction'
      });
    });
  }

  return insights;
}

/**
 * Get all unified insights (NPS, CSAT, and Customer Success) for an organization
 */
export async function getAllUnifiedInsights(customerId?: string): Promise<{ status: number; data?: any; error?: string }> {
  const organizationId = UserContextManager.getCurrentOrganizationId();
  if (!organizationId) {
    return { status: 400, error: 'Organization ID not found in user context' };
  }

  try {
    const unifiedInsights: any[] = [];

    // Get Customer Success insights
    if (customerId) {
      // Get insights for specific customer
      const csInsights = await getAllSavedCustomerSuccessInsights(customerId);
      const insightsWithCustomerInfo = csInsights.map(insight => ({
        ...insight,
        customerId: customerId,
        customerName: insight.customerName || 'Unknown Customer',
        insightType: 'customer_success'
      }));
      unifiedInsights.push(...insightsWithCustomerInfo);
    } else {
      // Get insights for all customers
      const customers = await CustomerModel.find({ organizationId })
        .select({ _id: 1, name: 1, logo: 1 })
        .lean();

      for (const c of customers) {
        const insights = await getAllSavedCustomerSuccessInsights(String(c._id));
        const insightsWithCustomerInfo = insights.map(insight => ({
          ...insight,
          customerId: String(c._id),
          customerName: c.name,
          customerLogo: c.logo,
          insightType: 'customer_success'
        }));
        unifiedInsights.push(...insightsWithCustomerInfo);
      }
    }

    // Get NPS insights
    const { SurveysService } = await import('../surveys');
    const surveysService = SurveysService.getInstance();
    
    if (customerId) {
      const npsInsights = await surveysService.getSurveyInsights(organizationId, 'nps', customerId);
      if (npsInsights) {
        // Convert NPS insights to unified format
        const npsUnifiedInsights = convertNPSInsightsToUnified(npsInsights, customerId);
        unifiedInsights.push(...npsUnifiedInsights);
      }
    } else {
      // Get NPS insights for all customers
      const customers = await CustomerModel.find({ organizationId })
        .select({ _id: 1, name: 1 })
        .lean();

      for (const c of customers) {
        const npsInsights = await surveysService.getSurveyInsights(organizationId, 'nps', String(c._id));
        if (npsInsights) {
          const npsUnifiedInsights = convertNPSInsightsToUnified(npsInsights, String(c._id), c.name);
          unifiedInsights.push(...npsUnifiedInsights);
        }
      }
    }

    // Get CSAT insights
    if (customerId) {
      const csatInsights = await surveysService.getSurveyInsights(organizationId, 'csat', customerId);
      if (csatInsights) {
        const csatUnifiedInsights = convertCSATInsightsToUnified(csatInsights, customerId);
        unifiedInsights.push(...csatUnifiedInsights);
      }
    } else {
      const customers = await CustomerModel.find({ organizationId })
        .select({ _id: 1, name: 1 })
        .lean();

      for (const c of customers) {
        const csatInsights = await surveysService.getSurveyInsights(organizationId, 'csat', String(c._id));
        if (csatInsights) {
          const csatUnifiedInsights = convertCSATInsightsToUnified(csatInsights, String(c._id), c.name);
          unifiedInsights.push(...csatUnifiedInsights);
        }
      }
    }

    // Deduplicate insights by period - keep only the latest when insights differ only by period
    const deduplicatedInsights = deduplicateInsightsByPeriod(unifiedInsights);
    console.log(`[Insights] Total insights before deduplication: ${unifiedInsights.length}, after: ${deduplicatedInsights.length}`);

    // Sort by creation date (newest first)
    deduplicatedInsights.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.processedAt || 0);
      const dateB = new Date(b.createdAt || b.processedAt || 0);
      return dateB.getTime() - dateA.getTime();
    });

    return {
      status: 200,
      data: deduplicatedInsights
    };
  } catch (error: any) {
    console.error('Error fetching unified insights:', error);
    return { status: 500, error: 'Internal server error' };
  }
}

