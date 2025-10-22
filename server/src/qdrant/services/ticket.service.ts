import { getSBERTEmbeddingForText } from '../../services/call-python';
import { ticketCollectionConfig, QdrantTicketPoint } from '../schemas/ticket';
import { QdrantService } from './base.service';

/**
 * Ticket-specific Qdrant operations
 */
export class TicketQdrantService extends QdrantService {
    constructor() {
        super();
    }
    
    /**
     * Create the tickets collection in Qdrant
     */
    async createTicketCollection(): Promise<'created' | 'alreadyExists' | 'error'> {
        return await this.createCollection({
            collectionName: ticketCollectionConfig.name,
            vectorSize: ticketCollectionConfig.vectorConfig.size,
            distance: ticketCollectionConfig.vectorConfig.distance
        });
    }

    /**
     * Add a ticket to the Qdrant tickets collection
     */
    async addTicket(ticket: any): Promise<boolean> {
        try {
            // Skip tickets without content
            if (!ticket.content || ticket.content.trim().length === 0) {
                console.log(`Skipping ticket ${ticket._id} - no content`);
                return true;
            }
            
            // Generate embedding for the ticket content
            const embeddings = await getSBERTEmbeddingForText([ticket.content]);
            if (!embeddings || embeddings.length === 0) {
                console.error(`Failed to generate embedding for ticket ${ticket._id}`);
                return false;
            }
            const embedding = embeddings[0];
            
            const point: QdrantTicketPoint = {
                id: ticket._id.toString(),
                vector: embedding,
                payload: {
                    ticket_id: ticket._id.toString(),
                    organization: ticket.organizationId.toString(),
                    customer_id: ticket.customerId?.toString() || null,
                    sentiment_score: ticket.sentiment_score || 0,
                    sentiment: ticket.sentiment || 'neutral',
                    created_at: ticket.createdAt.getTime(),
                    timestamp: ticket.createdAt.toISOString(),
                    tags: ticket.tags || [],
                    intent: ticket.intent || '',
                    user_agent: ticket.user_agent || '',
                    resolution_time_ms: ticket.resolution_time_ms,
                    resolved_at: ticket.resolved_at,
                    long_resolution_predicted: ticket.long_resolution_predicted || false,
                    prediction_added_at: ticket.prediction_added_at
                }
            };
            
            // Insert point into Qdrant
            const result = await this.client.upsert(ticketCollectionConfig.name, {
                points: [point]
            });
            
            console.log(`Successfully added ticket ${ticket._id} to Qdrant`);
            return result.status === 'completed';
            
        } catch (error) {
            console.error(`Error adding ticket ${ticket._id} to Qdrant:`, error);
            return false;
        }
    }

    /**
     * Remove a ticket from the Qdrant tickets collection
     */
    async removeTicket(ticketId: string): Promise<boolean> {
        try {
            const result = await this.client.delete(ticketCollectionConfig.name, {
                points: [ticketId]
            });
            
            console.log(`Successfully removed ticket ${ticketId} from Qdrant`);
            return result.status === 'completed';
            
        } catch (error) {
            console.error(`Error removing ticket ${ticketId} from Qdrant:`, error);
            return false;
        }
    }

