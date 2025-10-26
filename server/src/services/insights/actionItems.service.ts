import { InsightModel } from '../../schemas/insights.schema';
import { ActionItemModel, IActionItem } from '../../schemas/actionItem.schema';
import { callLLM } from '../llm';
import { UserContextManager } from '../../context/userContext';
import { IInsight } from '../../schemas/insights.schema';

// Define GeneratedActionItem interface locally for backward compatibility
export interface GeneratedActionItem {
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  priority: 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5'; // P0 is highest priority
}

// Initialize rule-based generators
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const generators: any[] = [];

// Conditionally load generators to avoid build issues
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const {
    FinancialRiskActionItemGenerator,
    CapacityActionItemGenerator,
    HealthScoreActionItemGenerator,
    SupportMetricsActionItemGenerator,
    StakeholderEngagementGenerator,
    RecurringProblemsGenerator
  } = require('./generators');
  
  if (FinancialRiskActionItemGenerator && CapacityActionItemGenerator) {
    generators.push(
      new FinancialRiskActionItemGenerator(),
      new CapacityActionItemGenerator()
    );
  }
  
  if (HealthScoreActionItemGenerator) {
    generators.push(new HealthScoreActionItemGenerator());
  }
  
  if (SupportMetricsActionItemGenerator) {
    generators.push(new SupportMetricsActionItemGenerator());
  }
  
  if (StakeholderEngagementGenerator) {
    generators.push(new StakeholderEngagementGenerator());
  }
  
  if (RecurringProblemsGenerator) {
    generators.push(new RecurringProblemsGenerator());
  }
} catch (error) {
  console.warn('Failed to load action item generators:', error);
}

/**
 * Generate action items from an insight based on its type and content
 * Uses rule-based generators when available, falls back to LLM
 */
export async function generateActionItemsFromInsight(
  insight: IInsight,
  userId?: string
): Promise<GeneratedActionItem[]> {
  // Try rule-based generation first
  for (const generator of generators) {
    if (generator.canHandle(insight)) {
      console.log(`Using ${generator.constructor.name} for insight type: ${insight.insightType}`);
      const items = generator.generate(insight);
      if (items.length > 0) {
        return items;
      }
    }
  }

  // Fall back to LLM generation
  console.log('No rule-based generator found, using LLM for insight type:', insight.insightType);
  try {
    const prompt = generateActionItemsPrompt(insight);
    
    const response = await callLLM({
      userId: userId || UserContextManager.getCurrentUserId() || '',
      isChat: false,
      systemMsg: 'You are an expert at creating actionable, specific action items from insights. Focus on clear, measurable actions.',
      prompt,
      maxTokens: 1500,
      temperature: 0.3,
    });

    const result = response.data || '';
    
    try {
      const parsed = JSON.parse(result);
      return Array.isArray(parsed) ? parsed : [];
    } catch (parseError) {
      console.error('Failed to parse action items JSON:', parseError);
      return generateFallbackActionItems(insight);
    }
  } catch (error) {
    console.error('Error generating action items from insight:', error);
    return generateFallbackActionItems(insight);
  }
}

/**
 * Generate the prompt for creating action items from an insight
 */
function generateActionItemsPrompt(insight: IInsight): string {
  const insightType = insight.insightType;
  const issueDescription = insight.issueDescription;
  
  // Build context based on insight type
  let context = '';
  
  if (insight.insightType === 'nps_analysis' && insight.npsData) {
    context = `
NPS Analysis Context:
- Current NPS: ${insight.npsData.currentNPS}
- NPS Change: ${insight.npsData.npsChange > 0 ? '+' : ''}${insight.npsData.npsChange}
- Response Rate: ${insight.npsData.responseRate}%
- Promoters: ${insight.npsData.segmentBreakdown.promoters}, Passives: ${insight.npsData.segmentBreakdown.passives}, Detractors: ${insight.npsData.segmentBreakdown.detractors}
${insight.npsData.recommendations ? `- Recommendations: ${insight.npsData.recommendations.join(', ')}` : ''}
    `;
  } else if (insight.insightType === 'customer_satisfaction' && insight.csatData) {
    context = `
CSAT Analysis Context:
- Current CSAT: ${insight.csatData.currentCSAT}
- CSAT Change: ${insight.csatData.csatChange > 0 ? '+' : ''}${insight.csatData.csatChange}
- Total Responses: ${insight.csatData.totalResponses}
- Overall Score: ${insight.csatData.averageScores.overall}
${insight.csatData.recommendations ? `- Recommendations: ${insight.csatData.recommendations.join(', ')}` : ''}
    `;
  } else {
    context = `
Ticket Context:
- Ticket Volume: ${insight.ticketVolume}
- Growth Rate: ${insight.growthRate}%
    `;
  }
  
  return `Based on the following ${insightType.replace('_', ' ')} insight, generate specific, actionable action items.

Insight Type: ${insightType}
Issue Description: ${issueDescription}
${context}

Generate ONLY high-quality, relevant action items in JSON format. Quality over quantity - only include items that are truly valuable and actionable:

[
  {
    "title": "Specific action title (max 80 characters)",
    "description": "Detailed description of what needs to be done and why",
    "severity": "critical|high|medium|low",
    "priority": "P0|P1|P2|P3|P4|P5"
  }
]

Critical Guidelines:
- ONLY generate action items that have clear business value and are genuinely actionable
- Do NOT force yourself to generate 2-4 items if fewer are relevant
- If only 1 meaningful action item exists, generate just 1
- If the insight doesn't warrant any action items, return an empty array []
- Each action item must have a specific, measurable outcome
- Avoid generic suggestions like "investigate further" or "monitor the situation"
- Priority levels: P0 (critical/urgent), P1 (high), P2 (medium-high), P3 (medium), P4 (low-medium), P5 (low)
- Use P0 for items that need immediate attention
- Use P1-P2 for important items that should be addressed soon
- Use P3-P5 for less urgent items or nice-to-haves
- Severity should reflect urgency and business impact
- For NPS/CSAT insights, focus on improving customer experience
- For ticket clusters, focus on reducing volume and improving resolution
- Quality is more important than quantity - better to have 1-2 excellent action items than 4 mediocre ones
`;
}

