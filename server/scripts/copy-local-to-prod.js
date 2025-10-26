#!/usr/bin/env node

/**
 * Standalone vanilla JavaScript script to copy all data from local database to production database
 * This script connects directly to MongoDB using the native driver
 */

// Load environment variables from .env file if it exists

const useEnv = false;
function loadEnvFile() {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Try to find .env file in various locations
    const possiblePaths = [
      './.env',
      '../.env',
      './server/.env',
      path.join(__dirname, '../.env'),
      path.join(__dirname, '../../.env')
    ];
    
    for (const envPath of possiblePaths) {
      if (useEnv && fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const lines = envContent.split('\n');
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine && !trimmedLine.startsWith('#')) {
            const [key, ...valueParts] = trimmedLine.split('=');
            if (key && valueParts.length > 0) {
              const value = valueParts.join('=');
              process.env[key] = value;
            }
          }
        }
        console.log(`✅ Environment variables loaded from ${envPath}`);
        break;
      }
    }
  } catch (error) {
    console.log('⚠️  Could not load .env file, using system environment variables');
  }
}

// Load environment variables
loadEnvFile();

class DatabaseMigration {
  constructor() {
    this.localClient = null;
    this.productionClient = null;
    this.localDb = null;
    this.productionDb = null;
    
    this.config = {
      local: {
        connectionString: process.env.DB_CONNECTION_STRING_LOCAL || 
                         process.env.DB_CONNECTION_STRING_LOCAL_DOCKER || 
                         'mongodb://localhost:27017',
        databaseName: 'test'
      },
      production: {
        connectionString: process.env.ATLAS_CONNECTION_STRING
        || 'mongodb+srv://itayschmidt:Y1tNcsluAkVcTVZx@foozool-cluster.sc6amk6.mongodb.net/?retryWrites=true&w=majority&appName=foozool-cluster',
        databaseName: 'test'
      },
      collections: [
        // Core entities
        'users',
        'organizations',
        'customers',
        'customeractivities',
        'customertiers',
        
        // LLM and AI
        'llmusages',
        'llmprices',
        
        // Support and tickets
        'tickets',
        
        // Products and solutions
        'products',
        'solutions',
        
        // Authentication and permissions
        'tokens',
        'roles',
        'permissions',
        
        // CRM and integrations
        'crms',
        'webhooks',
        
        // Autonomous AI
        'actionthresholds',
        'actionlogs',
        'thresholdmisses',
        
        // Insights and analytics
        'insights',
        'insightcomments',
        'predictions',
        'anomalies',
        
        // System and configuration
        'industries',
        'migrations',
        'seedtracks',
        'uploads',
        'useractivities',
        'bots',
        'processedstubs',
        'documents',
        
        // Additional collections that might exist
        'counters',
        'leads',
        'successcriteria',
        'capacitygrowths'
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

  async connectToLocal() {
    try {
      console.log('🔌 Connecting to local database...');
      
      // Use dynamic import for MongoDB driver
      const { MongoClient } = await import('mongodb');
      
      this.localClient = new MongoClient(this.config.local.connectionString, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      
      await this.localClient.connect();
      this.localDb = this.localClient.db(this.config.local.databaseName);
      console.log('✅ Connected to local database');
    } catch (error) {
      throw new Error(`Failed to connect to local database: ${error.message}`);
    }
  }

  async connectToProduction() {
    try {
      console.log('🔌 Connecting to production database...');
      
      // Use dynamic import for MongoDB driver
      const { MongoClient } = await import('mongodb');
      
      this.productionClient = new MongoClient(this.config.production.connectionString, {
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
      
      await this.productionClient.connect();
      this.productionDb = this.productionClient.db(this.config.production.databaseName);
      console.log('✅ Connected to production database');
    } catch (error) {
      throw new Error(`Failed to connect to production database: ${error.message}`);
    }
  }

  async disconnect() {
    if (this.localClient) {
      await this.localClient.close();
      console.log('🔌 Disconnected from local database');
    }
    if (this.productionClient) {
      await this.productionClient.close();
      console.log('🔌 Disconnected from production database');
    }
  }

  async migrateCollection(collectionName) {
    const startTime = Date.now();
    const errors = [];
    let totalDocuments = 0;
    let copiedDocuments = 0;

    try {
      console.log(`\n📦 Migrating collection: ${collectionName}`);

      // Get collections from both databases
      const localCollection = this.localDb.collection(collectionName);
      const productionCollection = this.productionDb.collection(collectionName);

      // Count total documents in local collection
      totalDocuments = await localCollection.countDocuments();
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
      const deleteResult = await productionCollection.deleteMany({});
      console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing documents from production ${collectionName}`);

      // Migrate documents in batches
      let skip = 0;
      while (skip < totalDocuments) {
        const batch = await localCollection.find({}).skip(skip).limit(this.config.batchSize).toArray();
        
        if (batch.length === 0) break;

        try {
          // Insert batch into production
          if (batch.length > 0) {
            await productionCollection.insertMany(batch, { ordered: false });
            copiedDocuments += batch.length;
          }
          
          console.log(`✅ Migrated batch: ${skip + 1}-${skip + batch.length} of ${totalDocuments}`);
        } catch (batchError) {
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

    } catch (error) {
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

  async runMigration() {
    const overallStartTime = Date.now();
    const results = [];
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

      const overallResult = {
        success: failedCollections === 0,
        totalCollections: this.config.collections.length,
        successfulCollections,
        failedCollections,
        totalExecutionTime,
        results,
        summary
      };

      return overallResult;

    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  printResults(result) {
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
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = DatabaseMigration;
