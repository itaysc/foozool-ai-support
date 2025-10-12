import { UserContextManager } from 'src/context/userContext';
import { callLLM } from 'src/services/llm';
import { CustomerSuccessInsight } from 'src/types/customerSuccessInsight';
import { generateInsightLinks } from './linkGeneration.service';

export interface EnhancedGuidance {
  summary: string;
  why: string;
  signals: string[];
  actions: string[];
  considerations: string;
  owner: string;
  slaDays: number;
  investigationPath?: {
    immediate: string[];
    rootCause: string[];
    customerCommunication: string[];
    longTermSolutions: string[];
  };
  evidence?: {
    ticketReferences: string[];
    errorPatterns: string[];
    affectedSystems: string[];
    timePatterns: string[];
    links?: Array<{
      label: string;
      url: string;
      type: 'log' | 'dashboard' | 'documentation' | 'ticket' | 'system' | 'other';
      description?: string;
    }>;
  };
}

export async function generateEnhancedGuidance(
  insight: CustomerSuccessInsight, 
  customerName: string,
  customerId?: string,
  organizationId?: string
): Promise<EnhancedGuidance> {
  try {
    const baseGuidance = {
      owner: 'CSM',
      slaDays: insight.severity === 'red' ? 2 : insight.severity === 'yellow' ? 5 : 7
    };

    // Generate guidance based on insight type
    let guidance: EnhancedGuidance;
    
    switch (insight.type) {
      case 'recurring_problems':
        guidance = await generateRecurringProblemsGuidance(insight, customerName, baseGuidance);
        break;
      
      case 'high_ticket_volume':
        guidance = await generateHighTicketVolumeGuidance(insight, customerName, baseGuidance);
        break;
      
      case 'sentiment_decline':
        guidance = await generateSentimentDeclineGuidance(insight, customerName, baseGuidance);
        break;
      
      case 'escalating_issues':
        guidance = await generateEscalatingIssuesGuidance(insight, customerName, baseGuidance);
        break;
      
      case 'resolution_delays':
        guidance = await generateResolutionDelaysGuidance(insight, customerName, baseGuidance);
        break;
      
      default:
        guidance = await generateGenericGuidance(insight, customerName, baseGuidance);
        break;
    }
    
    // Generate links if customerId and organizationId are provided
    if (customerId && organizationId) {
      const links = await generateInsightLinks(insight, customerId, organizationId);
      
      // Add links to evidence
      if (guidance.evidence) {
        guidance.evidence.links = links;
      } else {
        guidance.evidence = {
          ticketReferences: [],
          errorPatterns: [],
          affectedSystems: [],
          timePatterns: [],
          links
        };
      }
    }
    
    return guidance;
    
  } catch (error) {
    console.error('[Enhanced Guidance] Error generating guidance:', error);
    return getFallbackGuidance(insight, customerName);
  }
}

