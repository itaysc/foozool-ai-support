import { CustomerSuccessInsight } from 'src/types/customerSuccessInsight';

export interface EvidenceLink {
  label: string;
  url: string;
  type: 'log' | 'dashboard' | 'documentation' | 'ticket' | 'system' | 'other';
  description?: string;
}

export async function generateInsightLinks(
  insight: CustomerSuccessInsight,
  customerId: string,
  organizationId: string
): Promise<EvidenceLink[]> {
  const links: EvidenceLink[] = [];
  
  try {
    // Generate type-specific links
    switch (insight.type) {
      case 'recurring_problems':
        links.push(...generateRecurringProblemsLinks(insight, customerId));
        break;
      
      case 'high_ticket_volume':
        links.push(...generateHighTicketVolumeLinks(insight, customerId));
        break;
      
      case 'sentiment_decline':
        links.push(...generateSentimentDeclineLinks(insight, customerId));
        break;
      
      case 'escalating_issues':
        links.push(...generateEscalatingIssuesLinks(insight, customerId));
        break;
      
      case 'resolution_delays':
        links.push(...generateResolutionDelaysLinks(insight, customerId));
        break;
      
      case 'feature_discovery':
        links.push(...generateFeatureDiscoveryLinks(insight, customerId));
        break;
      
      case 'inactive_customer':
      case 'declining_activity':
      case 'low_utilization':
        links.push(...generateLowEngagementLinks(insight, customerId));
        break;
      
      case 'stakeholder_churn_risk':
      case 'health_score_at_risk':
        links.push(...generateChurnRiskLinks(insight, customerId));
        break;
      
      case 'solution_gap':
      case 'influencer_expansion_opportunity':
        links.push(...generateUpsellOpportunityLinks(insight, customerId));
        break;
      
      case 'increasing_usage':
      case 'adoption_milestones':
        links.push(...generateExpansionReadyLinks(insight, customerId));
        break;
      
      case 'stakeholder_health_decline':
      case 'engagement_velocity_decline':
        links.push(...generateHealthScoreDeclineLinks(insight, customerId));
        break;
      
      default:
        links.push(...generateGenericInsightLinks(insight, customerId));
        break;
    }
    
    // Always add customer profile link
    links.push({
      label: 'Customer Profile',
      url: `/customers/${customerId}`,
      type: 'system',
      description: 'View complete customer details and history'
    });
    
    // Limit to most relevant links (max 8)
    return links.slice(0, 8);
    
  } catch (error) {
    console.error('[Link Generation] Error generating insight links:', error);
    return [];
  }
}

function generateRecurringProblemsLinks(insight: CustomerSuccessInsight, customerId: string): EvidenceLink[] {
  const links: EvidenceLink[] = [];
  const meta = insight.meta || {};
  
  // Ticket links
  if (meta.ticketIds && meta.ticketIds.length > 0) {
    links.push({
      label: `View ${meta.ticketIds.length} Related Tickets`,
      url: `/tickets?ids=${meta.ticketIds.slice(0, 5).join(',')}`,
      type: 'ticket',
      description: `Tickets: ${meta.ticketIds.slice(0, 3).join(', ')}${meta.ticketIds.length > 3 ? '...' : ''}`
    });
  }
  
  // Log links based on error patterns
  if (meta.errorPatterns && meta.errorPatterns.length > 0) {
    const errorType = extractPrimaryErrorType(meta.errorPatterns);
    links.push({
      label: `View ${errorType} Logs`,
      url: `/logs?filter=${encodeURIComponent(errorType)}&customerId=${customerId}&timeframe=7d`,
      type: 'log',
      description: `Recent logs for ${errorType} errors`
    });
  }
  
  // System dashboard links
  if (meta.issue) {
    const issue = String(meta.issue).toLowerCase();
    if (issue.includes('api') || issue.includes('authentication')) {
      links.push({
        label: 'API Health Dashboard',
        url: `/dashboard/api-health?customerId=${customerId}`,
        type: 'dashboard',
        description: 'Monitor API performance and error rates'
      });
    }
    if (issue.includes('database') || issue.includes('connection')) {
      links.push({
        label: 'Database Monitoring',
        url: `/dashboard/database?customerId=${customerId}`,
        type: 'dashboard',
        description: 'Database performance metrics'
      });
    }
  }
  
  // Documentation links
  links.push({
    label: 'Troubleshooting Guide',
    url: '/docs/troubleshooting',
    type: 'documentation',
    description: 'General issue resolution procedures'
  });
  
  return links;
}

