import { TicketInsight, InsightAnalysisResult } from '@common/types/insights';
import { callLLM } from '../together.ai';
import { InsightModel } from '../../schemas/insight.schema';
import { v4 as uuidv4 } from 'uuid';
import config from '../../config';

interface TicketData {
  subject: string;
  description: string;
  ticketId: string;
  product?: any;
  similarTickets?: any[];
}

async function analyzeTicketContent(ticketData: TicketData): Promise<TicketInsight[]> {
  const prompt = `
Analyze the following support ticket and generate valuable insights. Consider:
1. Product feedback and potential improvements
2. Missing documentation or unclear information
3. Potential bugs or issues
4. User experience pain points
5. Anomalies in support patterns
6. Customer satisfaction indicators

Ticket Subject: ${ticketData.subject}
Ticket Description: ${ticketData.description}
${ticketData.product ? `Product Context: ${JSON.stringify(ticketData.product)}` : ''}
${ticketData.similarTickets ? `Similar Tickets Context: ${JSON.stringify(ticketData.similarTickets)}` : ''}

Generate insights in the following JSON format:
{
  "insights": [
    {
      "category": "one of: product_feedback, missing_documentation, potential_bug, user_experience, anomaly, trend, customer_satisfaction",
      "severity": "one of: low, medium, high, critical",
      "title": "short descriptive title",
      "description": "detailed description",
      "confidence": number between 0 and 1,
      // Additional fields based on category
    }
  ]
}

Focus on actionable insights that would be valuable for product improvement and customer support.
`;

  const response = await callLLM({
    userId: 'system',
    prompt,
    model: 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo',
    maxTokens: 2000,
    temperature: 0.2,
    isChat: true,
    systemMsg: 'You are an expert at analyzing support tickets and generating valuable business insights.',
  });

  try {
    const result = JSON.parse(response.data || '{"insights": []}');
    return result.insights.map((insight: any) => ({
      ...insight,
      id: uuidv4(),
      ticketIds: [ticketData.ticketId],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  } catch (error) {
    console.error('Error parsing insights:', error);
    return [];
  }
}

async function detectAnomalies(ticketData: TicketData, recentTickets: any[]): Promise<TicketInsight[]> {
  const prompt = `
Analyze the following ticket in context of recent tickets to detect any anomalies or patterns:

Current Ticket:
Subject: ${ticketData.subject}
Description: ${ticketData.description}

Recent Tickets Context: ${JSON.stringify(recentTickets)}

Look for:
1. Unusual spikes in support volume
2. Changes in user satisfaction
3. Emerging issues or trends
4. Product usage patterns

Generate insights in the same JSON format as before, focusing on anomalies and trends.
`;

  const response = await callLLM({
    userId: 'system',
    prompt,
    model: 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo',
    maxTokens: 2000,
    temperature: 0.2,
    isChat: true,
    systemMsg: 'You are an expert at detecting patterns and anomalies in support ticket data.',
  });

  try {
    const result = JSON.parse(response.data || '{"insights": []}');
    return result.insights.map((insight: any) => ({
      ...insight,
      id: uuidv4(),
      ticketIds: [ticketData.ticketId],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  } catch (error) {
    console.error('Error parsing anomaly insights:', error);
    return [];
  }
}

export async function analyzeTicket(ticketData: TicketData, recentTickets: any[] = []): Promise<InsightAnalysisResult> {
  // Generate content-based insights
  const contentInsights = await analyzeTicketContent(ticketData);
  
  // Generate anomaly-based insights
  const anomalyInsights = await detectAnomalies(ticketData, recentTickets);
  
  // Combine all insights
  const allInsights = [...contentInsights, ...anomalyInsights];
  
  // Save insights to database
  if (allInsights.length > 0) {
    await InsightModel.insertMany(allInsights);
  }
  
  // Generate summary
  const summary = {
    totalInsights: allInsights.length,
    highSeverityCount: allInsights.filter(i => i.severity === 'high' || i.severity === 'critical').length,
    categories: allInsights.reduce((acc, insight) => {
      acc[insight.category] = (acc[insight.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
  
  return {
    insights: allInsights,
    summary,
  };
} 