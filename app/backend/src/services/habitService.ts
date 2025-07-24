import prisma from '../config/database';
import { AppError } from '../types';
import Logger from '../utils/logger';
import { CreateHabitInput, UpdateHabitInput, HabitWithEvents } from '../types/prisma';

export class HabitService {
  // Create a new habit
  static async createHabit(userId: string, habitData: CreateHabitInput) {
    try {
      // Validate habit limit (max 20 habits per user for MVP)
      const existingHabitsCount = await prisma.habit.count({
        where: { userId, isActive: true }
      });
      
      if (existingHabitsCount >= 20) {
        throw new AppError('Maximum of 20 active habits allowed', 400);
      }
      
      // Check for duplicate habit titles (case-insensitive)
      const existingHabit = await prisma.habit.findFirst({
        where: {
          userId,
          title: {
            equals: habitData.title,
            mode: 'insensitive'
          },
          isActive: true
        }
      });
      
      if (existingHabit) {
        throw new AppError('A habit with this title already exists', 409);
      }
      
      const habit = await prisma.habit.create({
        data: {
          userId,
          title: habitData.title.trim(),
          description: habitData.description?.trim() || null,
          habitType: habitData.habitType,
        },
        include: {
          _count: {
            select: {
              habitEvents: true
            }
          }
        }
      });
      
      Logger.info('Habit created', { 
        userId, 
        habitId: habit.id, 
        title: habit.title,
        type: habit.habitType 
      });
      
      return habit;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Failed to create habit', { userId, error });
      throw new AppError('Failed to create habit', 500);
    }
  }
  
  // Get all habits for a user
  static async getUserHabits(userId: string, includeInactive: boolean = false) {
    try {
      const whereCondition: any = { userId };
      if (!includeInactive) {
        whereCondition.isActive = true;
      }
      
      const habits = await prisma.habit.findMany({
        where: whereCondition,
        include: {
          _count: {
            select: {
              habitEvents: {
                where: {
                  eventType: 'COMPLETED'
                }
              }
            }
          }
        },
        orderBy: [
          { isActive: 'desc' }, // Active habits first
          { createdAt: 'asc' }   // Oldest first within each group
        ]
      });
      
      return habits;
    } catch (error) {
      Logger.error('Failed to get user habits', { userId, error });
      throw new AppError('Failed to retrieve habits', 500);
    }
  }
  
  // Get a specific habit by ID
  static async getHabitById(habitId: string, userId: string) {
    try {
      const habit = await prisma.habit.findFirst({
        where: { 
          id: habitId, 
          userId 
        },
        include: {
          habitEvents: {
            orderBy: { occurredAt: 'desc' },
            take: 10 // Last 10 events
          },
          _count: {
            select: {
              habitEvents: true
            }
          }
        }
      });
      
      if (!habit) {
        throw new AppError('Habit not found', 404);
      }
      
      return habit;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Failed to get habit', { habitId, userId, error });
      throw new AppError('Failed to retrieve habit', 500);
    }
  }
  
  // Update a habit
  static async updateHabit(habitId: string, userId: string, updateData: UpdateHabitInput) {
    try {
      // Check if habit exists and belongs to user
      const existingHabit = await prisma.habit.findFirst({
        where: { id: habitId, userId }
      });
      
      if (!existingHabit) {
        throw new AppError('Habit not found', 404);
      }
      
      // If updating title, check for duplicates
      if (updateData.title) {
        const duplicateHabit = await prisma.habit.findFirst({
          where: {
            userId,
            title: {
              equals: updateData.title,
              mode: 'insensitive'
            },
            isActive: true,
            id: { not: habitId } // Exclude current habit
          }
        });
        
        if (duplicateHabit) {
          throw new AppError('A habit with this title already exists', 409);
        }
      }
      
      // Prepare update data
      const updatePayload: any = {};
      
      if (updateData.title !== undefined) {
        updatePayload.title = updateData.title.trim();
      }
      
      if (updateData.description !== undefined) {
        updatePayload.description = updateData.description ? updateData.description.trim() : null;
      }
      
      if (updateData.isActive !== undefined) {
        updatePayload.isActive = updateData.isActive;
      }
      
      const updatedHabit = await prisma.habit.update({
        where: { id: habitId },
        data: updatePayload,
        include: {
          _count: {
            select: {
              habitEvents: true
            }
          }
        }
      });
      
      Logger.info('Habit updated', { 
        userId, 
        habitId, 
        updatedFields: Object.keys(updatePayload) 
      });
      
      return updatedHabit;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Failed to update habit', { habitId, userId, error });
      throw new AppError('Failed to update habit', 500);
    }
  }
  
