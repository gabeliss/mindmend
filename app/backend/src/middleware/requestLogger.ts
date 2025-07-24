import { Request, Response, NextFunction } from 'express';
import Logger from '../utils/logger';

// Extended request interface to track timing
interface TimedRequest extends Request {
  startTime?: number;
}

// Request logging middleware
export const requestLogger = (req: TimedRequest, res: Response, next: NextFunction) => {
  req.startTime = Date.now();
  
  // Log incoming request
  Logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentLength: req.get('Content-Length'),
    ...(req.user && { userId: req.user.id })
  });

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body: any) {
    const responseTime = req.startTime ? Date.now() - req.startTime : 0;
    
    Logger.info('Outgoing response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: JSON.stringify(body).length,
      ...(req.user && { userId: req.user.id })
    });

    return originalJson.call(this, body);
  };

  next();
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Remove sensitive headers that might reveal information
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Only add HSTS in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
};

// Request ID middleware for tracking
export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] || 
                   `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  req.requestId = requestId as string;
  res.setHeader('X-Request-ID', requestId);
  
  next();
};

// Add request ID to Request interface
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: {
        id: string;
        firebaseUid: string;
        email: string;
        displayName?: string;
        verified: boolean;
      };
      firebaseToken?: any;
    }
  }
}