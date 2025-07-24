import { Request, Response } from 'express';
import { HabitEventService } from '../services/habitEventService';
import ResponseHandler from '../utils/response';
import { AppError } from '../types';
import { 
  validateRequiredFields, 
  validateEventType,
  validateTextContent,
  ValidationError 
} from '../middleware/validation';

export class HabitEventController {
  // Log a new habit event
  static logEvent = async (req: Request, res: Response) => {
    const { habitId } = req.params;
    const { eventType, notes, occurredAt } = req.body;
    const userId = req.user!.id;
    
    try {
      // Validate input
      if (!eventType || !validateEventType(eventType)) {
        throw new ValidationError('Valid event type is required (COMPLETED, SKIPPED, or RELAPSED)');
      }
      
      // Validate occurred date
      let eventDate: Date;
      if (occurredAt) {
        eventDate = new Date(occurredAt);
        if (isNaN(eventDate.getTime())) {
          throw new ValidationError('Invalid date format for occurredAt');
        }
        
        // Don't allow future dates beyond tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(23, 59, 59, 999);
        
        if (eventDate > tomorrow) {
          throw new ValidationError('Cannot log events for future dates beyond tomorrow');
        }
        
        // Don't allow dates too far in the past (1 year)
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        
        if (eventDate < oneYearAgo) {
          throw new ValidationError('Cannot log events more than 1 year in the past');
        }
      } else {
        // Default to current time
        eventDate = new Date();
      }
      
      // Validate and sanitize notes if provided
      let sanitizedNotes: string | undefined;
      if (notes) {
        if (typeof notes !== 'string') {
          throw new ValidationError('Notes must be a string');
        }
        sanitizedNotes = validateTextContent(notes, 1000);
      }
      
      const habitEvent = await HabitEventService.logEvent(userId, habitId, {
        eventType,
        notes: sanitizedNotes || null,
        occurredAt: eventDate
      });
      
      return ResponseHandler.created(res, habitEvent, 'Habit event logged successfully');
    } catch (error) {
      if (error instanceof AppError || error instanceof ValidationError) {
        return ResponseHandler.error(res, error.message, error.statusCode || 400);
      }
      return ResponseHandler.error(res, 'Failed to log habit event', 500);
    }
  };
  
  // Get habit events with filtering and pagination
  static getHabitEvents = async (req: Request, res: Response) => {
    const { habitId } = req.params;
    const userId = req.user!.id;
    
    try {
      // Parse query parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100); // Max 100
      
      const filters: any = {};
      
      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
        if (isNaN(filters.startDate.getTime())) {
          throw new ValidationError('Invalid startDate format');
        }
      }
      
      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
        if (isNaN(filters.endDate.getTime())) {
          throw new ValidationError('Invalid endDate format');
        }
      }
      
      if (req.query.eventType && validateEventType(req.query.eventType as string)) {
        filters.eventType = req.query.eventType as string;
      }
      
      const result = await HabitEventService.getHabitEvents(userId, habitId, filters, page, limit);
      
