import { BaseMigration } from '../BaseMigration';
import { MigrationResult } from '../types';
import QdrantService from '../../qdrant/service';
import { ticketCollectionConfig, QdrantTicketPoint } from '../../qdrant/schemas/ticket';
import { v5 as uuidv5 } from 'uuid';
import { QDRANT_POINT_NAMESPACE } from '../../qdrant/utils';

export class AddBotPerformanceDataMigration extends BaseMigration {
  name = 'add-bot-performance-data';
  description = 'Add mock bot performance data to existing Qdrant ticket points for insights dashboard';
  version = '1.0.0';
  databaseType = 'qdrant' as const;

  private readonly COLLECTION_NAME = 'tickets_v2';

  protected async execute(): Promise<MigrationResult> {
    console.log(`🚀 Starting ${this.name} migration...`);
    console.log(`📋 Migration Details:`);
    console.log(`   - Name: ${this.name}`);
    console.log(`   - Version: ${this.version}`);
    console.log(`   - Target Collection: ${this.COLLECTION_NAME}`);
    console.log(`   - Database Type: ${this.databaseType}`);
    console.log(`   - Timestamp: ${new Date().toISOString()}`);
    
    console.log(`🌍 Environment Information:`);
    console.log(`   - Node.js Version: ${process.version}`);
    console.log(`   - Platform: ${process.platform}`);
    console.log(`   - Architecture: ${process.arch}`);
    console.log(`   - Working Directory: ${process.cwd()}`);
    console.log(`   - User: ${process.env.USER || process.env.USERNAME || 'unknown'}`);
    
    // Check for Qdrant environment variables
    console.log(`🔧 Qdrant Configuration:`);
    console.log(`   - QDRANT_URL: ${process.env.QDRANT_URL || 'not set'}`);
    console.log(`   - QDRANT_API_KEY: ${process.env.QDRANT_API_KEY ? '***set***' : 'not set'}`);
    console.log(`   - QDRANT_HOST: ${process.env.QDRANT_HOST || 'not set'}`);
    console.log(`   - QDRANT_PORT: ${process.env.QDRANT_PORT || 'not set'}`);

    const qdrantService = new QdrantService();
    const result: MigrationResult = {
      success: false,
      totalRecords: 0,
      processedRecords: 0,
      errors: []
    };

    try {
      // Step 1: Initialize Qdrant connection
      console.log(`🔌 Initializing Qdrant connection...`);
      console.log(`   - Qdrant Service initialized: ${!!qdrantService}`);
      console.log(`   - Qdrant Client available: ${!!qdrantService.client}`);
      
      // Step 2: Check if collection exists
      console.log(`🔍 Checking if collection "${this.COLLECTION_NAME}" exists...`);
      
      let collections;
      try {
        collections = await qdrantService.client.getCollections();
        console.log(`✅ Successfully retrieved collections list`);
        console.log(`   - Total collections found: ${collections.collections?.length || 0}`);
        console.log(`   - Available collections: ${collections.collections?.map(c => c.name).join(', ') || 'none'}`);
      } catch (collectionError: any) {
        console.error(`❌ Failed to get collections:`, collectionError);
        console.error(`   - Error type: ${collectionError.constructor.name}`);
        console.error(`   - Error message: ${collectionError.message}`);
        console.error(`   - Error status: ${collectionError.status || 'unknown'}`);
        throw new Error(`Failed to access Qdrant collections: ${collectionError.message}`);
      }
      
      const collection = collections.collections.find(
        col => col.name === this.COLLECTION_NAME
      );
      
      if (!collection) {
        console.log(`⚠️  Collection "${this.COLLECTION_NAME}" does not exist.`);
        console.log(`   Available collections: ${collections.collections?.map(c => c.name).join(', ') || 'none'}`);
        result.success = true;
        return result;
      }

      console.log(`✅ Collection "${this.COLLECTION_NAME}" found`);
      console.log(`   - Collection details: ${JSON.stringify(collection, null, 2)}`);

      // Step 3: Count total points in collection (we'll filter during processing)
      console.log(`🔍 Counting total points in collection...`);
      console.log(`   - Note: Will filter for points without bot data during processing to avoid index issues`);
      
      let countResult;
      try {
        countResult = await qdrantService.client.count(this.COLLECTION_NAME, {
          exact: true
          // No filter to avoid index requirement issues
        });
        console.log(`✅ Successfully executed count query`);
        console.log(`   - Count result: ${JSON.stringify(countResult, null, 2)}`);
      } catch (countError: any) {
        console.error(`❌ Failed to count points:`, countError);
        console.error(`   - Error type: ${countError.constructor.name}`);
        console.error(`   - Error message: ${countError.message}`);
        console.error(`   - Error status: ${countError.status || 'unknown'}`);
        console.error(`   - Error code: ${countError.code || 'unknown'}`);
        throw new Error(`Failed to count total points: ${countError.message}`);
      }

      const totalPoints = countResult.count || 0;
      console.log(`📊 Found ${totalPoints} total points in collection`);
      
      if (totalPoints === 0) {
        console.log(`✅ No points found in collection. Migration completed.`);
        result.success = true;
        return result;
      }

      result.totalRecords = totalPoints;
      console.log(`📝 Set totalRecords to: ${result.totalRecords}`);

      // Step 4: Process points in batches
      console.log(`🔄 Processing ${totalPoints} points to add bot performance data (will filter during processing)...`);
      const batchSize = 100;
      const totalBatches = Math.ceil(totalPoints / batchSize);
      let offset = 0;
      let hasMore = true;
      let batchNumber = 0;
      
      console.log(`📊 Batch Processing Setup:`);
      console.log(`   - Total points to process: ${totalPoints}`);
      console.log(`   - Batch size: ${batchSize}`);
      console.log(`   - Estimated total batches: ${totalBatches}`);
      console.log(`   - Starting offset: ${offset}`);
      
      while (hasMore) {
        batchNumber++;
        const progressPercent = Math.round(((batchNumber - 1) / totalBatches) * 100);
        
        console.log(`\n🔄 === BATCH ${batchNumber}/${totalBatches} (${progressPercent}%) ===`);
        console.log(`   - Offset: ${offset}`);
        console.log(`   - Limit: ${batchSize}`);
        console.log(`   - Expected range: ${offset} to ${Math.min(offset + batchSize - 1, totalPoints - 1)}`);
        
        try {
          // Read batch of points without bot performance data
          console.log(`📖 Reading batch ${batchNumber}...`);
          const startTime = Date.now();
          
          const batch = await this.readBatchPointsWithoutBotData(qdrantService, offset, batchSize);
          const readTime = Date.now() - startTime;
          
          console.log(`📥 Batch ${batchNumber} read completed in ${readTime}ms`);
          
          if (!batch || !Array.isArray(batch)) {
            console.error(`❌ Batch ${batchNumber} failed: readBatchPointsWithoutBotData returned invalid result`);
            console.error(`   - Batch result: ${batch}`);
            throw new Error(`Invalid batch result: expected array but got ${typeof batch}`);
          }
          
          console.log(`   - Points retrieved: ${batch.length}`);
          console.log(`   - Expected points: ${Math.min(batchSize, totalPoints - offset)}`);
          
          if (batch.length === 0) {
            console.log(`✅ No more points to process at offset ${offset}.`);
            hasMore = false;
            break;
          }
          
          // Transform and update batch with bot performance data
          console.log(`🔧 Transforming batch ${batchNumber} with bot performance data...`);
          const transformStartTime = Date.now();
          
          const transformedBatch = this.addBotPerformanceData(batch);
          const transformTime = Date.now() - transformStartTime;
          
          console.log(`🔧 Batch ${batchNumber} transformation completed in ${transformTime}ms`);
          
          if (!transformedBatch || !Array.isArray(transformedBatch)) {
            console.error(`❌ Batch ${batchNumber} transformation failed: transformedBatch is not an array`);
            console.error(`   - transformedBatch: ${transformedBatch}`);
            console.error(`   - Original batch length: ${batch?.length || 'undefined'}`);
            throw new Error(`Transformation failed: expected array but got ${typeof transformedBatch}`);
          }
          
          console.log(`   - Points transformed: ${transformedBatch.length}`);
          
          // Log the first point structure for debugging (only for first batch)
          if (batchNumber === 1) {
            console.log(`🔍 DIAGNOSTIC - First point structure:`);
            console.log(`   - Point ID: ${transformedBatch[0].id}`);
            console.log(`   - Bot Performance Fields:`);
            console.log(`     • bot_processed: ${transformedBatch[0].payload.bot_processed}`);
            console.log(`     • bot_actions: ${JSON.stringify(transformedBatch[0].payload.bot_actions)}`);
            console.log(`     • resolution_source: ${transformedBatch[0].payload.resolution_source}`);
            console.log(`     • bot_processing_time: ${transformedBatch[0].payload.bot_processing_time}`);
            console.log(`     • bot_confidence_score: ${transformedBatch[0].payload.bot_confidence_score}`);
            console.log(`     • escalated_to_human: ${transformedBatch[0].payload.escalated_to_human}`);
            console.log(`     • bot_model_version: ${transformedBatch[0].payload.bot_model_version}`);
          }
          
          console.log(`💾 Upserting batch ${batchNumber} to Qdrant...`);
          const upsertStartTime = Date.now();
          
          let success;
          try {
            success = await qdrantService.client.upsert(this.COLLECTION_NAME, {
              wait: true,
              points: transformedBatch
            });
            const upsertTime = Date.now() - upsertStartTime;
            console.log(`💾 Batch ${batchNumber} upsert completed in ${upsertTime}ms`);
            console.log(`   - Upsert result: ${JSON.stringify(success, null, 2)}`);
          } catch (upsertError: any) {
            const upsertTime = Date.now() - upsertStartTime;
            console.error(`❌ Batch ${batchNumber} upsert failed after ${upsertTime}ms:`, upsertError);
            console.error(`   - Error type: ${upsertError.constructor.name}`);
            console.error(`   - Error message: ${upsertError.message}`);
            console.error(`   - Error status: ${upsertError.status || 'unknown'}`);
            console.error(`   - Error code: ${upsertError.code || 'unknown'}`);
            throw upsertError;
          }
          
          if (success) {
            result.processedRecords! += transformedBatch.length;
            const totalProgress = Math.round(((result.processedRecords || 0) / (result.totalRecords || 1)) * 100);
            
            console.log(`✅ Batch ${batchNumber}/${totalBatches} completed successfully`);
            console.log(`📊 Overall Progress: ${result.processedRecords}/${result.totalRecords || 0} points (${totalProgress}%)`);
            console.log(`📊 Remaining: ${(result.totalRecords || 0) - (result.processedRecords || 0)} points in ~${Math.ceil(((result.totalRecords || 0) - (result.processedRecords || 0)) / batchSize)} batches`);
            
            // Advance offset by the number of points actually read from Qdrant (before filtering)
            const readPointsCount = batch?.length || 0;
            offset += readPointsCount;
            
            // If we read fewer points than requested, we've reached the end
            if (readPointsCount < batchSize) {
              console.log(`📝 Read ${readPointsCount} points, less than batch size ${batchSize}. Reached end of collection.`);
              hasMore = false;
            }
          } else {
            const errorMsg = `Failed to upsert batch ${batchNumber} - upsert returned false`;
            console.error(`❌ ${errorMsg}`);
            result.errors.push(errorMsg);
            hasMore = false;
          }
          
        } catch (batchError: any) {
          const errorMsg = `Batch ${batchNumber}/${totalBatches} failed: ${batchError.message}`;
          console.error(`❌ ${errorMsg}`);
          console.error(`   - Error type: ${batchError.constructor.name}`);
          console.error(`   - Error status: ${batchError.status || 'unknown'}`);
          console.error(`   - Error code: ${batchError.code || 'unknown'}`);
          console.error(`   - Current offset: ${offset}`);
          console.error(`   - Processed so far: ${result.processedRecords}/${result.totalRecords || 0}`);
          
          result.errors.push(errorMsg);
          
          // Try to continue with next batch unless it's a critical error
          if (batchError.message.includes('connection') || 
              batchError.message.includes('timeout') ||
              batchError.message.includes('Forbidden') ||
              batchError.status === 403 ||
              batchError.status === 401) {
            console.log(`💔 Critical error detected (${batchError.status || batchError.message}), stopping migration`);
            hasMore = false;
          } else {
            console.log(`⚠️  Non-critical error, attempting to continue with next batch`);
            offset += batchSize; // Skip this batch
          }
        }
      }

      // Step 4: Verify migration
      if (result.processedRecords! > 0) {
        console.log(`\n🔍 Verifying migration...`);
        try {
          const verifyCountResult = await qdrantService.client.count(this.COLLECTION_NAME, {
            exact: true,
            filter: {
              must: [
                {
                  key: 'bot_processed',
                  match: { value: true }
                }
              ]
            }
          });

          const pointsWithBotData = verifyCountResult.count || 0;
          console.log(`📊 Points with bot performance data: ${pointsWithBotData}`);
          
          console.log(`✅ Migration verification: ${pointsWithBotData} points now have bot performance data.`);
          
        } catch (error: any) {
          console.error(`❌ Failed to verify migration: ${error.message}`);
          result.errors.push(`Verification failed: ${error.message}`);
        }
      }
      
      console.log(`\n🎉 Migration completed!`);
      console.log(`📊 Final results:`);
      console.log(`   - Total points found without bot data: ${result.totalRecords}`);
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
      console.error(`❌ MIGRATION FAILURE DETAILS:`);
      console.error(`   - Error Message: ${error.message}`);
      console.error(`   - Error Type: ${error.constructor.name}`);
      console.error(`   - Error Status: ${error.status || 'unknown'}`);
      console.error(`   - Error Code: ${error.code || 'unknown'}`);
      console.error(`   - Stack Trace: ${error.stack || 'not available'}`);
      console.error(`   - Migration Progress:`);
      console.error(`     • Total Records: ${result.totalRecords || 0}`);
      console.error(`     • Processed Records: ${result.processedRecords || 0}`);
      console.error(`     • Success Rate: ${(result.totalRecords || 0) > 0 ? Math.round(((result.processedRecords || 0) / (result.totalRecords || 1)) * 100) : 0}%`);
      console.error(`     • Previous Errors: ${result.errors.length}`);
      
      // Add additional context based on error type
      if (error.status === 403 || error.message.includes('Forbidden')) {
        console.error(`🔐 PERMISSION ERROR ANALYSIS:`);
        console.error(`   - This appears to be a permissions/authentication error`);
        console.error(`   - Check Qdrant API key and permissions`);
        console.error(`   - Verify collection access rights`);
        console.error(`   - Ensure Qdrant server is accessible`);
      } else if (error.status === 401 || error.message.includes('Unauthorized')) {
        console.error(`🔑 AUTHENTICATION ERROR ANALYSIS:`);
        console.error(`   - Authentication failed with Qdrant`);
        console.error(`   - Check QDRANT_API_KEY environment variable`);
        console.error(`   - Verify API key is valid and not expired`);
      } else if (error.message.includes('connection') || error.message.includes('timeout')) {
        console.error(`🌐 CONNECTION ERROR ANALYSIS:`);
        console.error(`   - Network connectivity issue with Qdrant`);
        console.error(`   - Check QDRANT_URL/QDRANT_HOST configuration`);
        console.error(`   - Verify Qdrant server is running and accessible`);
      }
      
      result.errors.push(errorMsg);
      result.success = false;
      return result;
    }
  }