/**
 * Generate fallback action items if LLM fails
 */
function generateFallbackActionItems(insight: IInsight): GeneratedActionItem[] {
  const actionItems: GeneratedActionItem[] = [];
  
  if (insight.insightType === 'nps_analysis') {
    actionItems.push({
      title: 'Investigate and address detractor feedback',
      description: `Analyze responses from ${insight.npsData?.segmentBreakdown.detractors || 0} detractors to identify key issues affecting NPS`,
      severity: 'high' as const,
      priority: 'P1' as const
    });
    actionItems.push({
      title: 'Develop action plan to improve NPS',
      description: 'Create specific initiatives to address root causes identified in NPS analysis',
      severity: 'medium' as const,
      priority: 'P3' as const
    });
  } else if (insight.insightType === 'customer_satisfaction') {
    actionItems.push({
      title: 'Review CSAT feedback in detail',
      description: `Analyze ${insight.csatData?.totalResponses || 0} customer satisfaction responses to identify improvement areas`,
      severity: 'high' as const,
      priority: 'P1' as const
    });
  } else {
    actionItems.push({
      title: 'Investigate root cause of ticket volume',
      description: `Investigate the reason for ${insight.ticketVolume} tickets to prevent recurrence`,
      severity: 'high' as const,
      priority: 'P1' as const
    });
    actionItems.push({
      title: 'Implement preventive measures',
      description: 'Develop and implement measures to reduce similar ticket volume going forward',
      severity: 'medium' as const,
      priority: 'P3' as const
    });
  }
  
  return actionItems;
}

/**
 * Create and save action items for an insight
 */
export async function createActionItemsForInsight(
  insightId: string,
  organizationId: string,
  userId?: string
): Promise<IActionItem[]> {
  try {
    const insight = await InsightModel.findById(insightId);
    
    if (!insight) {
      throw new Error(`Insight with ID ${insightId} not found`);
    }
    
    // Generate action items
    const generatedItems = await generateActionItemsFromInsight(insight, userId);
    
    // Create action items in database
    const createdItems: IActionItem[] = [];
    for (const item of generatedItems) {
      const actionItem = await ActionItemModel.create({
        insightId,
        organizationId,
        title: item.title,
        description: item.description,
        severity: item.severity,
        priority: item.priority,
        status: 'new',
        createdBy: userId,
      });
      
      createdItems.push(actionItem);
    }
    
    console.log(`Created ${createdItems.length} action items for insight ${insightId}`);
    
    return createdItems;
  } catch (error) {
    console.error('Error creating action items for insight:', error);
    throw error;
  }
}

/**
 * Create action items for multiple insights
 */
export async function createActionItemsForInsights(
  insightIds: string[],
  organizationId: string,
  userId?: string
): Promise<{ success: number; failed: number; results: Array<{ insightId: string; success: boolean; actionItemCount?: number; error?: string }> }> {
  let success = 0;
  let failed = 0;
  const results: Array<{ insightId: string; success: boolean; actionItemCount?: number; error?: string }> = [];
  
  for (const insightId of insightIds) {
    try {
      const actionItems = await createActionItemsForInsight(insightId, organizationId, userId);
      success++;
      results.push({ insightId, success: true, actionItemCount: actionItems.length });
    } catch (error) {
      failed++;
      results.push({ insightId, success: false, error: (error as Error).message });
    }
  }
  
  return { success, failed, results };
}
