// Only load module-alias in production
if (process.env.NODE_ENV === 'production') {
  require('module-alias/register');
}

import Server from "./server";
require('dotenv').config();

async function start() {
  const server: Server = new Server();
  
  try {
    // Start the server first
    server.startServer((port: number) => {
      console.log(`server is listening on port ${port}`);
    });
    
    // Try to connect to database, but don't fail if it doesn't work
    try {
      await server.connectDB();
      await server.seedDB();
    } catch (dbError) {
      console.log('Database connection failed, but server is running:', dbError);
    }
    
    // Try to initialize services, but don't fail if they don't work
    try {
      await server.initQdrant();
    } catch (qdrantError) {
      console.log('Qdrant initialization failed, but server is running:', qdrantError);
    }
    
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
}

start();