#!/usr/bin/env node

/**
 * Script to generate fake user activity data for testing and development
 * Usage: node generate-user-activities.js <organizationId> <customerId> <numberOfRecords>
 * 
 * Example: node generate-user-activities.js 507f1f77bcf86cd799439011 507f1f77bcf86cd799439012 100
 */

const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const path = require('path');
const fs = require('fs');

// Environment configuration - detect based on available connection strings
const ENV = 'development';

// Load environment variables
require('dotenv').config();

// Try to load from multiple possible locations
const possiblePaths = [
  './prod.env',
  '../prod.env',
  './server/prod.env',
  path.join(__dirname, '../prod.env'),
  path.join(__dirname, '../../prod.env')
];

let result = require('dotenv').config();
if (result.error) {
  let prodEnvFound = false;
  for (const envPath of possiblePaths) {
    if (fs.existsSync(envPath)) {
      result = require('dotenv').config({ path: envPath });
      if (!result.error) {
        prodEnvFound = true;
        break;
      }
    }
  }
}

// Import the existing UserActivity model
const { UserActivityModel } = require('../dist/schemas');

// Realistic solution names and actions
const SOLUTION_NAMES = [
  'Customer Dashboard',
  'Analytics Platform',
  'Support Portal',
  'Billing System',
  'User Management',
  'Reporting Tool',
  'API Gateway',
  'Notification Center',
  'Data Export',
  'Settings Panel',
  'Search Engine',
  'File Manager',
  'Calendar Integration',
  'Email Campaigns',
  'Performance Monitor',
  'Security Center',
  'Backup System',
  'Integration Hub',
  'Workflow Engine',
  'Document Manager'
];

const ACTIONS = [
  'login',
  'logout',
  'view',
  'create',
  'update',
  'delete',
  'export',
  'import',
  'search',
  'filter',
  'sort',
  'download',
  'upload',
  'share',
  'comment',
  'approve',
  'reject',
  'archive',
  'restore',
  'configure',
  'test',
  'deploy',
  'monitor',
  'analyze',
  'report'
];

const USER_ROLES = [
  'admin',
  'manager',
  'user',
  'viewer',
  'editor',
  'analyst',
  'developer',
  'support',
  'sales',
  'marketing'
];

// Generate realistic user IDs
function generateUserId() {
  const patterns = [
    () => faker.internet.email(),
    () => faker.person.firstName().toLowerCase() + '.' + faker.person.lastName().toLowerCase(),
    () => faker.person.firstName().toLowerCase() + faker.number.int({ min: 1, max: 999 }),
    () => 'user_' + faker.string.alphanumeric(8),
    () => faker.person.firstName().toLowerCase() + '_' + faker.person.lastName().toLowerCase()
  ];
  
  return faker.helpers.arrayElement(patterns)();
}

// Generate realistic session IDs
function generateSessionId() {
  return faker.string.uuid();
}

