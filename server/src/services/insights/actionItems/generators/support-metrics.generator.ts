import { IActionItemGenerator, InsightForGenerator } from './interface';
import { GeneratedActionItem } from '../types';

export class SupportMetricsActionItemGenerator implements IActionItemGenerator {
  private readonly SUPPORT_METRICS_INSIGHT_TYPES = [
    'high_ticket_volume',
    'escalation_rate_increase',
    'sla_breach_pattern',
    'resolution_time_degradation'
  ];

  getSupportedInsightTypes(): string[] {
    return this.SUPPORT_METRICS_INSIGHT_TYPES;
  }

  canHandle(insight: InsightForGenerator): boolean {
    if (insight.insightType !== 'customer_success') return false;
    
    const insightType = insight.metadata?.type as string;
    return this.SUPPORT_METRICS_INSIGHT_TYPES.includes(insightType);
  }

  generate(insight: InsightForGenerator): GeneratedActionItem[] {
    const items: GeneratedActionItem[] = [];
    const insightType = insight.metadata?.type as string;
    const meta = insight.metadata?.meta || {};

    switch (insightType) {
      case 'high_ticket_volume':
        items.push(...this.handleHighTicketVolume(meta));
        break;
      
      case 'escalation_rate_increase':
        items.push(...this.handleEscalationRateIncrease(meta));
        break;
      
      case 'sla_breach_pattern':
        items.push(...this.handleSlaBreachPattern(meta));
        break;
      
      case 'resolution_time_degradation':
        items.push(...this.handleResolutionTimeDegradation(meta));
        break;
    }

    return items;
  }

  private handleHighTicketVolume(meta: Record<string, unknown>): GeneratedActionItem[] {
    const items: GeneratedActionItem[] = [];
    const ticketVolume = Number(meta.ticketVolume) || Number(meta.totalTickets) || 0;
    const avgVolume = Number(meta.averageVolume) || Number(meta.baselineVolume) || 0;
    const increasePercentage = avgVolume > 0 ? ((ticketVolume - avgVolume) / avgVolume) * 100 : 0;

    if (increasePercentage > 30) {
      const isCritical = increasePercentage > 100;
      
      items.push({
        title: 'Review high ticket volume pattern',
        description: `${ticketVolume} tickets in period (${increasePercentage.toFixed(0)}% above average). Investigate root cause and identify areas for improvement.`,
        severity: isCritical ? 'critical' : 'high',
        priority: isCritical ? 'P0' : 'P1'
      });
    }

    return items;
  }

  private handleEscalationRateIncrease(meta: Record<string, unknown>): GeneratedActionItem[] {
    const items: GeneratedActionItem[] = [];
    const escalationRate = Number(meta.escalationRate) || 0;
    const avgEscalationRate = Number(meta.averageEscalationRate) || 0;

    if (escalationRate > avgEscalationRate * 1.2) { // 20% increase
      items.push({
        title: 'Address escalation rate increase',
        description: `Escalation rate is ${(escalationRate * 100).toFixed(1)}% (avg: ${(avgEscalationRate * 100).toFixed(1)}%). Review ticket patterns to reduce escalations.`,
        severity: 'high',
        priority: 'P1'
      });
    }

    return items;
  }

  private handleSlaBreachPattern(meta: Record<string, unknown>): GeneratedActionItem[] {
    const items: GeneratedActionItem[] = [];
    const breachRate = Number(meta.breachRate) || Number(meta.slaBreachRate) || 0;
    const impactedCustomers = Number(meta.impactedCustomers) || 0;

    if (breachRate > 0.05) { // 5% breach rate
      const isCritical = breachRate > 0.15 || impactedCustomers > 10;
      
      items.push({
        title: 'Address SLA breach pattern',
        description: `SLA breach rate is ${(breachRate * 100).toFixed(1)}%${impactedCustomers > 0 ? ` impacting ${impactedCustomers} customers` : ''}. Investigate and implement fixes.`,
        severity: isCritical ? 'critical' : 'high',
        priority: isCritical ? 'P0' : 'P1'
      });
    }

    return items;
  }

  private handleResolutionTimeDegradation(meta: Record<string, unknown>): GeneratedActionItem[] {
    const items: GeneratedActionItem[] = [];
    const avgResolutionTime = Number(meta.avgResolutionTime) || Number(meta.averageResolutionTime) || 0;
    const slaTime = Number(meta.slaTime) || Number(meta.targetResolutionTime) || 0;

    if (avgResolutionTime > slaTime * 1.2) { // 20% over SLA
      const overagePercentage = slaTime > 0 ? ((avgResolutionTime - slaTime) / slaTime) * 100 : 0;
      
      items.push({
        title: 'Address resolution time delays',
        description: `Average resolution ${avgResolutionTime.toFixed(1)} hours (SLA: ${slaTime} hours - ${overagePercentage.toFixed(0)}% over). Review and optimize resolution process.`,
        severity: 'high',
        priority: 'P1'
      });
    }

    return items;
  }
}
