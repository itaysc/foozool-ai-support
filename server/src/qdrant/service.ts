import { QdrantClient } from '@qdrant/js-client-rest';
import Config from '../config';
import { getDriveFileContent, getDriveFileMetadata } from '../services/google/drive';
import { getSBERTEmbeddingForText } from '../services/call-python';
import { googleFileCollectionConfig, QdrantGoogleFilePoint, chunkTypeScoreThresholds } from './schemas/googleFile';
import { ticketCollectionConfig, QdrantTicketPoint } from './schemas/ticket';
import { v5 as uuidv5 } from 'uuid';
import { parseTextIntoChunks } from '../services/google/parse';
import { QDRANT_POINT_NAMESPACE } from './utils';

type CreateCollectionStatus = 'created' | 'alreadyExists' | 'error';

const client = new QdrantClient({
    url: Config.QDRANT_API_URL,
    apiKey: Config.QDRANT_API_KEY,
});

export const qdrantClient = client;

class QdrantService {
    client: QdrantClient;
    
    constructor() {
        this.client = qdrantClient;
    }

    /**
     * Create a new collection (index) in Qdrant
     */
    async createCollection({ 
        collectionName, 
        vectorSize, 
        distance = 'Cosine' 
    }: { 
        collectionName: string; 
        vectorSize: number; 
        distance?: 'Cosine' | 'Dot' | 'Euclid' 
    }): Promise<CreateCollectionStatus> {
        try {
            // First check if collection already exists
            const collections = await this.client.getCollections();
            const existingCollection = collections.collections.find(
                collection => collection.name === collectionName
            );
            
            if (existingCollection) {
                console.log(`Collection "${collectionName}" already exists.`);
                return 'alreadyExists';
            }
            
            // Create collection only if it doesn't exist
            await this.client.createCollection(collectionName, {
                vectors: {
                    size: vectorSize,
                    distance,
                },
            });
            console.log(`Collection "${collectionName}" created successfully.`);
            return 'created';
        } catch (error: any) {
            console.error(`Error creating collection "${collectionName}":`, error);
            return 'error';
        }
    }

    /**
     * Delete a collection (index) from Qdrant
     */
    async deleteCollection({ collectionName }: { collectionName: string }): Promise<boolean> {
        try {
            await this.client.deleteCollection(collectionName);
            console.log(`Collection "${collectionName}" deleted successfully.`);
            return true;
        } catch (error: any) {
            console.error(`Error deleting collection "${collectionName}":`, error);
            return false;
        }
    }

    /**
     * Insert bulk vectors into a collection
     */
    async bulkInsert({ 
        collectionName, 
        points 
    }: { 
        collectionName: string; 
        points: Array<{
            id: string | number;
            vector: number[];
            payload?: Record<string, any>;
        }>;
    }): Promise<boolean> {
        try {
            await this.client.upsert(collectionName, {
                wait: true,
                points,
            });
            console.log(`Successfully inserted ${points.length} points into collection "${collectionName}".`);
            return true;
        } catch (error: any) {
            console.error(`Error inserting points into collection "${collectionName}":`, error);
            return false;
        }
    }

    /**
     * Insert a single ticket into the tickets collection
     */
    async addSingleTicket(point: QdrantTicketPoint): Promise<boolean> {
        try {
            await this.client.upsert(ticketCollectionConfig.name, {
                wait: true,
                points: [point],
            });
            console.log(`Successfully inserted ticket ${point.id} into collection "${ticketCollectionConfig.name}".`);
            return true;
        } catch (error: any) {
            console.error(`Error inserting ticket ${point.id} into collection "${ticketCollectionConfig.name}":`, error);
            return false;
        }
    }

    /**
     * Update an existing ticket point in the tickets collection
     */
    async updateTicketPoint(pointId: string | number, updates: Partial<QdrantTicketPoint['payload']>): Promise<boolean> {
        try {
            // First get the existing point to preserve the vector and other fields
            const existingPoint = await this.client.retrieve(ticketCollectionConfig.name, {
                ids: [pointId],
                with_payload: true,
                with_vector: true,
            });

            // The retrieve method returns an array of points, so we need to access the first one
            const points = (existingPoint as any).points || [];
            if (points.length === 0) {
                console.error(`Ticket point ${pointId} not found in collection "${ticketCollectionConfig.name}"`);
                return false;
            }

            const existing = points[0];
            
            // Merge existing payload with updates
            const updatedPayload = {
                ...existing.payload,
                ...updates,
            };

            // Create updated point
            const updatedPoint = {
                id: pointId,
                vector: existing.vector as number[],
                payload: updatedPayload,
            };

            // Upsert the updated point
            await this.client.upsert(ticketCollectionConfig.name, {
                wait: true,
                points: [updatedPoint],
            });

            console.log(`Successfully updated ticket ${pointId} in collection "${ticketCollectionConfig.name}".`);
            return true;
        } catch (error: any) {
            console.error(`Error updating ticket ${pointId} in collection "${ticketCollectionConfig.name}":`, error);
            return false;
        }
    }

