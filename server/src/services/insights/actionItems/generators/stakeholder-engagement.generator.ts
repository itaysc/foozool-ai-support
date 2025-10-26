import { IActionItemGenerator, InsightForGenerator } from './interface';
import { GeneratedActionItem } from '../types';

export class StakeholderEngagementGenerator implements IActionItemGenerator {
  private readonly STAKEHOLDER_INSIGHT_TYPES = [
    'key_stakeholder_disengagement',
    'champion_unidentified',
    'executive_engagement_opportunity',
    'cross_department_engagement'
  ];

  getSupportedInsightTypes(): string[] {
    return this.STAKEHOLDER_INSIGHT_TYPES;
  }

  canHandle(insight: InsightForGenerator): boolean {
    if (insight.insightType !== 'customer_success') return false;
    
    const insightType = insight.metadata?.type as string;
    return this.STAKEHOLDER_INSIGHT_TYPES.includes(insightType);
  }

  /**
   * Generate action items with rule-based templates
   * These can be enhanced by LLM if needed
   */
  generate(insight: InsightForGenerator): GeneratedActionItem[] {
    const items: GeneratedActionItem[] = [];
    const insightType = insight.metadata?.type as string;
    const meta = insight.metadata?.meta || {};

    switch (insightType) {
      case 'key_stakeholder_disengagement':
        items.push(...this.handleKeyStakeholderDisengagement(meta));
        break;
      
      case 'champion_unidentified':
        items.push(...this.handleChampionUnidentified(meta));
        break;
      
      case 'executive_engagement_opportunity':
        items.push(...this.handleExecutiveEngagementOpportunity(meta));
        break;
      
      case 'cross_department_engagement':
        items.push(...this.handleCrossDepartmentEngagement(meta));
        break;
    }

    return items;
  }

  private handleKeyStakeholderDisengagement(meta: Record<string, unknown>): GeneratedActionItem[] {
    const items: GeneratedActionItem[] = [];
    const stakeholder = meta.stakeholderName as string || meta.stakeholder as string || 'key stakeholder';
    const daysInactive = Number(meta.daysInactive) || Number(meta.daysSinceContact) || 0;

    if (daysInactive > 30) {
      const isCritical = daysInactive > 90;
      
      items.push({
        title: `Re-engage ${stakeholder}`,
        description: `${stakeholder} has been inactive for ${daysInactive} days. Schedule personalized outreach to understand their needs and strengthen the relationship.`,
        severity: isCritical ? 'critical' : 'high',
        priority: isCritical ? 'P1' : 'P2'
      });
    }

    return items;
  }

  private handleChampionUnidentified(meta: Record<string, unknown>): GeneratedActionItem[] {
    const items: GeneratedActionItem[] = [];
    const customerSize = meta.customerSize as string || meta.companySize as string || '';
    const isLarge = customerSize.toLowerCase().includes('large') || customerSize.toLowerCase().includes('enterprise');

    items.push({
      title: 'Identify and cultivate champion',
      description: isLarge 
        ? 'No clear champion identified for this enterprise account. Identify enthusiastic user to serve as internal advocate and product champion.'
        : 'No product champion identified. Engage with enthusiastic users to build internal advocacy and drive adoption.',
      severity: 'high',
      priority: isLarge ? 'P1' : 'P2'
    });

    return items;
  }

  private handleExecutiveEngagementOpportunity(meta: Record<string, unknown>): GeneratedActionItem[] {
    const items: GeneratedActionItem[] = [];
    const executiveTitle = meta.executiveTitle as string || meta.title as string || 'executive';
    const engagementLevel = meta.engagementLevel as string || '';

    items.push({
      title: 'Plan executive engagement strategy',
      description: `${executiveTitle} engagement opportunity identified${engagementLevel ? ` (current engagement: ${engagementLevel})` : ''}. Plan executive business review to demonstrate value and discuss strategic roadmap.`,
      severity: 'high',
      priority: 'P1'
    });

    return items;
  }

  private handleCrossDepartmentEngagement(meta: Record<string, unknown>): GeneratedActionItem[] {
    const items: GeneratedActionItem[] = [];
    const departments = meta.departments as string[] || [];
    const missingDepartment = meta.missingDepartment as string || 'additional department';

    if (departments.length > 0) {
      items.push({
        title: 'Expand engagement to additional departments',
        description: `Currently engaging with ${departments.join(', ')}. Opportunity to involve ${missingDepartment} to expand product usage and value across organization.`,
        severity: 'medium',
        priority: 'P2'
      });
    } else {
      items.push({
        title: 'Expand cross-departmental engagement',
        description: `Opportunity to engage additional departments beyond current stakeholders. Expand usage and drive broader organizational value.`,
        severity: 'medium',
        priority: 'P3'
      });
    }

    return items;
  }
}