  // Soft delete a habit (mark as inactive)
  static async deleteHabit(habitId: string, userId: string) {
    try {
      const habit = await prisma.habit.findFirst({
        where: { id: habitId, userId }
      });
      
      if (!habit) {
        throw new AppError('Habit not found', 404);
      }
      
      const deletedHabit = await prisma.habit.update({
        where: { id: habitId },
        data: { isActive: false },
        select: {
          id: true,
          title: true,
          isActive: true,
          updatedAt: true
        }
      });
      
      Logger.info('Habit soft deleted', { 
        userId, 
        habitId, 
        title: habit.title 
      });
      
      return deletedHabit;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Failed to delete habit', { habitId, userId, error });
      throw new AppError('Failed to delete habit', 500);
    }
  }
  
  // Reactivate a habit
  static async reactivateHabit(habitId: string, userId: string) {
    try {
      const habit = await prisma.habit.findFirst({
        where: { id: habitId, userId, isActive: false }
      });
      
      if (!habit) {
        throw new AppError('Inactive habit not found', 404);
      }
      
      // Check habit limit before reactivating
      const activeHabitsCount = await prisma.habit.count({
        where: { userId, isActive: true }
      });
      
      if (activeHabitsCount >= 20) {
        throw new AppError('Maximum of 20 active habits allowed', 400);
      }
      
      const reactivatedHabit = await prisma.habit.update({
        where: { id: habitId },
        data: { isActive: true },
        include: {
          _count: {
            select: {
              habitEvents: true
            }
          }
        }
      });
      
      Logger.info('Habit reactivated', { 
        userId, 
        habitId, 
        title: habit.title 
      });
      
      return reactivatedHabit;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Failed to reactivate habit', { habitId, userId, error });
      throw new AppError('Failed to reactivate habit', 500);
    }
  }
  
  // Get habit statistics
  static async getHabitStats(habitId: string, userId: string) {
    try {
      const habit = await prisma.habit.findFirst({
        where: { id: habitId, userId }
      });
      
      if (!habit) {
        throw new AppError('Habit not found', 404);
      }
      
      const [totalEvents, completedEvents, skippedEvents, relapsedEvents, recentEvents] = await Promise.all([
        prisma.habitEvent.count({ where: { habitId, userId } }),
        prisma.habitEvent.count({ where: { habitId, userId, eventType: 'COMPLETED' } }),
        prisma.habitEvent.count({ where: { habitId, userId, eventType: 'SKIPPED' } }),
        prisma.habitEvent.count({ where: { habitId, userId, eventType: 'RELAPSED' } }),
        prisma.habitEvent.findMany({
          where: { habitId, userId },
          orderBy: { occurredAt: 'desc' },
          take: 30, // Last 30 events
          select: {
            eventType: true,
            occurredAt: true
          }
        })
      ]);
      
      // Calculate completion rate
      const completionRate = totalEvents > 0 
        ? Math.round((completedEvents / totalEvents) * 100) 
        : 0;
      
      // Calculate streak (simplified version)
      let currentStreak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (const event of recentEvents) {
        const eventDate = new Date(event.occurredAt);
        eventDate.setHours(0, 0, 0, 0);
        
        const daysDiff = Math.floor((today.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === currentStreak && event.eventType === 'COMPLETED') {
          currentStreak++;
        } else {
          break;
        }
      }
      
      const stats = {
        totalEvents,
        completedEvents,
        skippedEvents,
        relapsedEvents,
        completionRate: `${completionRate}%`,
        currentStreak,
        habit: {
          id: habit.id,
          title: habit.title,
          habitType: habit.habitType,
          createdAt: habit.createdAt
        }
      };
      
      return stats;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Failed to get habit stats', { habitId, userId, error });
      throw new AppError('Failed to retrieve habit statistics', 500);
    }
  }
  
  // Bulk operations
  static async bulkUpdateHabits(userId: string, habitUpdates: Array<{ id: string; isActive: boolean }>) {
    try {
      const results = await Promise.all(
        habitUpdates.map(async ({ id, isActive }) => {
          return await prisma.habit.updateMany({
            where: { id, userId },
            data: { isActive }
          });
        })
      );
      
      const totalUpdated = results.reduce((sum, result) => sum + result.count, 0);
      
      Logger.info('Bulk habit update completed', { 
        userId, 
        totalUpdated,
        operations: habitUpdates.length 
      });
      
      return { updated: totalUpdated };
    } catch (error) {
      Logger.error('Failed to bulk update habits', { userId, error });
      throw new AppError('Failed to bulk update habits', 500);
    }
  }
}