import { IResponse, ZendeskTicket } from '@common/types';
import { classifyIntent } from '../call-python';
import { findZendeskSimilarTickets } from './search';
import { generateMockProduct } from './product';
import { buildAgentSuggestionPrompt, buildPrompt } from './prompts';
import { callLLM } from '../together.ai';
import { insightsService } from '../insights';
import { ticketAnalyticsService } from '../ticket-analytics';

/**
 * Process intent classification for a ticket
 */
async function processTicketIntent(ticketPayload: { subject: string; description: string }) {
  const intents = await classifyIntent(ticketPayload);
  return intents;
}

async function getAgentSuggestion(userId: string, ticketPayload: { subject: string; description: string }, product: any, similarTickets: any[]) {
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
  return response.data || '';
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
 * Create and save ticket analytics entry to database (privacy-compliant)
 */
async function saveTicketAnalytics(
  ticketPayload: { subject: string; description: string },
  externalId: string,
  organizationId?: string,
  productId?: string
) {
  await ticketAnalyticsService.processTicketForAnalytics({
    ticketId: externalId,
    subject: ticketPayload.subject,
    description: ticketPayload.description,
    organization: organizationId,
    productId: productId,
    channelSource: 'zendesk'
  });
}

/**
 * Process ticket for insights generation
 */
async function processTicketInsights(
  ticketId: string,
  ticketPayload: { subject: string; description: string },
  product: any,
  organizationId?: string
) {
  try {
    // Process the ticket for insights and return the results
    const analysisResult = await insightsService.processNewTicket({
      ticketId,
      subject: ticketPayload.subject,
      description: ticketPayload.description,
      organization: organizationId,
      productId: product?.serialNumber,
      tags: [], // Could extract tags from ticket or product
      satisfactionRating: undefined // Would come from actual ticket data
    });
    
    return analysisResult;
  } catch (error) {
    console.error('Error processing ticket for insights:', error);
    // Return null instead of throwing to keep backward compatibility
    return null;
  }
}

/**
 * Main webhook handler for processing Zendesk tickets
 */
export async function handleWebhook(userId: string, ticket: ZendeskTicket): Promise<IResponse> {
  // Extract ticket payload
  const ticketPayload = {
    subject: ticket.ticket.subject,
    description: ticket.ticket.description,
  };

  // Process intent classification
  const intents = await processTicketIntent(ticketPayload);

  // Find similar tickets
  const similarTickets = await findZendeskSimilarTickets({
    ticket: ticketPayload,
    k: 5,
  });

  // Generate or extract product information
  const product = generateMockProduct();
  // Alternative: const product = await extractProductFromTicket(userId, ticket);

  const agentSuggestion = await getAgentSuggestion(userId, ticketPayload, product, similarTickets.payload);

  // Generate AI response
  const aiResponse = await generateTicketResponse(
    userId,
    ticketPayload,
    similarTickets.payload,
    product
  );

  // Save ticket analytics
  const organizationId = ticket.ticket.organization_id?.toString();
  await saveTicketAnalytics(ticketPayload, ticket.ticket.id.toString(), organizationId, product?.serialNumber);

  // TODO: make this non blocking
  const insightsResult = await processTicketInsights(
    ticket.ticket.id.toString(),
    ticketPayload,
    product,
    organizationId
  ).catch(error => {
    console.error('Failed to process insights for ticket:', ticket.ticket.id, error);
    return null;
  });

  return {
    status: 200,
    payload: {
      response: aiResponse,
      agentSuggestion,
      similarTickets: similarTickets.payload,
      product,
      insights: insightsResult,
    },
  };
} 