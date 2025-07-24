import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import database configuration
import { testDatabaseConnection, disconnectDatabase, checkDatabaseHealth } from './config/database';
import Logger from './utils/logger';

// Import Firebase configuration
import FirebaseConfig from './config/firebase';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger, securityHeaders, requestId } from './middleware/requestLogger';
import { globalRateLimit } from './middleware/rateLimiter';

// Import routes
import apiRoutes from './routes/index';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import habitRoutes from './routes/habits';
import habitEventRoutes from './routes/habitEvents';
import streakRoutes from './routes/streaks';
import analyticsRoutes from './routes/analytics';
import journalRoutes from './routes/journal';
import aiInsightRoutes from './routes/aiInsights';
import weeklySummaryRoutes from './routes/weeklySummary';

class App {
  public app: Application;
  public port: string | number;

  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    
    this.initializeDatabase();
    this.initializeFirebase();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private async initializeDatabase(): Promise<void> {
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
      Logger.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }
  }

  private async initializeFirebase(): Promise<void> {
    try {
      // Firebase is initialized when the config is imported
      const health = await FirebaseConfig.healthCheck();
      if (health.status === 'unhealthy') {
        Logger.warn('Firebase connection unhealthy', { message: health.message });
      } else {
        Logger.info('Firebase initialized successfully');
      }
    } catch (error) {
      Logger.error('Firebase initialization failed', error);
      // Don't exit on Firebase failure in development
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }
  }

  private initializeMiddlewares(): void {
    // Request ID for tracking
    this.app.use(requestId);
    
    // Security headers
    this.app.use(securityHeaders);
    this.app.use(helmet());
    
    // CORS configuration
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://your-frontend-domain.com'] // Update with your frontend domain
        : true, // Allow all origins in development
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
    }));

    // Rate limiting
    this.app.use(globalRateLimit);

    // Body parsing middleware
    this.app.use(express.json({ 
      limit: '10mb',
      type: 'application/json'
    }));
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: '10mb' 
    }));

    // Request logging (after body parsing so we can log request size)
    this.app.use(requestLogger);
    
    // Built-in Morgan logging for additional HTTP request logs
    this.app.use(morgan(
      process.env.NODE_ENV === 'production' 
        ? 'combined' 
        : 'dev'
    ));
  }

  private initializeRoutes(): void {
    // Root API routes (health check, status)
    this.app.use('/', apiRoutes);

    // Authentication routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/users', userRoutes);

    // Business logic routes
    this.app.use('/api/habits', habitRoutes);
    this.app.use('/api/habit-events', habitEventRoutes);
    this.app.use('/api/streaks', streakRoutes);
    this.app.use('/api/analytics', analyticsRoutes);
    this.app.use('/api/journal', journalRoutes);
    this.app.use('/api/ai/insights', aiInsightRoutes);
    this.app.use('/api/weekly-summary', weeklySummaryRoutes);
  }

  private initializeErrorHandling(): void {
    // Global error handler
    this.app.use(errorHandler);
  }

  public listen(): void {
    this.app.listen(this.port, () => {
      console.log(`🚀 MindMend API server is running on port ${this.port}`);
      console.log(`🌟 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${this.port}/health`);
    });
  }
}

export default App;