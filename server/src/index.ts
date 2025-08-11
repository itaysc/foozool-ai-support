// Load module-alias FIRST in production, before any other imports
if (process.env.NODE_ENV === 'production') {
  require('module-alias/register');
}

// Load environment variables FIRST, before any other imports
import path from 'path';
import fs from 'fs';

console.log('Loading environment variables...');
console.log('Current working directory:', process.cwd());
console.log('Files in current directory:', fs.readdirSync('.'));

// Try multiple possible paths for prod.env
const possiblePaths = [
  './prod.env',
  '../prod.env',
  './server/prod.env',
  path.join(__dirname, '../prod.env'),
  path.join(__dirname, '../../prod.env')
];

let result = require('dotenv').config();
if (result.error) {
  console.log('No .env file found, trying to load prod.env...');
  
  let prodEnvFound = false;
  for (const envPath of possiblePaths) {
    console.log(`Checking for prod.env at: ${envPath}`);
    if (fs.existsSync(envPath)) {
      console.log(`Found prod.env at: ${envPath}`);
      result = require('dotenv').config({ path: envPath });
      if (!result.error) {
        console.log(`Environment variables loaded from ${envPath}`);
        prodEnvFound = true;
        break;
      }
    }
  }
  
  if (!prodEnvFound) {
    console.log('No prod.env file found in any location, using system environment variables');
    console.log('Error details:', result.error);
  }
} else {
  console.log('Environment variables loaded from .env file');
}

// Debug: Show some key environment variables
console.log('Environment variables after loading:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);
console.log('JWT_SECRET value (first 10 chars):', process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 10) + '...' : 'undefined');

// List all environment variables for debugging
console.log('All environment variables:');
Object.keys(process.env).forEach(key => {
  if (key.includes('JWT') || key.includes('SECRET') || key.includes('KEY') || key.includes('PASSWORD')) {
    console.log(`${key}: ${process.env[key] ? '***SET***' : 'undefined'}`);
  } else {
    console.log(`${key}: ${process.env[key]}`);
  }
});

import Server from "./server";

async function start() {
  console.log('🚀 Starting server...');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Port:', process.env.PORT);
  console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
  console.log('ATLAS_CONNECTION_STRING exists:', !!process.env.ATLAS_CONNECTION_STRING);
  console.log('QDRANT_API_KEY exists:', !!process.env.QDRANT_API_KEY);
  
  try {
    console.log('Creating server instance...');
    const server: Server = new Server();
    console.log('✅ Server instance created successfully');
    
    // Start the server first
    console.log('Starting server...');
    server.startServer((port: number) => {
      console.log(`✅ Server is listening on port ${port}`);
      console.log(`✅ Health check available at http://0.0.0.0:${port}/api/v1/health`);
      console.log(`✅ Root health check available at http://0.0.0.0:${port}/`);
      console.log(`✅ Ping health check available at http://0.0.0.0:${port}/ping`);
    });
    
    // Try to connect to database, but don't fail if it doesn't work
    try {
      console.log('Attempting to connect to database...');
      await server.connectDB();
      console.log('✅ Database connected successfully');
      
      console.log('Attempting to seed database...');
      await server.seedDB();
      console.log('✅ Database seeded successfully');
      
      // Start jobs after database is connected and seeded
      console.log('Starting scheduled jobs...');
      await server.startJobs();
      console.log('✅ Scheduled jobs started successfully');
    } catch (dbError) {
      console.log('⚠️ Database connection failed, but server is running:', dbError);
    }
    
    // Try to initialize services, but don't fail if they don't work
    try {
      console.log('Attempting to initialize Qdrant...');
      await server.initQdrant();
      console.log('✅ Qdrant initialized successfully');
    } catch (qdrantError) {
      console.log('⚠️ Qdrant initialization failed, but server is running:', qdrantError);
    }
    
    console.log('🚀 Server startup completed successfully');
    
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
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

start();