    /**
     * Search tickets with advanced filtering
     */
    async searchTickets({
        organizationId,
        query,
        limit = 10,
        customerId,
        status,
        priority,
        ticketType,
        minQualityScore = 0.0
    }: {
        organizationId: string;
        query: string;
        limit?: number;
        customerId?: string;
        status?: string;
        priority?: string;
        ticketType?: string;
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
                        key: 'organization',
                        match: { value: organizationId }
                    }
                ]
            };
            
            if (customerId) {
                filter.must.push({
                    key: 'customer_id',
                    match: { value: customerId }
                });
            }
            
            if (status) {
                filter.must.push({
                    key: 'status',
                    match: { value: status }
                });
            }
            
            if (priority) {
                filter.must.push({
                    key: 'priority',
                    match: { value: priority }
                });
            }
            
            if (ticketType) {
                filter.must.push({
                    key: 'ticket_type',
                    match: { value: ticketType }
                });
            }
            
            if (minQualityScore > 0) {
                filter.must.push({
                    key: 'embedding_quality_score',
                    range: { gte: minQualityScore }
                });
            }
            
            return await this.knnSearch({
                collectionName: ticketCollectionConfig.name,
                queryVector,
                limit,
                filter,
                withPayload: true,
                scoreThreshold: 0.7
            });
            
        } catch (error) {
            console.error('Error searching tickets:', error);
            throw error;
        }
    }

    /**
     * Get recent vectors for clustering and insights generation
     */
    async getRecentVectors({
        organizationId,
        createdAfter,
        limit = 500
    }: {
        organizationId: string;
        createdAfter: Date;
        limit?: number;
    }): Promise<any[]> {
        try {
            const filter = {
                must: [
                    {
                        key: 'organization',
                        match: { value: organizationId }
                    },
                    {
                        key: 'created_at',
                        range: { gte: createdAfter.getTime() }
                    }
                ]
            };

            const result = await this.scrollCollection({
                collectionName: ticketCollectionConfig.name,
                filter,
                limit,
                withPayload: true,
                withVector: true
            });

            return result.points || [];
            
        } catch (error) {
            console.error('Error getting recent vectors:', error);
            throw error;
        }
    }

    /**
     * Get customer ticket statistics
     */
    async getCustomerTicketStats(customerId: string): Promise<any> {
        try {
            const filter = {
                must: [
                    {
                        key: 'customer_id',
                        match: { value: customerId }
                    }
                ]
            };

            const result = await this.scrollCollection({
                collectionName: ticketCollectionConfig.name,
                filter,
                limit: 1000,
                withPayload: true,
                withVector: false
            });

            const tickets = result.points || [];
            
            // Calculate basic statistics
            const stats = {
                totalTickets: tickets.length,
                avgSentimentScore: 0,
                sentimentDistribution: {
                    positive: 0,
                    neutral: 0,
                    negative: 0
                },
                recentTickets: tickets.slice(0, 10)
            };

            if (tickets.length > 0) {
                const sentimentScores = tickets.map(t => t.payload.sentiment_score || 0);
                stats.avgSentimentScore = sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length;
                
                tickets.forEach(ticket => {
                    const score = ticket.payload.sentiment_score || 0;
                    if (score > 0.1) stats.sentimentDistribution.positive++;
                    else if (score < -0.1) stats.sentimentDistribution.negative++;
                    else stats.sentimentDistribution.neutral++;
                });
            }

            return stats;
            
        } catch (error) {
            console.error('Error getting customer ticket stats:', error);
            throw error;
        }
    }

    /**
     * Search tickets by customer
     */
    async searchTicketsByCustomer(customerId: string, limit: number = 100): Promise<any[]> {
        try {
            const filter = {
                must: [
                    {
                        key: 'customer_id',
                        match: { value: customerId }
                    }
                ]
            };

            const result = await this.scrollCollection({
                collectionName: ticketCollectionConfig.name,
                filter,
                limit,
                withPayload: true,
                withVector: false
            });

            return result.points || [];
            
        } catch (error) {
            console.error('Error searching tickets by customer:', error);
            throw error;
        }
    }

    /**
     * Update a specific ticket point in Qdrant
     */
    async updateTicketPoint(pointId: string, payload: any): Promise<boolean> {
        try {
            const result = await this.client.setPayload(ticketCollectionConfig.name, {
                points: [pointId],
                payload: payload
            });
            
            console.log(`Successfully updated Qdrant point ${pointId}`);
            return result.status === 'completed';
            
        } catch (error) {
            console.error(`Error updating Qdrant point ${pointId}:`, error);
            return false;
        }
    }

    /**
     * Retrieve ticket points from Qdrant
     */
    async retrieveTicketPoints(pointIds: string[], withPayload: boolean = true): Promise<any[]> {
        try {
            return await this.retrievePoints(ticketCollectionConfig.name, pointIds, withPayload);
        } catch (error) {
            console.error('Error retrieving ticket points:', error);
            throw error;
        }
    }

    /**
     * Bulk insert ticket points to Qdrant
     */
    async bulkInsertTickets(points: any[]): Promise<boolean> {
        try {
            return await this.bulkInsert({ collectionName: ticketCollectionConfig.name, points });
        } catch (error) {
            console.error('Error bulk inserting tickets:', error);
            return false;
        }
    }

    /**
     * Add a single ticket point to Qdrant
     */
    async addSingleTicket(point: any): Promise<boolean> {
        try {
            const result = await this.client.upsert(ticketCollectionConfig.name, {
                points: [point]
            });
            
            console.log(`Successfully added single ticket to Qdrant`);
            return result.status === 'completed';
            
        } catch (error) {
            console.error(`Error adding single ticket to Qdrant:`, error);
            return false;
        }
    }

    // ============================================================================
    // HELPER FUNCTIONS
    // ============================================================================

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
