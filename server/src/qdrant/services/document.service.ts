import { getSBERTEmbeddingForText } from '../../services/call-python';
import { documentCollectionConfig, QdrantDocumentPoint, documentHelpers } from '../schemas/document';
import { QdrantService } from './base.service';

/**
 * Document-specific Qdrant operations
 */
export class DocumentQdrantService extends QdrantService {
    constructor() {
        super();
    }
    
    /**
     * Create the documents collection in Qdrant
     */
    async createDocumentCollection(): Promise<'created' | 'alreadyExists' | 'error'> {
        return await super.createCollection({
            collectionName: documentCollectionConfig.name,
            vectorSize: documentCollectionConfig.vectorConfig.size,
            distance: documentCollectionConfig.vectorConfig.distance
        });
    }

    /**
     * Add a document to the Qdrant documents collection
     */
    async addDocument(document: any): Promise<boolean> {
        try {
            // Skip folders - only process actual documents
            if (document.isFolder) {
                return true;
            }
            
            // Skip documents without content
            if (!document.content || document.content.trim().length === 0) {
                console.log(`Skipping document ${document._id} - no content`);
                return true;
            }
            
            // Split content into chunks for better embedding
            const chunks = this.splitDocumentIntoChunks(document);
            
            const points: QdrantDocumentPoint[] = [];
            
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                
                // Get embedding for the chunk
                const embeddings = await getSBERTEmbeddingForText([chunk.content]);
                if (!embeddings || embeddings.length === 0) {
                    console.error(`Failed to get embedding for chunk ${i} of document ${document._id}`);
                    continue;
                }
                const embedding = embeddings[0];
                
                // Calculate metadata scores
                const insightRelevanceScore = documentHelpers.calculateInsightRelevance(
                    document.documentType,
                    chunk.type,
                    document.sentiment,
                    document.customerSatisfactionScore
                );
                
                const customerEngagementLevel = documentHelpers.calculateCustomerEngagement(
                    document.documentType,
                    document.meetingType,
                    document.duration
                );
                
                const businessImpact = documentHelpers.calculateBusinessImpact(
                    document.documentType,
                    document.meetingType,
                    document.sentiment,
                    document.customerSatisfactionScore
                );
                
                const point: QdrantDocumentPoint = {
                    id: `${document._id}_chunk_${i}`,
                    vector: embedding,
                    payload: {
                        // Document identification
                        document_id: document._id.toString(),
                        organization_id: document.organizationId.toString(),
                        customer_id: document.customerId?.toString() || null,
                        
                        // Document metadata
                        title: document.title,
                        document_type: document.documentType,
                        content_type: this.getContentType(document),
                        
                        // Content information
                        chunk_type: chunk.type,
                        chunk_content: chunk.content,
                        chunk_index: i,
                        chunk_length: chunk.content.length,
                        chunk_word_count: chunk.content.split(/\s+/).length,
                        
                        // Document structure
                        folder_path: document.folderPath || '/',
                        parent_folder_id: document.parentFolderId?.toString() || null,
                        
                        // Meeting-specific fields
                        meeting_date: document.meetingDate?.toISOString(),
                        meeting_type: document.meetingType,
                        duration: document.duration,
                        attendees: document.attendees?.map((id: any) => id.toString()) || [],
                        customer_satisfaction_score: document.customerSatisfactionScore,
                        
                        // Content analysis
                        sentiment: document.sentiment,
                        key_topics: this.extractKeyTopics(document),
                        action_items: document.actionItems?.map((item: any) => item.text) || [],
                        tags: document.tags || [],
                        
                        // External references
                        link_url: document.linkUrl,
                        link_description: document.linkDescription,
                        google_doc_id: document.googleDocId,
                        google_doc_url: document.googleDocUrl,
                        
                        // Processing metadata
                        created_at: document.createdAt.getTime(),
                        updated_at: document.updatedAt.getTime(),
                        processing_timestamp: new Date().toISOString(),
                        embedding_quality_score: 0.8, // Default quality score
                        created_by: document.createdBy.toString(),
                        
                        // Content source and hierarchy
                        source: this.getDocumentSource(document),
                        is_folder: document.isFolder,
                        children_count: document.childrenCount,
                        
                        // Insights generation metadata
                        insight_relevance_score: insightRelevanceScore,
                        customer_engagement_level: customerEngagementLevel,
                        business_impact: businessImpact,
                    }
                };
                
                points.push(point);
            }
            
            if (points.length === 0) {
                console.log(`No valid chunks created for document ${document._id}`);
                return false;
            }
            
            // Insert points into Qdrant
            const result = await super.upsertPoints(documentCollectionConfig.name, points);
            
            console.log(`Successfully added document ${document._id} to Qdrant with ${points.length} chunks`);
            return result;
            
        } catch (error) {
            console.error(`Error adding document ${document._id} to Qdrant:`, error);
            return false;
        }
    }

    /**
     * Remove a document from the Qdrant documents collection
     */
    async removeDocument(documentId: string): Promise<boolean> {
        try {
            // Find all points for this document
            const searchResult = await super.scrollCollection({
                collectionName: documentCollectionConfig.name,
                filter: {
                    must: [
                        {
                            key: 'document_id',
                            match: { value: documentId }
                        }
                    ]
                },
                withVector: false,
                withPayload: false
            });
            
            if (!searchResult.points || searchResult.points.length === 0) {
                console.log(`No points found for document ${documentId} in Qdrant`);
                return true;
            }
            
            const pointIds = searchResult.points.map((point: any) => point.id);
            
            // Delete all points for this document
            const result = await super.deletePoints(documentCollectionConfig.name, pointIds);
            
            console.log(`Successfully removed document ${documentId} from Qdrant (${pointIds.length} points)`);
            return result;
            
        } catch (error) {
            console.error(`Error removing document ${documentId} from Qdrant:`, error);
            return false;
        }
    }

    /**
     * Search documents in Qdrant for customer insights
     */
    async searchForInsights(
        organizationId: string,
        customerId?: string,
        query?: string,
        limit: number = 10,
        minRelevanceScore: number = 0.6
    ): Promise<any[]> {
        try {
            let queryVector: number[] | undefined;
            if (query && query.trim()) {
                const embeddings = await getSBERTEmbeddingForText([query]);
                if (!embeddings || embeddings.length === 0) {
                    throw new Error('Failed to generate query embedding');
                }
                queryVector = embeddings[0];
            }
            
            // Build filter based on parameters
            const filter: any = {
                must: [
                    {
                        key: 'organization_id',
                        match: { value: organizationId }
                    },
                    {
                        key: 'is_folder',
                        match: { value: false }
                    },
                    {
                        key: 'insight_relevance_score',
                        range: { gte: minRelevanceScore }
                    }
                ]
            };
            
            if (customerId) {
                filter.must.push({
                    key: 'customer_id',
                    match: { value: customerId }
                });
            }
            
            if (queryVector) {
                // Vector search
                const result = await super.knnSearch({
                    collectionName: documentCollectionConfig.name,
                    queryVector,
                    limit,
                    filter,
                    withPayload: true,
                    withVector: false,
                    scoreThreshold: 0.7
                });
                
                return result.map((point: any) => ({
                    id: point.id,
                    score: point.score,
                    payload: point.payload
                }));
            } else {
                // Filter-only search (no query vector)
                const result = await super.scrollCollection({
                    collectionName: documentCollectionConfig.name,
                    filter,
                    limit,
                    withPayload: true,
                    withVector: false
                });
                
                return (result.points || []).map((point: any) => ({
                    id: point.id,
                    score: 1.0, // No vector similarity score
                    payload: point.payload
                }));
            }
            
        } catch (error) {
            console.error('Error searching documents for insights:', error);
            throw error;
        }
    }

    /**
     * Search documents for user-specific insights
     */
    async searchForUserInsights(
        organizationId: string,
        userId: string,
        query?: string,
        limit: number = 10,
        minRelevanceScore: number = 0.5
    ): Promise<any[]> {
        try {
            let queryVector: number[] | undefined;
            if (query && query.trim()) {
                const embeddings = await getSBERTEmbeddingForText([query]);
                if (!embeddings || embeddings.length === 0) {
                    throw new Error('Failed to generate query embedding');
                }
                queryVector = embeddings[0];
            }
            
            const filter: any = {
                must: [
                    {
                        key: 'organization_id',
                        match: { value: organizationId }
                    },
                    {
                        key: 'created_by',
                        match: { value: userId }
                    },
                    {
                        key: 'is_folder',
                        match: { value: false }
                    },
                    {
                        key: 'insight_relevance_score',
                        range: { gte: minRelevanceScore }
                    }
                ]
            };
            
            if (queryVector) {
                const result = await super.knnSearch({
                    collectionName: documentCollectionConfig.name,
                    queryVector,
                    limit,
                    filter,
                    withPayload: true,
                    withVector: false,
                    scoreThreshold: 0.6
                });
                
                return result.map((point: any) => ({
                    id: point.id,
                    score: point.score,
                    payload: point.payload
                }));
            } else {
                const result = await super.scrollCollection({
                    collectionName: documentCollectionConfig.name,
                    filter,
                    limit,
                    withPayload: true,
                    withVector: false
                });
                
                return (result.points || []).map((point: any) => ({
                    id: point.id,
                    score: 1.0,
                    payload: point.payload
                }));
            }
            
        } catch (error) {
            console.error('Error searching documents for user insights:', error);
            throw error;
        }
    }

    // ============================================================================
    // HELPER FUNCTIONS FOR DOCUMENT PROCESSING
    // ============================================================================

    private splitDocumentIntoChunks(document: any): DocumentChunk[] {
        const chunks: DocumentChunk[] = [];
        
        // Add title as a chunk
        if (document.title) {
            chunks.push({
                type: 'title',
                content: document.title
            });
        }
        
        // Add main content
        if (document.content) {
            const contentChunks = this.splitTextIntoChunks(document.content, 500); // 500 char chunks
            contentChunks.forEach((chunk, index) => {
                chunks.push({
                    type: index === 0 ? 'content' : 'content',
                    content: chunk
                });
            });
        }
        
        // Add key points as separate chunks
        if (document.keyPoints && document.keyPoints.length > 0) {
            document.keyPoints.forEach((point: string) => {
                chunks.push({
                    type: 'key_points',
                    content: point
                });
            });
        }
        
        // Add action items as separate chunks
        if (document.actionItems && document.actionItems.length > 0) {
            document.actionItems.forEach((item: any) => {
                chunks.push({
                    type: 'action_items',
                    content: `${item.text} (Assignee: ${item.assignee}, Status: ${item.status})`
                });
            });
        }
        
        // Add notes as a chunk
        if (document.notes) {
            chunks.push({
                type: 'notes',
                content: document.notes
            });
        }
        
        return chunks;
    }

    private splitTextIntoChunks(text: string, chunkSize: number): string[] {
        const chunks: string[] = [];
        const sentences = text.split(/[.!?]+/);
        let currentChunk = '';
        
        for (const sentence of sentences) {
            const trimmedSentence = sentence.trim();
            if (!trimmedSentence) continue;
            
            if (currentChunk.length + trimmedSentence.length > chunkSize && currentChunk.length > 0) {
                chunks.push(currentChunk.trim());
                currentChunk = trimmedSentence;
            } else {
                currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
            }
        }
        
        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
        }
        
        return chunks;
    }

    private getContentType(document: any): string {
        if (document.documentType === 'google_doc') return 'external';
        if (document.documentType === 'link') return 'link';
        if (document.documentType === 'meeting_summary') return 'structured';
        return 'text';
    }

    private extractKeyTopics(document: any): string[] {
        const topics: string[] = [];
        
        // Add tags as topics
        if (document.tags) {
            topics.push(...document.tags);
        }
        
        // Add meeting type as topic
        if (document.meetingType) {
            topics.push(document.meetingType);
        }
        
        // Add document type as topic
        topics.push(document.documentType);
        
        return topics;
    }

    private getDocumentSource(document: any): string {
        if (document.googleDocId) return 'google_docs';
        if (document.linkUrl) return 'link';
        return 'manual_entry';
    }
}

interface DocumentChunk {
    type: string;
    content: string;
}
