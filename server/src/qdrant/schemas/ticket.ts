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
    } as const,
};

// Type for ticket points in Qdrant (for writing - requires vector)
export interface QdrantTicketPoint {
    id: string | number;
    vector: number[]; // 768-dimensional SBERT embedding (required when writing)
    payload: {
        ticket_id: string;
        organization: string;
        sentiment_score: number;
        sentiment: string;
        created_at: number; // Unix timestamp in milliseconds
        timestamp: string; // Original ISO string timestamp
        tags?: string[];
        intent?: string;
        user_agent?: string; // User agent string
    };
}

// Type for reading ticket points from Qdrant (vector is optional when with_vector: false)
export interface QdrantTicketPointRead {
    id: string | number;
    vector?: number[]; // 768-dimensional SBERT embedding (optional when reading)
    payload: {
        ticket_id: string;
        organization: string;
        sentiment_score: number;
        sentiment: string;
        created_at: number; // Unix timestamp in milliseconds
        timestamp: string; // Original ISO string timestamp
        tags?: string[];
        intent?: string;
        user_agent?: string; // User agent string
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
};

export default ticketCollectionConfig; 