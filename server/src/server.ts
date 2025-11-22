import express, { Application } from "express";
import mongoose from 'mongoose';
import path from 'path';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import rateLimit from "express-rate-limit";
import { passport, initializeJWTStrategies } from './middleware/passport';
import Config from './config';
import authRoutesV1 from './routes/auth/v1';
import usersRoutesV1 from './routes/users/v1';
import organizationsRoutesV1 from './routes/organizations/v1';
import healthRoutesV1 from './routes/health/v1';
import fakerRoutesV1 from './routes/faker/v1';
import googleRoutesV1 from './routes/google/v1';
import { NodeClickHouseClient } from "@clickhouse/client/dist/client";
import ElasticsearchService from "./elasticsearch/service";
import zendeskWebhookRoutesV1 from './routes/webhooks/zendesk/v1';
import webhookRoutesV1 from './routes/webhooks/v1';
import crmWebhookRoutesV1 from './routes/webhooks/crm/v1';
import { mapping as ticketsMapping, settings as ticketsSettings } from "./elasticsearch/schemas/ticket";
import modelTrainingRoutesV1 from './routes/model-training/v1';
import ticketsRoutesV1 from './routes/tickets/v1';
import autonomousAIRoutesV1 from './routes/autonomousAI/v1';
import insightsRoutesV1 from './routes/insights/v1';
import analyticsRoutesV1 from './routes/analytics/v1';
import jobsRoutesV1 from './routes/jobs/v1';
import crmRoutesV1 from './routes/crm/v1';
import anomaliesRoutesV1 from './routes/anomalies/v1';
import surveysRoutesV1 from './routes/surveys/v1';
import customersRoutesV1 from './routes/customers/v1';
import solutionsRoutesV1 from './routes/solutions/v1';
import customerActivityRoutesV1 from './routes/customer-activity/v1';
import industriesRoutesV1 from './routes/industries/v1';
import botsRoutesV1 from './routes/bots/v1';
import utilsRoutesV1 from './routes/utils/v1';
import permissionsRoutesV1 from './routes/permissions/v1';
import docsRoutesV1 from './routes/docs/v1';
import leadsRoutesV1 from './routes/leads/v1';
import actionItemsRoutes from './routes/action-items';
import newsRoutesV1 from './routes/news/v1';
import swaggerRoutesV1 from './routes/swagger/v1';
import { seed } from "./seeds";
import { qdrantClient } from "./qdrant/service";
import { googleFileCollectionConfig } from './qdrant/schemas/googleFile';
import { startAllJobs } from './jobs';
import searchRoutesV1 from './routes/search/v1';
import migrationsRoutesV1 from './routes/migrations/v1';
import { ensureIndexes } from './utils/ensureIndexes';
import { ticketCollectionConfig } from './qdrant/schemas/ticket';

export interface IServer {
  startServer: (callback: (port: number) => void) => void;
}

export default class Server{
  app: Application;
  appDefaultPort: number;
  clickhouseClient: NodeClickHouseClient;

  constructor() { 
    try {
      console.log('Creating server instance...');
      this.app = express();
      this.initialize();
      this.configureApp();
      this.initRoutes();
      
      // Initialize JWT strategies after environment variables are loaded
      console.log('Initializing JWT strategies...');
      initializeJWTStrategies();
      
      console.log('✅ Server instance created successfully');
    } catch (error) {
      console.error('❌ Error creating server instance:', error);
      throw error;
    }
  }

