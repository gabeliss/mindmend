import prisma from '../config/database';
import { AppError } from '../types';
import Logger from '../utils/logger';
import { EventType, HabitType } from '@prisma/client';

export interface AnalyticsTimeframe {
  startDate: Date;
  endDate: Date;
  period: 'day' | 'week' | 'month' | 'year';
}

export interface HabitAnalytics {
  habitId: string;
  habitTitle: string;
  habitType: HabitType;
  totalEvents: number;
  completedEvents: number;
  skippedEvents: number;
  relapsedEvents: number;
  completionRate: number;
  consistencyScore: number;
  averageEventsPerDay: number;
  bestStreak: number;
  currentStreak: number;
  trendDirection: 'improving' | 'declining' | 'stable';
  weeklyBreakdown: Array<{
    week: string;
    completed: number;
    total: number;
    rate: number;
  }>;
}

export interface UserAnalytics {
  userId: string;
  timeframe: AnalyticsTimeframe;
  overview: {
    totalHabits: number;
    activeHabits: number;
    totalEvents: number;
    completedEvents: number;
    overallCompletionRate: number;
    averageStreakLength: number;
    totalActiveStreaks: number;
  };
  performance: {
    bestPerformingHabit: string | null;
    worstPerformingHabit: string | null;
    mostConsistentHabit: string | null;
    improvingHabits: number;
    decliningHabits: number;
    stableHabits: number;
  };
  trends: {
    dailyAverages: Array<{
      date: string;
      completed: number;
      skipped: number;
      relapsed: number;
      completionRate: number;
    }>;
    weeklyTrends: Array<{
      week: string;
      completed: number;
      total: number;
      completionRate: number;
      activeHabits: number;
    }>;
  };
  habitAnalytics: HabitAnalytics[];
}

export interface HeatmapData {
  date: string;
  value: number;
  events: Array<{
    habitId: string;
    habitTitle: string;
    eventType: EventType;
  }>;
}

