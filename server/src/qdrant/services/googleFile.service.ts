import { getDriveFileContent, getDriveFileMetadata } from '../../services/google/drive';
import { getSBERTEmbeddingForText } from '../../services/call-python';
import { googleFileCollectionConfig, QdrantGoogleFilePoint, chunkTypeScoreThresholds } from '../schemas/googleFile';
import { v5 as uuidv5 } from 'uuid';
import { parseTextIntoChunks } from '../../services/google/parse';
import { QDRANT_POINT_NAMESPACE } from '../utils';
import { QdrantService } from './base.service';

/**
 * Google File-specific Qdrant operations
 */
export class GoogleFileQdrantService extends QdrantService {
    constructor() {
        super();
    }
    
    /**
     * Create the google_files collection in Qdrant
     */
    async createGoogleFileCollection(): Promise<'created' | 'alreadyExists' | 'error'> {
        return await this.createCollection({
            collectionName: googleFileCollectionConfig.name,
            vectorSize: googleFileCollectionConfig.vectorConfig.size,
            distance: googleFileCollectionConfig.vectorConfig.distance
        });
    }

    /**
     * Process and add a Google Drive file to Qdrant
     */
    async addGoogleFile(fileId: string, organizationId: string): Promise<boolean> {
        try {
            console.log(`Processing Google Drive file: ${fileId}`);
            
            // Get file metadata and content
            const [metadata, content] = await Promise.all([
                getDriveFileMetadata(organizationId, fileId),
                getDriveFileContent(organizationId, fileId)
            ]);
            
            if (!metadata || !content) {
                console.error(`Failed to get metadata or content for file ${fileId}`);
                return false;
            }
            
            // Parse content into chunks
            const chunks = parseTextIntoChunks(content, metadata.mimeType || 'text/plain');
            
            if (chunks.length === 0) {
                console.log(`No chunks extracted from file ${fileId}`);
                return false;
            }
            
            const points: QdrantGoogleFilePoint[] = [];
            
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                
                // Generate embedding for the chunk
                const embeddings = await getSBERTEmbeddingForText([chunk.content]);
                if (!embeddings || embeddings.length === 0) {
                    console.error(`Failed to generate embedding for chunk ${i} of file ${fileId}`);
                    continue;
                }
                const embedding = embeddings[0];
                
                // Create unique point ID
                const pointId = uuidv5(`${fileId}_${i}`, QDRANT_POINT_NAMESPACE);
                
                const point: QdrantGoogleFilePoint = {
                    id: pointId,
                    vector: embedding,
                    payload: {
                        file_id: fileId,
                        file_name: metadata.name || 'Unknown',
                        organization_id: organizationId,
                        chunk_type: chunk.type,
                        chunk_content: chunk.content,
                        chunk_index: i,
                        chunk_length: chunk.content.length,
                        chunk_word_count: chunk.content.split(/\s+/).length,
                        mime_type: metadata.mimeType || 'text/plain',
                        file_type: this.getFileTypeFromMimeType(metadata.mimeType || 'text/plain'),
                        created_at: new Date(metadata.createdTime || new Date()).getTime(),
                        modified_time: metadata.modifiedTime || new Date().toISOString(),
                        processing_timestamp: new Date().toISOString(),
                        embedding_quality_score: this.calculateEmbeddingQuality(chunk.content),
                        source: 'google_drive',
                        file_url: metadata.webViewLink || ''
                    }
                };
                
                points.push(point);
            }
            
            if (points.length === 0) {
                console.log(`No valid points created for file ${fileId}`);
                return false;
            }
            
            // Insert points into Qdrant
            const result = await this.client.upsert(googleFileCollectionConfig.name, {
                points: points
            });
            
            console.log(`Successfully added file ${fileId} to Qdrant with ${points.length} chunks`);
            return result.status === 'completed';
            
        } catch (error) {
            console.error(`Error processing Google Drive file ${fileId}:`, error);
            return false;
        }
    }

    /**
     * Remove a Google Drive file from Qdrant
     */
    async removeGoogleFile(fileId: string): Promise<boolean> {
        try {
            // Find all points for this file
            const searchResult = await this.client.scroll(googleFileCollectionConfig.name, {
                filter: {
                    must: [
                        {
                            key: 'file_id',
                            match: { value: fileId }
                        }
                    ]
                },
                with_vector: false,
                with_payload: false
            });
            
            if (!searchResult.points || searchResult.points.length === 0) {
                console.log(`No points found for file ${fileId} in Qdrant`);
                return true;
            }
            
            const pointIds = searchResult.points.map((point: any) => point.id);
            
            // Delete all points for this file
            const result = await this.client.delete(googleFileCollectionConfig.name, {
                points: pointIds
            });
            
            console.log(`Successfully removed file ${fileId} from Qdrant (${pointIds.length} points)`);
            return result.status === 'completed';
            
        } catch (error) {
            console.error(`Error removing file ${fileId} from Qdrant:`, error);
            return false;
        }
    }

    /**
     * Search Google files with advanced filtering
     */
    async searchGoogleFiles({
        organizationId,
        query,
        limit = 10,
        fileType,
        chunkType,
        minQualityScore = 0.0
    }: {
        organizationId: string;
        query: string;
        limit?: number;
        fileType?: string;
        chunkType?: string;
        minQualityScore?: number;
    }): Promise<any[]> {
        try {
            const embeddings = await getSBERTEmbeddingForText([query]);
            if (!embeddings || embeddings.length === 0) {
                throw new Error('Failed to generate query embedding');
            }
            const queryVector = embeddings[0];
            
            const filter: any = {
                must: [
                    {
                        key: 'organization_id',
                        match: { value: organizationId }
                    }
                ]
            };
            
            if (fileType) {
                filter.must.push({
                    key: 'file_type',
                    match: { value: fileType }
                });
            }
            
            if (chunkType) {
                filter.must.push({
                    key: 'chunk_type',
                    match: { value: chunkType }
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
            
            return await this.knnSearch({
                collectionName: googleFileCollectionConfig.name,
                queryVector,
                limit,
                filter,
                withPayload: true,
                scoreThreshold
            });
            
        } catch (error) {
            console.error('Error searching Google files:', error);
            throw error;
        }
    }

    /**
     * Get all processed Google file IDs for an organization
     */
    async getProcessedFileIds(organizationId: string): Promise<string[]> {
        let page = 1;
        const pageSize = 1000;
        let allIds: string[] = [];
        let hasMore = true;
        
        while (hasMore) {
            const result = await this.client.scroll(googleFileCollectionConfig.name, {
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

    // ============================================================================
    // HELPER FUNCTIONS
    // ============================================================================

    private getFileTypeFromMimeType(mimeType: string): string {
        if (mimeType.includes('document')) return 'document';
        if (mimeType.includes('spreadsheet')) return 'spreadsheet';
        if (mimeType.includes('presentation')) return 'presentation';
        if (mimeType.includes('pdf')) return 'pdf';
        if (mimeType.includes('image')) return 'image';
        if (mimeType.includes('video')) return 'video';
        if (mimeType.includes('audio')) return 'audio';
        return 'other';
    }

    private calculateEmbeddingQuality(text: string): number {
        // Simple quality scoring based on text characteristics
        let score = 0.5; // Base score
        
        // Length factor
        if (text.length > 100) score += 0.1;
        if (text.length > 500) score += 0.1;
        
        // Word count factor
        const wordCount = text.split(/\s+/).length;
        if (wordCount > 20) score += 0.1;
        if (wordCount > 100) score += 0.1;
        
        // Character diversity factor
        const uniqueChars = new Set(text.toLowerCase()).size;
        const totalChars = text.length;
        if (uniqueChars / totalChars > 0.5) score += 0.1;
        
        return Math.min(1.0, Math.max(0.0, score));
    }
}
