import { IResponse, ZendeskTicket } from '@common/types';
import { classifyIntent } from '../call-python';
import { findZendeskSimilarTickets } from './search';
import { generateMockProduct } from './product';
import { buildAgentSuggestionPrompt, buildPrompt } from './prompts';
import { callLLM } from '../together.ai';
import { TicketModel } from 'src/schemas/ticket.schema';

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
  
  // Currently commented out in original - uncomment when ready to save
  // await ticketEntry.save();
  
  return ticketEntry;
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

  // Save ticket entry
  await saveTicketEntry(ticketPayload, ticket.ticket.id.toString(), aiResponse);

  return {
    status: 200,
    payload: {
      response: aiResponse,
      agentSuggestion,
      similarTickets: similarTickets.payload,
      product,
    },
  };
} 