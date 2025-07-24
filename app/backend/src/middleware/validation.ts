import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types';

// Basic validation utilities
export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

// Validate required fields in request body
export const validateRequiredFields = (requiredFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missingFields: string[] = [];
    
    for (const field of requiredFields) {
      if (!req.body || req.body[field] === undefined || req.body[field] === null) {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    next();
  };
};

// Validate UUID format
export const validateUUID = (paramName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const uuid = req.params[paramName];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!uuid || !uuidRegex.test(uuid)) {
      throw new ValidationError(`Invalid ${paramName} format. Must be a valid UUID.`);
    }
    
    next();
  };
};

// Validate email format
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate mood rating (1-10)
export const validateMoodRating = (rating: number): boolean => {
  return Number.isInteger(rating) && rating >= 1 && rating <= 10;
};

// Validate habit type
export const validateHabitType = (type: string): boolean => {
  return ['AVOID', 'BUILD'].includes(type);
};

// Validate event type
export const validateEventType = (type: string): boolean => {
  return ['COMPLETED', 'SKIPPED', 'RELAPSED'].includes(type);
};

// Validate coach style
export const validateCoachStyle = (style: string): boolean => {
  return ['SUPPORTIVE', 'DIRECT', 'MOTIVATIONAL'].includes(style);
};

// General request body validator
export const validateRequestBody = (validations: Record<string, (value: any) => boolean>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];
    
    for (const [field, validator] of Object.entries(validations)) {
      if (req.body[field] !== undefined) {
        if (!validator(req.body[field])) {
          errors.push(`Invalid ${field} value`);
        }
      }
    }
    
    if (errors.length > 0) {
      throw new ValidationError(errors.join(', '));
    }
    
    next();
  };
};

// Pagination validation middleware
export const validatePagination = (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  if (page < 1) {
    throw new ValidationError('Page number must be greater than 0');
  }
  
  if (limit < 1 || limit > 100) {
    throw new ValidationError('Limit must be between 1 and 100');
  }
  
  req.query.page = page.toString();
  req.query.limit = limit.toString();
  
  next();
};

// Sanitize string input
export const sanitizeString = (str: string): string => {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, ''); // Basic HTML tag removal
};

// Validate and sanitize text content
export const validateTextContent = (content: string, maxLength = 5000): string => {
  if (typeof content !== 'string') {
    throw new ValidationError('Content must be a string');
  }
  
  const sanitized = sanitizeString(content);
  
  if (sanitized.length === 0) {
    throw new ValidationError('Content cannot be empty');
  }
  
  if (sanitized.length > maxLength) {
    throw new ValidationError(`Content cannot exceed ${maxLength} characters`);
  }
  
  return sanitized;
};