async function generateRecurringProblemsGuidance(
  insight: CustomerSuccessInsight, 
  customerName: string, 
  base: { owner: string; slaDays: number }
): Promise<EnhancedGuidance> {
  const meta = insight.meta || {};
  const frequency = meta.frequency || 0;
  const affectedCustomers = meta.affectedCustomers || [];
  const errorPatterns = meta.errorPatterns || [];
  const investigationSteps = meta.investigationSteps || [];
  
  try {
    const prompt = `
    Create detailed guidance for a recurring problems insight.
    
    Insight Details:
    - Issue: ${meta.issue || 'Unknown issue'}
    - Frequency: ${frequency} tickets
    - Affected Customers: ${affectedCustomers.length} customers
    - Error Patterns: ${errorPatterns.join(', ')}
    - Investigation Steps: ${investigationSteps.join('; ')}
    - Customer: ${customerName}
    
    Generate comprehensive guidance with:
    1. A clear summary of the problem
    2. Why this matters (business impact)
    3. Specific signals to look for
    4. Actionable steps to take
    5. Important considerations
    6. Investigation path with immediate, root cause, customer communication, and long-term solution steps
    
    Focus on making this actionable and specific. Avoid generic advice.
    
    Return a JSON object with this structure:
    {
      "summary": "Clear problem summary",
      "why": "Why this matters",
      "signals": ["signal1", "signal2", "signal3"],
      "actions": ["action1", "action2", "action3"],
      "considerations": "Important considerations",
      "investigationPath": {
        "immediate": ["immediate step 1", "immediate step 2"],
        "rootCause": ["root cause step 1", "root cause step 2"],
        "customerCommunication": ["comm step 1", "comm step 2"],
        "longTermSolutions": ["solution 1", "solution 2"]
      },
      "evidence": {
        "ticketReferences": ["ticket1", "ticket2"],
        "errorPatterns": ["pattern1", "pattern2"],
        "affectedSystems": ["system1", "system2"],
        "timePatterns": ["pattern1", "pattern2"]
      }
    }
    
    Return only valid JSON, no other text.
    `;

    const response = await callLLM({
      userId: UserContextManager.getCurrentUserId() || '',
      isChat: false,
      systemMsg: 'You are an expert at creating actionable guidance for customer success teams dealing with recurring technical issues.',
      prompt,
      maxTokens: 1000,
      temperature: 0.2,
    });

    const guidance = JSON.parse(response.data || '{}');
    
    return {
      ...guidance,
      owner: base.owner,
      slaDays: base.slaDays,
    };
    
  } catch (error) {
    console.error('[Enhanced Guidance] Error generating recurring problems guidance:', error);
    return getRecurringProblemsFallback(insight, customerName, base);
  }
}

async function generateHighTicketVolumeGuidance(
  insight: CustomerSuccessInsight, 
  customerName: string, 
  base: { owner: string; slaDays: number }
): Promise<EnhancedGuidance> {
  const meta = insight.meta || {};
  const totalTickets = meta.totalTickets || 0;
  
  return {
    summary: `High ticket volume detected: ${totalTickets} tickets for ${customerName}. This may indicate underlying systemic issues.`,
    why: 'High ticket volume often indicates product issues, user confusion, or process problems that need immediate attention.',
    signals: [
      `Total ticket count: ${totalTickets}`,
      'Recent ticket creation rate',
      'Ticket resolution time trends',
      'Customer satisfaction scores'
    ],
    actions: [
      'Schedule immediate health check call with customer',
      'Analyze ticket categories to identify root causes',
      'Review recent product changes or incidents',
      'Check customer onboarding and training status'
    ],
    considerations: 'Coordinate with product team if issues are feature-related, or support team if process-related.',
    owner: base.owner,
    slaDays: base.slaDays,
    investigationPath: {
      immediate: [
        'Pull ticket summary report for last 30 days',
        'Identify most common ticket categories',
        'Check for any recent incidents or outages'
      ],
      rootCause: [
        'Analyze ticket content for common themes',
        'Review customer usage patterns',
        'Check product adoption metrics'
      ],
      customerCommunication: [
        'Schedule health check call within 24 hours',
        'Prepare summary of findings',
        'Discuss proactive solutions'
      ],
      longTermSolutions: [
        'Implement proactive monitoring',
        'Create customer-specific playbook',
        'Set up regular check-ins'
      ]
    }
  };
}

