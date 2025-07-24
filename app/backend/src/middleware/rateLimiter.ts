import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types';

// Simple in-memory rate limiter for MVP
// In production, this should use Redis for distributed rate limiting

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class InMemoryRateLimiter {
  private store: RateLimitStore = {};
  
  constructor(
    private windowMs: number = 15 * 60 * 1000, // 15 minutes
    private maxRequests: number = 100
  ) {}

  public check(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const key = identifier;
    
    // Clean up expired entries
    if (this.store[key] && now > this.store[key].resetTime) {
      delete this.store[key];
    }
    
    // Initialize if not exists
    if (!this.store[key]) {
      this.store[key] = {
        count: 0,
        resetTime: now + this.windowMs
      };
    }
    
    const entry = this.store[key];
    entry.count++;
    
    const remaining = Math.max(0, this.maxRequests - entry.count);
    const allowed = entry.count <= this.maxRequests;
    
    return {
      allowed,
      remaining,
      resetTime: entry.resetTime
    };
  }
}

// Global rate limiter instance
const globalLimiter = new InMemoryRateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes
const authLimiter = new InMemoryRateLimiter(15 * 60 * 1000, 5); // 5 auth requests per 15 minutes
const aiLimiter = new InMemoryRateLimiter(60 * 60 * 1000, 10); // 10 AI requests per hour

// Generic rate limiting middleware
export const createRateLimit = (limiter: InMemoryRateLimiter, keyGenerator?: (req: Request) => string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Generate identifier (IP by default, or custom key)
    const identifier = keyGenerator ? keyGenerator(req) : (req.ip || 'unknown');
    
    const result = limiter.check(identifier);
    
    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': limiter['maxRequests'].toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
    });
    
    if (!result.allowed) {
      throw new AppError('Too many requests, please try again later', 429);
    }
    
    next();
  };
};

// Predefined rate limiters
export const globalRateLimit = createRateLimit(globalLimiter);

export const authRateLimit = createRateLimit(authLimiter, (req) => {
  // Rate limit by IP + endpoint for auth routes
  return `${req.ip}:auth`;
});

export const aiRateLimit = createRateLimit(aiLimiter, (req) => {
  // Rate limit by user ID for AI endpoints (if authenticated)
  const userId = req.user?.id || req.ip;
  return `${userId}:ai`;
});

// User-specific rate limiter (requires authentication)
export const createUserRateLimit = (maxRequests: number, windowMs: number) => {
  const userLimiter = new InMemoryRateLimiter(windowMs, maxRequests);
  
  return createRateLimit(userLimiter, (req) => {
    if (!req.user?.id) {
      throw new AppError('Authentication required', 401);
    }
    return req.user.id;
  });
};

// Alias for backward compatibility
export const rateLimiter = aiRateLimit;

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  
  // Clean up global limiter
  Object.keys(globalLimiter['store']).forEach(key => {
    if (now > globalLimiter['store'][key].resetTime) {
      delete globalLimiter['store'][key];
    }
  });
  
  // Clean up auth limiter
  Object.keys(authLimiter['store']).forEach(key => {
    if (now > authLimiter['store'][key].resetTime) {
      delete authLimiter['store'][key];
    }
  });
  
  // Clean up AI limiter
  Object.keys(aiLimiter['store']).forEach(key => {
    if (now > aiLimiter['store'][key].resetTime) {
      delete aiLimiter['store'][key];
    }
  });
}, 5 * 60 * 1000); // Clean up every 5 minutes