import ElasticsearchService from '../elasticsearch/service';
import QdrantService from './service';
import { ticketCollectionConfig, QdrantTicketPoint } from './schemas/ticket';
import { IESTicket } from '@common/types';

interface MigrationResult {
    success: boolean;
    totalTickets: number;
    migratedTickets: number;
    errors: string[];
}

class TicketMigration {
    private esService: ElasticsearchService;
    private qdrantService: QdrantService;
    private batchSize: number = 100;

    constructor() {
        this.esService = new ElasticsearchService();
        this.qdrantService = new QdrantService();
    }

    /**
     * Migrate all tickets from Elasticsearch to Qdrant
     */
    async migrateAllTickets(): Promise<MigrationResult> {
        const result: MigrationResult = {
            success: false,
            totalTickets: 0,
            migratedTickets: 0,
            errors: []
        };

        try {
            console.log('🚀 Starting ticket migration from Elasticsearch to Qdrant...');

            // Step 1: Create Qdrant collection if it doesn't exist
            const collectionStatus = await this.qdrantService.createCollection({
                collectionName: ticketCollectionConfig.name,
                vectorSize: ticketCollectionConfig.vectorConfig.size,
                distance: ticketCollectionConfig.vectorConfig.distance
            });

            console.log(`📦 Collection status: ${collectionStatus}`);

            // Step 2: Get all tickets from Elasticsearch
            const tickets = await this.getAllTicketsFromES();
            result.totalTickets = tickets.length;

            if (tickets.length === 0) {
                console.log('📭 No tickets found in Elasticsearch');
                result.success = true;
                return result;
            }

            console.log(`📊 Found ${tickets.length} tickets in Elasticsearch`);

            // Step 3: Process tickets in batches
            const batches = this.createBatches(tickets, this.batchSize);
            
            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];
                console.log(`📦 Processing batch ${i + 1}/${batches.length} (${batch.length} tickets)`);

                try {
                    const qdrantPoints = this.transformToQdrantPoints(batch);
                    const insertSuccess = await this.qdrantService.bulkInsert({
                        collectionName: ticketCollectionConfig.name,
                        points: qdrantPoints
                    });

                    if (insertSuccess) {
                        result.migratedTickets += batch.length;
                        console.log(`✅ Batch ${i + 1} migrated successfully`);
                    } else {
                        result.errors.push(`Failed to migrate batch ${i + 1}`);
                        console.error(`❌ Failed to migrate batch ${i + 1}`);
                    }
                } catch (batchError: any) {
                    result.errors.push(`Batch ${i + 1} error: ${batchError.message}`);
                    console.error(`❌ Error processing batch ${i + 1}:`, batchError);
                }
            }

            result.success = result.migratedTickets > 0;
            console.log(`🎉 Migration completed! ${result.migratedTickets}/${result.totalTickets} tickets migrated`);

        } catch (error: any) {
            result.errors.push(`Migration failed: ${error.message}`);
            console.error('❌ Migration failed:', error);
        }

        return result;
    }

    /**
     * Get all tickets from Elasticsearch using scroll API for large datasets
     */
    private async getAllTicketsFromES(): Promise<IESTicket[]> {
        try {
            const searchResponse = await this.esService.search({
                index: 'tickets',
                scroll: '2m',
                size: 1000,
                body: {
                    query: {
                        match_all: {}
                    }
                }
            });

            let tickets: IESTicket[] = searchResponse.hits.hits.map((hit: any) => hit._source);
            let scrollId = searchResponse._scroll_id;

            // Continue scrolling to get all tickets
            while (scrollId && searchResponse.hits.hits.length > 0) {
                const scrollResponse = await this.esService.client.scroll({
                    scroll_id: scrollId,
                    scroll: '2m'
                });

                if (scrollResponse.hits.hits.length === 0) {
                    break;
                }

                tickets = tickets.concat(scrollResponse.hits.hits.map((hit: any) => hit._source));
                scrollId = scrollResponse._scroll_id;
            }

            // Clear scroll context
            if (scrollId) {
                await this.esService.client.clearScroll({ scroll_id: scrollId });
            }

            return tickets;
        } catch (error: any) {
            console.error('Error fetching tickets from Elasticsearch:', error);
            throw error;
        }
    }

    /**
     * Transform ES tickets to Qdrant points format
     */
    private transformToQdrantPoints(tickets: IESTicket[]): QdrantTicketPoint[] {
        return tickets.map((ticket, index) => ({
            id: ticket.ticket_id || `ticket_${index}`,
            vector: ticket.embedding || [],
            payload: {
                ticket_id: ticket.ticket_id || '',
                subject: (ticket as any).subject || '',
                description: (ticket as any).description || '',
                organization: ticket.organization || '',
                sentiment_score: ticket.sentiment_score || 0,
                sentiment: ticket.sentiment || 'neutral',
                customer_id: ticket.customer_id || '',
                created_at: ticket.created_at || new Date().toISOString(),
                channel: (ticket as any).channel,
                status: (ticket as any).status,
                tags: (ticket as any).tags || []
            }
        }));
    }

    /**
     * Split array into batches
     */
    private createBatches<T>(array: T[], batchSize: number): T[][] {
        const batches: T[][] = [];
        for (let i = 0; i < array.length; i += batchSize) {
            batches.push(array.slice(i, i + batchSize));
        }
        return batches;
    }

    /**
     * Set custom batch size for migration
     */
    setBatchSize(size: number): void {
        this.batchSize = size;
    }
}

// Export function for easy usage
export async function migrateTicketsFromESToQdrant(): Promise<MigrationResult> {
    const migration = new TicketMigration();
    return await migration.migrateAllTickets();
}

export default TicketMigration; 