    /**
     * Perform KNN search on a collection
     */
    async knnSearch({ 
        collectionName, 
        queryVector, 
        limit = 5,
        filter,
        withPayload = true,
        scoreThreshold 
    }: { 
        collectionName: string; 
        queryVector: number[]; 
        limit?: number;
        filter?: Record<string, any>;
        withPayload?: boolean;
        scoreThreshold?: number;
    }): Promise<any[]> {
        try {
            const searchResult = await this.client.search(collectionName, {
                vector: queryVector,
                limit,
                filter,
                with_payload: withPayload,
                score_threshold: scoreThreshold,
                with_vector: true,
            });
            
            console.log(`KNN search returned ${searchResult.length} results from collection "${collectionName}".`);
            return searchResult;
        } catch (error: any) {
            console.error(`Error performing KNN search on collection "${collectionName}":`, error);
            return [];
        }
    }

    /**
     * Get recent vectors filtered by organization and date
     */
    async getRecentVectors({ 
        organizationId, 
        createdAfter,
        limit = 1000 
    }: { 
        organizationId: string; 
        createdAfter: Date;
        limit?: number;
    }): Promise<Array<{ vector: number[]; payload: any }>> {
        try {
            // Create filter for organization and date range
            const filter = {
                must: [
                    {
                        key: 'organization',
                        match: { value: organizationId }
                    },
                    {
                        key: 'created_at',
                        range: {
                            gte: createdAfter.getTime()
                        }
                    }
                ]
            };

            // Use scroll to get all vectors matching the filter
            let offset = 0;
            const batchSize = 100;
            const allVectors: Array<{ vector: number[]; payload: any }> = [];

            while (allVectors.length < limit) {
                const searchResult = await this.client.scroll(ticketCollectionConfig.name, {
                    filter,
                    limit: Math.min(batchSize, limit - allVectors.length),
                    offset,
                    with_payload: true,
                    with_vector: true,
                });

                if (!searchResult.points || searchResult.points.length === 0) {
                    break;
                }

                for (const point of searchResult.points) {
                    allVectors.push({
                        vector: point.vector as number[],
                        payload: point.payload
                    });
                }

                offset += batchSize;
            }

            console.log(`Retrieved ${allVectors.length} recent vectors for organization ${organizationId}`);
            return allVectors;
        } catch (error: any) {
            console.error(`Error getting recent vectors for organization ${organizationId}:`, error);
            return [];
        }
    }

    /**
     * Search tickets by customer ID
     */
    async searchTicketsByCustomer(customerId: string, limit = 50): Promise<any[]> {
        try {
            const result = await this.client.scroll(ticketCollectionConfig.name, {
                filter: {
                    must: [
                        {
                            key: 'customer_id',
                            match: { value: customerId }
                        }
                    ]
                },
                limit,
                with_payload: true,
                with_vector: false
            });

            return result.points || [];
        } catch (error: any) {
            console.error(`Error searching tickets for customer ${customerId}:`, error);
            return [];
        }
    }

    /**
     * Get ticket statistics for a customer
     */
    async getCustomerTicketStats(customerId: string): Promise<{
        totalTickets: number;
        avgSentiment: number;
        sentimentBreakdown: { [key: string]: number };
        recentTickets: any[];
    }> {
        try {
            const tickets = await this.searchTicketsByCustomer(customerId, 1000);
            
            const totalTickets = tickets.length;
            const sentiments = tickets.map(t => t.payload.sentiment).filter(Boolean);
            const sentimentScores = tickets.map(t => t.payload.sentiment_score).filter(score => typeof score === 'number');
            
            const avgSentiment = sentimentScores.length > 0 
                ? sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length 
                : 0;

            const sentimentBreakdown = sentiments.reduce((acc, sentiment) => {
                acc[sentiment] = (acc[sentiment] || 0) + 1;
                return acc;
            }, {} as { [key: string]: number });

            // Get recent tickets (last 10)
            const recentTickets = tickets
                .sort((a, b) => b.payload.created_at - a.payload.created_at)
                .slice(0, 10)
                .map(ticket => ({
                    ticket_id: ticket.payload.ticket_id,
                    subject: ticket.payload.subject || 'No subject',
                    sentiment: ticket.payload.sentiment,
                    sentiment_score: ticket.payload.sentiment_score,
                    created_at: ticket.payload.created_at,
                    status: ticket.payload.status || 'unknown'
                }));

            return {
                totalTickets,
                avgSentiment,
                sentimentBreakdown,
                recentTickets
            };
        } catch (error: any) {
            console.error(`Error getting ticket stats for customer ${customerId}:`, error);
            return {
                totalTickets: 0,
                avgSentiment: 0,
                sentimentBreakdown: {},
                recentTickets: []
            };
        }
    }
}