function generateHighTicketVolumeLinks(insight: CustomerSuccessInsight, customerId: string): EvidenceLink[] {
  const links: EvidenceLink[] = [];
  
  links.push({
    label: 'Ticket Analytics Dashboard',
    url: `/dashboard/tickets?customerId=${customerId}`,
    type: 'dashboard',
    description: 'View ticket trends and analytics'
  });
  
  links.push({
    label: 'Recent Tickets',
    url: `/tickets?customerId=${customerId}&sort=recent`,
    type: 'ticket',
    description: 'View all recent tickets for this customer'
  });
  
  links.push({
    label: 'Customer Health Score',
    url: `/customers/${customerId}/health`,
    type: 'system',
    description: 'View detailed health metrics'
  });
  
  return links;
}

function generateSentimentDeclineLinks(insight: CustomerSuccessInsight, customerId: string): EvidenceLink[] {
  const links: EvidenceLink[] = [];
  
  links.push({
    label: 'Sentiment Analysis Dashboard',
    url: `/dashboard/sentiment?customerId=${customerId}`,
    type: 'dashboard',
    description: 'View sentiment trends over time'
  });
  
  links.push({
    label: 'Recent Negative Feedback',
    url: `/tickets?customerId=${customerId}&sentiment=negative`,
    type: 'ticket',
    description: 'Review tickets with negative sentiment'
  });
  
  links.push({
    label: 'Customer Satisfaction Guide',
    url: '/docs/customer-satisfaction',
    type: 'documentation',
    description: 'Best practices for improving satisfaction'
  });
  
  return links;
}

function generateEscalatingIssuesLinks(insight: CustomerSuccessInsight, customerId: string): EvidenceLink[] {
  const links: EvidenceLink[] = [];
  
  links.push({
    label: 'Recent Escalations',
    url: `/tickets?customerId=${customerId}&priority=high&sort=recent`,
    type: 'ticket',
    description: 'View high-priority escalated tickets'
  });
  
  links.push({
    label: 'Escalation Dashboard',
    url: `/dashboard/escalations?customerId=${customerId}`,
    type: 'dashboard',
    description: 'Track escalation patterns'
  });
  
  links.push({
    label: 'Incident Response Playbook',
    url: '/docs/incident-response',
    type: 'documentation',
    description: 'Escalation handling procedures'
  });
  
  return links;
}

function generateResolutionDelaysLinks(insight: CustomerSuccessInsight, customerId: string): EvidenceLink[] {
  const links: EvidenceLink[] = [];
  
  links.push({
    label: 'Resolution Time Dashboard',
    url: `/dashboard/resolution-time?customerId=${customerId}`,
    type: 'dashboard',
    description: 'View resolution time metrics'
  });
  
  links.push({
    label: 'Open Tickets',
    url: `/tickets?customerId=${customerId}&status=open`,
    type: 'ticket',
    description: 'View currently open tickets'
  });
  
  links.push({
    label: 'SLA Management Guide',
    url: '/docs/sla-management',
    type: 'documentation',
    description: 'Best practices for meeting SLAs'
  });
  
  return links;
}

function generateFeatureDiscoveryLinks(insight: CustomerSuccessInsight, customerId: string): EvidenceLink[] {
  const links: EvidenceLink[] = [];
  const meta = insight.meta || {};
  
  links.push({
    label: 'Feature Adoption Dashboard',
    url: `/dashboard/feature-adoption?customerId=${customerId}`,
    type: 'dashboard',
    description: 'Track feature usage and adoption'
  });
  
  links.push({
    label: 'User Activity Analytics',
    url: `/analytics/user-activity?customerId=${customerId}`,
    type: 'system',
    description: 'View detailed user engagement metrics'
  });
  
  // Add specific feature links if available
  if (meta.keyFeatures && meta.keyFeatures.length > 0) {
    links.push({
      label: 'Feature Training Materials',
      url: `/docs/features/${encodeURIComponent(meta.keyFeatures[0].toLowerCase().replace(/\s+/g, '-'))}`,
      type: 'documentation',
      description: `Training guide for ${meta.keyFeatures[0]}`
    });
  }
  
  links.push({
    label: 'Onboarding Best Practices',
    url: '/docs/onboarding',
    type: 'documentation',
    description: 'Guide for improving feature discovery'
  });
  
  return links;
}

function generateLowEngagementLinks(insight: CustomerSuccessInsight, customerId: string): EvidenceLink[] {
  const links: EvidenceLink[] = [];
  
  links.push({
    label: 'Engagement Analytics',
    url: `/dashboard/engagement?customerId=${customerId}`,
    type: 'dashboard',
    description: 'View user engagement metrics'
  });
  
  links.push({
    label: 'Usage Statistics',
    url: `/analytics/usage?customerId=${customerId}`,
    type: 'system',
    description: 'Detailed usage patterns and trends'
  });
  
  links.push({
    label: 'Customer Activation Guide',
    url: '/docs/customer-activation',
    type: 'documentation',
    description: 'Strategies for increasing engagement'
  });
  
  return links;
}

