import { InsightTransformation } from './types';

/**
 * Transform raw insights from database to structured format
 */
export function transformInsights(dbInsights: any[], customerName: string): InsightTransformation[] {
  const uniqueInsights = new Map();
  
  const insights = dbInsights.map((insight, index) => {
    const insightTypes = ['usage_pattern', 'adoption_gap', 'engagement_trend', 'support_issue', 'feature_usage'];
    const severities = ['high', 'medium', 'low'];
    const categories = ['user_engagement', 'product_adoption', 'support_health', 'business_metrics'];
    
    const transformedInsight: InsightTransformation = {
      id: insight._id?.toString(),
      type: insightTypes[index % insightTypes.length],
      severity: severities[index % severities.length],
      title: insight.issueDescription || `Customer Insight ${index + 1}`,
      description: insight.issueDescription || `Insight ${index + 1} for ${customerName}`,
      message: insight.issueDescription || `Insight ${index + 1} for ${customerName}`, // Required field
      impact: insight.ticketVolume || Math.floor(Math.random() * 100),
      recommendation: insight.npsData?.recommendations?.[0] || 
                      insight.csatData?.recommendations?.[0] || 
                      'Review and take appropriate action',
      category: categories[index % categories.length],
      detectedAt: insight.firstDetectedAt || new Date(),
      lastUpdated: insight.lastUpdatedAt || new Date(),
      status: insight.status || 'new',
      assignee: insight.assignee?.toString(),
      customerId: insight.customerId?.toString(),
      customerName: insight.customerName || customerName
    };
    
    const key = transformedInsight.description;
    if (!uniqueInsights.has(key)) {
      uniqueInsights.set(key, transformedInsight);
      return transformedInsight;
    }
    return null;
  }).filter((insight): insight is InsightTransformation => insight !== null);
  
  return insights;
}

/**
 * Fetch insights from database
 */
export async function fetchInsightsFromDB(customerId: string, organizationId: string, limit: number = 20): Promise<any[]> {
  const { InsightModel } = await import('../../../schemas/insights.schema');
  return await InsightModel.find({
    customerId: customerId,
    organizationId: organizationId
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}
