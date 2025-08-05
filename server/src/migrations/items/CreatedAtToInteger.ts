import { BaseMigration } from '../BaseMigration';
import { MigrationResult } from '../types';
import QdrantService from '../../qdrant/service';
import { ticketCollectionConfig, QdrantTicketPoint } from '../../qdrant/schemas/ticket';
import { v5 as uuidv5 } from 'uuid';
import { QDRANT_POINT_NAMESPACE } from '../../qdrant/utils';

export class CreatedAtToIntegerMigration extends BaseMigration {
  name = 'created-at-to-integer';
  description = 'Convert created_at field from string to integer timestamps and preserve original strings in timestamp field by creating new Qdrant collection';
  version = '1.0.0';
  databaseType = 'qdrant' as const;

  private readonly NEW_COLLECTION_NAME = 'tickets_v2';
  private readonly OLD_COLLECTION_NAME = 'tickets';

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
      // Step 1: Check if old collection exists
      console.log(`🔍 Checking if collection "${this.OLD_COLLECTION_NAME}" exists...`);
      const collections = await qdrantService.client.getCollections();
      const oldCollection = collections.collections.find(
        collection => collection.name === this.OLD_COLLECTION_NAME
      );
      
      if (!oldCollection) {
        console.log(`⚠️  Collection "${this.OLD_COLLECTION_NAME}" does not exist. No tickets to migrate.`);
        result.success = true;
        return result;
      }

      console.log(`✅ Collection "${this.OLD_COLLECTION_NAME}" found`);

      // Step 2: Check if new collection already exists
      console.log(`🔍 Checking if collection "${this.NEW_COLLECTION_NAME}" exists...`);
      const newCollection = collections.collections.find(
        collection => collection.name === this.NEW_COLLECTION_NAME
      );

      if (newCollection) {
        console.log(`⚠️  Collection "${this.NEW_COLLECTION_NAME}" already exists. Migration already completed.`);
        console.log(`🔍 DIAGNOSTIC: Checking if collection actually has data...`);
        try {
          const newCollectionInfo = await qdrantService.client.getCollection(this.NEW_COLLECTION_NAME);
          const newTotalPoints = newCollectionInfo.points_count || 0;
          console.log(`📊 Collection "${this.NEW_COLLECTION_NAME}" contains ${newTotalPoints} points`);
          
          if (newTotalPoints === 0) {
            console.log(`⚠️  Collection exists but is empty. Proceeding with migration...`);
          } else {
            console.log(`✅ Collection has data. Skipping migration.`);
            result.success = true;
            return result;
          }
        } catch (error: any) {
          console.error(`❌ Failed to check collection: ${error.message}`);
          result.success = false;
          return result;
        }
      }

      // Step 3: Get old collection info
      console.log(`🔍 Getting old collection info...`);
      const oldCollectionInfo = await qdrantService.client.getCollection(this.OLD_COLLECTION_NAME);
      const totalPoints = oldCollectionInfo.points_count || 0;
      console.log(`📊 Collection "${this.OLD_COLLECTION_NAME}" contains ${totalPoints} total points`);
      
      if (totalPoints === 0) {
        console.log(`✅ Collection is empty. No tickets to migrate.`);
        result.success = true;
        return result;
      }

      // Step 4: Create new collection
      console.log(`🔧 Creating new collection "${this.NEW_COLLECTION_NAME}"...`);
      try {
        await qdrantService.client.createCollection(this.NEW_COLLECTION_NAME, {
          vectors: {
            size: 768,
            distance: 'Cosine'
          },
          on_disk_payload: true
        });
        console.log(`✅ Created new collection "${this.NEW_COLLECTION_NAME}"`);
      } catch (error: any) {
        console.error(`❌ Failed to create new collection: ${error.message}`);
        result.errors.push(`Failed to create new collection: ${error.message}`);
        return result;
      }

      // Step 5: Read all tickets from old collection
      console.log(`📥 Reading all tickets from old collection...`);
      const allTickets = await this.readAllTickets(qdrantService, this.OLD_COLLECTION_NAME);
      result.totalRecords = allTickets.length;
      
      console.log(`📈 Found ${allTickets.length} tickets to migrate`);
      
      if (allTickets.length === 0) {
        console.log(`✅ No tickets to migrate.`);
        result.success = true;
        return result;
      }

      // Step 6: Transform and migrate tickets
      console.log(`🔄 Migrating tickets to new collection...`);
      const batchSize = 100;
      const batches = this.createBatches(allTickets, batchSize);
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const batchNumber = i + 1;
        const totalBatches = batches.length;
        
        console.log(`\n🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} tickets)...`);
        
