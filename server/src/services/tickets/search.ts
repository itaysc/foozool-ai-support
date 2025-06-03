import { IProduct, IResponse } from '@common/types';
import { getSBERTEmbedding } from '../call-python';
import keyBy from 'lodash/keyBy';
import QdrantService from '../../qdrant/service';
import { ticketCollectionConfig } from '../../qdrant/schemas/ticket';
import { ITicket, IESTicket } from '@common/types';
import { TicketModel } from 'src/schemas/ticket.schema';
import { cosineSimilarity } from './utils';

export type SimilarTicket = ITicket & { similarity: number };

/**
 * KNN search using Qdrant vector database
 */
export async function knnSearch({ 
  ticket, 
  k = 5, 
}: { 
  ticket: Partial<ITicket> & { embedding: number[] }; 
  k: number; 
}): Promise<IESTicket[]> {
  const qdrantService = new QdrantService();

  try {
    const searchResults = await qdrantService.knnSearch({
      collectionName: ticketCollectionConfig.name,
      queryVector: ticket.embedding,
      limit: k,
      withPayload: true,
      scoreThreshold: 0.1 // Minimum similarity threshold
    });

    // Transform Qdrant results to match the expected IESTicket format
    return searchResults.map((result) => ({
      ticket_id: result.payload?.ticket_id || '',
      organization: result.payload?.organization || '',
      sentiment_score: result.payload?.sentiment_score || 0,
      sentiment: result.payload?.sentiment || 'neutral',
      customer_id: result.payload?.customer_id || '',
      created_at: result.payload?.created_at || new Date().toISOString(),
      embedding: result.vector || []
    } as IESTicket));

  } catch (error) {
    console.error('Qdrant search error:', error);
    return [];
  }
}

/**
 * Find similar tickets using SBERT embeddings and optional BM25 search
 */
export async function findZendeskSimilarTickets({
  ticket,
  k = 5,
}: {
  ticket: Partial<ITicket>;
  k: number;
}): Promise<IResponse<SimilarTicket[]>> {
  // Step 1: Get SBERT embedding for the new ticket
  const [sbertEmbedding] = await getSBERTEmbedding([ticket]);

  // Step 2: Fetch top-k similar tickets from Elasticsearch using SBERT + BM25
  const similarTickets = await knnSearch({
    ticket: { ...ticket, embedding: sbertEmbedding },
    k,
  });

  // TODO: in real app fetch from CRM here
  const tickets = await TicketModel.find({
    externalId: { $in: similarTickets.map((ticket) => ticket.ticket_id) },
  }).lean();
  const ticketsById = keyBy(tickets, 'externalId');

  if (similarTickets.length === 0) {
    return {
      status: 200,
      payload: [],
    };
  }

  // Step 3: Re-rank results with cosine similarity + keyword boost
  const rankedTickets = similarTickets
    .map((candidateTicket) => {
      // Compute cosine similarity between embeddings
      const similarity = cosineSimilarity(sbertEmbedding, candidateTicket.embedding as number[]);
      const crmTicket = ticketsById[candidateTicket.ticket_id];
      if (!crmTicket) return null;
      // Boost if candidate subject or description contains keywords from query ticket
      const subjectBoost = crmTicket.subject?.includes(ticket.subject) ? 0.2 : 0;
      const descriptionBoost = crmTicket.description?.includes(ticket.description) ? 0.1 : 0;
      delete candidateTicket.embedding;
      return {
        ticket: crmTicket,
        similarity: similarity + subjectBoost + descriptionBoost,
      };
    })
    .filter(t => !!t)
    .sort((a, b) => b.similarity - a.similarity);

  const topTickets = rankedTickets.slice(0, k).map(({ ticket, similarity }) => ({
    ...ticket,
    similarity,
  }));

  return {
    status: 200,
    payload: topTickets,
  };
} 