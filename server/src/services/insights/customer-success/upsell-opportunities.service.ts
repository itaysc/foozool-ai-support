import { CustomerSuccessInsight } from '../../../types/customerSuccessInsight';

/**
 * Generate upsell opportunities based on customer activity patterns
 */
export function generateUpsellOpportunities(activities: any[], orgActivities: any[], customerName: string): CustomerSuccessInsight[] {
  const opportunities: CustomerSuccessInsight[] = [];

  // 1. High Utilization / Capacity Limit
  const percentageActivities = activities.filter(a => a.metricType === 'percentage');
  for (const activity of percentageActivities) {
    if (activity.metricValue > 85) {
      opportunities.push({
        type: 'high_utilization',
        message: `${activity.solutionName} at ${activity.metricValue}% utilization - consider capacity upgrade`,
        severity: activity.metricValue > 95 ? 'red' : 'yellow',
        category: 'upsell',
        meta: { 
          solutionName: activity.solutionName,
          utilization: activity.metricValue,
          activityDate: activity.activityDate,
          upgradeUrgency: activity.metricValue > 95 ? 'high' : 'medium'
        }
      });
    }
  }

  // 2. Solution Gap Analysis
  const customerSolutions = new Set(activities.map(a => a.solutionName));
  const orgSolutions = new Set(orgActivities.map(a => a.solutionName));
  const unusedSolutions = Array.from(orgSolutions).filter(s => !customerSolutions.has(s));

  if (unusedSolutions.length > 0) {
    opportunities.push({
      type: 'solution_gap',
      message: `${customerName} not using ${unusedSolutions.length} available solutions: ${unusedSolutions.join(', ')}`,
      severity: 'info',
      category: 'upsell',
      meta: { 
        unusedSolutions,
        solutionCount: unusedSolutions.length,
        customerSolutions: Array.from(customerSolutions),
        totalOrgSolutions: orgSolutions.size
      }
    });
  }

  // 3. Increasing Usage Trend
  const solutionGroups = groupActivitiesBySolution(activities);
  for (const [solutionName, solutionActivities] of Array.from(solutionGroups.entries())) {
    if (solutionActivities.length >= 3) {
      // Sort by date and check for increasing trend
      const sortedActivities = solutionActivities
        .filter(a => a.activityDate)
        .sort((a, b) => new Date(a.activityDate).getTime() - new Date(b.activityDate).getTime());
      
      if (sortedActivities.length >= 3) {
        const recent = sortedActivities.slice(-3);
        const older = sortedActivities.slice(-6, -3);
        
        if (older.length > 0) {
          const recentAvg = recent.reduce((sum, a) => sum + (a.metricValue || 0), 0) / recent.length;
          const olderAvg = older.reduce((sum, a) => sum + (a.metricValue || 0), 0) / older.length;
          const growthPercent = ((recentAvg - olderAvg) / olderAvg) * 100;
          
          if (growthPercent > 25) {
            opportunities.push({
              type: 'increasing_usage',
              message: `${solutionName} usage increased ${growthPercent.toFixed(0)}% - expansion opportunity`,
              severity: 'info',
              category: 'upsell',
              meta: { 
                solutionName,
                growthPercent: growthPercent.toFixed(1),
                recentAvg: recentAvg.toFixed(1),
                olderAvg: olderAvg.toFixed(1),
                trendDirection: 'increasing'
              }
            });
          }
        }
      }
    }
  }

  // 4. Top Solution for Account
  const solutionTotals = new Map<string, number>();
  for (const [solutionName, solutionActivities] of Array.from(solutionGroups.entries())) {
    const total = solutionActivities.reduce((sum, a) => sum + (a.metricValue || 0), 0);
    solutionTotals.set(solutionName, total);
  }

  if (solutionTotals.size > 0) {
    const topSolution = Array.from(solutionTotals.entries())
      .sort(([,a], [,b]) => b - a)[0];
    
    opportunities.push({
      type: 'top_solution',
      message: `${topSolution[0]} is the top solution (${topSolution[1]} total usage) - explore advanced features`,
      severity: 'info',
      category: 'upsell',
      meta: { 
        topSolution: topSolution[0],
        totalUsage: topSolution[1],
        solutionRanking: Array.from(solutionTotals.entries())
          .sort(([,a], [,b]) => b - a)
          .map(([name, value], index) => ({ name, value, rank: index + 1 }))
      }
    });
  }

  return opportunities;
}

/**
 * Helper function to group activities by solution
 */
function groupActivitiesBySolution(activities: any[]): Map<string, any[]> {
  const groups = new Map<string, any[]>();
  for (const activity of activities) {
    if (!groups.has(activity.solutionName)) {
      groups.set(activity.solutionName, []);
    }
    groups.get(activity.solutionName)!.push(activity);
  }
  return groups;
}
