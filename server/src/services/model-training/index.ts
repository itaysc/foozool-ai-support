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
import { ProcessedStubModel } from '../../schemas/processed-stub.schema';

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

export async function loadStubData(): Promise<IResponse<any>> {
    const stub = await csvtojson().fromFile(path.join(__dirname, 'stub2.csv'));
    const org = await getDemoOrganization();
    const BATCH_SIZE = 100;
    const EMBEDDING_CHUNK_SIZE = 5;

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
        const qdrantPoints: QdrantTicketPoint[] = [];
        const tickets: ITicket[] = [];
        let currentEmbeddingIndex = 0;

        // Process each embedding chunk and immediately create points
        for (const [i, chunkData] of embeddingChunks.entries()) {
            console.log(`Embedding chunk ${i + 1} of ${embeddingChunks.length}...`);
            const embeddingsChunk: [number[]] = await getSBERTEmbedding(chunkData);
            
            // Process this chunk's data immediately
            for (let j = 0; j < chunkData.length; j++) {
                const ticket = batch[currentEmbeddingIndex + j];
                const customerId = faker.string.uuid();
                const sentiment = analyzeSentiment(ticket['Ticket Subject'] + ' ' + ticket['Ticket Description']);
                const channel = ticket['Ticket Channel'];
                const createdAt = faker.date.recent().toISOString();
                const ticketId = faker.string.uuid();
                const subject = ticket['Ticket Subject'];
                
                if (!subject) {
                    continue;
                }

                // Create Qdrant point
                qdrantPoints.push({
                    id: ticketId,
                    vector: embeddingsChunk[j],
                    payload: {
                        ticket_id: ticketId,
                        organization: org!._id!.toString(),
                        sentiment_score: sentiment.score,
                        sentiment: sentiment.sentiment,
                        created_at: createdAt,
                        tags: [ticket['Product Purchased']]
                    }
                });

                // Create ticket
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
            }

            currentEmbeddingIndex += chunkData.length;

            // Insert this chunk's data immediately
            if (qdrantPoints.length >= 50) {
                await qdrantService.bulkInsert({ 
                    collectionName: ticketCollectionConfig.name, 
                    points: qdrantPoints 
                });
                // await TicketModel.insertMany(tickets);
                console.log(`Inserted ${qdrantPoints.length} points to Qdrant and MongoDB`);
                
                // Clear arrays after insertion
                qdrantPoints.length = 0;
                tickets.length = 0;
            }

            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }
        }

        // Insert any remaining points
        if (qdrantPoints.length > 0) {
            await qdrantService.bulkInsert({ 
                collectionName: ticketCollectionConfig.name, 
                points: qdrantPoints 
            });
            // await TicketModel.insertMany(tickets);
            console.log(`Inserted remaining ${qdrantPoints.length} points to Qdrant and MongoDB`);
        }

        console.log(`Batch ${batchIndex + 1} processed and inserted to Qdrant and MongoDB.`);
        
        // Force garbage collection if available
        if (global.gc) {
            global.gc();
        }
    }

    return {
        status: 200,
        payload: `Successfully loaded ${stub.length} tickets to Qdrant and MongoDB in ${totalBatches} batches.`,
    };
}

function generateStubId(stubType: string, item: any, index: number): string {
    // Create a unique ID based on the content and index to ensure uniqueness
    const content = item.instruction || item['Ticket Description'];
    const baseId = `${stubType}-${Buffer.from(content).toString('base64').slice(0, 32)}`;
    return `${baseId}-${index}`;
}

