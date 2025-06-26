// Only load module-alias in production
if (process.env.NODE_ENV === 'production') {
  require('module-alias/register');
}

import Server from "./server";

// Load environment variables
console.log('Loading environment variables...');
let result = require('dotenv').config();
if (result.error) {
  console.log('No .env file found, trying to load prod.env...');
  result = require('dotenv').config({ path: './prod.env' });
  if (result.error) {
    console.log('No prod.env file found either, using system environment variables');
  } else {
    console.log('Environment variables loaded from prod.env file');
  }
} else {
  console.log('Environment variables loaded from .env file');
}

async function start() {
  console.log('Starting server...');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Port:', process.env.PORT);
  console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
  console.log('ATLAS_CONNECTION_STRING exists:', !!process.env.ATLAS_CONNECTION_STRING);
  console.log('QDRANT_API_KEY exists:', !!process.env.QDRANT_API_KEY);
  
  try {
    const server: Server = new Server();
    console.log('Server instance created successfully');
    
    // Start the server first
    server.startServer((port: number) => {
      console.log(`✅ Server is listening on port ${port}`);
      console.log(`✅ Health check available at http://0.0.0.0:${port}/api/v1/health`);
    });
    
    // Try to connect to database, but don't fail if it doesn't work
    try {
      console.log('Attempting to connect to database...');
      await server.connectDB();
      console.log('✅ Database connected successfully');
      
      console.log('Attempting to seed database...');
      await server.seedDB();
      console.log('✅ Database seeded successfully');
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