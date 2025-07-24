import { Request, Response } from 'express';
import { HabitService } from '../services/habitService';
import ResponseHandler from '../utils/response';
import { AppError } from '../types';
import { 
  validateRequiredFields, 
  validateHabitType,
  validateTextContent,
  ValidationError 
} from '../middleware/validation';

export class HabitController {
  // Create a new habit
  static createHabit = async (req: Request, res: Response) => {
    const { title, description, habitType } = req.body;
    const userId = req.user!.id;
    
    try {
      // Validate input
      if (!title || typeof title !== 'string') {
        throw new ValidationError('Title is required and must be a string');
      }
      
      if (!habitType || !validateHabitType(habitType)) {
        throw new ValidationError('Valid habit type is required (AVOID or BUILD)');
      }
      
      // Sanitize and validate title
      const sanitizedTitle = validateTextContent(title, 100);
      
      // Sanitize description if provided
      let sanitizedDescription: string | undefined;
      if (description) {
        if (typeof description !== 'string') {
          throw new ValidationError('Description must be a string');
        }
        sanitizedDescription = validateTextContent(description, 500);
      }
      
      const habit = await HabitService.createHabit(userId, {
        title: sanitizedTitle,
        description: sanitizedDescription,
        habitType: habitType
      });
      
      return ResponseHandler.created(res, habit, 'Habit created successfully');
    } catch (error) {
      if (error instanceof AppError || error instanceof ValidationError) {
        return ResponseHandler.error(res, error.message, error.statusCode || 400);
      }
      return ResponseHandler.error(res, 'Failed to create habit', 500);
    }
  };
  
  // Get all habits for the authenticated user
  static getUserHabits = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const includeInactive = req.query.includeInactive === 'true';
    
