import { InsightModel } from '../../schemas/insights.schema';
import { UserContextManager } from '../../context/userContext';
import { DateFilter, InsightsQueryResult, InsightsSummaryResult } from './types';

/**
 * Get insights for a specific organization with optional date filtering
 */
export async function getInsightsByOrganization(
  dateFilter?: DateFilter
): Promise<InsightsQueryResult> {
  // Get organization ID from user context
  const organizationId = UserContextManager.getCurrentOrganizationId();
  
  if (!organizationId) {
    throw new Error('Organization ID not found in user context');
  }

  // Build query filter
  const queryFilter: any = { 
    organizationId: organizationId 
  };

  // Add date filtering if provided
  if (dateFilter?.fromDate || dateFilter?.toDate) {
    queryFilter.lastUpdatedAt = {};
    
    if (dateFilter.fromDate) {
      queryFilter.lastUpdatedAt.$gte = new Date(dateFilter.fromDate);
    }
    
    if (dateFilter.toDate) {
      // Add one day to include the entire toDate
      const toDateObj = new Date(dateFilter.toDate);
      toDateObj.setDate(toDateObj.getDate() + 1);
      queryFilter.lastUpdatedAt.$lt = toDateObj;
    }
  }

  // Fetch insights for the organization, sorted by most recent
  const insights = await InsightModel.find(queryFilter)
    .sort({ lastUpdatedAt: -1 })
    .limit(50) // Limit to 50 most recent insights
    .lean(); // Use lean() for better performance

  // Transform the data to ensure proper format
  const formattedInsights = insights.map(insight => ({
    clusterId: insight.clusterId,
    organizationId: insight.organizationId.toString(),
    issueDescription: insight.issueDescription,
    ticketVolume: insight.ticketVolume,
    growthRate: insight.growthRate,
    firstDetectedAt: insight.firstDetectedAt.toISOString(),
    lastUpdatedAt: insight.lastUpdatedAt.toISOString(),
  }));

  console.log(`Retrieved ${formattedInsights.length} insights for organization ${organizationId}`);
  
  return {
    success: true,
    data: formattedInsights,
    count: formattedInsights.length
  };
}

/**
 * Get insights summary for a specific organization with optional date filtering
 */
export async function getInsightsSummary(
  dateFilter?: DateFilter
): Promise<InsightsSummaryResult> {
  // Get organization ID from user context
  const organizationId = UserContextManager.getCurrentOrganizationId();
  
  if (!organizationId) {
    throw new Error('Organization ID not found in user context');
  }
  
  // Build match filter for aggregation
  const matchFilter: any = { organizationId: organizationId };
  
  // Add date filtering if provided
  if (dateFilter?.fromDate || dateFilter?.toDate) {
    matchFilter.lastUpdatedAt = {};
    
    if (dateFilter.fromDate) {
      matchFilter.lastUpdatedAt.$gte = new Date(dateFilter.fromDate);
    }
    
    if (dateFilter.toDate) {
      // Add one day to include the entire toDate
      const toDateObj = new Date(dateFilter.toDate);
      toDateObj.setDate(toDateObj.getDate() + 1);
      matchFilter.lastUpdatedAt.$lt = toDateObj;
    }
  }
  
  // Get aggregated statistics
  const stats = await InsightModel.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: null,
        totalInsights: { $sum: 1 },
        totalTicketVolume: { $sum: '$ticketVolume' },
        avgGrowthRate: { $avg: '$growthRate' },
        maxGrowthRate: { $max: '$growthRate' },
        minGrowthRate: { $min: '$growthRate' },
        mostRecentUpdate: { $max: '$lastUpdatedAt' }
      }
    }
  ]);

  const summary = stats.length > 0 ? stats[0] : {
    totalInsights: 0,
    totalTicketVolume: 0,
    avgGrowthRate: 0,
    maxGrowthRate: 0,
    minGrowthRate: 0,
    mostRecentUpdate: null
  };

  // Remove the _id field from aggregation result
  delete summary._id;

  return {
    success: true,
    data: summary
  };
}

/**
 * Get all insights (admin endpoint)
 */
export async function getAllInsights(limit = 100, skip = 0): Promise<InsightsQueryResult> {
  const insights = await InsightModel.find({})
    .sort({ lastUpdatedAt: -1 })
    .limit(parseInt(limit.toString()))
    .skip(parseInt(skip.toString()))
    .populate('organizationId', 'name') // Populate organization name
    .lean();

  const formattedInsights = insights.map(insight => ({
    clusterId: insight.clusterId,
    organizationId: insight.organizationId,
    issueDescription: insight.issueDescription,
    ticketVolume: insight.ticketVolume,
    growthRate: insight.growthRate,
    firstDetectedAt: insight.firstDetectedAt.toISOString(),
    lastUpdatedAt: insight.lastUpdatedAt.toISOString(),
  }));

  return {
    success: true,
    data: formattedInsights,
    count: formattedInsights.length
  };
}

