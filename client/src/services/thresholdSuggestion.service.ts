import { IThresholdMissStats } from '../types/thresholdMiss';

export interface IThresholdSuggestion {
  actionType: string;
  thresholdName: string;
  currentThreshold: number;
  suggestedThreshold: number;
  changeAmount: number;
  confidence: number; // How confident we are in this suggestion (0-1)
  reasoning: string;
  impact: 'high' | 'medium' | 'low';
}

export class ThresholdSuggestionService {
  /**
   * Calculate suggested thresholds based on threshold miss data
   */
  static calculateSuggestions(stats: IThresholdMissStats[], currentThresholds?: any[]): IThresholdSuggestion[] {
    const suggestions: IThresholdSuggestion[] = [];

    for (const stat of stats) {
      if (stat.missCount > 0) {
        const suggestion = this.calculateSuggestionForThreshold(stat, currentThresholds);
        if (suggestion) {
          suggestions.push(suggestion);
        }
      }
    }

    // Sort by impact (high to low) and then by confidence
    return suggestions.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      const impactDiff = impactOrder[b.impact] - impactOrder[a.impact];
      if (impactDiff !== 0) return impactDiff;
      return b.confidence - a.confidence;
    });
  }

  /**
   * Calculate suggestion for a specific threshold
   */
  private static calculateSuggestionForThreshold(stat: IThresholdMissStats, currentThresholds?: any[]): IThresholdSuggestion | null {
    const { actionType, thresholdName, missCount, averageMissBy, missRate } = stat;
    
    // Skip if no misses
    if (missCount === 0) return null;

    // Find current threshold value from database
    let currentThreshold = 0.85; // Default fallback
    if (currentThresholds) {
      const threshold = currentThresholds.find((t: any) => 
        t.actionType === actionType && t.name === thresholdName
      );
      if (threshold) {
        currentThreshold = threshold.threshold;
      }
    }

    // Calculate suggested threshold based on miss patterns
    let suggestedThreshold: number;
    let reasoning: string;
    let confidence: number;
    let impact: 'high' | 'medium' | 'low';

    // Base suggestion: reduce threshold by the average miss amount
    const baseReduction = Math.min(averageMissBy * 0.8, 0.15); // Conservative reduction
    suggestedThreshold = Math.max(0.1, currentThreshold - baseReduction); // Don't go below 0.1

    // Adjust based on miss rate
    if (missRate > 70) {
      // High miss rate - more aggressive reduction
      suggestedThreshold = Math.max(0.1, suggestedThreshold - 0.05);
      reasoning = `High miss rate (${missRate.toFixed(1)}%) suggests threshold is too strict.`;
      impact = 'high';
      confidence = 0.9;
    } else if (missRate > 40) {
      // Medium miss rate - moderate reduction
      reasoning = `Moderate miss rate (${missRate.toFixed(1)}%) indicates threshold could be optimized.`;
      impact = 'medium';
      confidence = 0.7;
    } else {
      // Low miss rate - conservative adjustment
      reasoning = `Low miss rate (${missRate.toFixed(1)}%) suggests minor threshold adjustment.`;
      impact = 'low';
      confidence = 0.5;
    }

    // Adjust based on action type sensitivity
    const actionTypeAdjustments: { [key: string]: { reduction: number; reason: string } } = {
      'refund': { reduction: 0.02, reason: 'Refunds are high-impact actions requiring careful consideration.' },
      'escalate': { reduction: 0.01, reason: 'Escalations affect customer experience and should be conservative.' },
      'auto_resolve': { reduction: 0.03, reason: 'Auto-resolve can be more aggressive as it reduces manual work.' },
      'coupon': { reduction: 0.02, reason: 'Coupons have business impact but are reversible.' },
      'priority_change': { reduction: 0.01, reason: 'Priority changes affect resource allocation.' },
      'auto_reply': { reduction: 0.03, reason: 'Auto-replies are low-risk and can be more aggressive.' }
    };

    const adjustment = actionTypeAdjustments[actionType];
    if (adjustment) {
      suggestedThreshold = Math.max(0.1, suggestedThreshold - adjustment.reduction);
      reasoning += ` ${adjustment.reason}`;
    }

    // Ensure suggested threshold is reasonable
    suggestedThreshold = Math.max(0.1, Math.min(0.95, suggestedThreshold));

    const changeAmount = currentThreshold - suggestedThreshold; // Assuming current threshold is 0.85

    return {
      actionType,
      thresholdName,
      currentThreshold: currentThreshold, // This should come from the actual threshold data
      suggestedThreshold: Math.round(suggestedThreshold * 1000) / 1000, // Round to 3 decimal places
      changeAmount: Math.round(changeAmount * 1000) / 1000,
      confidence,
      reasoning,
      impact
    };
  }

  /**
   * Get impact color for UI display
   */
  static getImpactColor(impact: 'high' | 'medium' | 'low'): string {
    switch (impact) {
      case 'high':
        return '#f44336'; // Red
      case 'medium':
        return '#ff9800'; // Orange
      case 'low':
        return '#4caf50'; // Green
      default:
        return '#757575'; // Gray
    }
  }

  /**
   * Get impact description for UI display
   */
  static getImpactDescription(impact: 'high' | 'medium' | 'low'): string {
    switch (impact) {
      case 'high':
        return 'High Impact - Significant improvement expected';
      case 'medium':
        return 'Medium Impact - Moderate improvement expected';
      case 'low':
        return 'Low Impact - Minor improvement expected';
      default:
        return 'Unknown Impact';
    }
  }
}
