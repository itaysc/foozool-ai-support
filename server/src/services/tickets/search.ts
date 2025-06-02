import { IProduct, IResponse } from '@common/types';
import { getSBERTEmbedding } from '../call-python';
import keyBy from 'lodash/keyBy';
import ElasticsearchService from '../../elasticsearch/service';
import { ITicket, IESTicket } from '@common/types';
import { TicketModel } from 'src/schemas/ticket.schema';
import { cosineSimilarity } from './utils';

export type SimilarTicket = ITicket & { similarity: number };

/**
 * KNN search can only be used in elastic version > 18
 */
export async function knnSearch({ 
  ticket, 
  k = 5, 
  useBM25 = false 
}: { 
  ticket: Partial<ITicket> & { embedding: number[] }; 
  k: number; 
  useBM25: boolean 
}): Promise<IESTicket[]> {
  const esClient = new ElasticsearchService();
  if (!esClient) return [];

  // Build the KNN search body
  const knnSearchBody: any = {
      index: 'tickets',
      size: k,
      knn: {
          field: 'embedding',
          query_vector: ticket.embedding,
          k,
          num_candidates: 1000,
      }
  };

  // If BM25 is enabled, it needs to be a separate query:
  if (useBM25) {
      knnSearchBody.query = {
          bool: {
              should: [
                  {
                      match: {
                          description: {
                              query: ticket.description,
                              boost: 0.5,
                          },
                      },
                  }
              ],
              minimum_should_match: 1,
          }
      };
  }

  try {
      const response = await esClient.search(knnSearchBody);
      return response.hits.hits.map((hit) => hit._source as IESTicket);
  } catch (error) {
      console.error('Elasticsearch search error:', error);
      return [];
  }
}

/**
 * Find similar tickets using SBERT embeddings and optional BM25 search
 */
export async function findZendeskSimilarTickets({
  ticket,
  k = 5,
  useBM25 = false,
}: {
  ticket: Partial<ITicket>;
  k: number;
  useBM25: boolean;
}): Promise<IResponse<SimilarTicket[]>> {
  // Step 1: Get SBERT embedding for the new ticket
  const [sbertEmbedding] = await getSBERTEmbedding([ticket]);

  // Step 2: Fetch top-k similar tickets from Elasticsearch using SBERT + BM25
  const similarTickets = await knnSearch({
    ticket: { ...ticket, embedding: sbertEmbedding },
    k,
    useBM25,
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