export class AnalyticsService {
  // Get comprehensive user analytics for a time period
  static async getUserAnalytics(
    userId: string,
    startDate: Date,
    endDate: Date,
    period: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<UserAnalytics> {
    try {
      const timeframe: AnalyticsTimeframe = { startDate, endDate, period };
      
      // Get user's active habits during this period
      const habits = await prisma.habit.findMany({
        where: { 
          userId,
          createdAt: { lte: endDate },
          OR: [
            { isActive: true },
            { updatedAt: { gte: startDate } } // Include habits that were active during this period
          ]
        },
        select: {
          id: true,
          title: true,
          habitType: true,
          isActive: true,
          createdAt: true
        }
      });
      
      // Get all events for the time period
      const events = await prisma.habitEvent.findMany({
        where: {
          userId,
          occurredAt: { gte: startDate, lte: endDate },
          habit: {
            id: { in: habits.map(h => h.id) }
          }
        },
        include: {
          habit: {
            select: { id: true, title: true, habitType: true }
          }
        },
        orderBy: { occurredAt: 'asc' }
      });
      
      // Calculate overview metrics
      const overview = await this.calculateOverview(habits, events);
      
      // Calculate performance metrics
      const performance = await this.calculatePerformance(habits, events, timeframe);
      
      // Calculate trends
      const trends = await this.calculateTrends(events, timeframe);
      
      // Calculate individual habit analytics
      const habitAnalytics = await Promise.all(
        habits.map(habit => this.calculateHabitAnalytics(habit, events, timeframe))
      );
      
      return {
        userId,
        timeframe,
        overview,
        performance,
        trends,
        habitAnalytics
      };
    } catch (error) {
      Logger.error('Failed to get user analytics', { userId, error });
      throw new AppError('Failed to retrieve user analytics', 500);
    }
  }
  
  // Get habit-specific analytics
  static async getHabitAnalytics(
    habitId: string,
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<HabitAnalytics> {
    try {
      // Verify habit exists and belongs to user
      const habit = await prisma.habit.findFirst({
        where: { id: habitId, userId }
      });
      
      if (!habit) {
        throw new AppError('Habit not found', 404);
      }
      
      // Get events for this habit in the timeframe
      const events = await prisma.habitEvent.findMany({
        where: {
          habitId,
          userId,
          occurredAt: { gte: startDate, lte: endDate }
        },
        orderBy: { occurredAt: 'asc' }
      });
      
      const timeframe: AnalyticsTimeframe = { startDate, endDate, period: 'month' };
      
      return this.calculateHabitAnalytics(habit, events, timeframe);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Failed to get habit analytics', { habitId, userId, error });
      throw new AppError('Failed to retrieve habit analytics', 500);
    }
  }
  
  // Get activity heatmap data
  static async getActivityHeatmap(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<HeatmapData[]> {
    try {
      const events = await prisma.habitEvent.findMany({
        where: {
          userId,
          occurredAt: { gte: startDate, lte: endDate }
        },
        include: {
          habit: {
            select: { id: true, title: true }
          }
        },
        orderBy: { occurredAt: 'asc' }
      });
      
      // Group events by date
      const eventsByDate = new Map<string, Array<typeof events[0]>>();
      
      events.forEach(event => {
        const dateKey = event.occurredAt.toISOString().split('T')[0];
        if (!eventsByDate.has(dateKey)) {
          eventsByDate.set(dateKey, []);
        }
        eventsByDate.get(dateKey)!.push(event);
      });
      
      // Generate heatmap data for all dates in range
      const heatmapData: HeatmapData[] = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dateKey = currentDate.toISOString().split('T')[0];
        const dayEvents = eventsByDate.get(dateKey) || [];
        
        // Calculate intensity value (0-4 scale)
        const completedEvents = dayEvents.filter(e => e.eventType === 'COMPLETED').length;
        const totalEvents = dayEvents.length;
        
        let value = 0;
        if (totalEvents > 0) {
          const completionRate = completedEvents / totalEvents;
          if (completionRate >= 0.8) value = 4;
          else if (completionRate >= 0.6) value = 3;
          else if (completionRate >= 0.4) value = 2;
          else value = 1;
        }
        
        heatmapData.push({
          date: dateKey,
          value,
          events: dayEvents.map(e => ({
            habitId: e.habitId,
            habitTitle: e.habit.title,
            eventType: e.eventType
          }))
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return heatmapData;
    } catch (error) {
      Logger.error('Failed to get activity heatmap', { userId, error });
      throw new AppError('Failed to retrieve activity heatmap', 500);
    }
  }
  
  // Get completion rate trends over time
  static async getCompletionTrends(
    userId: string,
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'week' | 'month' = 'week'
  ): Promise<Array<{
    period: string;
    completed: number;
    total: number;
    completionRate: number;
    habitBreakdown: Record<string, { completed: number; total: number; rate: number; }>;
  }>> {
    try {
      const events = await prisma.habitEvent.findMany({
        where: {
          userId,
          occurredAt: { gte: startDate, lte: endDate }
        },
        include: {
          habit: { select: { id: true, title: true, habitType: true } }
        },
        orderBy: { occurredAt: 'asc' }
      });
      
      // Group events by time period
      const periodGroups = new Map<string, typeof events>();
      
      events.forEach(event => {
        let periodKey: string;
        const date = event.occurredAt;
        
        switch (groupBy) {
          case 'day':
            periodKey = date.toISOString().split('T')[0];
            break;
          case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            periodKey = weekStart.toISOString().split('T')[0];
            break;
          case 'month':
            periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
        }
        
        if (!periodGroups.has(periodKey)) {
          periodGroups.set(periodKey, []);
        }
        periodGroups.get(periodKey)!.push(event);
      });
      
      // Calculate trends for each period
      const trends = Array.from(periodGroups.entries()).map(([period, periodEvents]) => {
        const completed = periodEvents.filter(e => e.eventType === 'COMPLETED').length;
        const total = periodEvents.length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        // Calculate breakdown by habit
        const habitBreakdown: Record<string, { completed: number; total: number; rate: number; }> = {};
        
        periodEvents.forEach(event => {
          const habitTitle = event.habit.title;
          if (!habitBreakdown[habitTitle]) {
            habitBreakdown[habitTitle] = { completed: 0, total: 0, rate: 0 };
          }
          
          habitBreakdown[habitTitle].total++;
          if (event.eventType === 'COMPLETED') {
            habitBreakdown[habitTitle].completed++;
          }
        });
        
        // Calculate rates
        Object.values(habitBreakdown).forEach(breakdown => {
          breakdown.rate = breakdown.total > 0 
            ? Math.round((breakdown.completed / breakdown.total) * 100)
            : 0;
        });
        
        return {
          period,
          completed,
          total,
          completionRate,
          habitBreakdown
        };
      });
      
      // Sort by period
      return trends.sort((a, b) => a.period.localeCompare(b.period));
    } catch (error) {
      Logger.error('Failed to get completion trends', { userId, error });
      throw new AppError('Failed to retrieve completion trends', 500);
    }
  }
  
  // Private helper methods
  private static async calculateOverview(habits: any[], events: any[]) {
    const activeHabits = habits.filter(h => h.isActive);
    const completedEvents = events.filter(e => e.eventType === 'COMPLETED');
    
    return {
      totalHabits: habits.length,
      activeHabits: activeHabits.length,
      totalEvents: events.length,
      completedEvents: completedEvents.length,
      overallCompletionRate: events.length > 0 
        ? Math.round((completedEvents.length / events.length) * 100)
        : 0,
      averageStreakLength: 0, // TODO: Calculate from streak service
      totalActiveStreaks: 0   // TODO: Calculate from streak service
    };
  }
  
  private static async calculatePerformance(habits: any[], events: any[], timeframe: AnalyticsTimeframe) {
    const habitPerformance = habits.map(habit => {
      const habitEvents = events.filter(e => e.habitId === habit.id);
      const completed = habitEvents.filter(e => e.eventType === 'COMPLETED').length;
      const rate = habitEvents.length > 0 ? completed / habitEvents.length : 0;
      
      return { habitId: habit.id, title: habit.title, rate, total: habitEvents.length };
    });
    
    // Sort by completion rate
    habitPerformance.sort((a, b) => b.rate - a.rate);
    
    return {
      bestPerformingHabit: habitPerformance.length > 0 ? habitPerformance[0].title : null,
      worstPerformingHabit: habitPerformance.length > 0 ? habitPerformance[habitPerformance.length - 1].title : null,
      mostConsistentHabit: null, // TODO: Calculate consistency
      improvingHabits: 0,        // TODO: Calculate trend
      decliningHabits: 0,        // TODO: Calculate trend
      stableHabits: habitPerformance.length
    };
  }
  
  private static async calculateTrends(events: any[], timeframe: AnalyticsTimeframe) {
    // Group events by day
    const dailyEvents = new Map<string, any[]>();
    
    events.forEach(event => {
      const dateKey = event.occurredAt.toISOString().split('T')[0];
      if (!dailyEvents.has(dateKey)) {
        dailyEvents.set(dateKey, []);
      }
      dailyEvents.get(dateKey)!.push(event);
    });
    
    // Calculate daily averages
    const dailyAverages = Array.from(dailyEvents.entries()).map(([date, dayEvents]) => {
      const completed = dayEvents.filter(e => e.eventType === 'COMPLETED').length;
      const skipped = dayEvents.filter(e => e.eventType === 'SKIPPED').length;
      const relapsed = dayEvents.filter(e => e.eventType === 'RELAPSED').length;
      
      return {
        date,
        completed,
        skipped,
        relapsed,
        completionRate: dayEvents.length > 0 ? Math.round((completed / dayEvents.length) * 100) : 0
      };
    });
    
    return {
      dailyAverages,
      weeklyTrends: [] // TODO: Implement weekly trends
    };
  }
  
  private static async calculateHabitAnalytics(habit: any, allEvents: any[], timeframe: AnalyticsTimeframe): Promise<HabitAnalytics> {
    const events = allEvents.filter(e => e.habitId === habit.id);
    const completedEvents = events.filter(e => e.eventType === 'COMPLETED');
    const skippedEvents = events.filter(e => e.eventType === 'SKIPPED');
    const relapsedEvents = events.filter(e => e.eventType === 'RELAPSED');
    
    const totalDays = Math.ceil((timeframe.endDate.getTime() - timeframe.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const completionRate = events.length > 0 ? Math.round((completedEvents.length / events.length) * 100) : 0;
    
    // Calculate consistency score (how regularly events are logged)
    const consistencyScore = Math.min(100, Math.round((events.length / totalDays) * 100));
    
    return {
      habitId: habit.id,
      habitTitle: habit.title,
      habitType: habit.habitType,
      totalEvents: events.length,
      completedEvents: completedEvents.length,
      skippedEvents: skippedEvents.length,
      relapsedEvents: relapsedEvents.length,
      completionRate,
      consistencyScore,
      averageEventsPerDay: totalDays > 0 ? Math.round((events.length / totalDays) * 100) / 100 : 0,
      bestStreak: 0,      // TODO: Calculate from streak service
      currentStreak: 0,   // TODO: Calculate from streak service
      trendDirection: 'stable', // TODO: Calculate trend
      weeklyBreakdown: [] // TODO: Implement weekly breakdown
    };
  }
}