import express, { Application } from "express";
import mongoose from 'mongoose';
import path from 'path';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import rateLimit from "express-rate-limit";
import { passport } from './middleware/passport';
import Config from './config';
import authRoutesV1 from './routes/auth/v1';
import usersRoutesV1 from './routes/users/v1';
import { NodeClickHouseClient } from "@clickhouse/client/dist/client";
import ElasticsearchService from "./elasticsearch/service";
import zendeskWebhookRoutesV1 from './routes/webhooks/zendesk/v1';
import { mapping as ticketsMapping, settings as ticketsSettings } from "./elasticsearch/schemas/ticket";
import modelTrainingRoutesV1 from './routes/model-training/v1';
import ticketsRoutesV1 from './routes/tickets/v1';
import seed from "./seeds";
import QdrantService from "./qdrant/service";

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
      console.log("Initializing Routes ");
      
      console.log("Adding auth routes...");
      this.app.use('/api/v1/auth', authRoutesV1);
      
      console.log("Adding user routes...");
      this.app.use('/api/v1/users', usersRoutesV1);
      
      console.log("Adding model training routes...");
      this.app.use('/api/v1/train', modelTrainingRoutesV1);
      
      console.log("Adding ticket routes...");
      this.app.use('/api/v1/tickets', ticketsRoutesV1);
      
      console.log("Adding webhook routes...");
      this.app.use('/api/v1/webhooks/zendesk', zendeskWebhookRoutesV1);
      
      console.log("Adding health check routes...");
      this.app.get('/api/v1/health', (req, res) => {
        console.log('Health check requested');
        res.status(200).json({ 
          status: 'healthy', 
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          environment: process.env.NODE_ENV,
          port: process.env.PORT
        });
      });
      
      // Add a simple health check that doesn't depend on database
      this.app.get('/health', (req, res) => {
        console.log('Simple health check requested');
        res.status(200).json({ 
          status: 'ok',
          timestamp: new Date().toISOString()
        });
      });
      
      // Add a minimal health check for Railway
      this.app.get('/', (req, res) => {
        console.log('Root health check requested');
        res.status(200).json({ 
          status: 'ok',
          message: 'Server is running',
          timestamp: new Date().toISOString(),
          env: process.env.NODE_ENV || 'unknown',
          port: process.env.PORT || 'unknown'
        });
      });
      
      // Add a simple ping endpoint
      this.app.get('/ping', (req, res) => {
        console.log('Ping requested');
        res.status(200).send('pong');
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
    const esService = new ElasticsearchService();
    await esService.createIndex({ indexName: 'tickets', mapping: ticketsMapping, settings: ticketsSettings });
  }

  public async initQdrant() {
    const qdrantService = new QdrantService();
    await qdrantService.createCollection({ collectionName: 'tickets', vectorSize: 768 });
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
      connectionString = connectionString.replace('<db_username>', Config.ATLAS_USERNAME || '');
      connectionString = connectionString.replace('<db_password>', Config.ATLAS_PASSWORD || '');
    } else {
      throw new Error('Invalid env name was provided in config');
    }
    try {
      await mongoose.connect(`${connectionString}/foozool`, {
        // Connection timeout settings
        serverSelectionTimeoutMS: 5000, // 5 seconds
        connectTimeoutMS: 10000, // 10 seconds
        socketTimeoutMS: 45000, // 45 seconds
        
        // Connection pool settings
        maxPoolSize: 10, // Maximum number of connections
        minPoolSize: 2,  // Minimum number of connections
        
        // Retry settings
        maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
        retryWrites: true, // Retry failed writes
        
        // Heartbeat settings
        heartbeatFrequencyMS: 10000, // 10 seconds
      });
      
      // Configure mongoose buffer settings
      mongoose.set('bufferCommands', false);
      
      console.log('connected successfully to db');
      
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
      
    } catch (err) {
      console.log('MongoDB connection failed:', err);
      throw err;
    }
  }

  public async seedDB() {
     await seed();
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
      this.app.listen(port, '0.0.0.0', () => {
        callback(port);
      });
    }
  };
}