// Generate realistic metadata based on action and solution
function generateMetadata(action, solutionName) {
  const metadata = {};
  
  // Common metadata for all actions
  metadata.ipAddress = faker.internet.ip();
  metadata.userAgent = faker.internet.userAgent();
  metadata.browser = faker.helpers.arrayElement(['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera']);
  metadata.device = faker.helpers.arrayElement(['desktop', 'mobile', 'tablet']);
  metadata.operatingSystem = faker.helpers.arrayElement(['Windows', 'macOS', 'Linux', 'iOS', 'Android']);
  
  // Action-specific metadata
  switch (action) {
    case 'view':
      metadata.pageViews = faker.number.int({ min: 1, max: 10 });
      metadata.timeSpent = faker.number.int({ min: 5, max: 300 }); // seconds
      break;
    case 'create':
    case 'update':
      metadata.recordId = faker.string.uuid();
      metadata.fieldsModified = faker.number.int({ min: 1, max: 5 });
      break;
    case 'export':
      metadata.fileFormat = faker.helpers.arrayElement(['CSV', 'PDF', 'Excel', 'JSON']);
      metadata.recordCount = faker.number.int({ min: 10, max: 1000 });
      break;
    case 'search':
      metadata.searchTerm = faker.lorem.words(2);
      metadata.resultsCount = faker.number.int({ min: 0, max: 100 });
      break;
    case 'download':
      metadata.fileSize = faker.number.int({ min: 1024, max: 10485760 }); // bytes
      metadata.fileType = faker.helpers.arrayElement(['PDF', 'CSV', 'Excel', 'Image', 'Document']);
      break;
    case 'upload':
      metadata.fileName = faker.system.fileName();
      metadata.fileSize = faker.number.int({ min: 1024, max: 10485760 });
      break;
    case 'login':
      metadata.loginMethod = faker.helpers.arrayElement(['email', 'sso', 'oauth']);
      metadata.success = faker.datatype.boolean(0.95); // 95% success rate
      break;
    case 'logout':
      metadata.sessionDuration = faker.number.int({ min: 60, max: 28800 }); // seconds
      break;
  }
  
  // Solution-specific metadata
  switch (solutionName) {
    case 'Analytics Platform':
      metadata.chartType = faker.helpers.arrayElement(['line', 'bar', 'pie', 'scatter', 'heatmap']);
      metadata.dateRange = faker.helpers.arrayElement(['7d', '30d', '90d', '1y']);
      break;
    case 'Support Portal':
      metadata.ticketId = faker.string.uuid();
      metadata.priority = faker.helpers.arrayElement(['low', 'medium', 'high', 'urgent']);
      break;
    case 'Billing System':
      metadata.amount = faker.number.float({ min: 10, max: 10000, fractionDigits: 2 });
      metadata.currency = faker.helpers.arrayElement(['USD', 'EUR', 'GBP', 'CAD']);
      break;
    case 'API Gateway':
      metadata.endpoint = faker.internet.url();
      metadata.responseTime = faker.number.int({ min: 50, max: 2000 }); // milliseconds
      metadata.statusCode = faker.helpers.arrayElement([200, 201, 400, 401, 404, 500]);
      break;
  }
  
  return metadata;
}

// Generate realistic timestamps (spread over the last 30 days)
function generateRealisticTimestamp() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  
  // Weight recent dates more heavily (80% in last 7 days, 20% in previous 23 days)
  const isRecent = faker.datatype.boolean(0.8);
  const daysBack = isRecent 
    ? faker.number.int({ min: 0, max: 7 })
    : faker.number.int({ min: 8, max: 30 });
  
  const baseDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
  
  // Add random hours, minutes, seconds
  const hours = faker.number.int({ min: 0, max: 23 });
  const minutes = faker.number.int({ min: 0, max: 59 });
  const seconds = faker.number.int({ min: 0, max: 59 });
  
  baseDate.setHours(hours, minutes, seconds, 0);
  
  return baseDate;
}

// Generate a single user activity record
function generateUserActivity(organizationId, customerId) {
  const solutionName = faker.helpers.arrayElement(SOLUTION_NAMES);
  const action = faker.helpers.arrayElement(ACTIONS);
  const userId = generateUserId();
  const userRole = faker.helpers.arrayElement(USER_ROLES);
  const sessionId = generateSessionId();
  const timestamp = generateRealisticTimestamp();
  const metadata = generateMetadata(action, solutionName);
  
  return {
    organizationId: new mongoose.Types.ObjectId(organizationId),
    customerId: new mongoose.Types.ObjectId(customerId),
    userId,
    userRole,
    solutionName,
    action,
    sessionId,
    timestamp,
    metadata
  };
}

