import { QdrantClient } from '@qdrant/js-client-rest';
import Config from '../../config';

export type CreateCollectionStatus = 'created' | 'alreadyExists' | 'error';

/**
 * Base Qdrant service class with common functionality
 */
export class QdrantService {
    public client: QdrantClient;
    
    constructor() {
        this.client = new QdrantClient({
            url: Config.QDRANT_API_URL,
            apiKey: Config.QDRANT_API_KEY,
        });
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
            
            // Create the collection
            await this.client.createCollection(collectionName, {
                vectors: {
                    size: vectorSize,
                    distance: distance
                }
            });
            
            console.log(`Collection "${collectionName}" created successfully.`);
            return 'created';
            
        } catch (error) {
            console.error(`Error creating collection "${collectionName}":`, error);
            return 'error';
        }
    }

    /**
     * Delete a collection from Qdrant
     */
    async deleteCollection(collectionName: string): Promise<boolean> {
        try {
            await this.client.deleteCollection(collectionName);
            console.log(`Collection "${collectionName}" deleted successfully.`);
            return true;
        } catch (error) {
            console.error(`Error deleting collection "${collectionName}":`, error);
            return false;
        }
    }

    /**
     * Check if a collection exists
     */
    async collectionExists(collectionName: string): Promise<boolean> {
        try {
            const collections = await this.client.getCollections();
            return collections.collections.some(collection => collection.name === collectionName);
        } catch (error) {
            console.error(`Error checking collection existence "${collectionName}":`, error);
            return false;
        }
    }

    /**
     * Get collection info
     */
    async getCollectionInfo(collectionName: string): Promise<any> {
        try {
            return await this.client.getCollection(collectionName);
        } catch (error) {
            console.error(`Error getting collection info "${collectionName}":`, error);
            return null;
        }
    }

    /**
     * Perform KNN search
     */
    async knnSearch({
        collectionName,
        queryVector,
        limit = 10,
        filter,
        withPayload = true,
        withVector = false,
        scoreThreshold = 0.0
    }: {
        collectionName: string;
        queryVector: number[];
        limit?: number;
        filter?: any;
        withPayload?: boolean;
        withVector?: boolean;
        scoreThreshold?: number;
    }): Promise<any[]> {
        try {
            const result = await this.client.search(collectionName, {
                vector: queryVector,
                limit,
                filter,
                with_payload: withPayload,
                with_vector: withVector,
                score_threshold: scoreThreshold
            });
            
            return result;
        } catch (error) {
            console.error(`Error performing KNN search on collection "${collectionName}":`, error);
            throw error;
        }
    }

    /**
     * Scroll through collection points
     */
    async scrollCollection({
        collectionName,
        limit = 100,
        offset = 0,
        filter,
        withPayload = true,
        withVector = false
    }: {
        collectionName: string;
        limit?: number;
        offset?: number;
        filter?: any;
        withPayload?: boolean;
        withVector?: boolean;
    }): Promise<any> {
        try {
            return await this.client.scroll(collectionName, {
                limit,
                offset,
                filter,
                with_payload: withPayload,
                with_vector: withVector
            });
        } catch (error) {
            console.error(`Error scrolling collection "${collectionName}":`, error);
            throw error;
        }
    }

    /**
     * Retrieve points from collection
     */
    async retrievePoints(collectionName: string, pointIds: string[], withPayload: boolean = true): Promise<any[]> {
        try {
            const result = await this.client.retrieve(collectionName, {
                ids: pointIds,
                with_payload: withPayload
            });
            return result || [];
        } catch (error) {
            console.error(`Error retrieving points from collection "${collectionName}":`, error);
            throw error;
        }
    }

    /**
     * Bulk insert points to collection
     */
    async bulkInsert(params: { collectionName: string; points: any[] } | string, points?: any[]): Promise<boolean> {
        try {
            let collectionName: string;
            let pointsArray: any[];
            
            if (typeof params === 'string') {
                // Legacy format: bulkInsert(collectionName, points)
                collectionName = params;
                pointsArray = points || [];
            } else {
                // New format: bulkInsert({ collectionName, points })
                collectionName = params.collectionName;
                pointsArray = params.points;
            }
            
            const result = await this.client.upsert(collectionName, { points: pointsArray });
            return result.status === 'completed';
        } catch (error) {
            console.error(`Error bulk inserting points to collection "${typeof params === 'string' ? params : params.collectionName}":`, error);
            return false;
        }
    }

    /**
     * Upsert points to collection
     */
    async upsertPoints(collectionName: string, points: any[]): Promise<boolean> {
        try {
            const result = await this.client.upsert(collectionName, { points });
            return result.status === 'completed';
        } catch (error) {
            console.error(`Error upserting points to collection "${collectionName}":`, error);
            return false;
        }
    }

    /**
     * Delete points from collection
     */
    async deletePoints(collectionName: string, pointIds: string[]): Promise<boolean> {
        try {
            const result = await this.client.delete(collectionName, { points: pointIds });
            return result.status === 'completed';
        } catch (error) {
            console.error(`Error deleting points from collection "${collectionName}":`, error);
            return false;
        }
    }
}
