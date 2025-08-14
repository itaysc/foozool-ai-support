import { BaseMigration } from '../BaseMigration';
import { MigrationResult } from '../types';
import QdrantService from '../../qdrant/service';
import { ticketCollectionConfig } from '../../qdrant/schemas/ticket';

export class AddResolutionTimeDataToQdrantMigration extends BaseMigration {
  name = 'add-resolution-time-data-to-qdrant';
  description = 'Add mock resolution time prediction data to 2000 Qdrant tickets to demonstrate the new features';
  version = '1.0.0';
  databaseType = 'qdrant' as const;

  protected async execute(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      totalRecords: 0,
      processedRecords: 0,
      errors: []
    };

    console.log(`🚀 Starting ${this.name} migration...`);

    try {
      const qdrantService = new QdrantService();
      
      // Get all tickets from Qdrant
      console.log(`📊 Fetching tickets from Qdrant collection: ${ticketCollectionConfig.name}`);
      
      let allTickets: any[] = [];
      let offset = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore && allTickets.length < 2000) {
        const searchResult = await qdrantService.client.scroll(ticketCollectionConfig.name, {
          limit: Math.min(batchSize, 2000 - allTickets.length),
          offset,
          with_payload: true,
          with_vector: false,
        });

        if (!searchResult.points || searchResult.points.length === 0) {
          break;
        }

        allTickets = allTickets.concat(searchResult.points as any[]);
        offset += batchSize;
        hasMore = searchResult.points.length === batchSize;
        
        console.log(`📦 Fetched ${allTickets.length} tickets so far...`);
      }

      // Limit to 2000 tickets
      allTickets = allTickets.slice(0, 2000);
      result.totalRecords = allTickets.length;
      
      console.log(`📊 Found ${result.totalRecords} tickets to update with resolution time data`);
      
      // Debug: Show structure of first ticket
      if (allTickets.length > 0) {
        const firstTicket = allTickets[0];
        console.log(`🔍 First ticket structure:`);
        console.log(`  ID: ${firstTicket.id}`);
        console.log(`  ID type: ${typeof firstTicket.id}`);
        console.log(`  Payload keys: ${Object.keys(firstTicket.payload || {}).join(', ')}`);
        console.log(`  Has ticket_id: ${!!firstTicket.payload?.ticket_id}`);
        if (firstTicket.payload?.ticket_id) {
          console.log(`  ticket_id value: ${firstTicket.payload.ticket_id}`);
        }
        
        // Try to retrieve the first point to see if it exists
        try {
          const testRetrieve = await qdrantService.client.retrieve(ticketCollectionConfig.name, {
            ids: [firstTicket.id],
            with_payload: true,
            with_vector: false,
          });
          console.log(`  Point exists in Qdrant: ${!!testRetrieve && !!(testRetrieve as any).points && (testRetrieve as any).points.length > 0}`);
        } catch (error) {
          console.log(`  Error retrieving point: ${(error as Error).message}`);
        }
      }

      if (result.totalRecords === 0) {
        console.log(`✅ No tickets found to update`);
        result.success = true;
        return result;
      }

      // Process tickets in batches to avoid memory issues
      const processBatchSize = 50;
      let processedCount = 0;
      let skippedCount = 0;

