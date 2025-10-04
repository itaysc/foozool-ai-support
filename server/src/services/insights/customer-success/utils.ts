/**
 * Utility functions for customer success insights
 */

/**
 * Helper function to group activities by solution
 */
export function groupActivitiesBySolution(activities: any[]): Map<string, any[]> {
  const groups = new Map<string, any[]>();
  for (const activity of activities) {
    if (!groups.has(activity.solutionName)) {
      groups.set(activity.solutionName, []);
    }
    groups.get(activity.solutionName)!.push(activity);
  }
  return groups;
}

/**
 * Helper function to get expected payment days based on payment terms
 */
export function getExpectedPaymentDays(paymentTerms: string): number {
  switch (paymentTerms) {
    case 'net15': return 15;
    case 'net30': return 30;
    case 'net60': return 60;
    case 'net90': return 90;
    case 'prepaid': return 0;
    case 'monthly': return 30;
    case 'annual': return 365;
    default: return 30;
  }
}
