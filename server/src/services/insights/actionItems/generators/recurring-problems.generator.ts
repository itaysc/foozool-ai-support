import { IActionItemGenerator, InsightForGenerator } from './interface';
import { GeneratedActionItem } from '../types';

export class RecurringProblemsGenerator implements IActionItemGenerator {
  private readonly RECURRING_PROBLEMS_INSIGHT_TYPES = [
    'recurring_ticket_pattern',
    'frequent_service_interruption',
    'repeated_feature_request',
    'chronic_technical_issue'
  ];

  getSupportedInsightTypes(): string[] {
    return this.RECURRING_PROBLEMS_INSIGHT_TYPES;
  }

  canHandle(insight: InsightForGenerator): boolean {
    if (insight.insightType !== 'customer_success') return false;
    
    const insightType = insight.metadata?.type as string;
    return this.RECURRING_PROBLEMS_INSIGHT_TYPES.includes(insightType);
  }

  /**
   * Generate template-based action items for recurring problems
   */
  generate(insight: InsightForGenerator): GeneratedActionItem[] {
    const items: GeneratedActionItem[] = [];
    const insightType = insight.metadata?.type as string;
    const meta = insight.metadata?.meta || {};

    switch (insightType) {
      case 'recurring_ticket_pattern':
        items.push(...this.handleRecurringTicketPattern(meta));
        break;
      
      case 'frequent_service_interruption':
        items.push(...this.handleFrequentServiceInterruption(meta));
        break;
      
      case 'repeated_feature_request':
        items.push(...this.handleRepeatedFeatureRequest(meta));
        break;
      
      case 'chronic_technical_issue':
        items.push(...this.handleChronicTechnicalIssue(meta));
        break;
    }

    return items;
  }

  private handleRecurringTicketPattern(meta: Record<string, unknown>): GeneratedActionItem[] {
    const items: GeneratedActionItem[] = [];
    const issueName = meta.issueName as string || meta.patternName as string || 'this issue';
    const ticketCount = Number(meta.ticketCount) || Number(meta.occurrenceCount) || 0;
    const timePeriod = meta.timePeriod as string || meta.period as string || 'recent period';

    if (ticketCount >= 3) {
      const isCritical = ticketCount >= 10;
      
      items.push({
        title: `Investigate recurring issue: ${issueName}`,
        description: `Pattern detected: ${issueName} has recurred ${ticketCount} times in ${timePeriod}. Perform root cause analysis and implement permanent fix.`,
        severity: isCritical ? 'critical' : 'high',
        priority: isCritical ? 'P0' : 'P1'
      });
    }

    return items;
  }

  private handleFrequentServiceInterruption(meta: Record<string, unknown>): GeneratedActionItem[] {
    const items: GeneratedActionItem[] = [];
    const interruptionCount = Number(meta.interruptionCount) || Number(meta.incidentCount) || 0;
    const avgDowntime = Number(meta.avgDowntime) || 0;
    const serviceName = meta.serviceName as string || 'service';

    if (interruptionCount >= 2) {
      const isCritical = interruptionCount >= 5;
      
      items.push({
        title: 'Address frequent service interruptions',
        description: `${serviceName} experienced ${interruptionCount} interruptions${avgDowntime > 0 ? ` with avg downtime ${avgDowntime} minutes` : ''}. Investigate infrastructure stability and implement reliability improvements.`,
        severity: isCritical ? 'critical' : 'high',
        priority: isCritical ? 'P0' : 'P1'
      });
    }

    return items;
  }

  private handleRepeatedFeatureRequest(meta: Record<string, unknown>): GeneratedActionItem[] {
    const items: GeneratedActionItem[] = [];
    const featureName = meta.featureName as string || meta.requestName as string || 'feature';
    const requestCount = Number(meta.requestCount) || Number(meta.votes) || 0;
    const usersRequesting = Number(meta.usersRequesting) || 0;

    if (requestCount >= 5) {
      const hasMultipleUsers = usersRequesting >= 3;
      
      items.push({
        title: `Evaluate feature request: ${featureName}`,
        description: `${featureName} requested ${requestCount} times${usersRequesting > 0 ? ` by ${usersRequesting} users` : ''}. Review product roadmap feasibility and customer impact.`,
        severity: hasMultipleUsers ? 'high' : 'medium',
        priority: hasMultipleUsers ? 'P1' : 'P3'
      });
    }

    return items;
  }

  private handleChronicTechnicalIssue(meta: Record<string, unknown>): GeneratedActionItem[] {
    const items: GeneratedActionItem[] = [];
    const issueDescription = meta.issueDescription as string || meta.issueName as string || 'technical issue';
    const occurrenceCount = Number(meta.occurrenceCount) || Number(meta.ticketCount) || 0;
    const impactLevel = meta.impactLevel as string || '';

    if (occurrenceCount >= 3) {
      const isCritical = impactLevel?.toLowerCase().includes('critical') || impactLevel?.toLowerCase().includes('high');
      
      items.push({
        title: 'Resolve chronic technical issue',
        description: `${issueDescription} has occurred ${occurrenceCount} times${impactLevel ? ` (${impactLevel} impact)` : ''}. Escalate to engineering for investigation and permanent resolution.`,
        severity: isCritical ? 'critical' : 'high',
        priority: isCritical ? 'P0' : 'P1'
      });
    }

    return items;
  }
}
