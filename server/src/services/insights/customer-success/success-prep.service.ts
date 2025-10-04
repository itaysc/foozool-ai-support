import { CustomerSuccessInsight } from '../../../types/customerSuccessInsight';

/**
 * Generate customer success preparation insights
 */
export function generateCustomerSuccessPrep(activities: any[], customerName: string): CustomerSuccessInsight[] {
  const prep: CustomerSuccessInsight[] = [];

  // 1. Top Solution for Account
  const solutionGroups = groupActivitiesBySolution(activities);
  const solutionTotals = new Map<string, number>();
  
  for (const [solutionName, solutionActivities] of Array.from(solutionGroups.entries())) {
    const total = solutionActivities.reduce((sum, a) => sum + (a.metricValue || 0), 0);
    solutionTotals.set(solutionName, total);
  }

  if (solutionTotals.size > 0) {
    const topSolution = Array.from(solutionTotals.entries())
      .sort(([,a], [,b]) => b - a)[0];
    
    prep.push({
      type: 'top_solution',
      message: `${topSolution[0]} is the primary solution (${topSolution[1]} total usage) - focus discussion on this`,
      severity: 'info',
      category: 'customer_success',
      meta: { 
        topSolution: topSolution[0],
        totalUsage: topSolution[1],
        solutionCount: solutionTotals.size
      }
    });
  }

  // 2. Adoption Milestones
  const recentActivities = activities.filter(a => {
    if (!a.activityDate) return false;
    const activityDate = new Date(a.activityDate);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return activityDate >= thirtyDaysAgo;
  });

  if (recentActivities.length > 0) {
    const recentSolutions = new Set(recentActivities.map(a => a.solutionName));
    prep.push({
      type: 'adoption_milestones',
      message: `${customerName} actively using ${recentSolutions.size} solutions in last 30 days - good adoption`,
      severity: 'info',
      category: 'customer_success',
      meta: { 
        activeSolutions: Array.from(recentSolutions),
        solutionCount: recentSolutions.size,
        recentActivityCount: recentActivities.length
      }
    });
  }

  // 3. Correlation to Value
  const highValueActivities = activities.filter(a => a.metricValue > 100);
  if (highValueActivities.length > 0) {
    const highValueSolutions = Array.from(new Set(highValueActivities.map(a => a.solutionName)));
    prep.push({
      type: 'correlation_to_value',
      message: `${customerName} shows high-value usage in ${highValueSolutions.length} solutions - discuss ROI`,
      severity: 'info',
      category: 'customer_success',
      meta: { 
        highValueSolutions,
        highValueCount: highValueActivities.length,
        avgHighValue: (highValueActivities.reduce((sum, a) => sum + a.metricValue, 0) / highValueActivities.length).toFixed(1)
      }
    });
  }

  return prep;
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
