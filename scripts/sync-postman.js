#!/usr/bin/env node

/**
 * Postman Collection Sync Script
 * 
 * This script helps keep your local Postman in sync with the codebase
 * Run: node scripts/sync-postman.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COLLECTION_PATH = path.join(__dirname, '../postman/postman-collection.json');
const COLLECTION_NAME = 'TKTAI';

function validateCollection() {
  console.log('🔍 Validating Postman collection...');
  
  try {
    const collectionData = fs.readFileSync(COLLECTION_PATH, 'utf8');
    const collection = JSON.parse(collectionData);
    
    console.log('✅ Collection is valid JSON');
    console.log(`📊 Collection: ${collection.info.name}`);
    console.log(`📝 Description: ${collection.info.description}`);
    console.log(`📁 Sections: ${collection.item.length}`);
    
    // Count total requests
    let totalRequests = 0;
    collection.item.forEach(section => {
      totalRequests += section.item.length;
    });
    
    console.log(`🔗 Total Requests: ${totalRequests}`);
    
    return true;
  } catch (error) {
    console.error('❌ Collection validation failed:', error.message);
    return false;
  }
}

function generateImportInstructions() {
  console.log('\n📋 How to Import Updated Collection:');
  console.log('=====================================');
  console.log('1. Open Postman');
  console.log('2. Click "Import" button');
  console.log('3. Select "File" tab');
  console.log('4. Choose: postman/postman-collection.json');
  console.log('5. Click "Import"');
  console.log('\n💡 Pro Tip: Delete the old collection first to avoid duplicates');
}

function checkForChanges() {
  console.log('\n🔄 Checking for recent changes...');
  
  try {
    // Check if collection was modified in the last 5 minutes
    const stats = fs.statSync(COLLECTION_PATH);
    const now = new Date();
    const modified = new Date(stats.mtime);
    const diffMinutes = (now - modified) / (1000 * 60);
    
    if (diffMinutes < 5) {
      console.log('⚠️  Collection was recently modified!');
      console.log(`   Last modified: ${modified.toLocaleString()}`);
      console.log('   You may need to re-import in Postman');
    } else {
      console.log('✅ Collection hasn\'t been modified recently');
    }
  } catch (error) {
    console.error('❌ Error checking file stats:', error.message);
  }
}

function showCollectionSummary() {
  console.log('\n📊 Collection Summary:');
  console.log('====================');
  
  try {
    const collection = JSON.parse(fs.readFileSync(COLLECTION_PATH, 'utf8'));
    
    collection.item.forEach(section => {
      console.log(`📁 ${section.name} (${section.item.length} requests)`);
      section.item.forEach(request => {
        const method = request.request?.method || 'N/A';
        console.log(`  - ${request.name} (${method})`);
      });
    });
  } catch (error) {
    console.error('❌ Error generating summary:', error.message);
  }
}

function main() {
  console.log('🚀 Postman Collection Sync Helper');
  console.log('=================================\n');
  
  if (!fs.existsSync(COLLECTION_PATH)) {
    console.error('❌ Collection file not found:', COLLECTION_PATH);
    process.exit(1);
  }
  
  // Validate collection
  if (!validateCollection()) {
    process.exit(1);
  }
  
  // Check for recent changes
  checkForChanges();
  
  // Show summary
  showCollectionSummary();
  
  // Show import instructions
  generateImportInstructions();
  
  console.log('\n✨ Done! Your collection is ready for import.');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  validateCollection,
  generateImportInstructions,
  checkForChanges,
  showCollectionSummary
};
