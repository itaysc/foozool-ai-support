import { QdrantClient } from '@qdrant/js-client-rest';
import Config from '../config';

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
            });
            
            console.log(`KNN search returned ${searchResult.length} results from collection "${collectionName}".`);
            return searchResult;
        } catch (error: any) {
            console.error(`Error performing KNN search on collection "${collectionName}":`, error);
            return [];
        }
    }
}

export default QdrantService; 