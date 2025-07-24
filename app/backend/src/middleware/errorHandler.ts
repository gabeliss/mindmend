import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import Logger from '../utils/logger';
import { AppError } from '../types';

// Custom error handler middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  let statusCode = 500;
  let message = 'Internal server error';
  let details: any = undefined;

  // Log the error
  Logger.error('Error occurred', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  // Handle different types of errors
  if (error instanceof AppError) {
    // Custom application errors
    statusCode = error.statusCode;
    message = error.message;
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle Prisma database errors
    const { code, meta } = error;
    
    switch (code) {
      case 'P2002':
        statusCode = 409;
        message = 'A record with this data already exists';
        details = { field: meta?.target };
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Record not found';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Invalid reference to related record';
        break;
      case 'P2014':
        statusCode = 400;
        message = 'Invalid ID provided';
        break;
      default:
        statusCode = 400;
        message = 'Database operation failed';
        details = { code };
    }
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid data provided';
    details = { validation: 'Request data does not match expected format' };
  } else if (error instanceof SyntaxError && 'body' in error) {
    // Handle JSON parsing errors
    statusCode = 400;
    message = 'Invalid JSON in request body';
  } else if (error.name === 'ValidationError') {
    // Handle validation errors (if using a validation library)
    statusCode = 400;
    message = 'Validation failed';
    details = error.message;
  }

  // Response format
  const errorResponse = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    ...(details && { details }),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  };

  return res.status(statusCode).json(errorResponse);
};

// Not found handler
export const notFoundHandler = (req: Request, res: Response): Response => {
  return res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `The route ${req.originalUrl} does not exist on this server`,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
};

// Async error wrapper utility
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};