// Main function to generate user activities
async function generateUserActivities(organizationId, customerId, numberOfRecords) {
  try {
    console.log('🚀 Starting User Activity Generation...');
    console.log(`Organization ID: ${organizationId}`);
    console.log(`Customer ID: ${customerId}`);
    console.log(`Number of records: ${numberOfRecords}`);
    
    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      throw new Error('Invalid organizationId format');
    }
    
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      throw new Error('Invalid customerId format');
    }
    
    if (numberOfRecords < 1 || numberOfRecords > 10000) {
      throw new Error('Number of records must be between 1 and 10000');
    }
    
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    console.log(`Environment detected: ${ENV}`);
    
    const connectionString = ENV === 'production' 
      ? process.env.ATLAS_CONNECTION_STRING
      : process.env.DB_CONNECTION_STRING_LOCAL || process.env.DB_CONNECTION_STRING_LOCAL_DOCKER;
    
    if (!connectionString) {
      const availableVars = Object.keys(process.env).filter(key => 
        key.includes('CONNECTION_STRING') || key.includes('ATLAS')
      );
      console.log('Available database-related environment variables:', availableVars);
      throw new Error('No database connection string found in environment variables');
    }
    
    console.log(`Using ${ENV} database connection`);
    
    await mongoose.connect(connectionString, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Generate activities in batches for better performance
    const batchSize = 100;
    const batches = Math.ceil(numberOfRecords / batchSize);
    let totalInserted = 0;
    
    console.log(`📊 Generating ${numberOfRecords} user activities in ${batches} batches...`);
    
    for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
      const batchStart = batchIndex * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, numberOfRecords);
      const batchSizeActual = batchEnd - batchStart;
      
      console.log(`Processing batch ${batchIndex + 1}/${batches} (${batchSizeActual} records)...`);
      
      // Generate batch of activities
      const activities = [];
      for (let i = 0; i < batchSizeActual; i++) {
        activities.push(generateUserActivity(organizationId, customerId));
      }
      
      // Insert batch
      try {
        const result = await UserActivityModel.insertMany(activities, { ordered: false });
        totalInserted += result.length;
        console.log(`✅ Batch ${batchIndex + 1} completed: ${result.length} records inserted`);
      } catch (error) {
        if (error.code === 11000) {
          // Duplicate key error - some records might have been inserted
          console.log(`⚠️ Batch ${batchIndex + 1} had some duplicate records, continuing...`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('\n📈 Generation Results:');
    console.log(`Total records requested: ${numberOfRecords}`);
    console.log(`Total records inserted: ${totalInserted}`);
    console.log(`Success rate: ${((totalInserted / numberOfRecords) * 100).toFixed(2)}%`);
    
    // Generate summary statistics
    const stats = await UserActivityModel.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId), customerId: new mongoose.Types.ObjectId(customerId) } },
      {
        $group: {
          _id: null,
          totalActivities: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' },
          uniqueSolutions: { $addToSet: '$solutionName' },
          uniqueActions: { $addToSet: '$action' },
          dateRange: {
            $push: '$timestamp'
          }
        }
      }
    ]);
    
    if (stats.length > 0) {
      const stat = stats[0];
      console.log('\n📊 Database Statistics:');
      console.log(`Total activities in database: ${stat.totalActivities}`);
      console.log(`Unique users: ${stat.uniqueUsers.length}`);
      console.log(`Unique solutions: ${stat.uniqueSolutions.length}`);
      console.log(`Unique actions: ${stat.uniqueActions.length}`);
      
      if (stat.dateRange.length > 0) {
        const dates = stat.dateRange.sort();
        console.log(`Date range: ${dates[0].toISOString().split('T')[0]} to ${dates[dates.length - 1].toISOString().split('T')[0]}`);
      }
    }
    
    console.log('\n🎉 User activity generation completed successfully!');
    
  } catch (error) {
    console.error('❌ Error generating user activities:', error);
    throw error;
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('📡 Database connection closed');
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length !== 3) {
    console.log('Usage: node generate-user-activities.js <organizationId> <customerId> <numberOfRecords>');
    console.log('');
    console.log('Arguments:');
    console.log('  organizationId  - Valid MongoDB ObjectId for the organization');
    console.log('  customerId      - Valid MongoDB ObjectId for the customer');
    console.log('  numberOfRecords - Number of user activity records to generate (1-10000)');
    console.log('');
    console.log('Example:');
    console.log('  node generate-user-activities.js 507f1f77bcf86cd799439011 507f1f77bcf86cd799439012 100');
    process.exit(1);
  }
  
  const [organizationId, customerId, numberOfRecordsStr] = args;
  const numberOfRecords = parseInt(numberOfRecordsStr, 10);
  
  if (isNaN(numberOfRecords)) {
    console.error('❌ numberOfRecords must be a valid number');
    process.exit(1);
  }
  
  try {
    await generateUserActivities(organizationId, customerId, numberOfRecords);
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the script
main();
