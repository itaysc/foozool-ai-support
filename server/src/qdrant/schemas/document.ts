// Qdrant collection configuration for Documents (including notes, reports, and other files)
export const documentCollectionConfig = {
    name: 'documents',
    vectorConfig: {
        size: 768, // SBERT embedding dimension (same as Google files)
        distance: 'Cosine' as const, // Cosine similarity for semantic search
    },
    // Define payload schema for type safety and filtering
    payloadSchema: {
        // Document identification
        document_id: 'string',
        organization_id: 'string',
        customer_id: 'string', // Optional - null for organization-wide documents
        
        // Document metadata
        title: 'string',
        document_type: 'string', // 'meeting_summary', 'note', 'report', 'other', 'link', 'google_doc'
        content_type: 'string', // 'text', 'structured', 'link', 'external'
        
        // Content information
        chunk_type: 'string', // 'title', 'content', 'key_points', 'action_items', 'summary', 'notes'
        chunk_content: 'string', // The actual text content
        chunk_index: 'number', // Position of chunk within the document
        chunk_length: 'number', // Character count of chunk
        chunk_word_count: 'number', // Word count of chunk
        
        // Document structure
        folder_path: 'string', // Folder structure path
        parent_folder_id: 'string', // Parent folder ID for hierarchy
        
        // Meeting-specific fields (for meeting summaries)
        meeting_date: 'string', // ISO date string
        meeting_type: 'string', // 'customer_facing', 'internal', 'check_in', etc.
        duration: 'number', // Meeting duration in minutes
        attendees: 'array', // Array of attendee IDs
        customer_satisfaction_score: 'number', // 1-10 scale
        
        // Content analysis
        sentiment: 'string', // 'positive', 'neutral', 'negative'
        key_topics: 'array', // Extracted key topics/themes
        action_items: 'array', // Extracted action items
        tags: 'array', // Document tags
        
        // External references
        link_url: 'string', // For link documents
        link_description: 'string', // Link description
        google_doc_id: 'string', // Google Doc ID if applicable
        google_doc_url: 'string', // Google Doc URL
        
        // Processing metadata
        created_at: 'integer', // Unix timestamp in milliseconds
        updated_at: 'integer', // Unix timestamp in milliseconds
        processing_timestamp: 'string', // When the chunk was processed
        embedding_quality_score: 'number', // Quality metric for the embedding
        created_by: 'string', // User ID who created the document
        
        // Content source and hierarchy
        source: 'string', // 'manual_entry', 'google_docs', 'link', 'import'
        is_folder: 'boolean', // true for folders, false for documents
        children_count: 'number', // Number of children (for folders)
        
        // Insights generation metadata
        insight_relevance_score: 'number', // How relevant for customer insights (0-1)
        customer_engagement_level: 'string', // 'high', 'medium', 'low'
        business_impact: 'string', // 'high', 'medium', 'low'
        
    } as const,
};

// Type for document points in Qdrant
export interface QdrantDocumentPoint {
    id: string | number;
    vector: number[]; // 768-dimensional SBERT embedding
    payload: {
        // Document identification
        document_id: string;
        organization_id: string;
        customer_id: string | null;
        
        // Document metadata
        title: string;
        document_type: string;
        content_type: string;
        
        // Content information
        chunk_type: string;
        chunk_content: string;
        chunk_index: number;
        chunk_length: number;
        chunk_word_count: number;
        
        // Document structure
        folder_path: string;
        parent_folder_id: string | null;
        
        // Meeting-specific fields
        meeting_date?: string;
        meeting_type?: string;
        duration?: number;
        attendees?: string[];
        customer_satisfaction_score?: number;
        
        // Content analysis
        sentiment?: string;
        key_topics?: string[];
        action_items?: string[];
        tags?: string[];
        
        // External references
        link_url?: string;
        link_description?: string;
        google_doc_id?: string;
        google_doc_url?: string;
        
        // Processing metadata
        created_at: number;
        updated_at: number;
        processing_timestamp: string;
        embedding_quality_score: number;
        created_by: string;
        
        // Content source and hierarchy
        source: string;
        is_folder: boolean;
        children_count?: number;
        
        // Insights generation metadata
        insight_relevance_score: number;
        customer_engagement_level: string;
        business_impact: string;
    };
}

// Score thresholds for different chunk types
export const documentChunkTypeScoreThresholds = {
    title: 0.6,           // Titles need higher similarity
    content: 0.7,         // Main content
    key_points: 0.65,     // Key points and highlights
    action_items: 0.75,   // Action items need high precision
    summary: 0.7,         // Document summaries
    notes: 0.7,           // General notes
    meeting_notes: 0.65,  // Meeting-specific content
    customer_feedback: 0.8, // Customer feedback needs very high precision
} as const;