  private async readBatchPointsWithoutBotData(qdrantService: QdrantService, offset: number, limit: number): Promise<any[]> {
    console.log(`   📖 readBatchPointsWithoutBotData called:`);
    console.log(`      - offset: ${offset}`);
    console.log(`      - limit: ${limit}`);
    console.log(`      - collection: ${this.COLLECTION_NAME}`);
    
    const scrollOptions = {
      limit,
      offset,
      with_payload: true,
      with_vector: true
      // Removed filter to avoid index requirement issues
    };
    
    console.log(`   📖 Scroll options: ${JSON.stringify(scrollOptions, null, 2)}`);
    
    try {
      console.log(`   📖 Executing scroll query...`);
      const result = await qdrantService.client.scroll(this.COLLECTION_NAME, scrollOptions);
      
      console.log(`   📖 Scroll query completed successfully`);
      console.log(`      - Points returned: ${result.points?.length || 0}`);
      console.log(`      - Next page offset: ${result.next_page_offset || 'none'}`);
      
      // Filter in-memory for points that don't have bot_processed field or have it set to false
      const pointsWithoutBotData = result.points?.filter(point => {
        if (!point || !point.payload) {
          console.warn(`Warning: Invalid point structure found, skipping: ${JSON.stringify(point)}`);
          return false;
        }
        const hasBotsProcessed = point.payload.bot_processed !== undefined;
        const isBotProcessed = point.payload.bot_processed === true;
        return !hasBotsProcessed || !isBotProcessed;
      }) || [];
      
      console.log(`      - Points without bot data (after filtering): ${pointsWithoutBotData.length}`);
      
      return pointsWithoutBotData;
    } catch (error: any) {
      console.error(`   ❌ Failed to read batch:`, error);
      console.error(`      - Error type: ${error.constructor.name}`);
      console.error(`      - Error message: ${error.message}`);
      console.error(`      - Error status: ${error.status || 'unknown'}`);
      console.error(`      - Error code: ${error.code || 'unknown'}`);
      console.error(`      - Request details: offset=${offset}, limit=${limit}`);
      throw error;
    }
  }

