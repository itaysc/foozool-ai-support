import { IResponse, IAgentSuggestion, ZendeskTicketWebhookPayload } from 'src/types';
import { classifyIntent, getSBERTEmbedding, summarizeTickets } from '../call-python';
import { findZendeskSimilarTickets } from './search';
import { generateMockProduct } from './product';
import { buildAgentSuggestionPrompt, buildPrompt } from './prompts';
import { callLLM } from '../llm';
import { addCommentToTicket } from '../zendesk';
import sanitizeText, { extractCustomerMessage } from 'src/utils/text-sanitize';
import QdrantService from '../../qdrant/service';
import { QdrantTicketPoint } from '../../qdrant/schemas/ticket';
import { analyzeSentiment } from '../nlp';
import { executeAutonomousActions } from '../autonomousAI';
import { v5 as uuidv5 } from 'uuid';
import { QDRANT_POINT_NAMESPACE } from '../../qdrant/utils';
import { UserContextManager } from '../../context/userContext';
import { BotPerformanceTracker, BotPerformanceData } from '../botPerformance/tracking.service';
import { IBotProcessingStep } from 'src/types';

const DEFAULT_CONFIDENCE_SCORE = 0.3;

/**
 * Process intent classification for a ticket
 */
async function processTicketIntent(ticketPayload: { subject: string; description: string }) {
  const intents = await classifyIntent(ticketPayload);
  return intents;
}

async function getAgentSuggestion(userId: string, ticketPayload: { subject: string; description: string }, product: any, similarTickets: any[]) : Promise<IAgentSuggestion> {
  const prompt = buildAgentSuggestionPrompt(ticketPayload, product, similarTickets);
  const response = await callLLM({
    userId,
    prompt,
    maxTokens: 1000,
    temperature: 0,
    isChat: true,
    systemMsg: 'You are a helpful AI assistant that can answer questions and help with tasks.',
  });
  const data = response.data || '';
  const parsedResponse = JSON.parse(data) as IAgentSuggestion;
  return parsedResponse;
}

/**
 * Generate AI response for the ticket using similar tickets and product context
 */
async function generateTicketResponse(
  userId: string,
  ticketPayload: { subject: string; description: string },
  similarTickets: any[],
  product: any
): Promise<string> {
  const prompt = buildPrompt(ticketPayload.description, similarTickets, product);
  
  const response = await callLLM({
    userId,
    prompt,
    maxTokens: 1000,
    temperature: 0.2,
    isChat: true,
    systemMsg: 'You are a helpful AI assistant that can answer questions and help with tasks.',
  });
  
  // Return the LLM response as-is, expecting it to include confidence
  const baseResponse = response.data || '';
  try {
    const parsed = JSON.parse(sanitizeText(baseResponse));
    // Ensure confidence is present, use default if not
    if (typeof parsed.confidence !== 'number') {
      parsed.confidence = DEFAULT_CONFIDENCE_SCORE;
    }
    return JSON.stringify(parsed);
  } catch (error) {
    // If parsing fails, return the original response with default confidence
    return JSON.stringify({
      response: baseResponse,
      action: 'commentOnly',
      confidence: DEFAULT_CONFIDENCE_SCORE
    });
  }
}

/**
 * Extract and summarize comments from similar tickets
 */
async function extractAndSummarizeTicketComments(similarTickets: any[]): Promise<void> {
  // Extract and summarize comments from similar tickets
  const commentsForSummarization = similarTickets
    .filter(ticket => ticket.comments && Array.isArray(ticket.comments) && ticket.comments.length > 0)
    .map(ticket => {
      // Extract all comment bodies and join them
      const commentTexts = (ticket.comments as any[])
        .filter(comment => comment.body && comment.body.trim())
        .map(comment => comment.body)
        .join('\n\n');
      
      return {
        subject: `Comments from ticket ${ticket.externalId}`,
        description: commentTexts
      };
    });

  // Summarize comments if there are any
  let commentsSummary: string[] = [];
  if (commentsForSummarization.length > 0) {
    console.log(`Summarizing comments from ${commentsForSummarization.length} similar tickets`);
    commentsSummary = await summarizeTickets(commentsForSummarization);
  }

  // Add summarized comments to each ticket's context
  similarTickets.forEach((sTicket, index) => {
    if (commentsSummary[index]) {
      // Append the summarized comments to the ticket description
      sTicket.description = sTicket.description + '\n\nConversation Summary: ' + commentsSummary[index];
      console.log(`Added conversation summary to ticket ${sTicket.externalId}`);
    }
  });
}