async function generateSentimentDeclineGuidance(
  insight: CustomerSuccessInsight, 
  customerName: string, 
  base: { owner: string; slaDays: number }
): Promise<EnhancedGuidance> {
  const meta = insight.meta || {};
  const avgSentiment = meta.avgSentiment || 0;
  const sentimentBreakdown = meta.sentimentBreakdown || {};
  
  return {
    summary: `Customer sentiment decline detected for ${customerName} (${(avgSentiment * 100).toFixed(1)}% positive). Immediate attention required.`,
    why: 'Declining sentiment is a leading indicator of churn risk and requires immediate intervention to prevent customer loss.',
    signals: [
      `Current sentiment: ${(avgSentiment * 100).toFixed(1)}% positive`,
      'Recent sentiment trend',
      'Negative feedback themes',
      'Customer engagement levels'
    ],
    actions: [
      'Schedule satisfaction call within 24 hours',
      'Review recent negative interactions',
      'Identify specific pain points',
      'Develop recovery plan with customer'
    ],
    considerations: 'Focus on understanding root causes rather than just addressing symptoms. Coordinate with support team on recent interactions.',
    owner: base.owner,
    slaDays: base.slaDays,
    investigationPath: {
      immediate: [
        'Pull recent ticket interactions',
        'Review customer feedback',
        'Check for any service disruptions'
      ],
      rootCause: [
        'Analyze sentiment trends over time',
        'Identify specific pain points',
        'Review customer journey touchpoints'
      ],
      customerCommunication: [
        'Schedule recovery call immediately',
        'Acknowledge concerns and apologize',
        'Present concrete improvement plan'
      ],
      longTermSolutions: [
        'Implement proactive sentiment monitoring',
        'Create customer success plan',
        'Set up regular satisfaction surveys'
      ]
    }
  };
}

async function generateEscalatingIssuesGuidance(
  insight: CustomerSuccessInsight, 
  customerName: string, 
  base: { owner: string; slaDays: number }
): Promise<EnhancedGuidance> {
  const meta = insight.meta || {};
  const recentTickets = meta.recentTickets || 0;
  
  return {
    summary: `${recentTickets} tickets created in the last 7 days for ${customerName}. Escalation pattern requires immediate attention.`,
    why: 'Sudden ticket escalation often indicates a critical issue that needs immediate resolution to prevent further customer impact.',
    signals: [
      `${recentTickets} tickets in 7 days`,
      'Ticket creation rate trend',
      'Issue severity levels',
      'Customer communication patterns'
    ],
    actions: [
      'Investigate recent changes or incidents',
      'Contact customer immediately to understand impact',
      'Escalate to appropriate technical team',
      'Implement temporary workarounds if possible'
    ],
    considerations: 'This may indicate a critical system issue. Coordinate with engineering and support teams immediately.',
    owner: base.owner,
    slaDays: base.slaDays,
    investigationPath: {
      immediate: [
        'Contact customer within 2 hours',
        'Check system status and recent deployments',
        'Pull all recent tickets for analysis'
      ],
      rootCause: [
        'Analyze ticket patterns and timing',
        'Check for system outages or issues',
        'Review recent product changes'
      ],
      customerCommunication: [
        'Provide immediate status update',
        'Set up daily check-ins during resolution',
        'Document impact and timeline'
      ],
      longTermSolutions: [
        'Implement early warning systems',
        'Create escalation playbook',
        'Improve incident response procedures'
      ]
    }
  };
}

async function generateResolutionDelaysGuidance(
  insight: CustomerSuccessInsight, 
  customerName: string, 
  base: { owner: string; slaDays: number }
): Promise<EnhancedGuidance> {
  const meta = insight.meta || {};
  const avgResolutionHours = meta.avgResolutionHours || 0;
  const ticketsAnalyzed = meta.ticketsAnalyzed || 0;
  
  return {
    summary: `Average resolution time is ${avgResolutionHours} hours for ${customerName}. Process inefficiencies detected.`,
    why: 'Long resolution times indicate process issues that impact customer satisfaction and may require process improvements.',
    signals: [
      `Average resolution: ${avgResolutionHours} hours`,
      `Tickets analyzed: ${ticketsAnalyzed}`,
      'Resolution time trends',
      'Ticket complexity patterns'
    ],
    actions: [
      'Review support process efficiency',
      'Analyze ticket routing and assignment',
      'Check resource allocation',
      'Implement process improvements'
    ],
    considerations: 'Coordinate with support team leadership to identify process bottlenecks and improvement opportunities.',
    owner: base.owner,
    slaDays: base.slaDays,
    investigationPath: {
      immediate: [
        'Pull resolution time reports',
        'Identify longest-running tickets',
        'Check support team workload'
      ],
      rootCause: [
        'Analyze ticket routing patterns',
        'Review support process steps',
        'Check resource availability'
      ],
      customerCommunication: [
        'Set clear expectations for resolution times',
        'Provide regular status updates',
        'Offer alternative support channels'
      ],
      longTermSolutions: [
        'Optimize support processes',
        'Implement better ticket routing',
        'Add more support resources if needed'
      ]
    }
  };
}

