// Qdrant collection configuration for tickets
export const ticketCollectionConfig = {
    name: 'tickets_v2',
    vectorConfig: {
        size: 768, // SBERT embedding dimension
        distance: 'Cosine' as const, // Cosine similarity for semantic search
    },
    // Optional: Define payload schema for type safety and filtering
    payloadSchema: {
        ticket_id: 'string',
        subject: 'string',
        description: 'string',
        organization: 'string',
        sentiment_score: 'number',
        sentiment: 'string',
        customer_id: 'string',
        created_at: 'integer', // Unix timestamp in milliseconds
        timestamp: 'string', // Original ISO string timestamp
        channel: 'string',
        status: 'string',
        tags: 'array', // array of strings
        intent: 'string',
        user_agent: 'string', // User agent string
        resolution_time_ms: 'integer', // Time to resolution in milliseconds
        resolved_at: 'integer', // Unix timestamp when ticket was resolved
        long_resolution_predicted: 'boolean', // Flag indicating if long resolution was predicted
        prediction_confidence: 'number', // Confidence score for the prediction
        prediction_added_at: 'integer', // Unix timestamp when prediction was added
    } as const,
};

// Type for ticket points in Qdrant
export interface QdrantTicketPoint {
    id: string | number;
    vector: number[]; // 768-dimensional SBERT embedding
    payload: {
        ticket_id: string;
        organization: string;
        customer_id?: string;
        sentiment_score: number;
        sentiment: string;
        created_at: number; // Unix timestamp in milliseconds
        timestamp: string; // Original ISO string timestamp
        tags?: string[];
        intent?: string;
        user_agent?: string; // User agent string
        resolution_time_ms?: number; // Time to resolution in milliseconds
        resolved_at?: number; // Unix timestamp when ticket was resolved
        long_resolution_predicted?: boolean; // Flag indicating if long resolution was predicted
        prediction_confidence?: number; // Confidence score for the prediction
        prediction_added_at?: number; // Unix timestamp when prediction was added
    };
}

// Common filter templates for ticket searches
export const ticketFilters = {
    byOrganization: (organizationId: string) => ({
        must: [
            {
                key: 'organization',
                match: { value: organizationId }
            }
        ]
    }),
    
    bySentiment: (sentiment: string) => ({
        must: [
            {
                key: 'sentiment',
                match: { value: sentiment }
            }
        ]
    }),
    
    byDateRange: (startDate: string, endDate: string) => ({
        must: [
            {
                key: 'created_at',
                range: {
                    gte: new Date(startDate).getTime(),
                    lte: new Date(endDate).getTime()
                }
            }
        ]
    }),
    
    byOrganizationAndSentiment: (organizationId: string, sentiment: string) => ({
        must: [
            {
                key: 'organization',
                match: { value: organizationId }
            },
            {
                key: 'sentiment',
                match: { value: sentiment }
            }
        ]
    }),
    
    byCustomer: (customerId: string) => ({
        must: [
            {
                key: 'customer_id',
                match: { value: customerId }
            }
        ]
    }),
    
    byCustomerAndOrganization: (customerId: string, organizationId: string) => ({
        must: [
            {
                key: 'customer_id',
                match: { value: customerId }
            },
            {
                key: 'organization',
                match: { value: organizationId }
            }
        ]
    }),
    
    byCustomerAndDateRange: (customerId: string, startDate: string, endDate: string) => ({
        must: [
            {
                key: 'customer_id',
                match: { value: customerId }
            },
            {
                key: 'created_at',
                range: {
                    gte: new Date(startDate).getTime(),
                    lte: new Date(endDate).getTime()
                }
            }
        ]
    }),
};

export default ticketCollectionConfig; 