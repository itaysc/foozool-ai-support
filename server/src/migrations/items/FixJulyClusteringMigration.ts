import { BaseMigration } from '../BaseMigration';
import { MigrationResult } from '../types';
import QdrantService from '../../qdrant/service';
import { ticketCollectionConfig, QdrantTicketPoint } from '../../qdrant/schemas/ticket';
import { v5 as uuidv5 } from 'uuid';
import { QDRANT_POINT_NAMESPACE } from '../../qdrant/utils';

export class FixJulyClusteringMigration extends BaseMigration {
  name = 'fix-july-clustering';
  description = 'Fix July clustering issue by reassigning random dates to tickets between July 12-15, 2025';
  version = '1.0.0';
  databaseType = 'qdrant' as const;

  private readonly COLLECTION_NAME = 'tickets_v2';

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

      // Step 2: Define the July 12-15 date range
      const july12Start = new Date('2025-07-12T00:00:00.000Z').getTime();
      const july15End = new Date('2025-07-15T23:59:59.999Z').getTime();
      
      console.log(`📅 Targeting tickets between July 12-15, 2025`);
      console.log(`   Start: ${july12Start} (${new Date(july12Start).toISOString()})`);
      console.log(`   End: ${july15End} (${new Date(july15End).toISOString()})`);

      // Step 3: Count affected tickets
      console.log(`🔍 Counting tickets in the target date range...`);
      const countResult = await qdrantService.client.count(this.COLLECTION_NAME, {
        exact: true,
        filter: {
          must: [
            {
              key: 'created_at',
              range: {
                gte: july12Start,
                lte: july15End
              }
            }
          ]
        }
      });

      const affectedTickets = countResult.count || 0;
      console.log(`📊 Found ${affectedTickets} tickets in the target date range`);
      
      if (affectedTickets === 0) {
        console.log(`✅ No tickets found in the target date range. Migration completed.`);
        result.success = true;
        return result;
      }

      result.totalRecords = affectedTickets;

      // Step 4: Process tickets in batches
      console.log(`🔄 Processing ${affectedTickets} tickets with new random dates...`);
      const batchSize = 50;
      let offset = 0;
      let hasMore = true;
      let batchNumber = 0;
      
      while (hasMore) {
        batchNumber++;
        console.log(`\n🔄 Processing batch ${batchNumber} (offset: ${offset}, limit: ${batchSize})...`);
        
        try {
          // Read batch of tickets in the target date range
          const batch = await this.readBatchTicketsInRange(qdrantService, july12Start, july15End, offset, batchSize);
          
          if (batch.length === 0) {
            console.log(`✅ No more tickets to process.`);
            hasMore = false;
            break;
          }
          
          console.log(`📥 Read ${batch.length} tickets from offset ${offset}`);
          
          // Transform and update batch
          const transformedBatch = this.transformBatch(batch);
          console.log(`🔄 Updating ${transformedBatch.length} points...`);
          
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

      // Step 5: Verify migration
      if (result.processedRecords === result.totalRecords) {
        console.log(`\n🔍 Verifying migration...`);
        try {
          const updatedCountResult = await qdrantService.client.count(this.COLLECTION_NAME, {
            exact: true,
            filter: {
              must: [
                {
                  key: 'created_at',
                  range: {
                    gte: july12Start,
                    lte: july15End
                  }
                }
              ]
            }
          });

          const remainingTickets = updatedCountResult.count || 0;
          console.log(`📊 Remaining tickets in July 12-15 range: ${remainingTickets}`);
          
          if (remainingTickets === 0) {
            console.log(`✅ Migration verification successful! All tickets moved out of July 12-15 range.`);
          } else {
            console.warn(`⚠️  Migration verification: ${remainingTickets} tickets still in July 12-15 range`);
            result.errors.push(`Verification: ${remainingTickets} tickets still in target range`);
          }
        } catch (error: any) {
          console.error(`❌ Failed to verify migration: ${error.message}`);
          result.errors.push(`Verification failed: ${error.message}`);
        }
      }
      
      console.log(`\n🎉 Migration completed!`);
      console.log(`📊 Final results:`);
      console.log(`   - Total tickets in range: ${result.totalRecords}`);
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

  private async readBatchTicketsInRange(qdrantService: QdrantService, startTime: number, endTime: number, offset: number, limit: number): Promise<any[]> {
    try {
      const result = await qdrantService.client.scroll(this.COLLECTION_NAME, {
        limit,
        offset,
        with_payload: true,
        with_vector: true,
        filter: {
          must: [
            {
              key: 'created_at',
              range: {
                gte: startTime,
                lte: endTime
              }
            }
          ]
        }
      });
      
      const points = result.points || [];
      return points;
    } catch (error: any) {
      console.error(`❌ Failed to read batch from collection: ${error.message}`);
      throw error;
    }
  }

  private transformBatch(tickets: any[]): QdrantTicketPoint[] {
    console.log(`🔄 Transforming ${tickets.length} tickets with new random 2025 dates...`);
    
    const transformed = tickets.map((ticket, index) => {
      const ticketId = ticket.id;
      const qdrantPointId = typeof ticketId === 'string' ? ticketId : uuidv5(ticketId.toString(), QDRANT_POINT_NAMESPACE);
      
      // Generate random date in 2025 using ticket ID as seed for better distribution
      const random2025Date = this.generateRandom2025DateWithSeed(ticketId);
      const random2025Timestamp = random2025Date.getTime();
      const random2025DateString = random2025Date.toISOString();

      if (index < 3) {
        console.log(`   Ticket ${index + 1}: created_at=${ticket.payload?.created_at} → ${random2025Timestamp} (${random2025DateString})`);
        console.log(`   Ticket ${index + 1}: timestamp=${ticket.payload?.timestamp} → ${random2025DateString}`);
      }

      return {
        id: qdrantPointId,
        vector: ticket.vector || new Array(768).fill(0), // Ensure 768-dimensional vector
        payload: {
          ...ticket.payload,
          created_at: random2025Timestamp,
          timestamp: random2025DateString
        }
      };
    });

    console.log(`✅ Transformed ${transformed.length} tickets`);
    return transformed;
  }

  private generateRandom2025DateWithSeed(seed: string | number): Date {
    // Generate a random date in 2025 using a seed for better distribution
    const startOf2025 = new Date('2025-01-01T00:00:00.000Z');
    const today = new Date();
    const endOf2025 = new Date('2025-12-31T23:59:59.999Z');
    
    // Use the earlier of today or end of 2025
    const endDate = today < endOf2025 ? today : endOf2025;
    
    const startTime = startOf2025.getTime();
    const endTime = endDate.getTime();
    
    // Create a pseudo-random number based on the seed
    const seedStr = seed.toString();
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      const char = seedStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert hash to a number between 0 and 1
    const randomValue = Math.abs(hash) / 2147483647; // Max 32-bit integer
    
    const randomTime = startTime + randomValue * (endTime - startTime);
    return new Date(randomTime);
  }
} 