import { Request, Response, NextFunction } from 'express';
import FirebaseConfig from '../config/firebase';
import prisma from '../config/database';
import { AppError } from '../types';
import Logger from '../utils/logger';
import { authRateLimit } from './rateLimiter';

// Request interface is already extended in requestLogger.ts

// Extract token from Authorization header
const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return null;
  }
  
  // Support both "Bearer token" and "token" formats
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return authHeader;
};

// Main authentication middleware
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      throw new AppError('Authorization token required', 401);
    }
    
    // Development mode: allow mock token
    if (process.env.NODE_ENV === 'development' && token === 'mock-token') {
      const mockUser = await prisma.user.findUnique({
        where: { email: 'test@mindmend.app' }
      });
      
      if (mockUser) {
        req.user = {
          id: mockUser.id,
          firebaseUid: mockUser.firebaseUid,
          email: mockUser.email,
          displayName: mockUser.displayName || undefined,
          verified: true
        };
        return next();
      }
    }
    
    // Verify Firebase token
    const decodedToken = await FirebaseConfig.verifyIdToken(token);
    req.firebaseToken = decodedToken;
    
    // Check if user exists in our database
    let user = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid }
    });
    
    // If user doesn't exist, create them (this handles the registration flow)
    if (!user) {
      // Get additional user info from Firebase
      const firebaseUser = await FirebaseConfig.getUser(decodedToken.uid);
      
      user = await prisma.user.create({
        data: {
          firebaseUid: decodedToken.uid,
          email: decodedToken.email || firebaseUser.email!,
          displayName: decodedToken.name || firebaseUser.displayName || undefined,
          timezone: 'UTC', // Default timezone, can be updated later
          coachStyle: 'SUPPORTIVE' // Default coach style
        }
      });
      
      Logger.info('New user registered', { 
        userId: user.id, 
        email: user.email,
        firebaseUid: user.firebaseUid 
      });
    } else {
      // Update last active timestamp
      await prisma.user.update({
        where: { id: user.id },
        data: { updatedAt: new Date() }
      });
    }
    
    // Attach user to request
    req.user = {
      id: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      displayName: user.displayName || undefined,
      verified: decodedToken.email_verified || false
    };
    
    Logger.debug('User authenticated', { 
      userId: user.id, 
      email: user.email 
    });
    
    next();
  } catch (error: any) {
    // Log authentication failures
    Logger.warn('Authentication failed', { 
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url
    });
    
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
      timestamp: new Date().toISOString()
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = extractToken(req);
  
  if (!token) {
    return next(); // Continue without authentication
  }
  
  try {
    // Try to authenticate, but don't fail if it doesn't work
    await authenticateToken(req, res, () => {
      next(); // Continue with authenticated user
    });
  } catch (error) {
    // Continue without authentication if token is invalid
    Logger.debug('Optional authentication failed, continuing without auth', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next();
  }
};

// Require verified email
export const requireVerifiedEmail = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }
  
  if (!req.user.verified) {
    throw new AppError('Email verification required', 403);
  }
  
  next();
};

// Check if user owns resource
export const requireOwnership = (userIdParam: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }
    
    const resourceUserId = req.params[userIdParam] || req.body[userIdParam];
    
    if (!resourceUserId) {
      throw new AppError(`${userIdParam} parameter required`, 400);
    }
    
    if (req.user.id !== resourceUserId) {
      throw new AppError('Access denied: You can only access your own resources', 403);
    }
    
    next();
  };
};

// Check if user has specific role (for future use)
export const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }
    
    // For now, all users have the same role
    // This can be extended later with role-based access control
    if (role === 'user') {
      return next();
    }
    
    throw new AppError('Insufficient permissions', 403);
  };
};

// Authentication with rate limiting for auth endpoints
export const authenticateWithRateLimit = [authRateLimit, authenticateToken];

// Alias for backward compatibility
export const authenticateUser = authenticateToken;

// Logout endpoint handler (revokes refresh tokens)
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }
    
    // Revoke Firebase refresh tokens
    await FirebaseConfig.revokeRefreshTokens(req.user.firebaseUid);
    
    Logger.info('User logged out', { 
      userId: req.user.id,
      email: req.user.email 
    });
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};