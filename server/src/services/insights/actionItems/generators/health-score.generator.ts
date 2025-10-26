import { IActionItemGenerator, InsightForGenerator } from './interface';
import { GeneratedActionItem } from '../types';

export class HealthScoreActionItemGenerator implements IActionItemGenerator {
  private readonly HEALTH_SCORE_INSIGHT_TYPES = [
    'health_score_at_risk',
    'health_score_critical',
    'declining_activity',
    'inactive_customer',
    'engagement_drop',
    'feature_adoption_decline'
  ];

  getSupportedInsightTypes(): string[] {
    return this.HEALTH_SCORE_INSIGHT_TYPES;
  }

  canHandle(insight: InsightForGenerator): boolean {
    if (insight.insightType !== 'customer_success') return false;
    
    const insightType = insight.metadata?.type as string;
    return this.HEALTH_SCORE_INSIGHT_TYPES.includes(insightType);
  }

  generate(insight: InsightForGenerator): GeneratedActionItem[] {
    const items: GeneratedActionItem[] = [];
    const insightType = insight.metadata?.type as string;
    const meta = insight.metadata?.meta || {};

    switch (insightType) {
      case 'health_score_at_risk':
      case 'health_score_critical':
        items.push(...this.handleHealthScoreAtRisk(insightType, meta));
        break;
      
      case 'declining_activity':
      case 'engagement_drop':
        items.push(...this.handleDecliningActivity(meta));
        break;
      
      case 'inactive_customer':
        items.push(...this.handleInactiveCustomer(meta));
        break;
      
      case 'feature_adoption_decline':
        items.push(...this.handleFeatureAdoptionDecline(meta));
        break;
    }

    return items;
  }

  private handleHealthScoreAtRisk(insightType: string, meta: Record<string, unknown>): GeneratedActionItem[] {
    const items: GeneratedActionItem[] = [];
    const healthScore = Number(meta.healthScore) || Number(meta.currentHealthScore) || 0;
    const isCritical = insightType.includes('critical');

    if (healthScore > 0) {
      items.push({
        title: isCritical ? 'Schedule urgent health check call' : 'Schedule health check call',
        description: `Customer health score is ${healthScore}/100. ${isCritical ? 'Immediate intervention needed.' : 'Review customer status and engagement.'}`,
        severity: isCritical ? 'critical' : 'high',
        priority: isCritical ? 'P0' : 'P1'
      });
    }

    return items;
  }

  private handleDecliningActivity(meta: Record<string, unknown>): GeneratedActionItem[] {
    const items: GeneratedActionItem[] = [];
    const activityDecline = Number(meta.activityDecline) || Number(meta.declinePercentage) || 0;
    const daysDeclining = Number(meta.daysDeclining) || 0;

    if (activityDecline > 30) {
      const isCritical = activityDecline > 50 || daysDeclining > 60;
      
      items.push({
        title: 'Investigate declining activity trend',
        description: `Activity declined ${activityDecline}%${daysDeclining > 0 ? ` over ${daysDeclining} days` : ''}. Reach out to understand usage pattern changes.`,
        severity: isCritical ? 'critical' : 'high',
        priority: isCritical ? 'P0' : 'P1'
      });
    }

    return items;
  }

  private handleInactiveCustomer(meta: Record<string, unknown>): GeneratedActionItem[] {
    const items: GeneratedActionItem[] = [];
    const daysSinceLastActivity = Number(meta.daysSinceLastActivity) || Number(meta.daysInactive) || 0;

    if (daysSinceLastActivity > 30) {
      const isCritical = daysSinceLastActivity > 90;
      
      items.push({
        title: 'Re-engage inactive customer',
        description: `No activity for ${daysSinceLastActivity} days. Contact customer to understand needs and re-engage with product.`,
        severity: isCritical ? 'critical' : 'high',
        priority: isCritical ? 'P1' : 'P2'
      });
    }

    return items;
  }

  private handleFeatureAdoptionDecline(meta: Record<string, unknown>): GeneratedActionItem[] {
    const items: GeneratedActionItem[] = [];
    const feature = meta.featureName as string || 'features';
    const declinePercentage = Number(meta.declinePercentage) || 0;

    if (declinePercentage > 20) {
      items.push({
        title: 'Review feature adoption decline',
        description: `${feature} adoption decreased by ${declinePercentage}%. Offer additional training or support to improve adoption.`,
        severity: 'high',
        priority: 'P2'
      });
    }

    return items;
  }
}
