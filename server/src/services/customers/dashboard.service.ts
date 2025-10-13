import { InsightModel } from '../../schemas/insights.schema';

/**
 * Helper function to calculate week-year period from date
 * Format: "2025 W33"
 */
function calculateWeekYear(date: Date): string {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year} W${week.toString().padStart(2, '0')}`;
}

export interface InsightsAnalyticsResult {
  chartData: Array<{
    period: string;
    total: number;
    [key: string]: any;
  }>;
  insightTypes: string[];
  periods: string[];
  statusChartData: Array<{
    period: string;
    total: number;
    [key: string]: any;
  }>;
  statusTypes: string[];
  severityChartData: Array<{
    period: string;
    total: number;
    [key: string]: any;
  }>;
  severityTypes: string[];
  summary: {
    totalInsights: number;
    totalPeriods: number;
    averageInsightsPerPeriod: number;
    mostRecentPeriod: string | null;
    mostRecentTotal: number;
  };
}

/**
 * Get insights data aggregated by period for customer dashboard analytics
 * @param organizationId - The organization ID to filter insights
 * @param customerId - Optional customer ID to filter insights for a specific customer
 * @returns Promise<InsightsAnalyticsResult>
 */
export async function getInsightsAnalytics(
  organizationId: string, 
  customerId?: string
): Promise<InsightsAnalyticsResult> {
  // Build query filter
  const queryFilter: any = {
    organizationId: organizationId,
    insightType: 'customer_success' // Focus on customer success insights
  };

  // Add customer filter if provided
  if (customerId) {
    queryFilter.customerId = customerId;
  }

  // Get insights for the organization, sorted by creation date
  const insights = await InsightModel.find(queryFilter)
    .sort({ firstDetectedAt: 1 }) // Sort by first detected date ascending
    .lean();

  // Single pass aggregation for all three chart types
  const insightsByPeriod: Record<string, Record<string, number>> = {};
  const insightsByStatus: Record<string, Record<string, number>> = {};
  const insightsBySeverity: Record<string, Record<string, number>> = {};
  
  const allInsightTypes = new Set<string>();
  const allStatusTypes = new Set<string>();
  const allSeverityTypes = new Set<string>();
  
  insights.forEach(insight => {
    // Use firstDetectedAt as the primary date for period calculation
    const date = insight.firstDetectedAt || new Date();
    const period = calculateWeekYear(date);
    
    // Get insight type, status, and severity
    const insightType = insight.metadata?.type || 'unknown';
    const status = insight.status || 'pending';
    const severity = insight.metadata?.severity || 'info';
    
    // Initialize period objects if they don't exist
    [insightsByPeriod, insightsByStatus, insightsBySeverity].forEach(obj => {
      if (!obj[period]) {
        obj[period] = {};
      }
    });
    
    // Increment counts for all three aggregations
    insightsByPeriod[period][insightType] = (insightsByPeriod[period][insightType] || 0) + 1;
    insightsByStatus[period][status] = (insightsByStatus[period][status] || 0) + 1;
    insightsBySeverity[period][severity] = (insightsBySeverity[period][severity] || 0) + 1;
    
    // Collect all unique types
    allInsightTypes.add(insightType);
    allStatusTypes.add(status);
    allSeverityTypes.add(severity);
  });

  // Get sorted periods and types
  const periods = Object.keys(insightsByPeriod).sort();
  const insightTypes = Array.from(allInsightTypes).sort();
  const statusTypes = Array.from(allStatusTypes).sort();
  const severityTypes = Array.from(allSeverityTypes).sort();
  
  // Helper function to create chart data
  const createChartData = (periodData: Record<string, Record<string, number>>, types: string[]) => {
    return periods.map(period => {
      const dataPoint: any = {
        period: period,
        total: 0
      };
      
      types.forEach(type => {
        const count = periodData[period]?.[type] || 0;
        dataPoint[type] = count;
        dataPoint.total += count;
      });
      
      return dataPoint;
    });
  };
  
  // Create data structures for all three charts
  const chartData = createChartData(insightsByPeriod, insightTypes);
  const statusChartData = createChartData(insightsByStatus, statusTypes);
  const severityChartData = createChartData(insightsBySeverity, severityTypes);

  // Calculate summary statistics
  const totalInsights = insights.length;
  const totalPeriods = periods.length;
  const averageInsightsPerPeriod = totalPeriods > 0 ? Math.round(totalInsights / totalPeriods * 100) / 100 : 0;

  // Get most recent period data
  const mostRecentPeriod = periods[periods.length - 1] || null;
  const mostRecentInsights = mostRecentPeriod ? insightsByPeriod[mostRecentPeriod] : {};
  const mostRecentTotal = mostRecentPeriod ? 
    Object.values(mostRecentInsights).reduce((sum, count) => sum + count, 0) : 0;

  return {
    chartData,
    insightTypes,
    periods,
    statusChartData,
    statusTypes,
    severityChartData,
    severityTypes,
    summary: {
      totalInsights,
      totalPeriods,
      averageInsightsPerPeriod,
      mostRecentPeriod,
      mostRecentTotal
    }
  };
}