      for (let i = 0; i < allTickets.length; i += processBatchSize) {
        const batch = allTickets.slice(i, i + processBatchSize);
        console.log(`📦 Processing batch ${Math.floor(i / processBatchSize) + 1}/${Math.ceil(allTickets.length / processBatchSize)}`);

        const batchPromises = batch.map(async (ticket) => {
          try {
            // Get the ticket_id from the payload
            const ticketId = ticket.payload?.ticket_id;
            if (!ticketId) {
              console.log(`⚠️  Skipping ticket - no ticket_id in payload`);
              return { success: false, reason: 'no_ticket_id' };
            }

            // Generate mock data based on the ticket payload
            const mockData = this.generateMockResolutionTimeData(ticket);
            
            // Debug: Show what fields are being added
            console.log(`🔧 Adding fields to ticket ${ticketId}:`, Object.keys(mockData).join(', '));
            
            // Update the point directly using Qdrant client
            try {
              // Create updated point with existing data plus new fields
              const updatedPoint = {
                id: ticket.id,
                vector: ticket.vector || new Array(768).fill(0), // Use existing vector or default
                payload: {
                  ...ticket.payload, // Keep all existing fields
                  ...mockData, // Add new resolution time fields
                }
              };

              // Upsert the updated point (this will create or update)
              await qdrantService.client.upsert(ticketCollectionConfig.name, {
                wait: true,
                points: [updatedPoint],
              });

              console.log(`✅ Successfully updated ticket ${ticketId} (point ID: ${ticket.id})`);
              return { success: true, reason: 'updated' };
              
            } catch (updateError) {
              console.log(`⚠️  Error updating ticket ${ticketId} (point ID: ${ticket.id}): ${(updateError as Error).message}`);
              return { success: false, reason: 'update_error', error: (updateError as Error).message };
            }
          } catch (error) {
            console.log(`⚠️  Error processing ticket: ${(error as Error).message}`);
            return { success: false, reason: 'error', error: (error as Error).message };
          }
        });

        try {
          const batchResults = await Promise.all(batchPromises);
          
          const successfulUpdates = batchResults.filter(r => r.reason === 'updated').length;
          const failedUpdates = batchResults.filter(r => r.reason === 'update_failed').length;
          const noTicketId = batchResults.filter(r => r.reason === 'no_ticket_id').length;
          const errors = batchResults.filter(r => r.reason === 'error' || r.reason === 'update_error').length;
          
          processedCount += successfulUpdates;
          skippedCount += noTicketId;
          
          console.log(`✅ Batch completed: ${successfulUpdates} updated successfully`);
          if (failedUpdates > 0) console.log(`⚠️  ${failedUpdates} updates failed`);
          if (noTicketId > 0) console.log(`⚠️  ${noTicketId} tickets skipped (no ticket_id)`);
          if (errors > 0) console.log(`❌ ${errors} tickets had errors`);
          
        } catch (error) {
          const errorMsg = `Failed to process batch: ${(error as Error).message}`;
          console.error(`❌ ${errorMsg}`);
          result.errors.push(errorMsg);
        }

        // Small delay between batches to avoid overwhelming Qdrant
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      result.processedRecords = processedCount;
      result.success = result.errors.length === 0;
      
      // Add metadata about the results
      result.metadata = {
        updatedRecords: processedCount,
        skippedRecords: skippedCount,
        totalProcessed: processedCount + skippedCount
      };

      console.log(`🎯 Migration completed: ${processedCount} tickets updated successfully`);
      console.log(`⚠️  Skipped ${skippedCount} tickets (no ticket_id or errors)`);
      
      if (result.errors.length > 0) {
        console.log(`❌ ${result.errors.length} errors occurred during migration`);
      }

      return result;

    } catch (error) {
      const errorMsg = `Migration failed: ${(error as Error).message}`;
      console.error(`❌ ${errorMsg}`);
      result.errors.push(errorMsg);
      return result;
    }
  }

  private generateMockResolutionTimeData(ticket: any) {
    const now = Date.now();
    // Use the existing created_at timestamp if available, otherwise use current time
    const createdTime = ticket.payload?.created_at || now;
    
    // Generate realistic resolution time data that shows good prediction accuracy
    const mockData: any = {};
    
    // 70% of tickets should have resolution data (simulating resolved tickets)
    if (Math.random() < 0.7) {
      // Generate resolution time between 2 hours and 7 days
      const minResolutionTime = 2 * 60 * 60 * 1000; // 2 hours in ms
      const maxResolutionTime = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
      const resolutionTime = Math.floor(Math.random() * (maxResolutionTime - minResolutionTime + 1)) + minResolutionTime;
      
      mockData.resolution_time_ms = resolutionTime;
      mockData.resolved_at = createdTime + resolutionTime;
      
      // Determine if this should be a "long resolution" case (> 24 hours)
      const isLongResolution = resolutionTime > 24 * 60 * 60 * 1000;
      
      if (isLongResolution) {
        // 80% of long resolution tickets should have been predicted correctly
        const wasPredictedCorrectly = Math.random() < 0.8;
        
        if (wasPredictedCorrectly) {
          mockData.long_resolution_predicted = true;
          mockData.prediction_confidence = Math.random() * 0.3 + 0.7; // 70-100% confidence
          mockData.prediction_added_at = createdTime + Math.floor(Math.random() * 60 * 60 * 1000); // Within 1 hour of creation
        } else {
          // 20% were not predicted (false negative)
          mockData.long_resolution_predicted = false;
        }
      } else {
        // Short resolution tickets
        // 90% should not have been predicted as long resolution (true negative)
        const wasPredictedIncorrectly = Math.random() < 0.1;
        
        if (wasPredictedIncorrectly) {
          mockData.long_resolution_predicted = true;
          mockData.prediction_confidence = Math.random() * 0.4 + 0.5; // 50-90% confidence
          mockData.prediction_added_at = createdTime + Math.floor(Math.random() * 60 * 60 * 1000);
        } else {
          mockData.long_resolution_predicted = false;
        }
      }
    } else {
      // 30% of tickets are still open (no resolution data)
      // Some of these might have predictions
      if (Math.random() < 0.3) {
        mockData.long_resolution_predicted = true;
        mockData.prediction_confidence = Math.random() * 0.3 + 0.6; // 60-90% confidence
        mockData.prediction_added_at = createdTime + Math.floor(Math.random() * 60 * 60 * 1000);
      }
    }

    return mockData;
  }
}
