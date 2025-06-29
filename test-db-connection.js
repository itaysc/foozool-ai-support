// Simple MongoDB connection test
const mongoose = require('mongoose');

// This would be your actual connection string from Railway
const connectionString = process.env.ATLAS_CONNECTION_STRING || 'mongodb+srv://<username>:<password>@foozool-cluster.sc6amk6.mongodb.net/?retryWrites=true&w=majority&appName=foozool-cluster';

console.log('Testing MongoDB connection...');
console.log('Connection string format check:');
console.log('- Contains mongodb+srv://:', connectionString.includes('mongodb+srv://'));
console.log('- Contains username placeholder:', connectionString.includes('<username>'));
console.log('- Contains password placeholder:', connectionString.includes('<password>'));
console.log('- Contains cluster name:', connectionString.includes('foozool-cluster'));
console.log('- Contains retryWrites:', connectionString.includes('retryWrites=true'));

// Check if placeholders are replaced
if (connectionString.includes('<username>') || connectionString.includes('<password>')) {
  console.log('\n❌ ERROR: Connection string still contains placeholders!');
  console.log('Make sure to replace <username> and <password> with actual values in Railway environment variables.');
} else {
  console.log('\n✅ Connection string format looks correct');
  console.log('If connection still fails, check:');
  console.log('1. MongoDB Atlas Network Access settings');
  console.log('2. Username/password are correct');
  console.log('3. Database user has proper permissions');
} 