  private initRoutes() {
    if (!this.app) {
      throw new Error('Cannot initialize routes, app does not exist.');
    }
    try {
      console.log("Initializing routes...");
      
      // Initialize JWT strategies
      initializeJWTStrategies();
      
      // API routes
      this.app.use('/api/v1/auth', authRoutesV1);
      this.app.use('/api/v1/users', usersRoutesV1);
      this.app.use('/api/v1/organizations', organizationsRoutesV1);
      this.app.use('/api/v1/health', healthRoutesV1);
      this.app.use('/api/v1/tickets', ticketsRoutesV1);
      this.app.use('/api/v1/autonomous-ai', autonomousAIRoutesV1);
      this.app.use('/api/v1/insights', insightsRoutesV1);
      this.app.use('/api/v1/analytics', analyticsRoutesV1);
      this.app.use('/api/v1', jobsRoutesV1);
      this.app.use('/api/v1/crm', crmRoutesV1);
      this.app.use('/api/v1/anomalies', anomaliesRoutesV1);
      this.app.use('/api/v1/surveys', surveysRoutesV1);
      this.app.use('/api/v1/customers', customersRoutesV1);
      this.app.use('/api/v1/solutions', solutionsRoutesV1);
      this.app.use('/api/v1/customer-activity', customerActivityRoutesV1);
      this.app.use('/api/v1/action-items', actionItemsRoutes);
      this.app.use('/api/v1/industries', industriesRoutesV1);
      this.app.use('/api/v1/bots', botsRoutesV1);
      this.app.use('/api/v1/utils', utilsRoutesV1);
      this.app.use('/api/v1/permissions', permissionsRoutesV1);
      this.app.use('/api/v1/docs', docsRoutesV1);
      this.app.use('/api/v1', leadsRoutesV1);

      this.app.use('/api/v1/news', newsRoutesV1);
      this.app.use('/api/v1/train', modelTrainingRoutesV1);
      this.app.use('/api/v1/webhooks/zendesk', zendeskWebhookRoutesV1);
      this.app.use('/api/v1/webhooks', webhookRoutesV1);
      this.app.use('/api/v1/webhooks/crm', crmWebhookRoutesV1);
      this.app.use('/api/v1/faker', fakerRoutesV1);
      this.app.use('/api/v1/google', googleRoutesV1);
      this.app.use('/api/v1/search', searchRoutesV1);
      this.app.use('/api/v1/migrations', migrationsRoutesV1);
      // Swagger documentation
      this.app.use('/api/swagger', swaggerRoutesV1);
      
      // Legacy health check endpoints for backward compatibility
      this.app.get('/api/v1/health', (req, res) => {
        res.redirect('/api/v1/health/detailed');
      });
      
      this.app.get('/health', (req, res) => {
        res.redirect('/api/v1/health/simple');
      });
      
      this.app.get('/health-simple', (req, res) => {
        res.redirect('/api/v1/health/simple');
      });
      
      this.app.get('/', (req, res) => {
        res.redirect('/api/v1/health/minimal');
      });
      
      this.app.get('/ping', (req, res) => {
        res.redirect('/api/v1/health/ping');
      });
      
      // Add a test POST endpoint
      this.app.post('/api/v1/test', (req, res) => {
        console.log('Test POST endpoint called with body:', req.body);
        res.status(200).json({ 
          status: 'success',
          message: 'POST request received successfully',
          body: req.body,
          timestamp: new Date().toISOString()
        });
      });
      
      console.log("✅ All routes initialized successfully");
    } catch (err) {
      console.error("❌ Error initializing routes:", err);
      throw err;
    }
  }

  private async initialize() {
    try {
      console.log("Initializing middleware...");
      
      // Trust proxy for Railway deployment (fixes X-Forwarded-For header issue)
      this.app.set('trust proxy', 1);
      
      this.app.use(bodyParser.json({ limit: '50mb' }));
      this.app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
      this.app.use(cookieParser());
      this.app.use(express.json());
      this.app.use(passport.initialize());
      
      const limiter = rateLimit({
        windowMs: 1 * 60 * 1000, // 1 minute
        max: 100, // limit each IP to 100 requests per windowMs
      });
      this.app.use(limiter);

      this.app.use(cors({
        origin: (origin, callback) => {
          return callback(null, true);
        },
        optionsSuccessStatus: 200,
        credentials: true
      }));
      
      this.appDefaultPort = process.env.PORT ? Number(process.env.PORT) : 80;
      
      console.log("✅ Middleware initialized successfully");
    } catch (err) {
      console.error("❌ Error initializing middleware:", err);
      throw err;
    }
  }
  public async initElasticSearch() {
    try {
      console.log('Initializing Elasticsearch...');
      const esService = new ElasticsearchService();
      await esService.createIndex({ indexName: 'tickets', mapping: ticketsMapping, settings: ticketsSettings });
      console.log('✅ Elasticsearch initialized successfully');
    } catch (error) {
      console.error('❌ Elasticsearch initialization failed:', error);
      throw error;
    }
  }

  public async initQdrant() {
    // Use the singleton qdrantClient instance
    // Create collections using the service instances
    const { createTicketCollection, createGoogleFileCollection } = await import('./qdrant/service');
    await createTicketCollection();
    await createGoogleFileCollection();
    
    // Create index for organization_id for filtering
    await qdrantClient.createPayloadIndex(googleFileCollectionConfig.name, {
      field_name: 'organization_id',
      field_schema: 'keyword'
    });
    // Create index for embedding_quality_score for filtering/searching
    await qdrantClient.createPayloadIndex(googleFileCollectionConfig.name, {
      field_name: 'embedding_quality_score',
      field_schema: 'float'
    });
    // Create index for created_at for date range filtering in tickets collection
    await qdrantClient.createPayloadIndex(ticketCollectionConfig.name, {
      field_name: 'created_at',
      field_schema: 'integer'
    });
    // Create index for organization for filtering in tickets collection
    await qdrantClient.createPayloadIndex(ticketCollectionConfig.name, {
      field_name: 'organization',
      field_schema: 'keyword'
    });
    // Create index for customer_id for filtering in tickets collection
    await qdrantClient.createPayloadIndex(ticketCollectionConfig.name, {
      field_name: 'customer_id',
      field_schema: 'keyword'
    });
  }