      return ResponseHandler.success(res, result, 'Habit events retrieved successfully');
    } catch (error) {
      if (error instanceof AppError || error instanceof ValidationError) {
        return ResponseHandler.error(res, error.message, error.statusCode || 400);
      }
      return ResponseHandler.error(res, 'Failed to retrieve habit events', 500);
    }
  };
  
  // Get all events for a user
  static getAllUserEvents = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    
    try {
      // Parse query parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      
      const filters: any = {};
      
      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
        if (isNaN(filters.startDate.getTime())) {
          throw new ValidationError('Invalid startDate format');
        }
      }
      
      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
        if (isNaN(filters.endDate.getTime())) {
          throw new ValidationError('Invalid endDate format');
        }
      }
      
      if (req.query.eventType && validateEventType(req.query.eventType as string)) {
        filters.eventType = req.query.eventType as string;
      }
      
      const result = await HabitEventService.getAllUserEvents(userId, filters, page, limit);
      
      return ResponseHandler.success(res, result, 'User events retrieved successfully');
    } catch (error) {
      if (error instanceof AppError || error instanceof ValidationError) {
        return ResponseHandler.error(res, error.message, error.statusCode || 400);
      }
      return ResponseHandler.error(res, 'Failed to retrieve user events', 500);
    }
  };
  
  // Get a specific habit event
  static getEventById = async (req: Request, res: Response) => {
    const { eventId } = req.params;
    const userId = req.user!.id;
    
    try {
      const event = await HabitEventService.getEventById(eventId, userId);
      return ResponseHandler.success(res, event, 'Event retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return ResponseHandler.error(res, error.message, error.statusCode);
      }
      return ResponseHandler.error(res, 'Failed to retrieve event', 500);
    }
  };
  
  // Update a habit event
  static updateEvent = async (req: Request, res: Response) => {
    const { eventId } = req.params;
    const { eventType, notes, occurredAt } = req.body;
    const userId = req.user!.id;
    
    try {
      const updateData: any = {};
      
      // Validate and set event type if provided
      if (eventType !== undefined) {
        if (!validateEventType(eventType)) {
          throw new ValidationError('Valid event type is required (COMPLETED, SKIPPED, or RELAPSED)');
        }
        updateData.eventType = eventType;
      }
      
      // Validate and sanitize notes if provided
      if (notes !== undefined) {
        if (notes === null || notes === '') {
          updateData.notes = null;
        } else {
          if (typeof notes !== 'string') {
            throw new ValidationError('Notes must be a string');
          }
          updateData.notes = validateTextContent(notes, 1000);
        }
      }
      
      // Validate occurred date if provided
      if (occurredAt !== undefined) {
        const eventDate = new Date(occurredAt);
        if (isNaN(eventDate.getTime())) {
          throw new ValidationError('Invalid date format for occurredAt');
        }
        
        // Same validation as creation
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(23, 59, 59, 999);
        
        if (eventDate > tomorrow) {
          throw new ValidationError('Cannot set events for future dates beyond tomorrow');
        }
        
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        
        if (eventDate < oneYearAgo) {
          throw new ValidationError('Cannot set events more than 1 year in the past');
        }
        
        updateData.occurredAt = eventDate;
      }
      
      // Check if there's anything to update
      if (Object.keys(updateData).length === 0) {
        throw new ValidationError('No valid fields provided to update');
      }
      
      const updatedEvent = await HabitEventService.updateEvent(eventId, userId, updateData);
      
      return ResponseHandler.success(res, updatedEvent, 'Event updated successfully');
    } catch (error) {
      if (error instanceof AppError || error instanceof ValidationError) {
        return ResponseHandler.error(res, error.message, error.statusCode || 400);
      }
      return ResponseHandler.error(res, 'Failed to update event', 500);
    }
  };
  
  // Delete a habit event
  static deleteEvent = async (req: Request, res: Response) => {
    const { eventId } = req.params;
    const userId = req.user!.id;
    
    try {
      const result = await HabitEventService.deleteEvent(eventId, userId);
      return ResponseHandler.success(res, result, 'Event deleted successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return ResponseHandler.error(res, error.message, error.statusCode);
      }
      return ResponseHandler.error(res, 'Failed to delete event', 500);
    }
  };
  
  // Get today's events for dashboard
  static getTodayEvents = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    
    try {
      const events = await HabitEventService.getTodayEvents(userId);
      
      return ResponseHandler.success(res, {
        date: new Date().toISOString().split('T')[0],
        events,
        summary: {
          total: events.length,
          completed: events.filter(e => e.eventType === 'COMPLETED').length,
          skipped: events.filter(e => e.eventType === 'SKIPPED').length,
          relapsed: events.filter(e => e.eventType === 'RELAPSED').length
        }
      }, 'Today\'s events retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return ResponseHandler.error(res, error.message, error.statusCode);
      }
      return ResponseHandler.error(res, 'Failed to retrieve today\'s events', 500);
    }
  };
  
  // Get completion calendar
  static getCompletionCalendar = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    
    try {
      // Parse date range (default to current month)
      let startDate: Date, endDate: Date;
      
      if (req.query.startDate && req.query.endDate) {
        startDate = new Date(req.query.startDate as string);
        endDate = new Date(req.query.endDate as string);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new ValidationError('Invalid date format');
        }
      } else {
        // Default to current month
        const now = new Date();
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }
      
      // Limit range to prevent large queries
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > 366) {
        throw new ValidationError('Date range cannot exceed 1 year');
      }
      
      const calendar = await HabitEventService.getCompletionCalendar(userId, startDate, endDate);
      
      return ResponseHandler.success(res, {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        calendar
      }, 'Completion calendar retrieved successfully');
    } catch (error) {
      if (error instanceof AppError || error instanceof ValidationError) {
        return ResponseHandler.error(res, error.message, error.statusCode || 400);
      }
      return ResponseHandler.error(res, 'Failed to retrieve completion calendar', 500);
    }
  };
  
  // Get event statistics
  static getEventStatistics = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { habitId } = req.query;
    
    try {
      const stats = await HabitEventService.getEventStatistics(
        userId, 
        habitId as string | undefined
      );
      
      return ResponseHandler.success(res, stats, 'Event statistics retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return ResponseHandler.error(res, error.message, error.statusCode);
      }
      return ResponseHandler.error(res, 'Failed to retrieve event statistics', 500);
    }
  };
  
  // Bulk log events
  static bulkLogEvents = async (req: Request, res: Response) => {
    const { events } = req.body;
    const userId = req.user!.id;
    
    try {
      // Validate input
      if (!Array.isArray(events) || events.length === 0) {
        throw new ValidationError('Events array is required and must not be empty');
      }
      
      if (events.length > 50) {
        throw new ValidationError('Cannot log more than 50 events at once');
      }
      
      // Validate each event
      const validatedEvents = events.map((event, index) => {
        if (!event.habitId || typeof event.habitId !== 'string') {
          throw new ValidationError(`Event ${index}: habitId is required`);
        }
        
        if (!event.eventData || typeof event.eventData !== 'object') {
          throw new ValidationError(`Event ${index}: eventData is required`);
        }
        
        const { eventType, notes, occurredAt } = event.eventData;
        
        if (!validateEventType(eventType)) {
          throw new ValidationError(`Event ${index}: invalid eventType`);
        }
        
        let eventDate = occurredAt ? new Date(occurredAt) : new Date();
        if (isNaN(eventDate.getTime())) {
          throw new ValidationError(`Event ${index}: invalid occurredAt date`);
        }
        
        return {
          habitId: event.habitId,
          eventData: {
            eventType,
            notes: notes ? validateTextContent(notes, 1000) : null,
            occurredAt: eventDate
          }
        };
      });
      
      const result = await HabitEventService.bulkLogEvents(userId, validatedEvents);
      
      return ResponseHandler.success(res, result, 'Events logged successfully');
    } catch (error) {
      if (error instanceof AppError || error instanceof ValidationError) {
        return ResponseHandler.error(res, error.message, error.statusCode || 400);
      }
      return ResponseHandler.error(res, 'Failed to bulk log events', 500);
    }
  };
}