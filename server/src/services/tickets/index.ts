import { IProduct, IResponse, ZendeskTicket } from '@common/types';
import { answerTicket, classifyIntent, getSBERTEmbedding, summarizeTickets } from '../call-python';
import keyBy from 'lodash/keyBy';
import ElasticsearchService from '../elasticsearch/service';
import { ITicket, IESTicket } from '@common/types';
import { TicketModel } from 'src/schemas/ticket.schema';
import { buildProductPromptFromTicket, buildPrompt } from './prompts';
import { callLLM } from '../together.ai';
import { faker } from '@faker-js/faker';
import { ProductModel } from 'src/schemas/product.schema';
import sanitizeJSON from 'src/utils/sanitizeJson';

function cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
    const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  
    // Avoid division by zero
    if (normA === 0 || normB === 0) return 0;
  
    return dotProduct / (normA * normB);
  }

  
/** KNN search can only be used in elastic version > 18 */
export async function knnSearch({ ticket, k = 5, useBM25 = false }: { ticket: Partial<ITicket> & { embedding: number[] }; k: number; useBM25: boolean }): Promise<IESTicket[]> {
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

  type SimilarTicket = ITicket & { similarity: number };
  
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
  
    // Step 4: Summarize the new ticket to create a query summary
    // const [summary] = await summarizeTickets([ticket]);
  
    const topTickets = rankedTickets.slice(0, k).map(({ ticket, similarity }) => ({
      ...ticket,
      similarity,
    }));
    // Step 5: Optionally generate an answer using top similar tickets as context
    // const answer = await answerTicket({ tickets: topTickets, question: summary });
  
    // Return similar tickets and optionally the generated answer
    return {
      status: 200,
      payload: topTickets,
    };
  }
  
  export async function handleWebhook(userId: string, ticket: ZendeskTicket): Promise<IResponse> {
    const ticketPayload = {
      subject: ticket.ticket.subject,
      description: ticket.ticket.description,
    }
    const intents = await classifyIntent(ticketPayload);
    const similarTickets = await findZendeskSimilarTickets({
      ticket: ticketPayload,
      k: 5,
      useBM25: false,
    });

    const product: IProduct = {
      productName: '',
      serialNumber: faker.string.uuid(),
      purchaseDate: faker.date.past().toISOString(),
      price: faker.number.int({ min: 100, max: 1000 }),
      currency: 'USD',
      refundPolicy: {
        unit: 'days',
        value: 33,
      },
      warrantyPeriod: {
        unit: 'years',
        value: 2.5,
      },
      storeLocation: faker.location.city(),
      customerName: faker.person.fullName(),
      customerEmail: faker.internet.email(),
      metadata: {
        color: faker.color.human(),
      },
    };
    // const productLLMResponse = await callLLM({
    //   userId,
    //   prompt: buildProductPromptFromTicket(ticket),
    //   model: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
    //   maxTokens: 1000,
    //   temperature: 0,
    // });
    // let product = null;
    // if (productLLMResponse.data) {
    //   const jsonText = sanitizeJSON(productLLMResponse.data);
    //   try{
    //     product = JSON.parse(jsonText);
    //     await ProductModel.create(product);
    //   } catch(err) {
    //     console.log(err);
    //   }
    // }
    const prompt = buildPrompt(ticketPayload.description, similarTickets.payload, product);
    const response = await callLLM({
      userId,
      prompt,
      // model: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
      model: 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo',
      maxTokens: 1000,
      temperature: 0.2,
      isChat: true,
      systemMsg: 'You are a helpful AI assistant that can answer questions and help with tasks.',
    });
    const ticketEntry = new TicketModel({
      subject: ticketPayload.subject,
      description: ticketPayload.description,
      externalId: ticket.ticket.id.toString(),
      comments: [],
      chatHistory: [{
        role: 'user',
        content: ticketPayload.description,
        createdAt: new Date(),
      }, {
        role: 'agent',
        content: response.data,
        createdAt: new Date(),
      }],
    });
    await ticketEntry.save();
    return {
      status: 200,
      payload: {response: response.data, similarTickets: similarTickets.payload, product},
    };
  }