function generateChurnRiskLinks(insight: CustomerSuccessInsight, customerId: string): EvidenceLink[] {
  const links: EvidenceLink[] = [];
  
  links.push({
    label: 'Churn Risk Dashboard',
    url: `/dashboard/churn-risk?customerId=${customerId}`,
    type: 'dashboard',
    description: 'View churn risk indicators'
  });
  
  links.push({
    label: 'Customer Health Metrics',
    url: `/customers/${customerId}/health`,
    type: 'system',
    description: 'Complete health score breakdown'
  });
  
  links.push({
    label: 'Recent Customer Interactions',
    url: `/tickets?customerId=${customerId}&timeframe=30d`,
    type: 'ticket',
    description: 'Review last 30 days of interactions'
  });
  
  links.push({
    label: 'Retention Playbook',
    url: '/docs/customer-retention',
    type: 'documentation',
    description: 'Churn prevention strategies'
  });
  
  return links;
}

function generateUpsellOpportunityLinks(insight: CustomerSuccessInsight, customerId: string): EvidenceLink[] {
  const links: EvidenceLink[] = [];
  
  links.push({
    label: 'Usage Analytics',
    url: `/analytics/usage?customerId=${customerId}`,
    type: 'system',
    description: 'View usage patterns for upsell indicators'
  });
  
  links.push({
    label: 'Product Catalog',
    url: '/products/catalog',
    type: 'other',
    description: 'Available products and features'
  });
  
  links.push({
    label: 'Customer Success Story',
    url: `/customers/${customerId}/success-metrics`,
    type: 'system',
    description: 'ROI and value metrics'
  });
  
  links.push({
    label: 'Upsell Strategies Guide',
    url: '/docs/upsell-strategies',
    type: 'documentation',
    description: 'Best practices for expansion conversations'
  });
  
  return links;
}

function generateExpansionReadyLinks(insight: CustomerSuccessInsight, customerId: string): EvidenceLink[] {
  const links: EvidenceLink[] = [];
  
  links.push({
    label: 'Account Expansion Dashboard',
    url: `/dashboard/expansion?customerId=${customerId}`,
    type: 'dashboard',
    description: 'Expansion readiness metrics'
  });
  
  links.push({
    label: 'Customer Value Metrics',
    url: `/customers/${customerId}/value`,
    type: 'system',
    description: 'ROI and business impact analysis'
  });
  
  links.push({
    label: 'Expansion Playbook',
    url: '/docs/account-expansion',
    type: 'documentation',
    description: 'Guide for expansion conversations'
  });
  
  return links;
}

function generateHealthScoreDeclineLinks(insight: CustomerSuccessInsight, customerId: string): EvidenceLink[] {
  const links: EvidenceLink[] = [];
  
  links.push({
    label: 'Health Score Dashboard',
    url: `/dashboard/health-score?customerId=${customerId}`,
    type: 'dashboard',
    description: 'Detailed health score breakdown'
  });
  
  links.push({
    label: 'Customer Timeline',
    url: `/customers/${customerId}/timeline`,
    type: 'system',
    description: 'Complete customer interaction history'
  });
  
  links.push({
    label: 'Health Score Recovery Guide',
    url: '/docs/health-score-recovery',
    type: 'documentation',
    description: 'Strategies for improving health scores'
  });
  
  return links;
}

function generateGenericInsightLinks(insight: CustomerSuccessInsight, customerId: string): EvidenceLink[] {
  const links: EvidenceLink[] = [];
  
  links.push({
    label: 'Customer Dashboard',
    url: `/customers/${customerId}/dashboard`,
    type: 'dashboard',
    description: 'Complete customer overview'
  });
  
  links.push({
    label: 'Customer Support Guide',
    url: '/docs/customer-success',
    type: 'documentation',
    description: 'General customer success best practices'
  });
  
  return links;
}

function extractPrimaryErrorType(errorPatterns: string[]): string {
  if (!errorPatterns || errorPatterns.length === 0) return 'errors';
  
  const firstError = errorPatterns[0].toLowerCase();
  
  if (firstError.includes('authentication') || firstError.includes('auth')) return 'authentication';
  if (firstError.includes('timeout')) return 'timeout';
  if (firstError.includes('database') || firstError.includes('sql')) return 'database';
  if (firstError.includes('api') || firstError.includes('http')) return 'api';
  if (firstError.includes('connection')) return 'connection';
  
  return 'errors';
}
