// Qdrant collection configuration for tickets
export const ticketCollectionConfig = {
    name: 'tickets',
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
        created_at: 'string', // ISO date string
        channel: 'string',
        status: 'string',
        tags: 'array', // array of strings
        intent: 'string',
    } as const,
};

// Type for ticket points in Qdrant
export interface QdrantTicketPoint {
    id: string | number;
    vector: number[]; // 768-dimensional SBERT embedding
    payload: {
        ticket_id: string;
        organization: string;
        sentiment_score: number;
        sentiment: string;
        created_at: string;
        tags?: string[];
        intent?: string;
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
                    gte: startDate,
                    lte: endDate
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