  public async connectDB() {
    console.log('connecting to db...');
    let connectionString: string = '';
    if (Config.NODE_ENV === 'development') {
      connectionString = Config.IS_DOCKER_DEV === 'true'
      ? Config.DB_CONNECTION_STRING_LOCAL_DOCKER || ''
      : Config.DB_CONNECTION_STRING_LOCAL || '';
    } else if (Config.NODE_ENV === 'production') {
      connectionString = Config.ATLAS_CONNECTION_STRING || '';
      // Only replace placeholders if they exist in the connection string
      if (connectionString.includes('<db_username>')) {
        connectionString = connectionString.replace('<db_username>', Config.ATLAS_USERNAME || '');
      }
      if (connectionString.includes('<db_password>')) {
        connectionString = connectionString.replace('<db_password>', Config.ATLAS_PASSWORD || '');
      }
    } else {
      throw new Error('Invalid env name was provided in config');
    }
    
    console.log('Connection string (masked):', connectionString.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    console.log('NODE_ENV:', Config.NODE_ENV);
    console.log('ATLAS_CONNECTION_STRING exists:', !!Config.ATLAS_CONNECTION_STRING);
    console.log('ATLAS_USERNAME exists:', !!Config.ATLAS_USERNAME);
    console.log('ATLAS_PASSWORD exists:', !!Config.ATLAS_PASSWORD);
    
    // Configure mongoose buffer settings BEFORE connecting
    mongoose.set('bufferCommands', true); // Enable buffering for Railway
    
    // Don't append /test if the connection string already includes a database name
    const finalConnectionString = connectionString.includes('/?') || connectionString.includes('/test') 
      ? connectionString 
      : `${connectionString}/test`;
      
    console.log('Final connection string (masked):', finalConnectionString.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    console.log('Connecting to MongoDB with URI:', finalConnectionString);
    
    // Retry connection logic
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        console.log(`Attempting database connection (attempt ${retryCount + 1}/${maxRetries})...`);
        
        await mongoose.connect(finalConnectionString, {
          // Connection timeout settings - more lenient for Railway
          serverSelectionTimeoutMS: 30000, // 30 seconds (increased from 5)
          connectTimeoutMS: 30000, // 30 seconds (increased from 10)
          socketTimeoutMS: 60000, // 60 seconds (increased from 45)
          
          // Connection pool settings - optimized for Railway
          maxPoolSize: 5, // Reduced from 10 to avoid overwhelming the connection
          minPoolSize: 1, // Reduced from 2
          maxIdleTimeMS: 60000, // 60 seconds (increased from 30)
          
          // Retry settings
          retryWrites: true,
          retryReads: true, // Enable retry for reads
          
          // Heartbeat settings
          heartbeatFrequencyMS: 30000, // 30 seconds (increased from 10)
          
          // Additional settings for stability
          family: 4, // Force IPv4
        });
        
        console.log('✅ Connected successfully to database');
        
        // Handle connection events
        mongoose.connection.on('error', (err) => {
          console.error('MongoDB connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
          console.log('MongoDB disconnected');
        });
        
        mongoose.connection.on('reconnected', () => {
          console.log('MongoDB reconnected');
        });
        
        // Add connection state logging
        console.log('MongoDB connection state:', mongoose.connection.readyState);
        console.log('MongoDB connection host:', mongoose.connection.host);
        console.log('MongoDB connection name:', mongoose.connection.name);
        
        // Ensure database indexes are created
        await this.ensureDatabaseIndexes();
        
        return; // Success, exit the retry loop
        
      } catch (err) {
        retryCount++;
        console.error(`❌ Database connection attempt ${retryCount} failed:`, err);
        
        if (retryCount >= maxRetries) {
          console.error('❌ All database connection attempts failed');
          throw err;
        }
        
        // Wait before retrying (exponential backoff)
        const waitTime = Math.min(1000 * Math.pow(2, retryCount - 1), 10000); // Max 10 seconds
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  public async seedDB() {
     await seed();
  }

  public async startJobs() {
    console.log('Initializing scheduled jobs...');
    startAllJobs();
    console.log('✅ Scheduled jobs started successfully');
  }

  /**
   * Ensure database indexes are created for optimal query performance
   */
  private async ensureDatabaseIndexes(): Promise<void> {
    try {
      await ensureIndexes();
    } catch (error) {
      console.error('❌ Error ensuring database indexes:', error);
      // Don't throw error to prevent application startup failure
    }
  }

  private configureApp() {
    try {
      if (this.app) {
        this.app.use(express.static(path.join(__dirname, "../public")));
        console.log("✅ App configuration completed");
      } else {
        throw new Error("App is not initialized");
      }
    } catch (error) {
      console.error("❌ Error configuring app:", error);
      throw error;
    }
  }

  public startServer = (callback: (port: number) => void) => {
    if (this.app) {
      const port = this.appDefaultPort || 80;
      const host = '0.0.0.0'; // Bind to all interfaces for Railway
      
      console.log(`Attempting to start server on ${host}:${port}...`);
      
      try {
        this.app.listen(port, host, () => {
          console.log(`🚀 Server started on ${host}:${port}`);
          callback(port);
        });
      } catch (error) {
        console.error('❌ Error starting server:', error);
        throw error;
      }
    } else {
      console.error('❌ Cannot start server: app is not initialized');
      throw new Error('App is not initialized');
    }
  };
}
