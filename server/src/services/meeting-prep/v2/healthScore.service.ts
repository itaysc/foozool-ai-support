import { HealthScoreData } from './types';

/**
 * Calculate health score from customer data
 */
export function calculateHealthScore(customer: any): HealthScoreData {
  const currentScore = customer.healthScore;
  const previousScore = (customer as any).previousHealthScore;
  
  // Determine trend based on score comparison
  let trend = 'stable';
  if (previousScore !== undefined && previousScore !== null) {
    const scoreDifference = currentScore - previousScore;
    if (scoreDifference > 0) {
      trend = 'improving';
    } else if (scoreDifference < 0) {
      trend = 'declining';
    }
  }
  
  return {
    overallScore: currentScore,
    supportHealth: { score: currentScore },
    engagementHealth: { score: currentScore },
    businessHealth: { score: currentScore },
    trend: trend,
    lastUpdated: new Date()
  };
}

/**
 * Validate that customer has health score data
 */
export function validateHealthScore(customer: any): void {
  if (!customer.healthScore) {
    throw new Error('Customer health score not available. Cannot generate meeting prep document.');
  }
}
