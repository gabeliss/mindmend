import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../types';

export class ResponseHandler {
  static success<T>(res: Response, data: T, message?: string, statusCode = 200): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    };
    
    return res.status(statusCode).json(response);
  }

  static error(res: Response, error: string, statusCode = 500): Response {
    const response: ApiResponse = {
      success: false,
      error,
      timestamp: new Date().toISOString()
    };
    
    return res.status(statusCode).json(response);
  }

  static paginated<T>(
    res: Response, 
    data: T[], 
    pagination: PaginatedResponse<T>['pagination'],
    message?: string,
    statusCode = 200
  ): Response {
    const response: PaginatedResponse<T> = {
      data,
      pagination
    };
    
    return res.status(statusCode).json({
      success: true,
      ...response,
      message,
      timestamp: new Date().toISOString()
    });
  }

  static created<T>(res: Response, data: T, message = 'Resource created successfully'): Response {
    return this.success(res, data, message, 201);
  }

  static noContent(res: Response, message = 'Operation completed successfully'): Response {
    return res.status(204).json({
      success: true,
      message,
      timestamp: new Date().toISOString()
    });
  }
}

export default ResponseHandler;

// Convenience exports for backward compatibility
export const successResponse = ResponseHandler.success;
export const errorResponse = ResponseHandler.error;