export default QdrantService; 

/**
 * Process Google Drive files and store them in Qdrant
 */
export async function processGoogleDriveFiles({
    organizationId,
    fileIds
}: {
    organizationId: string;
    fileIds: string[];
}): Promise<{
    success: boolean;
    processedFiles: number;
    totalChunks: number;
    errors: string[];
    processingStats: {
        averageQualityScore: number;
        averageVectorMagnitude: number;
        totalProcessingTime: number;
        fileTypeDistribution: Record<string, number>;
        chunkTypeDistribution: Record<string, number>;
    };
}> {
    const qdrantService = new QdrantService();
    const errors: string[] = [];
    let processedFiles = 0;
    let totalChunks = 0;
    const startTime = Date.now();
    
    // Statistics tracking
    let totalQualityScore = 0;
    let totalVectorMagnitude = 0;
    const fileTypeDistribution: Record<string, number> = {};
    const chunkTypeDistribution: Record<string, number> = {};

    try {
        // Create the Google files collection if it doesn't exist
        const collectionStatus = await qdrantService.createCollection({
            collectionName: googleFileCollectionConfig.name,
            vectorSize: googleFileCollectionConfig.vectorConfig.size,
            distance: googleFileCollectionConfig.vectorConfig.distance,
        });

        if (collectionStatus === 'error') {
            throw new Error('Failed to create Google files collection in Qdrant');
        }

        console.log(`Processing ${fileIds.length} Google Drive files for organization ${organizationId}`);

        for (const fileId of fileIds) {
            try {
                console.log(`Processing file ${fileId}...`);

                // Get file metadata
                const fileMetadata = await getDriveFileMetadata(organizationId, fileId);
                if (!fileMetadata) {
                    errors.push(`Failed to get metadata for file ${fileId}`);
                    continue;
                }

                // Get file content
                const fileContent = await getDriveFileContent(organizationId, fileId);
                if (!fileContent) {
                    errors.push(`Failed to get content for file ${fileId}`);
                    continue;
                }

                // Convert content to string if it's not already
                const contentString = typeof fileContent === 'string' 
                    ? fileContent 
                    : JSON.stringify(fileContent);

                // Determine file type
                const fileType = fileMetadata.mimeType || 'text/plain'; // getFileType is removed, so we'll use mimeType directly
                fileTypeDistribution[fileType] = (fileTypeDistribution[fileType] || 0) + 1;

                // Parse content into chunks
                const chunks = parseTextIntoChunks(contentString, fileMetadata.name || 'Unknown', fileType);
                console.log(`Parsed file ${fileId} into ${chunks.length} chunks`);

                if (chunks.length === 0) {
                    console.log(`No chunks found for file ${fileId}, skipping`);
                    continue;
                }

                // Extract text content for embedding
                const textContents = chunks.map(chunk => chunk.content);

                // Get embeddings for all chunks
                const embeddings = await getSBERTEmbeddingForText(textContents);
                console.log(`Generated ${embeddings.length} embeddings for file ${fileId}`);

                if (embeddings.length !== chunks.length) {
                    errors.push(`Embedding count mismatch for file ${fileId}: expected ${chunks.length}, got ${embeddings.length}`);
                    continue;
                }

                // Calculate vector statistics
                for (const embedding of embeddings) {
                    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
                    totalVectorMagnitude += magnitude;
                }

                // Prepare points for Qdrant with enhanced metadata
                const points: QdrantGoogleFilePoint[] = chunks.map((chunk, index) => {
                    // Update chunk type distribution
                    chunkTypeDistribution[chunk.type] = (chunkTypeDistribution[chunk.type] || 0) + 1;
                    
                    // Accumulate quality scores
                    totalQualityScore += chunk.qualityScore;

                    return {
                        id: uuidv5(`${fileId}_${chunk.index}`, QDRANT_POINT_NAMESPACE),
                        vector: embeddings[index],
                        payload: {
                            file_id: fileId,
                            file_name: fileMetadata.name || 'Unknown',
                            organization_id: organizationId,
                            chunk_type: chunk.type,
                            chunk_index: chunk.index,
                            chunk_length: chunk.length,
                            chunk_word_count: chunk.wordCount,
                            mime_type: fileMetadata.mimeType || 'text/plain',
                            file_type: fileType,
                            created_at: fileMetadata.createdTime ? new Date(fileMetadata.createdTime).getTime() : Date.now(),
                            modified_time: fileMetadata.modifiedTime || new Date().toISOString(),
                            processing_timestamp: new Date().toISOString(),
                            embedding_quality_score: chunk.qualityScore,
                            source: 'google',
                            file_url: `https://drive.google.com/file/d/${fileId}/view`,
                        }
                    };
                });

                // Insert points into Qdrant
                const insertSuccess = await qdrantService.bulkInsert({
                    collectionName: googleFileCollectionConfig.name,
                    points: points
                });

                if (insertSuccess) {
                    console.log(`Successfully stored ${points.length} chunks for file ${fileId} in Qdrant`);
                    processedFiles++;
                    totalChunks += points.length;
                } else {
                    errors.push(`Failed to insert chunks for file ${fileId} into Qdrant`);
                }

            } catch (error: any) {
                const errorMessage = `Error processing file ${fileId}: ${error.message}`;
                console.error(errorMessage);
                errors.push(errorMessage);
            }
        }

        const totalProcessingTime = Date.now() - startTime;
        const averageQualityScore = totalChunks > 0 ? totalQualityScore / totalChunks : 0;
        const averageVectorMagnitude = totalChunks > 0 ? totalVectorMagnitude / totalChunks : 0;

        console.log(`Google Drive processing completed. Processed ${processedFiles} files, ${totalChunks} total chunks.`);
        console.log(`Average quality score: ${averageQualityScore.toFixed(3)}`);
        console.log(`Average vector magnitude: ${averageVectorMagnitude.toFixed(3)}`);
        console.log(`Total processing time: ${totalProcessingTime}ms`);
        
        return {
            success: processedFiles > 0,
            processedFiles,
            totalChunks,
            errors,
            processingStats: {
                averageQualityScore,
                averageVectorMagnitude,
                totalProcessingTime,
                fileTypeDistribution,
                chunkTypeDistribution
            }
        };

    } catch (error: any) {
        console.error('Error in processGoogleDriveFiles:', error);
        return {
            success: false,
            processedFiles,
            totalChunks,
            errors: [...errors, `General error: ${error.message}`],
            processingStats: {
                averageQualityScore: 0,
                averageVectorMagnitude: 0,
                totalProcessingTime: Date.now() - startTime,
                fileTypeDistribution: {},
                chunkTypeDistribution: {}
            }
        };
    }
}

