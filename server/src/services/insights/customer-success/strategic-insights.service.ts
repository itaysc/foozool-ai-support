import { CustomerSuccessInsight } from '../../../types/customerSuccessInsight';

/**
 * Generate strategic insights based on customer activity patterns
 */
export function generateStrategicInsights(activities: any[], customerName: string): CustomerSuccessInsight[] {
  const insights: CustomerSuccessInsight[] = [];

  // 1. Seasonality Patterns Analysis
  const monthlyGroups = new Map<string, any[]>();
  const monthlyTotals = new Map<string, number>();
  
  for (const activity of activities) {
    if (activity.activityDate) {
      const month = new Date(activity.activityDate).toISOString().substring(0, 7);
      if (!monthlyGroups.has(month)) {
        monthlyGroups.set(month, []);
      }
      monthlyGroups.get(month)!.push(activity);
    }
  }

  // Calculate monthly totals
  for (const [month, monthActivities] of Array.from(monthlyGroups.entries())) {
    const total = monthActivities.reduce((sum, a) => sum + (a.metricValue || 0), 0);
    monthlyTotals.set(month, total);
  }

  if (monthlyTotals.size >= 6) {
    const totals = Array.from(monthlyTotals.values());
    const maxValue = Math.max(...totals);
    const minValue = Math.min(...totals);
    const variationPercent = ((maxValue - minValue) / minValue) * 100;

    if (variationPercent > 50) {
      const maxMonth = Array.from(monthlyTotals.entries())
        .find(([, value]) => value === maxValue)?.[0];
      const minMonth = Array.from(monthlyTotals.entries())
        .find(([, value]) => value === minValue)?.[0];
      
      if (maxMonth && minMonth) {
        const peakMonthName = new Date(maxMonth + '-01').toLocaleDateString('en-US', { month: 'long' });
        const lowMonthName = new Date(minMonth + '-01').toLocaleDateString('en-US', { month: 'long' });
        
        insights.push({
          type: 'seasonality',
          message: `Strong seasonal pattern detected: ${peakMonthName} is ${Math.round(maxValue/minValue)}x more active than ${lowMonthName}. Plan engagement accordingly.`,
          severity: 'info',
          category: 'strategic',
          meta: { 
            peakMonth: peakMonthName,
            lowMonth: lowMonthName,
            peakValue: maxValue,
            lowValue: minValue,
            variationPercent: variationPercent.toFixed(1),
            ratio: Math.round(maxValue/minValue)
          }
        });
      }
    } else if (variationPercent > 25) {
      insights.push({
        type: 'seasonality',
        message: `Moderate seasonal variations detected (${variationPercent.toFixed(0)}% difference). Monitor patterns for optimal engagement timing.`,
        severity: 'info',
        category: 'strategic',
        meta: { 
          variationPercent: variationPercent.toFixed(1),
          monthlyData: Array.from(monthlyTotals.entries()).map(([month, value]) => ({
            month,
            value,
            monthName: new Date(month + '-01').toLocaleDateString('en-US', { month: 'long' })
          }))
        }
      });
    } else {
      insights.push({
        type: 'seasonality',
        message: `Consistent activity patterns across months. Customer maintains steady engagement throughout the year.`,
        severity: 'info',
        category: 'strategic',
        meta: { 
          variationPercent: variationPercent.toFixed(1),
          consistencyLevel: 'high',
          monthlyData: Array.from(monthlyTotals.entries()).map(([month, value]) => ({
            month,
            value,
            monthName: new Date(month + '-01').toLocaleDateString('en-US', { month: 'long' })
          }))
        }
      });
    }
  }

  // 2. Early Warning for Renewal (placeholder)
  insights.push({
    type: 'renewal_warning',
    message: 'Monitor activity trends as renewal approaches',
    severity: 'info',
    category: 'strategic',
    meta: { renewalRisk: 'medium', daysToRenewal: 90 }
  });

  return insights;
}