    try {
      const habits = await HabitService.getUserHabits(userId, includeInactive);
      
      return ResponseHandler.success(res, {
        habits,
        meta: {
          total: habits.length,
          active: habits.filter(h => h.isActive).length,
          inactive: habits.filter(h => !h.isActive).length
        }
      }, 'Habits retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return ResponseHandler.error(res, error.message, error.statusCode);
      }
      return ResponseHandler.error(res, 'Failed to retrieve habits', 500);
    }
  };
  
  // Get a specific habit by ID
  static getHabitById = async (req: Request, res: Response) => {
    const { habitId } = req.params;
    const userId = req.user!.id;
    
    try {
      const habit = await HabitService.getHabitById(habitId, userId);
      return ResponseHandler.success(res, habit, 'Habit retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return ResponseHandler.error(res, error.message, error.statusCode);
      }
      return ResponseHandler.error(res, 'Failed to retrieve habit', 500);
    }
  };
  
  // Update a habit
  static updateHabit = async (req: Request, res: Response) => {
    const { habitId } = req.params;
    const { title, description, isActive } = req.body;
    const userId = req.user!.id;
    
    try {
      const updateData: any = {};
      
      // Validate and sanitize title if provided
      if (title !== undefined) {
        if (typeof title !== 'string') {
          throw new ValidationError('Title must be a string');
        }
        updateData.title = validateTextContent(title, 100);
      }
      
      // Validate and sanitize description if provided
      if (description !== undefined) {
        if (description === null || description === '') {
          updateData.description = null;
        } else {
          if (typeof description !== 'string') {
            throw new ValidationError('Description must be a string');
          }
          updateData.description = validateTextContent(description, 500);
        }
      }
      
      // Validate isActive if provided
      if (isActive !== undefined) {
        if (typeof isActive !== 'boolean') {
          throw new ValidationError('isActive must be a boolean');
        }
        updateData.isActive = isActive;
      }
      
      // Check if there's anything to update
      if (Object.keys(updateData).length === 0) {
        throw new ValidationError('No valid fields provided to update');
      }
      
      const updatedHabit = await HabitService.updateHabit(habitId, userId, updateData);
      
      return ResponseHandler.success(res, updatedHabit, 'Habit updated successfully');
    } catch (error) {
      if (error instanceof AppError || error instanceof ValidationError) {
        return ResponseHandler.error(res, error.message, error.statusCode || 400);
      }
      return ResponseHandler.error(res, 'Failed to update habit', 500);
    }
  };
  
  // Delete (deactivate) a habit
  static deleteHabit = async (req: Request, res: Response) => {
    const { habitId } = req.params;
    const userId = req.user!.id;
    
    try {
      const deletedHabit = await HabitService.deleteHabit(habitId, userId);
      return ResponseHandler.success(res, deletedHabit, 'Habit deleted successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return ResponseHandler.error(res, error.message, error.statusCode);
      }
      return ResponseHandler.error(res, 'Failed to delete habit', 500);
    }
  };
  
  // Reactivate a habit
  static reactivateHabit = async (req: Request, res: Response) => {
    const { habitId } = req.params;
    const userId = req.user!.id;
    
    try {
      const reactivatedHabit = await HabitService.reactivateHabit(habitId, userId);
      return ResponseHandler.success(res, reactivatedHabit, 'Habit reactivated successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return ResponseHandler.error(res, error.message, error.statusCode);
      }
      return ResponseHandler.error(res, 'Failed to reactivate habit', 500);
    }
  };
  
  // Get habit statistics
  static getHabitStats = async (req: Request, res: Response) => {
    const { habitId } = req.params;
    const userId = req.user!.id;
    
    try {
      const stats = await HabitService.getHabitStats(habitId, userId);
      return ResponseHandler.success(res, stats, 'Habit statistics retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return ResponseHandler.error(res, error.message, error.statusCode);
      }
      return ResponseHandler.error(res, 'Failed to retrieve habit statistics', 500);
    }
  };
  
  // Bulk update habits (activate/deactivate multiple)
  static bulkUpdateHabits = async (req: Request, res: Response) => {
    const { habits } = req.body;
    const userId = req.user!.id;
    
    try {
      // Validate input
      if (!Array.isArray(habits) || habits.length === 0) {
        throw new ValidationError('Habits array is required and must not be empty');
      }
      
      if (habits.length > 20) {
        throw new ValidationError('Cannot update more than 20 habits at once');
      }
      
      // Validate each habit update
      for (const habit of habits) {
        if (!habit.id || typeof habit.id !== 'string') {
          throw new ValidationError('Each habit must have a valid id');
        }
        
        if (typeof habit.isActive !== 'boolean') {
          throw new ValidationError('Each habit must have a boolean isActive field');
        }
      }
      
      const result = await HabitService.bulkUpdateHabits(userId, habits);
      
      return ResponseHandler.success(res, result, 'Habits updated successfully');
    } catch (error) {
      if (error instanceof AppError || error instanceof ValidationError) {
        return ResponseHandler.error(res, error.message, error.statusCode || 400);
      }
      return ResponseHandler.error(res, 'Failed to bulk update habits', 500);
    }
  };
  
  // Get habits summary (for dashboard)
  static getHabitsSummary = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    
    try {
      const habits = await HabitService.getUserHabits(userId, false); // Only active habits
      
      const summary = {
        totalActive: habits.length,
        byType: {
          avoid: habits.filter(h => h.habitType === 'AVOID').length,
          build: habits.filter(h => h.habitType === 'BUILD').length
        },
        recentlyCreated: habits
          .filter(h => {
            const daysDiff = Math.floor((Date.now() - h.createdAt.getTime()) / (1000 * 60 * 60 * 24));
            return daysDiff <= 7; // Created in last 7 days
          }).length,
        habits: habits.map(h => ({
          id: h.id,
          title: h.title,
          habitType: h.habitType,
          totalEvents: h._count?.habitEvents || 0,
          createdAt: h.createdAt
        }))
      };
      
      return ResponseHandler.success(res, summary, 'Habits summary retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return ResponseHandler.error(res, error.message, error.statusCode);
      }
      return ResponseHandler.error(res, 'Failed to retrieve habits summary', 500);
    }
  };
}