export async function loadStubData3(): Promise<IResponse<any>> {
    const stub = await csvtojson().fromFile(path.join(__dirname, 'stub3.csv'));
    const org = await getDemoOrganization();
    const BATCH_SIZE = 100;
    const EMBEDDING_CHUNK_SIZE = 10;
    const STUB_TYPE = 'stub3';

    // Get already processed items
    const processedItems = await ProcessedStubModel.find({ 
        stubType: STUB_TYPE,
        status: 'success'
    }).select('stubId').lean();
    
    const processedIds = new Set(processedItems.map(item => item.stubId));
    
    // Filter out already processed items
    const unprocessedStub = stub.filter((item, index) => {
        const stubId = generateStubId(STUB_TYPE, item, index);
        return !processedIds.has(stubId);
    });

    console.log(`Found ${stub.length} total items, ${unprocessedStub.length} unprocessed items`);

    if (unprocessedStub.length === 0) {
        return {
            status: 200,
            payload: 'All items have already been processed.',
        };
    }

    const totalBatches = Math.ceil(unprocessedStub.length / BATCH_SIZE);
    const qdrantService = new QdrantService();
    let processedCount = 0;
    let failedCount = 0;

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const start = batchIndex * BATCH_SIZE;
        const end = start + BATCH_SIZE;
        const batch = unprocessedStub.slice(start, end);

        console.log(`Processing batch ${batchIndex + 1} of ${totalBatches} (${batch.length} tickets)`);
        
        const dataForEmbedding: Partial<ITicket>[] = batch.map((ticket: any) => ({
            subject: '',
            description: ticket['instruction'],
        }));

        const embeddingChunks = chunk(dataForEmbedding, EMBEDDING_CHUNK_SIZE);
        const qdrantPoints: QdrantTicketPoint[] = [];
        const tickets: ITicket[] = [];
        const processingStatus: { stubId: string; status: 'success' | 'failed'; error?: string }[] = [];
        let currentEmbeddingIndex = 0;

        try {
            for (const [i, chunkData] of embeddingChunks.entries()) {
                console.log(`Embedding chunk ${i + 1} of ${embeddingChunks.length}...`);
                await sleep(7000);
                const embeddingsChunk: [number[]] = await getSBERTEmbedding(chunkData);
                
                // Process this chunk's data immediately
                for (let j = 0; j < chunkData.length; j++) {
                    const globalIndex = start + currentEmbeddingIndex + j;
                    const ticket = batch[currentEmbeddingIndex + j];
                    const stubId = generateStubId(STUB_TYPE, ticket, globalIndex);
                    
                    try {
                        const customerId = faker.string.uuid();
                        const description = ticket['instruction'];
                        const sentiment = analyzeSentiment(description);
                        const channel = faker.helpers.arrayElement(['email', 'web', 'api', 'whatsapp']);
                        const priority = faker.helpers.arrayElement(['low', 'medium', 'high']);
                        const status = faker.helpers.arrayElement(['new', 'open', 'pending']);
                        const createdAt = faker.date.recent().toISOString();
                        const intent = ticket['intent'];
                        const ticketId = faker.string.uuid();
                        const response = ticket['response'];

                        // Create Qdrant point
                        qdrantPoints.push({
                            id: ticketId,
                            vector: embeddingsChunk[j],
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

                        // Create ticket
                        tickets.push({
                            subject: '',
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

                        processingStatus.push({ stubId, status: 'success' });
                    } catch (error) {
                        console.error(`Error processing item ${stubId}:`, error);
                        processingStatus.push({ 
                            stubId, 
                            status: 'failed', 
                            error: error instanceof Error ? error.message : 'Unknown error' 
                        });
                    }
                }

                currentEmbeddingIndex += chunkData.length;

                // Insert this chunk's data immediately
                if (qdrantPoints.length >= 50) {
                    await qdrantService.bulkInsert({ 
                        collectionName: ticketCollectionConfig.name, 
                        points: qdrantPoints 
                    });
                    await createDemoZendeskTickets(tickets);
                    
                    // Record processing status using updateOne with upsert
                    await Promise.all(processingStatus.map(status => 
                        ProcessedStubModel.updateOne(
                            { stubId: status.stubId },
                            {
                                $set: {
                                    stubType: STUB_TYPE,
                                    status: status.status,
                                    error: status.error,
                                    metadata: {
                                        description: batch[currentEmbeddingIndex - qdrantPoints.length + processingStatus.findIndex(s => s.stubId === status.stubId)]['instruction'],
                                        intent: batch[currentEmbeddingIndex - qdrantPoints.length + processingStatus.findIndex(s => s.stubId === status.stubId)]['intent']
                                    }
                                }
                            },
                            { upsert: true }
                        )
                    ));

                    console.log(`Inserted ${qdrantPoints.length} points to Qdrant and Zendesk`);
                    
                    // Update counters
                    processedCount += processingStatus.filter(s => s.status === 'success').length;
                    failedCount += processingStatus.filter(s => s.status === 'failed').length;
                    
                    // Clear arrays
                    qdrantPoints.length = 0;
                    tickets.length = 0;
                    processingStatus.length = 0;
                }

                if (global.gc) {
                    global.gc();
                }
            }

            // Insert any remaining points
            if (qdrantPoints.length > 0) {
                await qdrantService.bulkInsert({ 
                    collectionName: ticketCollectionConfig.name, 
                    points: qdrantPoints 
                });
                await createDemoZendeskTickets(tickets);
                
                // Record remaining processing status using updateOne with upsert
                await Promise.all(processingStatus.map(status => 
                    ProcessedStubModel.updateOne(
                        { stubId: status.stubId },
                        {
                            $set: {
                                stubType: STUB_TYPE,
                                status: status.status,
                                error: status.error,
                                metadata: {
                                    description: batch[currentEmbeddingIndex - qdrantPoints.length + processingStatus.findIndex(s => s.stubId === status.stubId)]['instruction'],
                                    intent: batch[currentEmbeddingIndex - qdrantPoints.length + processingStatus.findIndex(s => s.stubId === status.stubId)]['intent']
                                }
                            }
                        },
                        { upsert: true }
                    )
                ));

                console.log(`Inserted remaining ${qdrantPoints.length} points to Qdrant and Zendesk`);
                
                // Update counters
                processedCount += processingStatus.filter(s => s.status === 'success').length;
                failedCount += processingStatus.filter(s => s.status === 'failed').length;
            }

            console.log(`Batch ${batchIndex + 1} processed. Success: ${processedCount}, Failed: ${failedCount}`);
            
            if (global.gc) {
                global.gc();
            }
        } catch (error) {
            console.error(`Error processing batch ${batchIndex + 1}:`, error);
            // Record failed status for all items in this batch using updateOne with upsert
            await Promise.all(batch.map((item, index) => 
                ProcessedStubModel.updateOne(
                    { stubId: generateStubId(STUB_TYPE, item, start + index) },
                    {
                        $set: {
                            stubType: STUB_TYPE,
                            status: 'failed',
                            error: error instanceof Error ? error.message : 'Batch processing failed',
                            metadata: {
                                description: item.instruction,
                                intent: item.intent
                            }
                        }
                    },
                    { upsert: true }
                )
            ));
            failedCount += batch.length;
        }
    }

    return {
        status: 200,
        payload: `Processing completed. Successfully processed: ${processedCount}, Failed: ${failedCount}, Skipped: ${stub.length - unprocessedStub.length}`,
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
