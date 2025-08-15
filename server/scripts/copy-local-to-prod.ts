#!/usr/bin/env node

/**
 * Script to copy all data from local database to production database
 * This script will migrate all collections while preserving data integrity
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Import all models
import {
  UserModel,
  OrganizationModel,
  LLMUsageModel,
  LLMPricesModel,
  TicketModel,
  SeedTrackModel,
  ProductModel,
  TokenModel,
  ActionThresholdModel,
  ActionLogModel,
  CustomerTierModel,
  WebhookModel,
  CRMModel,
  ThresholdMissModel,
} from '../src/schemas';

interface MigrationConfig {
  local: {
    connectionString: string;
    databaseName: string;
  };
  production: {
    connectionString: string;
    databaseName: string;
  };
  collections: string[];
  batchSize: number;
  dryRun: boolean;
}

interface MigrationResult {
  collection: string;
  totalDocuments: number;
  copiedDocuments: number;
  errors: string[];
  executionTime: number;
  success: boolean;
}

interface OverallMigrationResult {
  success: boolean;
  totalCollections: number;
  successfulCollections: number;
  failedCollections: number;
  totalExecutionTime: number;
  results: MigrationResult[];
  summary: {
    totalDocuments: number;
    totalCopiedDocuments: number;
    totalErrors: number;
  };
}

class DatabaseMigration {
  private localConnection: mongoose.Connection | null = null;
  private productionConnection: mongoose.Connection | null = null;
  private config: MigrationConfig;

  constructor() {
    this.config = {
      local: {
        connectionString: process.env.DB_CONNECTION_STRING_LOCAL || process.env.DB_CONNECTION_STRING_LOCAL_DOCKER || '',
        databaseName: 'test'
      },
      production: {
        connectionString: process.env.ATLAS_CONNECTION_STRING || '',
        databaseName: 'test'
      },
      collections: [
        'users',
        'organizations',
        'llmusages',
        'llmprices',
        'tickets',
        'seedtracks',
        'products',
        'tokens',
        'actionthresholds',
        'actionlogs',
        'customertiers',
        'webhooks',
        'crms',
        'thresholdmisses'
      ],
      batchSize: 1000,
      dryRun: process.env.DRY_RUN === 'true'
    };

    // Replace placeholders in production connection string
    if (this.config.production.connectionString.includes('<db_username>')) {
      this.config.production.connectionString = this.config.production.connectionString.replace(
        '<db_username>',
        process.env.ATLAS_USERNAME || ''
      );
    }
    if (this.config.production.connectionString.includes('<db_password>')) {
      this.config.production.connectionString = this.config.production.connectionString.replace(
        '<db_password>',
        process.env.ATLAS_PASSWORD || ''
      );
    }
  }

  private async connectToLocal(): Promise<void> {
    try {
      console.log('🔌 Connecting to local database...');
      this.localConnection = await mongoose.createConnection(this.config.local.connectionString, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      console.log('✅ Connected to local database');
    } catch (error) {
      throw new Error(`Failed to connect to local database: ${error}`);
    }
  }

  private async connectToProduction(): Promise<void> {
    try {
      console.log('🔌 Connecting to production database...');
      this.productionConnection = await mongoose.createConnection(this.config.production.connectionString, {
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 60000,
        maxPoolSize: 5,
        minPoolSize: 1,
        maxIdleTimeMS: 60000,
        retryWrites: true,
        retryReads: true,
        family: 4,
      });
      console.log('✅ Connected to production database');
    } catch (error) {
      throw new Error(`Failed to connect to production database: ${error}`);
    }
  }

  private async disconnect(): Promise<void> {
    if (this.localConnection) {
      await this.localConnection.close();
      console.log('🔌 Disconnected from local database');
    }
    if (this.productionConnection) {
      await this.productionConnection.close();
      console.log('🔌 Disconnected from production database');
    }
  }

  private getModelForCollection(collectionName: string): mongoose.Model<any> | null {
    const modelMap: { [key: string]: mongoose.Model<any> } = {
      'users': UserModel,
      'organizations': OrganizationModel,
      'llmusages': LLMUsageModel,
      'llmprices': LLMPricesModel,
      'tickets': TicketModel,
      'seedtracks': SeedTrackModel,
      'products': ProductModel,
      'tokens': TokenModel,
      'actionthresholds': ActionThresholdModel,
      'actionlogs': ActionLogModel,
      'customertiers': CustomerTierModel,
      'webhooks': WebhookModel,
      'crms': CRMModel,
      'thresholdmisses': ThresholdMissModel
    };

    return modelMap[collectionName] || null;
  }

  private async migrateCollection(collectionName: string): Promise<MigrationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let totalDocuments = 0;
    let copiedDocuments = 0;

    try {
      console.log(`\n📦 Migrating collection: ${collectionName}`);

      // Get the model for this collection
      const Model = this.getModelForCollection(collectionName);
      if (!Model) {
        throw new Error(`No model found for collection: ${collectionName}`);
      }

      // Count total documents in local collection
      totalDocuments = await Model.countDocuments();
      console.log(`📊 Total documents in local ${collectionName}: ${totalDocuments}`);

      if (totalDocuments === 0) {
        console.log(`⏭️  Skipping ${collectionName} - no documents to migrate`);
        return {
          collection: collectionName,
          totalDocuments: 0,
          copiedDocuments: 0,
          errors: [],
          executionTime: Date.now() - startTime,
          success: true
        };
      }

      if (this.config.dryRun) {
        console.log(`🔍 DRY RUN: Would migrate ${totalDocuments} documents from ${collectionName}`);
        return {
          collection: collectionName,
          totalDocuments,
          copiedDocuments: totalDocuments,
          errors: [],
          executionTime: Date.now() - startTime,
          success: true
        };
      }

      // First, delete all existing data from production collection
      console.log(`🧹 Deleting all existing data from production ${collectionName}...`);
      const deleteResult = await Model.deleteMany({});
      console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing documents from production ${collectionName}`);

      // Migrate documents in batches
      let skip = 0;
      while (skip < totalDocuments) {
        const batch = await Model.find({}).skip(skip).limit(this.config.batchSize).lean();
        
        if (batch.length === 0) break;

        try {
          // Insert batch into production
          await Model.insertMany(batch, { ordered: false });
          copiedDocuments += batch.length;
          
          console.log(`✅ Migrated batch: ${skip + 1}-${skip + batch.length} of ${totalDocuments}`);
        } catch (batchError: any) {
          const errorMsg = `Batch ${skip + 1}-${skip + batch.length} failed: ${batchError.message}`;
          console.error(`❌ ${errorMsg}`);
          errors.push(errorMsg);
        }

        skip += this.config.batchSize;
      }

      const executionTime = Date.now() - startTime;
      console.log(`✅ Completed migration of ${collectionName}: ${copiedDocuments}/${totalDocuments} documents in ${executionTime}ms`);

      return {
        collection: collectionName,
        totalDocuments,
        copiedDocuments,
        errors,
        executionTime,
        success: errors.length === 0
      };

    } catch (error: any) {
      const errorMsg = `Failed to migrate collection ${collectionName}: ${error.message}`;
      console.error(`❌ ${errorMsg}`);
      errors.push(errorMsg);
      
      return {
        collection: collectionName,
        totalDocuments,
        copiedDocuments,
        errors,
        executionTime: Date.now() - startTime,
        success: false
      };
    }
  }

  public async runMigration(): Promise<OverallMigrationResult> {
    const overallStartTime = Date.now();
    const results: MigrationResult[] = [];
    let successfulCollections = 0;
    let failedCollections = 0;
    let totalDocuments = 0;
    let totalCopiedDocuments = 0;
    let totalErrors = 0;

    try {
      console.log('🚀 Starting database migration from local to production...');
      console.log(`📋 Configuration:`);
      console.log(`   Local DB: ${this.config.local.connectionString.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
      console.log(`   Production DB: ${this.config.production.connectionString.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
      console.log(`   Collections: ${this.config.collections.join(', ')}`);
      console.log(`   Batch Size: ${this.config.batchSize}`);
      console.log(`   Dry Run: ${this.config.dryRun ? 'Yes' : 'No'}`);

      // Connect to both databases
      await this.connectToLocal();
      await this.connectToProduction();

      // Migrate each collection
      for (const collectionName of this.config.collections) {
        const result = await this.migrateCollection(collectionName);
        results.push(result);
        
        if (result.success) {
          successfulCollections++;
        } else {
          failedCollections++;
        }

        totalDocuments += result.totalDocuments;
        totalCopiedDocuments += result.copiedDocuments;
        totalErrors += result.errors.length;
      }

      const totalExecutionTime = Date.now() - overallStartTime;

      // Generate summary
      const summary = {
        totalDocuments,
        totalCopiedDocuments,
        totalErrors
      };

      const overallResult: OverallMigrationResult = {
        success: failedCollections === 0,
        totalCollections: this.config.collections.length,
        successfulCollections,
        failedCollections,
        totalExecutionTime,
        results,
        summary
      };

      return overallResult;

    } catch (error: any) {
      console.error('❌ Migration failed:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  public printResults(result: OverallMigrationResult): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 MIGRATION RESULTS SUMMARY');
    console.log('='.repeat(80));
    
    console.log(`\n🎯 Overall Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`📦 Collections: ${result.successfulCollections}/${result.totalCollections} successful`);
    console.log(`⏱️  Total Time: ${result.totalExecutionTime}ms`);
    console.log(`📄 Total Documents: ${result.summary.totalDocuments.toLocaleString()}`);
    console.log(`✅ Copied Documents: ${result.summary.totalCopiedDocuments.toLocaleString()}`);
    console.log(`❌ Total Errors: ${result.summary.totalErrors}`);
    
    console.log('\n📋 Collection Details:');
    console.log('-'.repeat(80));
    
    result.results.forEach((collectionResult) => {
      const status = collectionResult.success ? '✅' : '❌';
      const errorCount = collectionResult.errors.length;
      console.log(`${status} ${collectionResult.collection.padEnd(20)} | ${collectionResult.totalDocuments.toString().padStart(8)} docs | ${collectionResult.executionTime.toString().padStart(6)}ms | ${errorCount > 0 ? `${errorCount} errors` : 'No errors'}`);
    });

    if (result.summary.totalErrors > 0) {
      console.log('\n⚠️  Errors Details:');
      console.log('-'.repeat(80));
      result.results.forEach((collectionResult) => {
        if (collectionResult.errors.length > 0) {
          console.log(`\n${collectionResult.collection}:`);
          collectionResult.errors.forEach((error, index) => {
            console.log(`  ${index + 1}. ${error}`);
          });
        }
      });
    }

    console.log('\n' + '='.repeat(80));
    
    if (result.success) {
      console.log('🎉 Migration completed successfully!');
      console.log('🌐 Your production database now contains all the data from your local database.');
    } else {
      console.log('❌ Migration completed with errors. Please review the error details above.');
      console.log('💡 Some collections may have been migrated successfully while others failed.');
    }
  }
}

async function main() {
  try {
    const migration = new DatabaseMigration();
    const result = await migration.runMigration();
    migration.printResults(result);
    
    if (!result.success) {
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  main();
}

export default DatabaseMigration;