/**
 * Main webhook handler for processing Zendesk tickets
 */
export async function handleWebhook(ticket: ZendeskTicketWebhookPayload): Promise<IResponse> {
  const startTime = Date.now();
  const processingSteps: IBotProcessingStep[] = [];
  
  try {
    // Get user ID and organization ID from context
    const userId = UserContextManager.getCurrentUserId();
    const organizationId = UserContextManager.getCurrentOrganizationId();
    
    if (!userId || !organizationId) {
      throw new Error('User context not available');
    }
    
    console.log(`Processing webhook for ticket ${ticket.ticket_id}`);
    
    // Extract ticket payload
    const ticketPayload = {
      subject: ticket.subject,
      description: extractCustomerMessage(ticket.description),
    };

    // Track start of processing
    processingSteps.push(BotPerformanceTracker.createProcessingStep(
      'webhook_received',
      true,
      Date.now() - startTime
    ));

    // Analyze sentiment
    const stepStartTime = Date.now();
    const sentimentResult = analyzeSentiment(ticketPayload.subject + ' ' + ticketPayload.description);
    processingSteps.push(BotPerformanceTracker.createProcessingStep(
      'sentiment_analysis',
      true,
      Date.now() - stepStartTime
    ));

    // Process intent classification
    const intentStartTime = Date.now();
    const intents = await processTicketIntent(ticketPayload);
    processingSteps.push(BotPerformanceTracker.createProcessingStep(
      'intent_classification',
      true,
      Date.now() - intentStartTime
    ));
    
    // Summarize ticket
    const summaryStartTime = Date.now();
    const summary = await summarizeTickets([ticketPayload]);
    processingSteps.push(BotPerformanceTracker.createProcessingStep(
      'ticket_summarization',
      true,
      Date.now() - summaryStartTime
    ));

    // Generate embeddings
    const embeddingStartTime = Date.now();
    const [sbertEmbedding] = await getSBERTEmbedding([ticketPayload]);
    processingSteps.push(BotPerformanceTracker.createProcessingStep(
      'embedding_generation',
      true,
      Date.now() - embeddingStartTime
    ));
    // Save ticket point in qdrant
    const qdrantStartTime = Date.now();
    const qdrantService = new QdrantService();
    
    // Generate a UUID for the Qdrant point ID based on the ticket ID
    const qdrantPointId = uuidv5(ticket.ticket_id.toString(), QDRANT_POINT_NAMESPACE);
    
    // Create base payload for performance tracking
    const botPerformanceData: BotPerformanceData = {
      botProcessed: true,
      botResponseGenerated: false, // Will be updated later
      botResponseTime: 0, // Will be calculated at the end
      botConfidenceScore: 0, // Will be updated with AI response
      botActions: [],
      escalatedToHuman: false, // Will be determined by autonomous actions
      resolutionSource: 'human', // Default, will be updated based on actions
      similarTicketsUsed: 0, // Will be updated after search
      processingSteps: [...processingSteps], // Clone current steps
      botModelVersion: 'gpt-4',
      botPromptTemplate: 'agent_suggestion_v1',
    };
    
    const baseQdrantPayload = {
      ticket_id: ticket.ticket_id,
      organization: organizationId,
      sentiment_score: sentimentResult.score,
      sentiment: sentimentResult.sentiment,
      created_at: ticket.created_at ? new Date(ticket.created_at).getTime() : Date.now(),
      timestamp: ticket.created_at || new Date().toISOString(),
      tags: typeof ticket.tags === 'string' ? ticket.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      intent: Array.isArray(intents) && intents.length > 0 ? intents[0] : '',
    };
    
    const qdrantPoint: QdrantTicketPoint = {
      id: qdrantPointId,
      vector: sbertEmbedding,
      payload: BotPerformanceTracker.enhanceQdrantPayload(baseQdrantPayload, botPerformanceData),
    };
    
    const qdrantResult = await qdrantService.addSingleTicket(qdrantPoint);
    processingSteps.push(BotPerformanceTracker.createProcessingStep(
      'qdrant_storage',
      !!qdrantResult,
      Date.now() - qdrantStartTime,
      qdrantResult ? undefined : 'Failed to store in Qdrant'
    ));
    
    if (qdrantResult) {
      console.log(`Ticket ${ticket.ticket_id} added to Qdrant.`);
    } else {
      console.error(`Failed to add ticket ${ticket.ticket_id} to Qdrant.`);
    }
    
    // Find similar tickets
    const similarSearchStartTime = Date.now();
    const similarTickets = await findZendeskSimilarTickets({
      ticket: ticketPayload,
      k: 5,
      embedding: sbertEmbedding,
      fetchComments: true,
    });
    
    // Update performance data with similar tickets count
    botPerformanceData.similarTicketsUsed = similarTickets.payload?.length || 0;
    processingSteps.push(BotPerformanceTracker.createProcessingStep(
      'similar_tickets_search',
      true,
      Date.now() - similarSearchStartTime
    ));

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

    // Extract and summarize comments from similar tickets
    await extractAndSummarizeTicketComments(similarTickets.payload);
    
    // TODO: extract product information from similar tickets
    // Generate or extract product information
    const product = generateMockProduct();

    const agentSuggestion = await getAgentSuggestion(userId, {
      subject: ticketPayload.subject,
      description: summary[0] || ticketPayload.description,
    }, product, similarTickets.payload);
    
    // Add comment to Zendesk ticket with better error handling
    try {
      // Collect similar ticket numbers
      const similarTicketNumbers = similarTickets.payload.map(t => t.externalId).filter(Boolean);
      let comment = agentSuggestion.reasoning;
      if (similarTicketNumbers.length > 0) {
        comment += `\n\nSimilar tickets used for this response: ${similarTicketNumbers.join(", ")}`;
      }
      await addCommentToTicket(ticket.ticket_id.toString(), comment, false);
      console.log(`Successfully added agent suggestion comment to ticket ${ticket.ticket_id}`);
    } catch (commentError: any) {
      console.error(`Failed to add comment to Zendesk ticket ${ticket.ticket_id}:`, commentError.message);
      // Continue processing even if comment fails
    }
    
    // Generate AI response
    const responseStartTime = Date.now();
    const aiResponse = await generateTicketResponse(
      userId,
      ticketPayload,
      similarTickets.payload,
      product
    );
    
    const responseTime = Date.now() - responseStartTime;
    botPerformanceData.botResponseGenerated = true;
    botPerformanceData.botResponseTime = Date.now() - startTime; // Total processing time
    botPerformanceData.botResponseContent = aiResponse;
    
    processingSteps.push(BotPerformanceTracker.createProcessingStep(
      'ai_response_generation',
      true,
      responseTime
    ));

    // Parse the AI response to extract action
    let parsedResponse;
    let actionType = 'commentOnly';
    let confidenceScore = DEFAULT_CONFIDENCE_SCORE;
    
    try {
      parsedResponse = JSON.parse(aiResponse);
      actionType = parsedResponse.action || 'commentOnly';
      confidenceScore = parsedResponse.confidence || DEFAULT_CONFIDENCE_SCORE;
      
      // Update bot confidence score
      botPerformanceData.botConfidenceScore = confidenceScore;
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      // Default to commentOnly if parsing fails
      processingSteps.push(BotPerformanceTracker.createProcessingStep(
        'ai_response_parsing',
        false,
        0,
        'Failed to parse AI response JSON'
      ));
    }

    // Execute autonomous actions based on thresholds
    const actionsStartTime = Date.now();
    const executedActions = await executeAutonomousActions(
      ticket.ticket_id.toString(),
      organizationId,
      actionType,
      confidenceScore,
      userId
    );
    
    // Update performance data based on executed actions
    if (executedActions && executedActions.length > 0) {
      botPerformanceData.botActions = executedActions.map(action => action.actionType || actionType);
      
      // Determine if ticket was escalated or resolved by bot
      const hasEscalation = executedActions.some(action => 
        action.actionType === 'escalate' || action.status === 'failed'
      );
      const hasAutoResolve = executedActions.some(action => 
        action.actionType === 'auto_resolve' && action.status === 'executed'
      );
      
      botPerformanceData.escalatedToHuman = hasEscalation;
      if (hasAutoResolve) {
        botPerformanceData.resolutionSource = 'bot';
      } else if (hasEscalation) {
        botPerformanceData.resolutionSource = 'human';
        botPerformanceData.escalationReason = 'Autonomous action escalation';
      } else {
        botPerformanceData.resolutionSource = 'hybrid';
      }
    }
    
    processingSteps.push(BotPerformanceTracker.createProcessingStep(
      'autonomous_actions',
      true,
      Date.now() - actionsStartTime
    ));

    // Finalize performance data
    botPerformanceData.processingSteps = processingSteps;
    
    // Track bot performance (async, don't block response)
    BotPerformanceTracker.trackTicketProcessing(
      ticket.ticket_id.toString(),
      organizationId,
      botPerformanceData
    ).catch(trackingError => {
      console.error('Failed to track bot performance:', trackingError);
    });

    console.log(`Successfully processed webhook for ticket ${ticket.ticket_id} in ${Date.now() - startTime}ms`);

    return {
      status: 200,
      payload: {
        response: aiResponse,
        agentSuggestion,
        similarTickets: similarTickets.payload,
        product,
        executedActions,
        botPerformance: {
          processingTime: Date.now() - startTime,
          stepsCompleted: processingSteps.length,
          confidenceScore: botPerformanceData.botConfidenceScore,
          similarTicketsUsed: botPerformanceData.similarTicketsUsed,
          actionsExecuted: botPerformanceData.botActions.length
        }
      },
    };
  } catch (error: any) {
    // Track failed processing
    const failedPerformanceData: BotPerformanceData = {
      botProcessed: true,
      botResponseGenerated: false,
      botResponseTime: Date.now() - startTime,
      botConfidenceScore: 0,
      botActions: [],
      escalatedToHuman: true,
      escalationReason: `Processing failed: ${error.message}`,
      resolutionSource: 'human',
      similarTicketsUsed: 0,
      processingSteps: [
        ...processingSteps,
        BotPerformanceTracker.createProcessingStep(
          'error_occurred',
          false,
          Date.now() - startTime,
          error.message
        )
      ],
      botModelVersion: 'gpt-4',
      botPromptTemplate: 'agent_suggestion_v1',
    };
    
    // Track the failed attempt (async)
    if (ticket?.ticket_id && UserContextManager.getCurrentOrganizationId()) {
      BotPerformanceTracker.trackTicketProcessing(
        ticket.ticket_id.toString(),
        UserContextManager.getCurrentOrganizationId()!,
        failedPerformanceData
      ).catch(() => {}); // Ignore tracking errors
    }

    console.error('Error handling webhook:', {
      ticketId: ticket?.ticket_id,
      error: error.message,
      stack: error.stack,
      userId: UserContextManager.getCurrentUserId() || 'unknown',
      processingTime: Date.now() - startTime
    });
    
    return {
      status: 500,
      payload: { 
        error: 'Internal server error',
        message: error.message,
        ticketId: ticket?.ticket_id,
        processingTime: Date.now() - startTime
      },
    };
  }
} 