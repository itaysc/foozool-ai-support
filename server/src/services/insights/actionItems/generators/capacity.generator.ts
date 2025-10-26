import { IActionItemGenerator, InsightForGenerator } from './interface';
import { GeneratedActionItem } from '../types';

export class CapacityActionItemGenerator implements IActionItemGenerator {
  private readonly CAPACITY_INSIGHT_TYPES = [
    'storage_capacity_critical',
    'storage_capacity_warning',
    'user_capacity_critical',
    'user_growth_planning',
    'transaction_capacity_warning',
    'api_capacity_growth_planning',
    'upgrade_approaching',
    'upgrade_overdue',
    'significant_growth_projection',
    'constraint_resolution_approaching',
    'ongoing_high_impact_constraint'
  ];

  getSupportedInsightTypes(): string[] {
    return this.CAPACITY_INSIGHT_TYPES;
  }

  canHandle(insight: InsightForGenerator): boolean {
    if (insight.insightType !== 'customer_success') return false;
    
    const insightType = insight.metadata?.type as string;
    return this.CAPACITY_INSIGHT_TYPES.includes(insightType);
  }

  generate(insight: InsightForGenerator): GeneratedActionItem[] {
    const items: GeneratedActionItem[] = [];
    const insightType = insight.metadata?.type as string;
    const meta = insight.metadata?.meta || {};

    switch (insightType) {
      case 'storage_capacity_critical':
      case 'storage_capacity_warning':
        items.push(...this.handleStorageCapacity(insightType, meta));
        break;
      
      case 'user_capacity_critical':
      case 'user_growth_planning':
        items.push(...this.handleUserCapacity(insightType, meta));
        break;
      
      case 'upgrade_approaching':
        items.push(...this.handleUpgradeApproaching(meta));
        break;
      
      case 'upgrade_overdue':
        items.push(...this.handleUpgradeOverdue(meta));
        break;
      
      case 'transaction_capacity_warning':
      case 'api_capacity_growth_planning':
        items.push(...this.handleUsageCapacity(insightType, meta));
        break;
    }

    return items;
  }

  private handleStorageCapacity(insightType: string, meta: Record<string, unknown>): GeneratedActionItem[] {
    const items: GeneratedActionItem[] = [];
    const utilization = Number(meta.utilization) || Number(meta.storageUtilization) || 0;
    const isCritical = insightType.includes('critical');

    if (utilization > 90) {
      items.push({
        title: 'Upgrade storage capacity urgently',
        description: `Storage at ${utilization}% capacity. ${isCritical ? 'Critical threshold exceeded.' : 'Approaching limit.'}`,
        severity: isCritical ? 'critical' : 'high',
        priority: isCritical ? 'P0' : 'P1'
      });
    } else if (utilization > 80) {
      items.push({
        title: 'Plan storage capacity upgrade',
        description: `Storage at ${utilization}% capacity. Plan upgrade within next 30 days.`,
        severity: 'high',
        priority: 'P2'
      });
    }

    return items;
  }

  private handleUserCapacity(insightType: string, meta: Record<string, unknown>): GeneratedActionItem[] {
    const items: GeneratedActionItem[] = [];
    const currentUsers = Number(meta.currentUsers) || 0;
    const maxUsers = Number(meta.maxUsers) || Number(meta.userLimit) || 0;
    const utilization = maxUsers > 0 ? (currentUsers / maxUsers) * 100 : 0;

    if (insightType.includes('critical') && utilization > 90) {
      items.push({
        title: 'Upgrade user capacity immediately',
        description: `${currentUsers}/${maxUsers} users (${utilization.toFixed(0)}% capacity). Critical threshold exceeded.`,
        severity: 'critical',
        priority: 'P0'
      });
    } else if (utilization > 80) {
      items.push({
        title: 'Plan user capacity upgrade',
        description: `${currentUsers}/${maxUsers} users (${utilization.toFixed(0)}% capacity). Plan upgrade soon.`,
        severity: 'high',
        priority: 'P2'
      });
    }

    return items;
  }

  private handleUpgradeApproaching(meta: Record<string, unknown>): GeneratedActionItem[] {
    const items: GeneratedActionItem[] = [];
    const daysUntilUpgrade = Number(meta.daysUntilUpgrade) || Number(meta.daysToUpgrade) || null;

    if (daysUntilUpgrade !== null && daysUntilUpgrade <= 30) {
      items.push({
        title: 'Prepare for upcoming capacity upgrade',
        description: `Upgrade scheduled in ${daysUntilUpgrade} days. Coordinate with customer on upgrade timing.`,
        severity: daysUntilUpgrade <= 14 ? 'critical' : 'high',
        priority: daysUntilUpgrade <= 14 ? 'P0' : 'P1'
      });
    }

    return items;
  }

  private handleUpgradeOverdue(meta: Record<string, unknown>): GeneratedActionItem[] {
    const items: GeneratedActionItem[] = [];
    const daysOverdue = Number(meta.daysOverdue) || Number(meta.daysPastUpgrade) || 0;

    if (daysOverdue > 0) {
      items.push({
        title: 'Upgrade overdue - urgent action required',
        description: `Upgrade ${daysOverdue} days overdue. Contact customer immediately to schedule upgrade.`,
        severity: 'critical',
        priority: 'P0'
      });
    }

    return items;
  }

  private handleUsageCapacity(insightType: string, meta: Record<string, unknown>): GeneratedActionItem[] {
    const items: GeneratedActionItem[] = [];
    const utilization = Number(meta.utilization) || Number(meta.usageRate) || 0;

    if (utilization > 90) {
      const resourceType = insightType.includes('api') ? 'API' : 'Transaction';
      
      items.push({
        title: `Plan ${resourceType.toLowerCase()} capacity increase`,
        description: `${resourceType} usage at ${utilization}% capacity. Plan capacity increase to avoid throttling.`,
        severity: 'high',
        priority: 'P1'
      });
    }

    return items;
  }
}