/**
 * Search Google Drive files in Qdrant with adaptive thresholds
 */
export async function searchGoogleDriveFiles({
    organizationId,
    queryVector,
    limit = 10,
    chunkType,
    fileId,
    fileType,
    minQualityScore = 0.5
}: {
    organizationId: string;
    queryVector: number[];
    limit?: number;
    chunkType?: string;
    fileId?: string;
    fileType?: string;
    minQualityScore?: number;
}): Promise<any[]> {
    const qdrantService = new QdrantService();
    
    // Build filter based on parameters
    let filter: Record<string, any> = {
        must: [
            {
                key: 'organization_id',
                match: { value: organizationId }
            }
        ]
    };

    if (chunkType) {
        filter.must.push({
            key: 'chunk_type',
            match: { value: chunkType }
        });
    }

    if (fileId) {
        filter.must.push({
            key: 'file_id',
            match: { value: fileId }
        });
    }

    if (fileType) {
        filter.must.push({
            key: 'file_type',
            match: { value: fileType }
        });
    }

    if (minQualityScore > 0) {
        filter.must.push({
            key: 'embedding_quality_score',
            range: { gte: minQualityScore }
        });
    }

    // Use adaptive score threshold based on chunk type
    let scoreThreshold = 0.7; // Default
    if (chunkType && chunkType in chunkTypeScoreThresholds) {
        scoreThreshold = chunkTypeScoreThresholds[chunkType as keyof typeof chunkTypeScoreThresholds];
    }

    return await qdrantService.knnSearch({
        collectionName: googleFileCollectionConfig.name,
        queryVector,
        limit,
        filter,
        withPayload: true,
        scoreThreshold
    });
} 

/**
 * Get all file_ids in the google_files collection for a given organization
 */
export async function getProcessedGoogleFileIds(organizationId: string): Promise<string[]> {
    const qdrantService = new QdrantService();
    let page = 1;
    const pageSize = 1000;
    let allIds: string[] = [];
    let hasMore = true;
    while (hasMore) {
        const result = await qdrantService.client.scroll(googleFileCollectionConfig.name, {
            limit: pageSize,
            offset: (page - 1) * pageSize,
            with_payload: true,
            filter: {
                must: [
                    { key: 'organization_id', match: { value: organizationId } }
                ]
            },
            with_vector: false,
        });
        const ids = (result.points || []).map((pt: any) => pt.payload?.file_id).filter(Boolean);
        allIds = allIds.concat(ids);
        hasMore = (result.points || []).length === pageSize;
        page++;
    }
    return Array.from(new Set(allIds));
} 