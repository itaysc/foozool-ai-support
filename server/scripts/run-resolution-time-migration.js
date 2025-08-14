#!/usr/bin/env node

/**
 * Script to run the resolution time data migration for Qdrant
 * This will populate 2000 tickets with mock resolution time prediction data
 */

const { MigrationRegistry } = require('../dist/migrations/MigrationRegistry');

async function runResolutionTimeMigration() {
  try {
    console.log('🚀 Starting Resolution Time Data Migration...');
    
    const registry = MigrationRegistry.getInstance();
    
    // Run the specific migration
    const result = await registry.runMigration('add-resolution-time-data-to-qdrant');
    
    console.log('\n📊 Migration Results:');
    console.log(`Name: ${result.name}`);
    console.log(`Database Type: ${result.databaseType}`);
    console.log(`Success: ${result.result.success ? '✅ Yes' : '❌ No'}`);
    console.log(`Total Records: ${result.result.totalRecords || 0}`);
    console.log(`Processed Records: ${result.result.processedRecords || 0}`);
    console.log(`Execution Time: ${result.result.executionTime || 0}ms`);
    
    if (result.result.metadata) {
      console.log('\n📈 Detailed Results:');
      console.log(`Updated Records: ${result.result.metadata.updatedRecords || 0}`);
      console.log(`Skipped Records: ${result.result.metadata.skippedRecords || 0}`);
      console.log(`Total Processed: ${result.result.metadata.totalProcessed || 0}`);
    }
    
    if (result.result.errors && result.result.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      result.result.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    if (result.result.success) {
      console.log('\n🎉 Migration completed successfully!');
      console.log(`📈 ${result.result.processedRecords} tickets now have resolution time prediction data`);
      console.log('🌐 You can now view the enhanced performance metrics in the UI');
    } else {
      console.log('\n❌ Migration failed. Check the errors above.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Failed to run migration:', error);
    process.exit(1);
  }
}

// Run the migration
runResolutionTimeMigration();
