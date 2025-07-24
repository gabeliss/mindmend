import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { checkDatabaseHealth } from '../config/database';
import FirebaseConfig from '../config/firebase';
import ResponseHandler from '../utils/response';

const router = Router();

// API status endpoint
router.get('/status', asyncHandler(async (req: Request, res: Response) => {
  const [dbHealth, firebaseHealth] = await Promise.all([
    checkDatabaseHealth(),
    FirebaseConfig.healthCheck()
  ]);
  
  const status = {
    service: 'MindMend API',
    version: process.env.API_VERSION || 'v1',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      status: dbHealth.status,
      responseTime: dbHealth.responseTime
    },
    firebase: {
      status: firebaseHealth.status,
      message: firebaseHealth.message
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024)
    }
  };
  
  const httpStatus = (dbHealth.status === 'healthy' && firebaseHealth.status === 'healthy') ? 200 : 503;
  return ResponseHandler.success(res, status, 'API status retrieved', httpStatus);
}));

// Health check endpoint (simple)
router.get('/health', asyncHandler(async (req: Request, res: Response) => {
  const dbHealth = await checkDatabaseHealth();
  
  const health = {
    status: dbHealth.status === 'healthy' ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    checks: {
      database: dbHealth
    }
  };
  
  const httpStatus = dbHealth.status === 'healthy' ? 200 : 503;
  return ResponseHandler.success(res, health, undefined, httpStatus);
}));

// API version info
router.get('/version', (req: Request, res: Response) => {
  return ResponseHandler.success(res, {
    version: process.env.API_VERSION || 'v1',
    name: process.env.APP_NAME || 'MindMend API',
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  });
});

// Root endpoint
router.get('/', (req: Request, res: Response) => {
  return ResponseHandler.success(res, {
    message: 'Welcome to MindMend API',
    version: process.env.API_VERSION || 'v1',
    documentation: '/api/status',
    endpoints: {
      health: '/health',
      status: '/api/status',
      version: '/api/version'
    }
  });
});

export default router;