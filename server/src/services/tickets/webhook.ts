import { IResponse, ZendeskTicket } from '@common/types';
import { classifyIntent } from '../call-python';
import { findZendeskSimilarTickets } from './search';
import { generateMockProduct } from './product';
import { buildAgentSuggestionPrompt, buildPrompt } from './prompts';
import { callLLM } from '../together.ai';
import { TicketModel } from 'src/schemas/ticket.schema';
import { analyzeTicket } from '../insights/analyzer';
import { InsightModel } from 'src/schemas/insight.schema';

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
  
  return ticketEntry.save();
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

  // Get recent tickets for anomaly detection (last 100 tickets)
  const recentTickets = await TicketModel.find({
    // Only get tickets from the last 30 days
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    // Exclude the current ticket
    externalId: { $ne: ticket.ticket.id.toString() },
    // Only include tickets that have been processed (have a response)
    'chatHistory.1': { $exists: true }
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .select({
      subject: 1,
      description: 1,
      externalId: 1,
      createdAt: 1,
      'chatHistory.role': 1,
      'chatHistory.content': 1,
      'chatHistory.createdAt': 1
    })
    .lean();

  // Analyze ticket and generate insights
  const insightAnalysis = await analyzeTicket({
    subject: ticketPayload.subject,
    description: ticketPayload.description,
    ticketId: ticket.ticket.id.toString(),
    product,
    similarTickets: similarTickets.payload,
  }, recentTickets);

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
      insights: insightAnalysis,
    },
  };
} 