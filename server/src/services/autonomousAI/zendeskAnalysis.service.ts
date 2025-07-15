import { SimpleAutonomousAIService } from './simple.service';
import { findZendeskSimilarTickets, type SimilarTicket } from '../tickets/search';
import { classifyIntent, summarizeTickets } from '../call-python';
import { generateMockProduct } from '../tickets/product';
import { extractCustomerMessage } from '../../utils/text-sanitize';
import { ZendeskTicketWebhookPayload } from '../../types/zendesk/webhookPayload';
import { IRecommendedAction } from '../../types/autonomousAI';

export interface ZendeskAnalysisResult {
  ticketId: string;
  analysis: {
    confidenceScore: number;
    sentiment: string;
    urgency: string;
    customerSatisfaction: number;
    issueComplexity: string;
    estimatedResolutionTime: number;
    keywords: string[];
    intent: string;
    suggestedTags: string[];
  };
  recommendedActions: IRecommendedAction[];
  executedActions?: ExecutedAction[];
  similarTickets: SimilarTicket[];
  product: unknown;
  intents: unknown;
  summary: string;
}

export interface ExecutedAction {
  actionType: string;
  confidenceScore: number;
  status: 'executed' | 'failed';
  reasoning?: string;
  error?: string;
}



export interface ZendeskAnalysisRequest {
  ticket: ZendeskTicketWebhookPayload;
  userId: string;
  organizationId: string;
}

export class ZendeskAnalysisService {
  /**
   * Analyze a Zendesk ticket and optionally execute autonomous actions
   */
  static async analyzeTicket(
    request: ZendeskAnalysisRequest,
    executeActions: boolean = false
  ): Promise<ZendeskAnalysisResult> {
    try {
      const { ticket, userId, organizationId } = request;
      
      console.log(`Analyzing Zendesk ticket ${ticket.ticket_id} for autonomous actions`);

      // Extract ticket payload
      const ticketPayload = {
        subject: ticket.subject,
        description: extractCustomerMessage(ticket.description),
      };

      // Process intent classification and summarization
      const intents = await classifyIntent(ticketPayload);
      const summary = await summarizeTickets([ticketPayload]);

      // Find similar tickets using existing Qdrant search logic
      const similarTickets = await findZendeskSimilarTickets({
        ticket: ticketPayload,
        k: 5,
      });

      // Filter similar tickets to only include subject and description for summarization
      const ticketsForSummarization = similarTickets.payload.map(ticket => ({
        subject: ticket.subject || '',
        description: ticket.description || ''
      }));
      
      // Summarize similar tickets to reduce llm token usage
      const similarTicketsSummary = await summarizeTickets(ticketsForSummarization);
      similarTickets.payload.forEach((sTicket, index) => {
        if (similarTicketsSummary[index]) {
          sTicket.description = similarTicketsSummary[index];
        }
      });

      // Generate or extract product information
      const product = generateMockProduct();

      // Perform autonomous AI analysis using the existing analyzeTicket method
      const analysis = await SimpleAutonomousAIService.analyzeTicket(
        ticket.ticket_id.toString(),
        organizationId
      );

      let executedActions: ExecutedAction[] = [];

      // Execute recommended actions if requested and confidence is high enough
      if (executeActions) {
        executedActions = await this.executeRecommendedActions(
          analysis.recommendedActions,
          ticket.ticket_id.toString(),
          organizationId,
          userId
        );
      }

      console.log(`Successfully analyzed Zendesk ticket ${ticket.ticket_id}`);

      return {
        ticketId: ticket.ticket_id,
        analysis: {
          confidenceScore: analysis.confidenceScore,
          sentiment: analysis.sentiment,
          urgency: analysis.urgency,
          customerSatisfaction: analysis.customerSatisfaction,
          issueComplexity: analysis.issueComplexity,
          estimatedResolutionTime: analysis.estimatedResolutionTime,
          keywords: analysis.keywords,
          intent: analysis.intent,
          suggestedTags: analysis.suggestedTags
        },
        recommendedActions: analysis.recommendedActions,
        executedActions: executeActions ? executedActions : undefined,
        similarTickets: similarTickets.payload,
        product: product,
        intents: intents,
        summary: summary[0] || ticketPayload.description
      };

    } catch (error) {
      console.error('Error analyzing Zendesk ticket for autonomous actions:', error);
      throw error;
    }
  }



  /**
   * Execute recommended actions based on confidence threshold
   */
  private static async executeRecommendedActions(
    recommendedActions: IRecommendedAction[],
    ticketId: string,
    organizationId: string,
    userId: string
  ): Promise<ExecutedAction[]> {
    const executedActions: ExecutedAction[] = [];
    
    for (const action of recommendedActions) {
      if (action.confidenceScore >= 0.8) { // High confidence threshold
        try {
          const actionRequest = {
            ticketId: ticketId,
            organizationId: organizationId,
            actionType: action.actionType,
            thresholdId: action.threshold,
            confidenceScore: action.confidenceScore,
            parameters: action.parameters,
            userId: userId
          };

          const result = await SimpleAutonomousAIService.executeAction(actionRequest);
          if (result) {
            executedActions.push({
              actionType: action.actionType,
              confidenceScore: action.confidenceScore,
              status: 'executed' as const,
              reasoning: action.reasoning
            });
          }
        } catch (actionError) {
          console.error(`Failed to execute action ${action.actionType}:`, actionError);
          executedActions.push({
            actionType: action.actionType,
            confidenceScore: action.confidenceScore,
            status: 'failed' as const,
            error: (actionError as Error).message
          });
        }
      }
    }

    return executedActions;
  }

  /**
   * Analyze ticket without executing actions (for preview/testing)
   */
  static async analyzeTicketOnly(request: ZendeskAnalysisRequest): Promise<ZendeskAnalysisResult> {
    return this.analyzeTicket(request, false);
  }

  /**
   * Analyze ticket and execute actions
   */
  static async analyzeAndExecuteActions(request: ZendeskAnalysisRequest): Promise<ZendeskAnalysisResult> {
    return this.analyzeTicket(request, true);
  }
} 