        try {
          const transformedBatch = this.transformBatch(batch);
          console.log(`🔄 Inserting ${transformedBatch.length} points...`);
          
          // Log the first point structure for debugging
          if (batchNumber === 1) {
            console.log(`🔍 DIAGNOSTIC - First point structure:`, JSON.stringify(transformedBatch[0], null, 2));
          }
          
          const success = await qdrantService.client.upsert(this.NEW_COLLECTION_NAME, {
            wait: true,
            points: transformedBatch
          });
          
          console.log(`🔍 DIAGNOSTIC - Upsert result:`, success);
          
          if (success) {
            result.processedRecords! += transformedBatch.length;
            console.log(`✅ Batch ${batchNumber}/${totalBatches} completed successfully`);
            console.log(`📊 Progress: ${result.processedRecords}/${result.totalRecords} tickets (${Math.round(((result.processedRecords || 0) / result.totalRecords) * 100)}%)`);
          } else {
            throw new Error('Upsert returned false');
          }
        } catch (error: any) {
          console.error(`❌ Batch ${batchNumber}/${totalBatches} failed: ${error.message}`);
          
          // Log detailed error information
          if (error.response) {
            console.error(`❌ Response status: ${error.response.status}`);
            console.error(`❌ Response data:`, JSON.stringify(error.response.data, null, 2));
          }
          
          result.errors.push(`Batch ${batchNumber}/${totalBatches}: ${error.message}`);
          
          // Stop after first error
          console.error(`❌ First error encountered. Stopping migration.`);
          break;
        }
      }

      // Step 7: Verify migration
      if (result.processedRecords === result.totalRecords) {
        console.log(`\n🔍 Verifying migration...`);
        try {
          const newCollectionInfo = await qdrantService.client.getCollection(this.NEW_COLLECTION_NAME);
          const newTotalPoints = newCollectionInfo.points_count || 0;
          console.log(`📊 New collection contains ${newTotalPoints} points`);
          
          if (newTotalPoints === result.totalRecords) {
            console.log(`✅ Migration verification successful!`);
            console.log(`\n📋 NEXT STEPS:`);
            console.log(`1. Update your application to use collection "${this.NEW_COLLECTION_NAME}"`);
            console.log(`2. Test that everything works correctly`);
            console.log(`3. Delete the old collection "${this.OLD_COLLECTION_NAME}" when ready`);
          } else {
            console.warn(`⚠️  Migration verification failed: Expected ${result.totalRecords} points, got ${newTotalPoints}`);
            result.errors.push(`Verification failed: Expected ${result.totalRecords} points, got ${newTotalPoints}`);
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

  private async readAllTickets(qdrantService: QdrantService, collectionName: string): Promise<any[]> {
    console.log(`🔍 Reading all points from collection "${collectionName}"...`);
    
    try {
      const collectionInfo = await qdrantService.client.getCollection(collectionName);
      const totalPoints = collectionInfo.points_count || 0;
      
      if (totalPoints === 0) {
        return [];
      }
      
      console.log(`📊 Reading ${totalPoints} points...`);
      
      const result = await qdrantService.client.scroll(collectionName, {
        limit: totalPoints,
        with_payload: true,
        with_vector: true
      });
      
      const points = result.points || [];
      console.log(`✅ Successfully read ${points.length} points`);
      
      return points;
    } catch (error: any) {
      console.error(`❌ Failed to read collection: ${error.message}`);
      throw error;
    }
  }

  private transformBatch(tickets: any[]): QdrantTicketPoint[] {
    console.log(`🔄 Transforming ${tickets.length} tickets...`);
    
    const transformed = tickets.map((ticket, index) => {
      const ticketId = ticket.id;
      const qdrantPointId = typeof ticketId === 'string' ? ticketId : uuidv5(ticketId.toString(), QDRANT_POINT_NAMESPACE);
      
      // Convert string created_at to integer timestamp
      const createdAtString = ticket.payload?.created_at;
      const createdAtInteger = createdAtString ? new Date(createdAtString).getTime() : Date.now();

      if (index < 3) {
        console.log(`   Ticket ${index + 1}: "${createdAtString}" → ${createdAtInteger} (preserved in timestamp field)`);
      }

      return {
        id: qdrantPointId,
        vector: ticket.vector || new Array(768).fill(0), // Ensure 768-dimensional vector
        payload: {
          ...ticket.payload,
          created_at: createdAtInteger,
          timestamp: createdAtString // Preserve original string timestamp
        }
      };
    });

    console.log(`✅ Transformed ${transformed.length} tickets`);
    return transformed;
  }

  private createBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }
}