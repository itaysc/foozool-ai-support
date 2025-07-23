// Qdrant collection configuration for Google Drive files
export const googleFileCollectionConfig = {
    name: 'google_files',
    vectorConfig: {
        size: 768, // SBERT embedding dimension
        distance: 'Cosine' as const, // Cosine similarity for semantic search
    },
    // Define payload schema for type safety and filtering
    payloadSchema: {
        file_id: 'string',
        file_name: 'string',
        organization_id: 'string',
        chunk_type: 'string', // 'title', 'paragraph', 'section', etc.
        // chunk_content: 'string', // now optional
        chunk_index: 'number', // Position of chunk within the file
        chunk_length: 'number', // Character count of chunk
        chunk_word_count: 'number', // Word count of chunk
        mime_type: 'string',
        file_type: 'string', // Derived from mime_type (document, spreadsheet, etc.)
        created_at: 'string', // ISO date string
        modified_time: 'string', // ISO date string
        processing_timestamp: 'string', // When the chunk was processed
        embedding_quality_score: 'number', // Quality metric for the embedding
        source: 'string', // new field
        file_url: 'string', // new field
    } as const,
};

// Type for Google file points in Qdrant
export interface QdrantGoogleFilePoint {
    id: string | number;
    vector: number[]; // 768-dimensional SBERT embedding
    payload: {
        file_id: string;
        file_name: string;
        organization_id: string;
        chunk_type: string;
        chunk_content?: string; // now optional
        chunk_index: number;
        chunk_length: number;
        chunk_word_count: number;
        mime_type: string;
        file_type: string;
        created_at: string;
        modified_time: string;
        processing_timestamp: string;
        embedding_quality_score: number;
        source: string; // new field
        file_url: string; // new field
    };
}

// Score thresholds for different chunk types
export const chunkTypeScoreThresholds = {
    title: 0.6,      // Titles need higher similarity
    paragraph: 0.7,  // Standard paragraphs
    section: 0.65,   // Section headers
    list_item: 0.75, // List items need high precision
    content: 0.7     // General content
} as const;

// Common filter templates for Google file searches
export const googleFileFilters = {
    byOrganization: (organizationId: string) => ({
        must: [
            {
                key: 'organization_id',
                match: { value: organizationId }
            }
        ]
    }),
    
    byChunkType: (chunkType: string) => ({
        must: [
            {
                key: 'chunk_type',
                match: { value: chunkType }
            }
        ]
    }),
    
    byFileId: (fileId: string) => ({
        must: [
            {
                key: 'file_id',
                match: { value: fileId }
            }
        ]
    }),
    
    byFileType: (fileType: string) => ({
        must: [
            {
                key: 'file_type',
                match: { value: fileType }
            }
        ]
    }),
    
    byOrganizationAndChunkType: (organizationId: string, chunkType: string) => ({
        must: [
            {
                key: 'organization_id',
                match: { value: organizationId }
            },
            {
                key: 'chunk_type',
                match: { value: chunkType }
            }
        ]
    }),
    
    byDateRange: (startDate: string, endDate: string) => ({
        must: [
            {
                key: 'modified_time',
                range: {
                    gte: startDate,
                    lte: endDate
                }
            }
        ]
    }),
    
    byQualityScore: (minScore: number) => ({
        must: [
            {
                key: 'embedding_quality_score',
                range: {
                    gte: minScore
                }
            }
        ]
    }),
};

export default googleFileCollectionConfig; 