async function generateGenericGuidance(
  insight: CustomerSuccessInsight, 
  customerName: string, 
  base: { owner: string; slaDays: number }
): Promise<EnhancedGuidance> {
  try {
    const prompt = `
    Create guidance for this customer success insight.
    
    Insight Type: ${insight.type}
    Message: ${insight.message}
    Severity: ${insight.severity}
    Customer: ${customerName}
    Meta: ${JSON.stringify(insight.meta || {})}
    
    Generate actionable guidance with specific steps. Focus on being concrete and helpful.
    
    Return a JSON object with:
    {
      "summary": "Problem summary",
      "why": "Why this matters",
      "signals": ["signal1", "signal2"],
      "actions": ["action1", "action2"],
      "considerations": "Important considerations"
    }
    
    Return only valid JSON, no other text.
    `;

    const response = await callLLM({
      userId: UserContextManager.getCurrentUserId() || '',
      isChat: false,
      systemMsg: 'You are an expert at creating actionable guidance for customer success teams.',
      prompt,
      maxTokens: 500,
      temperature: 0.3,
    });

    const guidance = JSON.parse(response.data || '{}');
    
    return {
      ...guidance,
      owner: base.owner,
      slaDays: base.slaDays,
    };
    
  } catch (error) {
    console.error('[Enhanced Guidance] Error generating generic guidance:', error);
    return getFallbackGuidance(insight, customerName);
  }
}

function getRecurringProblemsFallback(
  insight: CustomerSuccessInsight, 
  customerName: string, 
  base: { owner: string; slaDays: number }
): EnhancedGuidance {
  const meta = insight.meta || {};
  const frequency = meta.frequency || 0;
  const issue = meta.issue || 'recurring issue';
  
  return {
    summary: `Recurring ${issue} detected for ${customerName}: ${frequency} tickets identified.`,
    why: 'Recurring issues indicate systematic problems that need root cause analysis and permanent solutions.',
    signals: [
      `${frequency} tickets with similar patterns`,
      'Error message patterns',
      'Time-based occurrence patterns',
      'Customer impact assessment'
    ],
    actions: [
      'Analyze ticket content for common themes',
      'Identify root cause of the recurring issue',
      'Contact customer to understand impact',
      'Implement permanent solution'
    ],
    considerations: 'Focus on preventing future occurrences rather than just resolving individual tickets.',
    owner: base.owner,
    slaDays: base.slaDays,
    investigationPath: {
      immediate: [
        'Review all related tickets',
        'Identify common error patterns',
        'Check system logs for the issue'
      ],
      rootCause: [
        'Analyze system configuration',
        'Check for integration issues',
        'Review recent changes'
      ],
      customerCommunication: [
        'Explain the issue and impact',
        'Provide timeline for resolution',
        'Offer workarounds if available'
      ],
      longTermSolutions: [
        'Implement system improvements',
        'Create monitoring alerts',
        'Update documentation'
      ]
    }
  };
}

function getFallbackGuidance(insight: CustomerSuccessInsight, customerName: string): EnhancedGuidance {
  return {
    summary: `Action recommended for ${String(insight.type).replace(/_/g, ' ')} at ${customerName}.`,
    why: 'Signal crossed an actionable threshold based on trends and benchmarks.',
    signals: ['Monitor related metrics', 'Track customer feedback', 'Watch for escalation patterns'],
    actions: ['Review the signals and contact the stakeholder to define next steps.'],
    considerations: 'Coordinate with relevant teams based on the specific issue type.',
    owner: 'CSM',
    slaDays: insight.severity === 'red' ? 2 : insight.severity === 'yellow' ? 5 : 7,
  };
}
