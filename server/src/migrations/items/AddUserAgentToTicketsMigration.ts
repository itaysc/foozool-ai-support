import { BaseMigration } from '../BaseMigration';
import { MigrationResult } from '../types';
import QdrantService from '../../qdrant/service';
import { ticketCollectionConfig, QdrantTicketPoint } from '../../qdrant/schemas/ticket';
import { v5 as uuidv5 } from 'uuid';
import { QDRANT_POINT_NAMESPACE } from '../../qdrant/utils';

export class AddUserAgentToTicketsMigration extends BaseMigration {
  name = 'add-user-agent-to-tickets';
  description = 'Add user_agent string field to all tickets in Qdrant collection with random user agent values';
  version = '1.0.0';
  databaseType = 'qdrant' as const;

  private readonly COLLECTION_NAME = ticketCollectionConfig.name;
  
  // User agent strings to randomly select from
  private readonly USER_AGENTS = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.60 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.6312.120 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 13; OnePlus 10 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.6312.86 Mobile Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.60 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.6312.86 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.6312.120 Safari/537.36'
  ];

  protected async execute(): Promise<MigrationResult> {
    const qdrantService = new QdrantService();
    const result: MigrationResult = {
      success: false,
      totalRecords: 0,
      processedRecords: 0,
      errors: []
    };

    console.log(`🚀 Starting ${this.name} migration...`);

    try {
      // Step 1: Check if collection exists
      console.log(`🔍 Checking if collection "${this.COLLECTION_NAME}" exists...`);
      const collections = await qdrantService.client.getCollections();
      const collection = collections.collections.find(
        col => col.name === this.COLLECTION_NAME
      );
      
      if (!collection) {
        console.log(`⚠️  Collection "${this.COLLECTION_NAME}" does not exist.`);
        result.success = true;
        return result;
      }

      console.log(`✅ Collection "${this.COLLECTION_NAME}" found`);

      // Step 2: Count total tickets
      console.log(`🔍 Counting total tickets in collection...`);
      const countResult = await qdrantService.client.count(this.COLLECTION_NAME, {
        exact: true
      });

      const totalTickets = countResult.count || 0;
      console.log(`📊 Found ${totalTickets} tickets in collection`);
      
      if (totalTickets === 0) {
        console.log(`✅ No tickets found in collection. Migration completed.`);
        result.success = true;
        return result;
      }

      result.totalRecords = totalTickets;

      // Step 3: Process tickets in batches
      console.log(`🔄 Processing ${totalTickets} tickets with user_agent field...`);
      const batchSize = 50;
      let offset = 0;
      let hasMore = true;
      let batchNumber = 0;
      
      while (hasMore) {
        batchNumber++;
        console.log(`\n🔄 Processing batch ${batchNumber} (offset: ${offset}, limit: ${batchSize})...`);
        
        try {
          // Read batch of tickets
          const batch = await this.readBatchTickets(qdrantService, offset, batchSize);
          
          if (batch.length === 0) {
            console.log(`✅ No more tickets to process.`);
            hasMore = false;
            break;
          }
          
          console.log(`📥 Read ${batch.length} tickets from offset ${offset}`);
          
          // Transform and update batch
          const transformedBatch = this.transformBatch(batch);
          console.log(`🔄 Updating ${transformedBatch.length} points with user_agent...`);
          
          // Log the first point structure for debugging (only for first batch)
          if (batchNumber === 1) {
            console.log(`🔍 DIAGNOSTIC - First point structure:`, JSON.stringify(transformedBatch[0], null, 2));
          }
          
          const success = await qdrantService.client.upsert(this.COLLECTION_NAME, {
            wait: true,
            points: transformedBatch
          });
          
          if (success) {
            result.processedRecords! += transformedBatch.length;
            console.log(`✅ Batch ${batchNumber} completed successfully`);
            console.log(`📊 Progress: ${result.processedRecords}/${result.totalRecords} tickets (${Math.round(((result.processedRecords || 0) / result.totalRecords) * 100)}%)`);
            
            // Move to next batch
            offset += batchSize;
            
            // Check if we've processed all tickets
            if ((result.processedRecords || 0) >= result.totalRecords) {
              hasMore = false;
            }
          } else {
            throw new Error('Upsert returned false');
          }
          
          // Add small delay to prevent overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error: any) {
          console.error(`❌ Batch ${batchNumber} failed: ${error.message}`);
          
          // Log detailed error information
          if (error.response) {
            console.error(`❌ Response status: ${error.response.status}`);
            console.error(`❌ Response data:`, JSON.stringify(error.response.data, null, 2));
          }
          
          result.errors.push(`Batch ${batchNumber}: ${error.message}`);
          
          // Stop after first error
          console.error(`❌ First error encountered. Stopping migration.`);
          break;
        }
      }

      // Step 4: Verify migration
      if (result.processedRecords === result.totalRecords) {
        console.log(`\n🔍 Verifying migration...`);
        try {
          // Count tickets with user_agent field
          const updatedCountResult = await qdrantService.client.count(this.COLLECTION_NAME, {
            exact: true,
            filter: {
              must: [
                {
                  exists: { key: 'user_agent' }
                }
              ]
            }
          });

          const ticketsWithUserAgent = updatedCountResult.count || 0;
          console.log(`📊 Tickets with user_agent field: ${ticketsWithUserAgent}`);
          
          if (ticketsWithUserAgent === result.totalRecords) {
            console.log(`✅ Migration verification successful! All tickets now have user_agent field.`);
          } else {
            console.warn(`⚠️  Migration verification: ${ticketsWithUserAgent}/${result.totalRecords} tickets have user_agent field`);
            result.errors.push(`Verification: ${ticketsWithUserAgent}/${result.totalRecords} tickets have user_agent field`);
          }
        } catch (error: any) {
          console.error(`❌ Failed to verify migration: ${error.message}`);
          result.errors.push(`Verification failed: ${error.message}`);
        }
      }
      
      console.log(`\n🎉 Migration completed!`);
      console.log(`📊 Final results:`);
      console.log(`   - Total tickets: ${result.totalRecords}`);
      console.log(`   - Successfully processed: ${result.processedRecords}`);
      console.log(`   - Errors: ${result.errors.length}`);
      
      if (result.errors.length > 0) {
        console.log(`⚠️  Errors:`);
        result.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`);
        });
      }
      
      result.success = result.processedRecords! > 0 && result.errors.length === 0;
      return result;
    } catch (error: any) {
      const errorMsg = `Migration failed: ${error.message}`;
      console.error(`❌ ${errorMsg}`);
      result.errors.push(errorMsg);
      return result;
    }
  }

  private async readBatchTickets(qdrantService: QdrantService, offset: number, limit: number): Promise<any[]> {
    try {
      const result = await qdrantService.client.scroll(this.COLLECTION_NAME, {
        limit,
        offset,
        with_payload: true,
        with_vector: true
      });
      
      const points = result.points || [];
      return points;
    } catch (error: any) {
      console.error(`❌ Failed to read batch from collection: ${error.message}`);
      throw error;
    }
  }

  private transformBatch(tickets: any[]): QdrantTicketPoint[] {
    console.log(`🔄 Transforming ${tickets.length} tickets with user_agent field...`);
    
    const transformed = tickets.map((ticket, index) => {
      const ticketId = ticket.id;
      const qdrantPointId = typeof ticketId === 'string' ? ticketId : uuidv5(ticketId.toString(), QDRANT_POINT_NAMESPACE);
      
      // Select random user agent using ticket ID as seed for consistent distribution
      const randomUserAgent = this.selectRandomUserAgent(ticketId);

      if (index < 3) {
        console.log(`   Ticket ${index + 1}: Adding user_agent="${randomUserAgent.substring(0, 50)}..."`);
      }

      return {
        id: qdrantPointId,
        vector: ticket.vector || new Array(768).fill(0), // Ensure 768-dimensional vector
        payload: {
          ...ticket.payload,
          user_agent: randomUserAgent
        }
      };
    });

    console.log(`✅ Transformed ${transformed.length} tickets`);
    return transformed;
  }

  private selectRandomUserAgent(seed: string | number): string {
    // Create a pseudo-random number based on the seed
    const seedStr = seed.toString();
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      const char = seedStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert hash to an index in the USER_AGENTS array
    const index = Math.abs(hash) % this.USER_AGENTS.length;
    return this.USER_AGENTS[index];
  }
} 