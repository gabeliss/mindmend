import prisma from '../config/database';
import { AppError } from '../types';
import Logger from '../utils/logger';
import { CreateHabitEventInput, HabitEventFilters } from '../types/prisma';

export class HabitEventService {
  // Log a new habit event (completion, skip, or relapse)
  static async logEvent(userId: string, habitId: string, eventData: CreateHabitEventInput) {
    try {
      // Verify habit exists and belongs to user
      const habit = await prisma.habit.findFirst({
        where: { id: habitId, userId, isActive: true }
      });
      
      if (!habit) {
        throw new AppError('Active habit not found', 404);
      }
      
      // Check if event already exists for the same day (prevent duplicates)
      const eventDate = new Date(eventData.occurredAt);
      const startOfDay = new Date(eventDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(eventDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      const existingEvent = await prisma.habitEvent.findFirst({
        where: {
          habitId,
          userId,
          occurredAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });
      
      if (existingEvent) {
        // Update existing event instead of creating duplicate
        const updatedEvent = await prisma.habitEvent.update({
          where: { id: existingEvent.id },
          data: {
            eventType: eventData.eventType,
            notes: eventData.notes?.trim() || null
          },
          include: {
            habit: {
              select: {
                id: true,
                title: true,
                habitType: true
              }
            }
          }
        });
        
        Logger.info('Habit event updated', {
          userId,
          habitId,
          eventId: updatedEvent.id,
          eventType: updatedEvent.eventType,
          date: eventDate.toISOString().split('T')[0]
        });
        
        return updatedEvent;
      }
      
      // Create new event
      const habitEvent = await prisma.habitEvent.create({
        data: {
          userId,
          habitId,
          eventType: eventData.eventType,
          notes: eventData.notes?.trim() || null,
          occurredAt: eventData.occurredAt
        },
        include: {
          habit: {
            select: {
              id: true,
              title: true,
              habitType: true
            }
          }
        }
      });
      
      Logger.info('Habit event logged', {
        userId,
        habitId,
        eventId: habitEvent.id,
        eventType: habitEvent.eventType,
        date: eventDate.toISOString().split('T')[0]
      });
      
      return habitEvent;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Failed to log habit event', { userId, habitId, error });
      throw new AppError('Failed to log habit event', 500);
    }
  }
  
  // Get habit events with filtering and pagination
  static async getHabitEvents(
    userId: string, 
    habitId: string, 
    filters: HabitEventFilters = {},
    page: number = 1,
    limit: number = 50
  ) {
    try {
      // Verify habit exists and belongs to user
      const habit = await prisma.habit.findFirst({
        where: { id: habitId, userId }
      });
      
      if (!habit) {
        throw new AppError('Habit not found', 404);
      }
      
      // Build where clause
      const whereClause: any = { habitId, userId };
      
      if (filters.startDate || filters.endDate) {
        whereClause.occurredAt = {};
        if (filters.startDate) {
          whereClause.occurredAt.gte = filters.startDate;
        }
        if (filters.endDate) {
          whereClause.occurredAt.lte = filters.endDate;
        }
      }
      
      if (filters.eventType) {
        whereClause.eventType = filters.eventType;
      }
      
      // Calculate pagination
      const skip = (page - 1) * limit;
      
      // Get events and total count
      const [events, totalCount] = await Promise.all([
        prisma.habitEvent.findMany({
          where: whereClause,
          orderBy: { occurredAt: 'desc' },
          skip,
          take: limit,
          include: {
            habit: {
              select: {
                id: true,
                title: true,
                habitType: true
              }
            }
          }
        }),
        prisma.habitEvent.count({ where: whereClause })
      ]);
      
      const totalPages = Math.ceil(totalCount / limit);
      
      return {
        events,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Failed to get habit events', { userId, habitId, error });
      throw new AppError('Failed to retrieve habit events', 500);
    }
  }
  
  // Get all events for a user (across all habits)
  static async getAllUserEvents(
    userId: string,
    filters: Omit<HabitEventFilters, 'habitId'> = {},
    page: number = 1,
    limit: number = 50
  ) {
    try {
      // Build where clause
      const whereClause: any = { userId };
      
      if (filters.startDate || filters.endDate) {
        whereClause.occurredAt = {};
        if (filters.startDate) {
          whereClause.occurredAt.gte = filters.startDate;
        }
        if (filters.endDate) {
          whereClause.occurredAt.lte = filters.endDate;
        }
      }
      
      if (filters.eventType) {
        whereClause.eventType = filters.eventType;
      }
      
      // Calculate pagination
      const skip = (page - 1) * limit;
      
      // Get events and total count
      const [events, totalCount] = await Promise.all([
        prisma.habitEvent.findMany({
          where: whereClause,
          orderBy: { occurredAt: 'desc' },
          skip,
          take: limit,
          include: {
            habit: {
              select: {
                id: true,
                title: true,
                habitType: true
              }
            }
          }
        }),
        prisma.habitEvent.count({ where: whereClause })
      ]);
      
      const totalPages = Math.ceil(totalCount / limit);
      
      return {
        events,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      Logger.error('Failed to get user events', { userId, error });
      throw new AppError('Failed to retrieve user events', 500);
    }
  }
  
  // Get a specific habit event
  static async getEventById(eventId: string, userId: string) {
    try {
      const event = await prisma.habitEvent.findFirst({
        where: { id: eventId, userId },
        include: {
          habit: {
            select: {
              id: true,
              title: true,
              habitType: true,
              description: true
            }
          }
        }
      });
      
      if (!event) {
        throw new AppError('Event not found', 404);
      }
      
      return event;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Failed to get habit event', { eventId, userId, error });
      throw new AppError('Failed to retrieve habit event', 500);
    }
  }
  
  // Update a habit event
  static async updateEvent(eventId: string, userId: string, updateData: Partial<CreateHabitEventInput>) {
    try {
      // Verify event exists and belongs to user
      const existingEvent = await prisma.habitEvent.findFirst({
        where: { id: eventId, userId }
      });
      
      if (!existingEvent) {
        throw new AppError('Event not found', 404);
      }
      
      // Prepare update data
      const updatePayload: any = {};
      
      if (updateData.eventType) {
        updatePayload.eventType = updateData.eventType;
      }
      
      if (updateData.notes !== undefined) {
        updatePayload.notes = updateData.notes ? updateData.notes.trim() : null;
      }
      
      if (updateData.occurredAt) {
        updatePayload.occurredAt = updateData.occurredAt;
      }
      
      const updatedEvent = await prisma.habitEvent.update({
        where: { id: eventId },
        data: updatePayload,
        include: {
          habit: {
            select: {
              id: true,
              title: true,
              habitType: true
            }
          }
        }
      });
      
      Logger.info('Habit event updated', {
        userId,
        eventId,
        updatedFields: Object.keys(updatePayload)
      });
      
      return updatedEvent;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Failed to update habit event', { eventId, userId, error });
      throw new AppError('Failed to update habit event', 500);
    }
  }
  
  // Delete a habit event
  static async deleteEvent(eventId: string, userId: string) {
    try {
      const event = await prisma.habitEvent.findFirst({
        where: { id: eventId, userId }
      });
      
      if (!event) {
        throw new AppError('Event not found', 404);
      }
      
      await prisma.habitEvent.delete({
        where: { id: eventId }
      });
      
      Logger.info('Habit event deleted', {
        userId,
        eventId,
        habitId: event.habitId,
        eventType: event.eventType
      });
      
      return { deleted: true, id: eventId };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Failed to delete habit event', { eventId, userId, error });
      throw new AppError('Failed to delete habit event', 500);
    }
  }
  
  // Get today's events for a user (for dashboard)
  static async getTodayEvents(userId: string) {
    try {
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);
      
      const events = await prisma.habitEvent.findMany({
        where: {
          userId,
          occurredAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        include: {
          habit: {
            select: {
              id: true,
              title: true,
              habitType: true
            }
          }
        },
        orderBy: { occurredAt: 'desc' }
      });
      
      return events;
    } catch (error) {
      Logger.error('Failed to get today events', { userId, error });
      throw new AppError('Failed to retrieve today\'s events', 500);
    }
  }
  
  // Get habit completion status for a date range (for calendar view)
  static async getCompletionCalendar(userId: string, startDate: Date, endDate: Date) {
    try {
      const events = await prisma.habitEvent.findMany({
        where: {
          userId,
          occurredAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          habit: {
            select: {
              id: true,
              title: true,
              habitType: true
            }
          }
        },
        orderBy: { occurredAt: 'asc' }
      });
      
      // Group events by date
      const calendar: Record<string, any[]> = {};
      
      events.forEach(event => {
        const dateKey = event.occurredAt.toISOString().split('T')[0];
        if (!calendar[dateKey]) {
          calendar[dateKey] = [];
        }
        calendar[dateKey].push({
          habitId: event.habitId,
          habitTitle: event.habit.title,
          habitType: event.habit.habitType,
          eventType: event.eventType,
          notes: event.notes
        });
      });
      
      return calendar;
    } catch (error) {
      Logger.error('Failed to get completion calendar', { userId, error });
      throw new AppError('Failed to retrieve completion calendar', 500);
    }
  }
  
  // Get habit event statistics
  static async getEventStatistics(userId: string, habitId?: string) {
    try {
      const whereClause: any = { userId };
      if (habitId) {
        whereClause.habitId = habitId;
      }
      
      const [totalEvents, completedEvents, skippedEvents, relapsedEvents, recentEvents] = await Promise.all([
        prisma.habitEvent.count({ where: whereClause }),
        prisma.habitEvent.count({ where: { ...whereClause, eventType: 'COMPLETED' } }),
        prisma.habitEvent.count({ where: { ...whereClause, eventType: 'SKIPPED' } }),
        prisma.habitEvent.count({ where: { ...whereClause, eventType: 'RELAPSED' } }),
        prisma.habitEvent.findMany({
          where: whereClause,
          orderBy: { occurredAt: 'desc' },
          take: 30,
          select: {
            eventType: true,
            occurredAt: true,
            habitId: true
          }
        })
      ]);
      
      // Calculate completion rate
      const completionRate = totalEvents > 0 
        ? Math.round((completedEvents / totalEvents) * 100) 
        : 0;
      
      // Calculate weekly completion rate (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const weekEvents = recentEvents.filter(event => event.occurredAt >= weekAgo);
      const weekCompleted = weekEvents.filter(event => event.eventType === 'COMPLETED').length;
      const weeklyCompletionRate = weekEvents.length > 0 
        ? Math.round((weekCompleted / weekEvents.length) * 100)
        : 0;
      
      return {
        total: {
          events: totalEvents,
          completed: completedEvents,
          skipped: skippedEvents,
          relapsed: relapsedEvents
        },
        rates: {
          completion: `${completionRate}%`,
          weeklyCompletion: `${weeklyCompletionRate}%`
        },
        recent: recentEvents.slice(0, 10) // Last 10 events
      };
    } catch (error) {
      Logger.error('Failed to get event statistics', { userId, habitId, error });
      throw new AppError('Failed to retrieve event statistics', 500);
    }
  }
  
  // Bulk log events (for batch operations)
  static async bulkLogEvents(userId: string, events: Array<{habitId: string; eventData: CreateHabitEventInput}>) {
    try {
      // Validate all habits belong to user
      const habitIds = events.map(e => e.habitId);
      const userHabits = await prisma.habit.findMany({
        where: { 
          id: { in: habitIds },
          userId,
          isActive: true 
        },
        select: { id: true }
      });
      
      if (userHabits.length !== habitIds.length) {
        throw new AppError('One or more habits not found or inactive', 400);
      }
      
      // Prepare event data for bulk creation
      const eventData = events.map(({ habitId, eventData }) => ({
        userId,
        habitId,
        eventType: eventData.eventType,
        notes: eventData.notes?.trim() || null,
        occurredAt: eventData.occurredAt
      }));
      
      const createdEvents = await prisma.habitEvent.createMany({
        data: eventData,
        skipDuplicates: true // Skip if duplicate date+habit combination
      });
      
      Logger.info('Bulk habit events logged', {
        userId,
        eventsCreated: createdEvents.count,
        eventsRequested: events.length
      });
      
      return {
        created: createdEvents.count,
        requested: events.length
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Failed to bulk log habit events', { userId, error });
      throw new AppError('Failed to bulk log habit events', 500);
    }
  }
}