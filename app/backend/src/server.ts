import App from './app';
import { disconnectDatabase } from './config/database';
import Logger from './utils/logger';

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Create and start the application
const app = new App();
app.listen();

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  Logger.info(`${signal} received. Shutting down gracefully...`);
  
  try {
    // Close database connections
    await disconnectDatabase();
    
    // Close server connections
    Logger.info('Server closed. Exiting...');
    process.exit(0);
  } catch (error) {
    Logger.error('Error during graceful shutdown', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));