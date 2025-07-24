import { PrismaClient } from '@prisma/client';
import Logger from '../utils/logger';

// Global Prisma instance to prevent hot reloading issues in development
declare global {
  var __prisma: PrismaClient | undefined;
}

// Create Prisma client with proper configuration
const createPrismaClient = (): PrismaClient => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
    errorFormat: 'minimal',
  });
};

// Use global variable in development to prevent exhausting database connections
const prisma = global.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV === 'development') {
  global.__prisma = prisma;
}

// Simple logging setup (removing event-based logging that was causing issues)

// Database connection test
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$connect();
    Logger.info('Database connected successfully');
    return true;
  } catch (error) {
    Logger.error('Database connection failed', error);
    return false;
  }
};

// Graceful shutdown
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    Logger.info('Database disconnected gracefully');
  } catch (error) {
    Logger.error('Error disconnecting from database', error);
  }
};

// Health check function
export const checkDatabaseHealth = async (): Promise<{
  status: 'healthy' | 'unhealthy';
  message: string;
  responseTime?: number;
}> => {
  const startTime = Date.now();
  
  try {
    // Simple query to test database connectivity
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      message: 'Database is healthy',
      responseTime
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      message: `Database health check failed: ${error.message}`
    };
  }
};

export default prisma;