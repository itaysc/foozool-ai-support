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



import Server from "./server";

async function start() {
  try {
    const server: Server = new Server();
    
    // Start the server first
    server.startServer((port: number) => {
      console.log(`✅ Server is listening on port ${port}`);
    });
    
    // Try to connect to database, but don't fail if it doesn't work
    try {
      await server.connectDB();
      await server.seedDB();
      await server.startJobs();
    } catch (dbError) {
      console.log('⚠️ Database connection failed, but server is running:', dbError);
    }
    
    // Try to initialize services, but don't fail if they don't work
    try {
      await server.initQdrant();
    } catch (qdrantError) {
      console.log('⚠️ Qdrant initialization failed, but server is running:', qdrantError);
    }
    
  } catch (error) {
    console.error('❌ Server startup failed:', error);
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