// Common filter templates for document searches
export const documentFilters = {
    byOrganization: (organizationId: string) => ({
        must: [
            {
                key: 'organization_id',
                match: { value: organizationId }
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
    
    byOrganizationAndCustomer: (organizationId: string, customerId: string) => ({
        must: [
            {
                key: 'organization_id',
                match: { value: organizationId }
            },
            {
                key: 'customer_id',
                match: { value: customerId }
            }
        ]
    }),
    
    byDocumentType: (documentType: string) => ({
        must: [
            {
                key: 'document_type',
                match: { value: documentType }
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
    
    byDocumentId: (documentId: string) => ({
        must: [
            {
                key: 'document_id',
                match: { value: documentId }
            }
        ]
    }),
    
    byFolderPath: (folderPath: string) => ({
        must: [
            {
                key: 'folder_path',
                match: { value: folderPath }
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
    
    byMeetingType: (meetingType: string) => ({
        must: [
            {
                key: 'meeting_type',
                match: { value: meetingType }
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
    
    byInsightRelevance: (minScore: number) => ({
        must: [
            {
                key: 'insight_relevance_score',
                range: {
                    gte: minScore
                }
            }
        ]
    }),
    
    byCustomerEngagement: (engagementLevel: string) => ({
        must: [
            {
                key: 'customer_engagement_level',
                match: { value: engagementLevel }
            }
        ]
    }),
    
    byBusinessImpact: (impactLevel: string) => ({
        must: [
            {
                key: 'business_impact',
                match: { value: impactLevel }
            }
        ]
    }),
    
    excludeFolders: () => ({
        must: [
            {
                key: 'is_folder',
                match: { value: false }
            }
        ]
    }),
    
    // Complex filters for insights generation
    byCustomerInsights: (organizationId: string, customerId: string, minRelevanceScore: number = 0.6) => ({
        must: [
            {
                key: 'organization_id',
                match: { value: organizationId }
            },
            {
                key: 'customer_id',
                match: { value: customerId }
            },
            {
                key: 'insight_relevance_score',
                range: {
                    gte: minRelevanceScore
                }
            },
            {
                key: 'is_folder',
                match: { value: false }
            }
        ]
    }),
    
    byUserInsights: (organizationId: string, createdBy: string, minRelevanceScore: number = 0.5) => ({
        must: [
            {
                key: 'organization_id',
                match: { value: organizationId }
            },
            {
                key: 'created_by',
                match: { value: createdBy }
            },
            {
                key: 'insight_relevance_score',
                range: {
                    gte: minRelevanceScore
                }
            },
            {
                key: 'is_folder',
                match: { value: false }
            }
        ]
    }),
    
    byMeetingInsights: (organizationId: string, customerId?: string, meetingType?: string) => ({
        must: [
            {
                key: 'organization_id',
                match: { value: organizationId }
            },
            {
                key: 'document_type',
                match: { value: 'meeting_summary' }
            },
            ...(customerId ? [{
                key: 'customer_id',
                match: { value: customerId }
            }] : []),
            ...(meetingType ? [{
                key: 'meeting_type',
                match: { value: meetingType }
            }] : [])
        ]
    }),
    
    // Filter for documents with specific tags
    byTags: (tags: string[]) => ({
        must: tags.map(tag => ({
            key: 'tags',
            match: { any: [tag] }
        }))
    }),
    
    // Filter for documents with action items
    withActionItems: () => ({
        must: [
            {
                key: 'action_items',
                match: { 
                    any: [''] // Non-empty action items
                }
            }
        ]
    }),
};

// Helper functions for document processing
export const documentHelpers = {
    // Calculate insight relevance score based on document content and type
    calculateInsightRelevance: (documentType: string, chunkType: string, sentiment?: string, customerSatisfactionScore?: number): number => {
        let score = 0.5; // Base score
        
        // Document type relevance
        switch (documentType) {
            case 'meeting_summary':
                score += 0.3;
                break;
            case 'report':
                score += 0.2;
                break;
            case 'note':
                score += 0.1;
                break;
            default:
                score += 0.05;
        }
        
        // Chunk type relevance
        switch (chunkType) {
            case 'key_points':
            case 'action_items':
            case 'customer_feedback':
                score += 0.2;
                break;
            case 'summary':
                score += 0.15;
                break;
            case 'title':
                score += 0.1;
                break;
            default:
                score += 0.05;
        }
        
        // Sentiment relevance (negative sentiment often more insightful)
        if (sentiment === 'negative') {
            score += 0.1;
        } else if (sentiment === 'positive') {
            score += 0.05;
        }
        
        // Customer satisfaction relevance
        if (customerSatisfactionScore !== undefined) {
            if (customerSatisfactionScore < 5) {
                score += 0.15; // Low satisfaction is highly relevant
            } else if (customerSatisfactionScore > 8) {
                score += 0.1; // High satisfaction is also relevant
            }
        }
        
        return Math.min(1.0, Math.max(0.0, score));
    },
    
    // Calculate customer engagement level
    calculateCustomerEngagement: (documentType: string, meetingType?: string, duration?: number): string => {
        if (documentType === 'meeting_summary') {
            if (meetingType === 'customer_facing' || meetingType === 'check_in') {
                if (duration && duration > 30) {
                    return 'high';
                }
                return 'medium';
            }
            return 'low';
        }
        
        if (documentType === 'report' || documentType === 'note') {
            return 'medium';
        }
        
        return 'low';
    },
    
    // Calculate business impact level
    calculateBusinessImpact: (documentType: string, meetingType?: string, sentiment?: string, customerSatisfactionScore?: number): string => {
        let impact = 'low';
        
        if (documentType === 'meeting_summary') {
            if (meetingType === 'escalation' || meetingType === 'renewal') {
                impact = 'high';
            } else if (meetingType === 'customer_facing' || meetingType === 'check_in') {
                impact = 'medium';
            }
        } else if (documentType === 'report') {
            impact = 'medium';
        }
        
        // Adjust based on sentiment and satisfaction
        if (sentiment === 'negative' || (customerSatisfactionScore && customerSatisfactionScore < 4)) {
            impact = 'high';
        } else if (sentiment === 'positive' || (customerSatisfactionScore && customerSatisfactionScore > 8)) {
            impact = impact === 'low' ? 'medium' : impact;
        }
        
        return impact;
    }
};

export default documentCollectionConfig;
