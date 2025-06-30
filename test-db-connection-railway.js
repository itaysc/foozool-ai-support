// Test script for Railway MongoDB connection
const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config();

async function testConnection() {
  console.log('🔍 Testing Railway MongoDB connection...');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('ATLAS_CONNECTION_STRING exists:', !!process.env.ATLAS_CONNECTION_STRING);
  console.log('ATLAS_USERNAME exists:', !!process.env.ATLAS_USERNAME);
  console.log('ATLAS_PASSWORD exists:', !!process.env.ATLAS_PASSWORD);
  
  let connectionString = process.env.ATLAS_CONNECTION_STRING || '';
  
  // Replace placeholders if they exist
  if (connectionString.includes('<db_username>')) {
    connectionString = connectionString.replace('<db_username>', process.env.ATLAS_USERNAME || '');
  }
  if (connectionString.includes('<db_password>')) {
    connectionString = connectionString.replace('<db_password>', process.env.ATLAS_PASSWORD || '');
  }
  
  // Add database name if not present
  if (!connectionString.includes('/foozool') && !connectionString.includes('/?')) {
    connectionString = `${connectionString}/foozool`;
  }
  
  console.log('Connection string (masked):', connectionString.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
  
  // Configure mongoose
  mongoose.set('bufferCommands', true);
  
  try {
    console.log('⏳ Attempting connection...');
    
    await mongoose.connect(connectionString, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      maxPoolSize: 5,
      minPoolSize: 1,
      maxIdleTimeMS: 60000,
      retryWrites: true,
      retryReads: true,
      heartbeatFrequencyMS: 30000,
      family: 4,
    });
    
    console.log('✅ Connection successful!');
    console.log('Connection state:', mongoose.connection.readyState);
    console.log('Connection host:', mongoose.connection.host);
    console.log('Connection name:', mongoose.connection.name);
    
    // Test a simple query
    console.log('🧪 Testing database query...');
    if (mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
      console.log('✅ Database ping successful!');
    }
    
    // Test user collection access
    console.log('🧪 Testing user collection access...');
    const User = mongoose.model('User', new mongoose.Schema({}));
    const userCount = await User.countDocuments();
    console.log(`✅ User collection accessible! Found ${userCount} users.`);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  await mongoose.disconnect();
  process.exit(0);
});

// Run the test
testConnection().catch(console.error); 