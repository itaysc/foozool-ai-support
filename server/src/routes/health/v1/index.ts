import express, { Request, Response } from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Basic health check endpoint for Railway
router.get('/api/v1/health', (req: Request, res: Response) => {
  console.log('Basic health check requested');
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 'unknown',
      database: {
        status: dbStatus,
        readyState: mongoose.connection.readyState
      }
    });
  } catch (error) {
    console.error('Error in basic health check:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add a health check that includes database status
router.get('/api/v1/health/detailed', async (req: Request, res: Response) => {
  console.log('Detailed health check requested');
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const jwtSecretExists = !!process.env.JWT_SECRET;
    
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      port: process.env.PORT,
      database: {
        status: dbStatus,
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        name: mongoose.connection.name
      },
      config: {
        jwtSecretExists,
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT
      }
    });
  } catch (error) {
    console.error('Error in detailed health check:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add a database-specific health check
router.get('/api/v1/health/database', async (req: Request, res: Response) => {
  console.log('Database health check requested');
  try {
    const dbState = mongoose.connection.readyState;
    const isConnected = dbState === 1;
    
    if (isConnected) {
      // Test a simple query to ensure the connection is working
      try {
        if (mongoose.connection.db) {
          await mongoose.connection.db.admin().ping();
          res.status(200).json({
            status: 'healthy',
            database: 'connected',
            readyState: dbState,
            host: mongoose.connection.host,
            name: mongoose.connection.name,
            timestamp: new Date().toISOString()
          });
        } else {
          res.status(503).json({
            status: 'unhealthy',
            database: 'no_db_reference',
            readyState: dbState,
            timestamp: new Date().toISOString()
          });
        }
      } catch (pingError) {
        console.error('Database ping failed:', pingError);
        res.status(503).json({
          status: 'unhealthy',
          database: 'ping_failed',
          readyState: dbState,
          error: pingError instanceof Error ? pingError.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    } else {
      res.status(503).json({
        status: 'unhealthy',
        database: 'disconnected',
        readyState: dbState,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error in database health check:', error);
    res.status(500).json({
      status: 'error',
      message: 'Database health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Add a simple health check that doesn't depend on database
router.get('/api/v1/health/simple', (req: Request, res: Response) => {
  console.log('Simple health check requested');
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Add a minimal health check for Railway
router.get('/api/v1/health/minimal', (req: Request, res: Response) => {
  console.log('Minimal health check requested');
  res.status(200).json({ 
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'unknown',
    port: process.env.PORT || 'unknown'
  });
});

// Add a simple ping endpoint
router.get('/api/v1/health/ping', (req: Request, res: Response) => {
  console.log('Ping requested');
  res.status(200).send('pong');
});

export default router; 