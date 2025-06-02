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
import ElasticsearchService from "./services/elasticsearch/service";
import zendeskWebhookRoutesV1 from './routes/webhooks/zendesk/v1';
import { mapping as ticketsMapping, settings as ticketsSettings } from "./elasticsearch/schemas/ticket";
import modelTrainingRoutesV1 from './routes/model-training/v1';
import ticketsRoutesV1 from './routes/tickets/v1';
import seed from "./seeds";

export interface IServer {
  startServer: (callback: (port: number) => void) => void;
}

export default class Server{
  app: Application;
  appDefaultPort: number;
  clickhouseClient: NodeClickHouseClient;

  constructor() { 
    this.app = express();
    this.initialize();
    this.configureApp();
    this.initRoutes();
  }

  private initRoutes() {
    if (!this.app) {
      throw new Error('Cannot initialize routes, app does not exist.');
    }
    try {
      console.log("Initializing Routes ");
      this.app.use('/api/v1/auth', authRoutesV1);
      this.app.use('/api/v1/users', usersRoutesV1);
      this.app.use('/api/v1/train', modelTrainingRoutesV1);
      this.app.use('/api/v1/tickets', ticketsRoutesV1);
      this.app.use('/api/v1/webhooks/zendesk', zendeskWebhookRoutesV1);
    } catch (err) {
      console.log(err);
    }
  }

  private async initialize() {
    try {
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
    } catch (err) {
      console.log(err);
    }
  }
  public async initElasticSearch() {
    const esService = new ElasticsearchService();
    await esService.createIndex({ indexName: 'tickets', mapping: ticketsMapping, settings: ticketsSettings });
  }
  public async connectDB() {
    console.log('connecting to db...');
    let connectionString = '';
    if (Config.NODE_ENV === 'development') {
      // connectionString = Config.DB_CONNECTION_STRING_LOCAL || '';
      connectionString = Config.DB_CONNECTION_STRING_LOCAL_DOCKER || '';
    } else if (Config.NODE_ENV === 'production') {
      connectionString = Config.DB_CONNECTION_STRING_PROD || '';
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
    if (this.app) {
      this.app.use(express.static(path.join(__dirname, "../public")));
    }
  }

  public startServer = (callback: (port: number) => void) => {
    if (this.app) {
      this.app.listen(this.appDefaultPort || 80, () =>
        callback(this.appDefaultPort || 80)
      );
    }
  };
}
