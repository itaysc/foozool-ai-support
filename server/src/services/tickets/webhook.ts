import { IResponse, IAgentSuggestion, ZendeskTicketWebhookPayload } from 'src/types';
import { classifyIntent, getSBERTEmbedding, summarizeTickets } from '../call-python';
import { findZendeskSimilarTickets } from './search';
import { generateMockProduct } from './product';
import { buildAgentSuggestionPrompt, buildPrompt } from './prompts';
import { callLLM } from '../together.ai';
import { TicketModel } from 'src/schemas/ticket.schema';
import { analyzeTicket } from '../insights/analyzer';
import { InsightModel } from 'src/schemas/insight.schema';
import { addCommentToTicket } from '../zendesk';
import sanitizeText, { extractCustomerMessage } from 'src/utils/text-sanitize';
import QdrantService from '../../qdrant/service';
import { QdrantTicketPoint } from '../../qdrant/schemas/ticket';
import { analyzeSentiment } from '../nlp';
import { executeAutonomousActions } from '../autonomousAI';

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
    model: 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo',
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
    model: 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo',
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
 * Main webhook handler for processing Zendesk tickets
 */
export async function handleWebhook(ticket: ZendeskTicketWebhookPayload, userId: string, organizationId: string): Promise<IResponse> {
  try {
    console.log(`Processing webhook for ticket ${ticket.ticket_id}`);
    
    // Extract ticket payload
    const ticketPayload = {
      subject: ticket.subject,
      description: extractCustomerMessage(ticket.description),
    };

    // Analyze sentiment
    const sentimentResult = analyzeSentiment(ticketPayload.subject + ' ' + ticketPayload.description);

    // Process intent classification
    const intents = await processTicketIntent(ticketPayload);
    const summary = await summarizeTickets([ticketPayload]);

    const [sbertEmbedding] = await getSBERTEmbedding([ticketPayload]);
    // Save ticket point in qdrant
    const qdrantService = new QdrantService();
    const qdrantPoint: QdrantTicketPoint = {
      id: ticket.ticket_id,
      vector: sbertEmbedding,
      payload: {
        ticket_id: ticket.ticket_id,
        organization: organizationId,
        sentiment_score: sentimentResult.score,
        sentiment: sentimentResult.sentiment,
        created_at: ticket.created_at || new Date().toISOString(),
        tags: typeof ticket.tags === 'string' ? ticket.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        intent: Array.isArray(intents) && intents.length > 0 ? intents[0] : '',
      },
    };
    const qdrantResult = await qdrantService.addSingleTicket(qdrantPoint);
    if (qdrantResult) {
      console.log(`Ticket ${ticket.ticket_id} added to Qdrant.`);
    } else {
      console.error(`Failed to add ticket ${ticket.ticket_id} to Qdrant.`);
    }
    // Find similar tickets
    const similarTickets = await findZendeskSimilarTickets({
      ticket: ticketPayload,
      k: 5,
      embedding: sbertEmbedding,
      fetchComments: true,
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

    // Extract and summarize comments from similar tickets
    const commentsForSummarization = similarTickets.payload
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
    similarTickets.payload.forEach((sTicket, index) => {
      if (commentsSummary[index]) {
        // Append the summarized comments to the ticket description
        sTicket.description = sTicket.description + '\n\nConversation Summary: ' + commentsSummary[index];
        console.log(`Added conversation summary to ticket ${sTicket.externalId}`);
      }
    });
    
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
    const aiResponse = await generateTicketResponse(
      userId,
      ticketPayload,
      similarTickets.payload,
      product
    );

    // Parse the AI response to extract action
    let parsedResponse;
    let actionType = 'commentOnly';
    let confidenceScore = DEFAULT_CONFIDENCE_SCORE;
    
    try {
      parsedResponse = JSON.parse(aiResponse);
      actionType = parsedResponse.action || 'commentOnly';
      confidenceScore = parsedResponse.confidence || DEFAULT_CONFIDENCE_SCORE;
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      // Default to commentOnly if parsing fails
    }

    // Execute autonomous actions based on thresholds
    const executedActions = await executeAutonomousActions(
      ticket.ticket_id.toString(),
      organizationId,
      actionType,
      confidenceScore,
      userId
    );

    console.log(`Successfully processed webhook for ticket ${ticket.ticket_id}`);

    return {
      status: 200,
      payload: {
        response: aiResponse,
        agentSuggestion,
        similarTickets: similarTickets.payload,
        product,
        executedActions,
      },
    };
  } catch (error: any) {
    console.error('Error handling webhook:', {
      ticketId: ticket?.ticket_id,
      error: error.message,
      stack: error.stack,
      userId
    });
    return {
      status: 500,
      payload: { 
        error: 'Internal server error',
        message: error.message,
        ticketId: ticket?.ticket_id
      },
    };
  }
} 