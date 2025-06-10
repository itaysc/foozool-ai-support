import path from "path";
import { faker } from '@faker-js/faker';
import { chunk } from 'lodash';
import csvtojson from "csvtojson";
import { getSBERTEmbedding } from '../call-python';
import QdrantService from '../../qdrant/service';
import { ticketCollectionConfig, QdrantTicketPoint } from '../../qdrant/schemas/ticket';
import fetchTickets from '../zendesk';
import { IResponse, ITicket } from '@common/types';
import { analyzeSentiment } from '../nlp';
import { getDemoOrganization } from '../../dal/organization.dal';
import { TicketModel } from "src/schemas/ticket.schema";
import { createDemoZendeskTickets } from '../zendesk';

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

export async function loadStubData(): Promise<IResponse<any>> {
    const stub = await csvtojson().fromFile(path.join(__dirname, 'stub2.csv'));
    const org = await getDemoOrganization();
    const BATCH_SIZE = 300;
    const EMBEDDING_CHUNK_SIZE = 10;

    const totalBatches = Math.ceil(stub.length / BATCH_SIZE);
    const qdrantService = new QdrantService();

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const start = batchIndex * BATCH_SIZE;
        const end = start + BATCH_SIZE;
        const batch = stub.slice(start, end);

        console.log(`Processing batch ${batchIndex + 1} of ${totalBatches} (${batch.length} tickets)`);

        const dataForEmbedding: Partial<ITicket>[] = batch.map((ticket: any) => ({
            subject: ticket['Ticket Subject'],
            description: ticket['Ticket Description'],
        }));

        const embeddingChunks = chunk(dataForEmbedding, EMBEDDING_CHUNK_SIZE);
        let embeddings: number[][] = [];

        for (const [i, chunkData] of embeddingChunks.entries()) {
            console.log(`Embedding chunk ${i + 1} of ${embeddingChunks.length}...`);
            const embeddingsChunk: [number[]] = await getSBERTEmbedding(chunkData);
            embeddings = embeddings.concat(embeddingsChunk);
        }

        const qdrantPoints: QdrantTicketPoint[] = [];
        const tickets: ITicket[] = [];

        batch.forEach((ticket: any, index: number) => {
            const customerId = faker.string.uuid();
            const sentiment = analyzeSentiment(ticket['Ticket Subject'] + ' ' + ticket['Ticket Description']);
            const channel = ticket['Ticket Channel'];
            const createdAt = faker.date.recent().toISOString();
            const ticketId = faker.string.uuid();
            const subject = ticket['Ticket Subject'];
            if (!subject) {
                return;
            }
            
            // Prepare data for Qdrant
            qdrantPoints.push({
                id: ticketId,
                vector: embeddings[index],
                payload: {
                    ticket_id: ticketId,
                    organization: org!._id!.toString(),
                    sentiment_score: sentiment.score,
                    sentiment: sentiment.sentiment,
                    created_at: createdAt,
                    tags: [ticket['Product Purchased']]
                }
            });

            tickets.push({
                subject,
                description: ticket['Ticket Description'],
                organization: org!._id!,
                priority: ticket['Ticket Priority'],
                externalId: ticketId,
                createdAt: createdAt,
                updatedAt: createdAt,
                channel,
                customerId,
                status: ticket['Ticket Status'],
                tags: [ticket['Product Purchased']],
                satisfactionRating: ticket['Customer Satisfaction Rating'],
                comments: [],
                chatHistory: [],
            });
        });

        // Insert into Qdrant instead of Elasticsearch
        await qdrantService.bulkInsert({ 
            collectionName: ticketCollectionConfig.name, 
            points: qdrantPoints 
        });
        await TicketModel.insertMany(tickets);

        console.log(`Batch ${batchIndex + 1} processed and inserted to Qdrant and MongoDB.`);
    }

    return {
        status: 200,
        payload: `Successfully loaded ${stub.length} tickets to Qdrant and MongoDB in ${totalBatches} batches.`,
    };
}
export async function loadStubData3(): Promise<IResponse<any>> {
    const stub = await csvtojson().fromFile(path.join(__dirname, 'stub3.csv'));
    const org = await getDemoOrganization();
    const BATCH_SIZE = 300;
    const EMBEDDING_CHUNK_SIZE = 50;

    const totalBatches = Math.ceil(stub.length / BATCH_SIZE);
    const qdrantService = new QdrantService();

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const start = batchIndex * BATCH_SIZE;
        const end = start + BATCH_SIZE;
        const batch = stub.slice(start, end);

        console.log(`Processing batch ${batchIndex + 1} of ${totalBatches} (${batch.length} tickets)`);
        const dataForEmbedding: Partial<ITicket>[] = batch.map((ticket: any) => ({
            subject: '', // no subject in this stub
            description: ticket['instruction'],
        }));

        const embeddingChunks = chunk(dataForEmbedding, EMBEDDING_CHUNK_SIZE);
        let embeddings: number[][] = [];

        for (const [i, chunkData] of embeddingChunks.entries()) {
            console.log(`Embedding chunk ${i + 1} of ${embeddingChunks.length}...`);
            await sleep(5000);
            const embeddingsChunk: [number[]] = await getSBERTEmbedding(chunkData);
            embeddings = embeddings.concat(embeddingsChunk);
        }

        const qdrantPoints: QdrantTicketPoint[] = [];
        const tickets: ITicket[] = [];

        batch.forEach((ticket: any, index: number) => {
            const customerId = faker.string.uuid();
            const description = ticket['instruction'];
            const sentiment = analyzeSentiment(description);
            const channel = faker.helpers.arrayElement(['email', 'web', 'api', 'whatsapp']);
            const priority = faker.helpers.arrayElement(['low', 'medium', 'high']);
            const status = faker.helpers.arrayElement(['new', 'open', 'pending', 'hold', 'solved', 'closed']);
            const createdAt = faker.date.recent().toISOString();
            const intent = ticket['intent'];
            const ticketId = faker.string.uuid();
            const response = ticket['response'];
            const subject = '';
            if (!subject) {
                return;
            }
            
            // Prepare data for Qdrant
            qdrantPoints.push({
                id: ticketId,
                vector: embeddings[index],
                payload: {
                    ticket_id: ticketId,
                    intent,
                    organization: org!._id!.toString(),
                    sentiment_score: sentiment.score,
                    sentiment: sentiment.sentiment,
                    created_at: createdAt,
                    tags: [intent]
                }
            });

            tickets.push({
                subject,
                description: description,
                organization: org!._id!,
                priority,
                externalId: ticketId,
                createdAt: createdAt,
                updatedAt: createdAt,
                channel,
                customerId,
                status,
                tags: [intent],
                satisfactionRating: 5,
                comments: [response],
                chatHistory: [],
            });
        });

        // Insert into Qdrant instead of Elasticsearch
        await qdrantService.bulkInsert({ 
            collectionName: ticketCollectionConfig.name, 
            points: qdrantPoints 
        });
        // await TicketModel.insertMany(tickets);
        await createDemoZendeskTickets(tickets);
        console.log(`Batch ${batchIndex + 1} processed and inserted to Qdrant and MongoDB.`);
    }

    return {
        status: 200,
        payload: `Successfully loaded ${stub.length} tickets to Qdrant and MongoDB in ${totalBatches} batches.`,
    };
}
export async function trainModel(params: {
    useStub?: boolean;
    maxPages?: number;
    perPage?: number;
    fromPage?: number;
}): Promise<IResponse<any>> {
    const { maxPages = 100, perPage = 100, fromPage = 1 } = params;
    console.log(`Starting model training with maxPages: ${maxPages}, perPage: ${perPage}`);

    const BATCH_SIZE = 5;
    const qdrantService = new QdrantService();

    try {
        for (let pageStart = fromPage; pageStart <= fromPage + maxPages - 1; pageStart += BATCH_SIZE) {
            const currentBatchEnd = Math.min(pageStart + BATCH_SIZE - 1, fromPage + maxPages - 1);
            console.log(`Fetching pages ${pageStart} to ${currentBatchEnd}...`);

            const ticketsResponse = await fetchTickets({
                maxPages: currentBatchEnd - pageStart + 1,
                perPage,
                fromPage: pageStart,
            });

            if (!ticketsResponse.payload || ticketsResponse.payload.length === 0) {
                console.log(`No tickets found in pages ${pageStart} to ${currentBatchEnd}. Skipping...`);
                continue;
            }

            console.log(`Fetched ${ticketsResponse.payload.length} tickets.`);

            const ticketChunks = chunk(ticketsResponse.payload, 50);

            for (const [i, chunk] of ticketChunks.entries()) {
                console.log(`Processing chunk ${i + 1} of ${ticketChunks.length}...`);

                const [embeddings] = await Promise.all([
                    getSBERTEmbedding(chunk),
                    // summarizeTickets(chunk),
                ]);

                const qdrantPoints: QdrantTicketPoint[] = chunk.map((t: ITicket, index) => {
                    const sentiment = analyzeSentiment(t.subject + ' ' + t.description);
                    return {
                        id: t._id?.toString() || faker.string.uuid(),
                        vector: embeddings[index],
                        payload: {
                            ticket_id: t._id?.toString() || '',
                            subject: t.subject,
                            description: t.description,
                            organization: t.organization.toString(),
                            sentiment_score: sentiment.score,
                            sentiment: sentiment.sentiment,
                            customer_id: t.customerId,
                            created_at: t.createdAt,
                            channel: t.channel,
                            status: t.status,
                            tags: t.tags
                        }
                    };
                });

                // Insert into Qdrant instead of Elasticsearch
                await qdrantService.bulkInsert({ 
                    collectionName: ticketCollectionConfig.name, 
                    points: qdrantPoints 
                });
                console.log(`✅ Finished loading ${qdrantPoints.length} tickets to Qdrant.`);
            }
        }

        console.log(`🎉 Model training completed successfully.`);
        return {
            status: 200,
            payload: {
                message: 'Model trained successfully',
            },
        };

    } catch (error: any) {
        console.error("❌ Error during model training:", error.message);
        return {
            status: 500,
            payload: {
                message: 'Model training failed',
                error: error.message,
            },
        };
    }
}
