import { CustomerSuccessInsight } from '../../../types/customerSuccessInsight';

/**
 * Generate risk alerts based on customer activity patterns
 */
export function generateRiskAlerts(activities: any[], customerName: string, last30Start: Date, prev30Start: Date, last60Start: Date): CustomerSuccessInsight[] {
  const alerts: CustomerSuccessInsight[] = [];
  const now = new Date();

  // 1. Declining Activity
  const recentActivities = activities.filter(a => 
    a.activityDate && new Date(a.activityDate) >= last30Start
  );
  const olderActivities = activities.filter(a => 
    a.activityDate && new Date(a.activityDate) >= prev30Start && new Date(a.activityDate) < last30Start
  );

  if (recentActivities.length > 0 && olderActivities.length > 0) {
    const recentTotal = recentActivities.reduce((sum, a) => sum + (a.metricValue || 0), 0);
    const olderTotal = olderActivities.reduce((sum, a) => sum + (a.metricValue || 0), 0);
    const declinePercent = ((olderTotal - recentTotal) / olderTotal) * 100;

    if (declinePercent > 50) {
      alerts.push({
        type: 'declining_activity',
        message: `${customerName} shows ${declinePercent.toFixed(0)}% decline in activity - high churn risk`,
        severity: 'red',
        category: 'risk',
        meta: { 
          declinePercent: declinePercent.toFixed(1),
          recentTotal,
          olderTotal,
          recentCount: recentActivities.length,
          olderCount: olderActivities.length
        }
      });
    } else if (declinePercent > 25) {
      alerts.push({
        type: 'declining_activity',
        message: `${customerName} shows ${declinePercent.toFixed(0)}% decline in activity - monitor closely`,
        severity: 'yellow',
        category: 'risk',
        meta: { 
          declinePercent: declinePercent.toFixed(1),
          recentTotal,
          olderTotal,
          recentCount: recentActivities.length,
          olderCount: olderActivities.length
        }
      });
    }
  }

  // 2. Inactive Customer
  const lastActivity = activities.length > 0 ? 
    Math.max(...activities.map(a => new Date(a.activityDate || a.createdAt).getTime())) : 0;
  const daysSinceLastActivity = (now.getTime() - lastActivity) / (1000 * 60 * 60 * 24);

  if (daysSinceLastActivity > 30) {
    alerts.push({
      type: 'inactive_customer',
      message: `${customerName} has been inactive for ${Math.floor(daysSinceLastActivity)} days - re-engagement needed`,
      severity: 'red',
      category: 'risk',
      meta: { 
        daysSinceLastActivity: Math.floor(daysSinceLastActivity),
        lastActivityDate: new Date(lastActivity).toISOString()
      }
    });
  } else if (daysSinceLastActivity > 14) {
    alerts.push({
      type: 'inactive_customer',
      message: `${customerName} has been inactive for ${Math.floor(daysSinceLastActivity)} days - check in needed`,
      severity: 'yellow',
      category: 'risk',
      meta: { 
        daysSinceLastActivity: Math.floor(daysSinceLastActivity),
        lastActivityDate: new Date(lastActivity).toISOString()
      }
    });
  }

  // 3. Low Utilization
  const percentageActivities = activities.filter(a => a.metricType === 'percentage');
  const lowUtilizationSolutions = percentageActivities.filter(a => a.metricValue < 30);

  if (lowUtilizationSolutions.length > 0) {
    const solutionNames = Array.from(new Set(lowUtilizationSolutions.map(a => a.solutionName)));
    alerts.push({
      type: 'low_utilization',
      message: `${customerName} has low utilization (<30%) in ${solutionNames.length} solutions: ${solutionNames.join(', ')}`,
      severity: 'yellow',
      category: 'risk',
      meta: { 
        lowUtilizationSolutions: solutionNames,
        solutionCount: solutionNames.length,
        activities: lowUtilizationSolutions.map(a => ({
          solutionName: a.solutionName,
          utilization: a.metricValue,
          date: a.activityDate
        }))
      }
    });
  }

  // 4. One Solution Dependency
  const solutionGroups = new Map<string, any[]>();
  for (const activity of activities) {
    if (!solutionGroups.has(activity.solutionName)) {
      solutionGroups.set(activity.solutionName, []);
    }
    solutionGroups.get(activity.solutionName)!.push(activity);
  }

  if (solutionGroups.size === 1) {
    const singleSolution = Array.from(solutionGroups.keys())[0];
    alerts.push({
      type: 'one_solution_dependency',
      message: `${customerName} only uses ${singleSolution} - diversification risk`,
      severity: 'yellow',
      category: 'risk',
      meta: { 
        singleSolution,
        totalActivities: activities.length,
        dependencyRisk: 'high'
      }
    });
  }

  return alerts;
}