  private addBotPerformanceData(points: any[]): any[] {
    console.log(`🔄 Adding bot performance data to ${points.length} points...`);
    
    if (!points || !Array.isArray(points)) {
      console.error(`❌ Invalid points parameter: expected array but got ${typeof points}`);
      return [];
    }
    
    const botActions = [
      ['auto_reply'],
      ['auto_reply', 'escalate'],
      ['refund'],
      ['coupon'],
      ['auto_resolve'],
      ['auto_reply', 'auto_resolve'],
      ['escalate'],
      ['refund', 'auto_reply'],
      ['coupon', 'auto_reply'],
      []  // No actions taken
    ];

    const resolutionSources = ['bot', 'human', 'hybrid'];
    const botModelVersions = ['gpt-4-turbo-2024-04-09', 'gpt-4-0613', 'gpt-3.5-turbo-0125'];

    const transformed = points.map((point, index) => {
      const pointId = point.id;
      const qdrantPointId = typeof pointId === 'string' ? pointId : uuidv5(pointId.toString(), QDRANT_POINT_NAMESPACE);
      
      // Generate consistent pseudo-random values based on point ID for reproducibility
      const seed = this.generateSeedFromId(pointId);
      
      // Determine if bot processed this ticket (80% chance)
      const botProcessed = this.randomFromSeed(seed, 'processed') > 0.2;
      
      // Generate bot performance data
      let botData: any = {};
      
      if (botProcessed) {
        // Bot processed the ticket
        const actionIndex = Math.floor(this.randomFromSeed(seed, 'action') * botActions.length);
        let selectedActions = botActions[actionIndex] || [];
        
        if (!selectedActions || !Array.isArray(selectedActions)) {
          console.warn(`Warning: Invalid selectedActions for actionIndex ${actionIndex}, using empty array`);
          selectedActions = [];
        }
        
        // Success rate varies based on action complexity
        const baseSuccessRate = selectedActions.length === 0 ? 0.9 : 
                               selectedActions.includes('escalate') ? 0.6 :
                               selectedActions.includes('refund') ? 0.85 :
                               selectedActions.includes('coupon') ? 0.9 :
                               0.8;
        
        const isSuccessful = this.randomFromSeed(seed, 'success') < baseSuccessRate;
        
        // Processing time varies based on complexity (1-10 seconds)
        const baseProcessingTime = selectedActions.length === 0 ? 1000 :
                                 selectedActions.includes('escalate') ? 8000 :
                                 selectedActions.includes('refund') ? 5000 :
                                 3000;
        const processingTimeVariation = this.randomFromSeed(seed, 'time') * 2000;
        const processingTime = Math.round(baseProcessingTime + processingTimeVariation);
        
        // Confidence score (higher for simpler actions)
        const baseConfidence = selectedActions.length === 0 ? 0.9 :
                              selectedActions.includes('escalate') ? 0.4 :
                              selectedActions.includes('refund') ? 0.8 :
                              0.85;
        const confidenceVariation = (this.randomFromSeed(seed, 'confidence') - 0.5) * 0.3;
        const confidenceScore = Math.max(0.1, Math.min(1.0, baseConfidence + confidenceVariation));
        
        // Escalation logic
        const escalatedToHuman = selectedActions.includes('escalate') || 
                                (!isSuccessful && this.randomFromSeed(seed, 'escalate') > 0.7);
        
        // Resolution source
        const resolutionSource = escalatedToHuman ? 
                               (this.randomFromSeed(seed, 'hybrid') > 0.5 ? 'hybrid' : 'human') : 
                               'bot';
        
        // Model version
        const modelIndex = Math.floor(this.randomFromSeed(seed, 'model') * botModelVersions.length);
        
        botData = {
          bot_processed: true,
          bot_actions: selectedActions,
          resolution_source: resolutionSource,
          bot_processing_time: processingTime,
          bot_confidence_score: Math.round(confidenceScore * 100) / 100, // Round to 2 decimal places
          escalated_to_human: escalatedToHuman,
          bot_model_version: botModelVersions[modelIndex]
        };
      } else {
        // Bot did not process this ticket (manual handling)
        botData = {
          bot_processed: false,
          bot_actions: [],
          resolution_source: 'human',
          bot_processing_time: null,
          bot_confidence_score: null,
          escalated_to_human: false,
          bot_model_version: null
        };
      }

      if (index < 3) {
        console.log(`   Point ${index + 1}: bot_processed=${botData.bot_processed}, actions=${JSON.stringify(botData.bot_actions)}, confidence=${botData.bot_confidence_score}, resolution=${botData.resolution_source}`);
      }

      return {
        id: qdrantPointId,
        vector: point.vector || new Array(768).fill(0), // Ensure 768-dimensional vector
        payload: {
          ...point.payload,
          ...botData
        }
      };
    });

    console.log(`✅ Added bot performance data to ${transformed.length} points`);
    return transformed;
  }

  /**
   * Generate a numeric seed from point ID for consistent pseudo-random values
   */
  private generateSeedFromId(id: string | number): number {
    const idStr = id.toString();
    let hash = 0;
    for (let i = 0; i < idStr.length; i++) {
      const char = idStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Generate pseudo-random number between 0 and 1 based on seed and salt
   */
  private randomFromSeed(seed: number, salt: string): number {
    // Add salt to seed for different random sequences
    let saltHash = 0;
    for (let i = 0; i < salt.length; i++) {
      const char = salt.charCodeAt(i);
      saltHash = ((saltHash << 5) - saltHash) + char;
      saltHash = saltHash & saltHash;
    }
    
    const combinedSeed = seed + saltHash;
    
    // Simple LCG (Linear Congruential Generator) for pseudo-random numbers
    const a = 1664525;
    const c = 1013904223;
    const m = Math.pow(2, 32);
    
    const result = (a * combinedSeed + c) % m;
    return result / m;
  }
}