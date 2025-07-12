import { IResponse, IAgentSuggestion, ZendeskTicketWebhookPayload } from 'src/types';
import { classifyIntent, summarizeTickets } from '../call-python';
import { findZendeskSimilarTickets } from './search';
import { generateMockProduct } from './product';
import { buildAgentSuggestionPrompt, buildPrompt } from './prompts';
import { callLLM } from '../together.ai';
import { TicketModel } from 'src/schemas/ticket.schema';
import { analyzeTicket } from '../insights/analyzer';
import { InsightModel } from 'src/schemas/insight.schema';
import { addCommentToTicket } from '../zendesk';
import { extractCustomerMessage } from 'src/utils/text-sanitize';
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
  
  return response.data || '';
}

/**
 * Create and save ticket entry to database
 */
async function saveTicketEntry(
  ticketPayload: { subject: string; description: string },
  externalId: string,
  aiResponse: string
) {
  const ticketEntry = new TicketModel({
    subject: ticketPayload.subject,
    description: ticketPayload.description,
    externalId: externalId,
    comments: [],
    chatHistory: [{
      role: 'user',
      content: ticketPayload.description,
      createdAt: new Date(),
    }, {
      role: 'agent',
      content: aiResponse,
      createdAt: new Date(),
    }],
  });
  
  return ticketEntry.save();
}

/**
 * Main webhook handler for processing Zendesk tickets
 */
export async function handleWebhook(userId: string, ticket: ZendeskTicketWebhookPayload): Promise<IResponse> {
  try {
    console.log(`Processing webhook for ticket ${ticket.ticket_id}`);
    
    // Extract ticket payload
    const ticketPayload = {
      subject: ticket.subject,
      description: extractCustomerMessage(ticket.description),
    };

    // Process intent classification
    const intents = await processTicketIntent(ticketPayload);
    const summary = await summarizeTickets([ticketPayload]);
    
    // Find similar tickets
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

    const agentSuggestion = await getAgentSuggestion(userId, {
      subject: ticketPayload.subject,
      description: summary[0] || ticketPayload.description,
    }, product, similarTickets.payload);
    
    // Add comment to Zendesk ticket with better error handling
    try {
      await addCommentToTicket(ticket.ticket_id.toString(), agentSuggestion.reasoning, false);
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

    // Save ticket entry
    await saveTicketEntry(ticketPayload, ticket.ticket_id.toString(), aiResponse);

    console.log(`Successfully processed webhook for ticket ${ticket.ticket_id}`);

    return {
      status: 200,
      payload: {
        response: aiResponse,
        agentSuggestion,
        similarTickets: similarTickets.payload,
        product,
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