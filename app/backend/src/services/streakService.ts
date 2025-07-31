import prisma from '../config/database';
import { AppError } from '../types';
import Logger from '../utils/logger';

export interface StreakData {
  habitId: string;
  currentStreak: number;
  longestStreak: number;
  lastEventDate: Date | null;
  streakType: 'current' | 'broken' | 'new';
}

export interface UserStreakSummary {
  totalActiveHabits: number;
  habitsWithStreaks: number;
  averageStreak: number;
  totalCompletions: number;
  streakBreaks: number;
  habitStreaks: StreakData[];
}

export class StreakService {
  // Calculate current and longest streaks for a specific habit
  static async calculateHabitStreak(habitId: string, userId: string): Promise<StreakData> {
    try {
      // Verify habit exists and belongs to user, and get user timezone
      const [habit, user] = await Promise.all([
        prisma.habit.findFirst({
          where: { id: habitId, userId }
        }),
        prisma.user.findUnique({
          where: { id: userId },
          select: { timezone: true }
        })
      ]);
      
      if (!habit) {
        throw new AppError('Habit not found', 404);
      }
      
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      const userTimezone = user.timezone || 'UTC';
      
      // Get all habit events ordered by date (most recent first)
      const events = await prisma.habitEvent.findMany({
        where: { habitId, userId },
        orderBy: { occurredAt: 'desc' },
        select: {
          eventType: true,
          occurredAt: true
        }
      });
      
      if (events.length === 0) {
        return {
          habitId,
          currentStreak: 0,
          longestStreak: 0,
          lastEventDate: null,
          streakType: 'new'
        };
      }
      
      const lastEventDate = events[0].occurredAt;
      
      // Calculate current streak (consecutive days from today backward)
      const currentStreak = this.calculateCurrentStreak(events, habit.habitType, userTimezone);
      
      // Calculate longest streak in history
      const longestStreak = this.calculateLongestStreak(events, habit.habitType, userTimezone);
      
      // Determine streak type
      let streakType: 'current' | 'broken' | 'new' = 'current';
      
      // Check if streak is broken (no activity today or yesterday for BUILD habits)
      if (habit.habitType === 'BUILD') {
        const today = this.getDateInTimezone(new Date(), userTimezone);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const lastEventStart = this.getDateInTimezone(lastEventDate, userTimezone);
        lastEventStart.setHours(0, 0, 0, 0);
        const todayStart = new Date(today);
        todayStart.setHours(0, 0, 0, 0);
        const yesterdayStart = new Date(yesterday);
        yesterdayStart.setHours(0, 0, 0, 0);
        
        if (lastEventStart < yesterdayStart) {
          streakType = 'broken';
        } else if (currentStreak === 0) {
          streakType = 'new';
        }
      }
      
      return {
        habitId,
        currentStreak,
        longestStreak,
        lastEventDate,
        streakType
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Failed to calculate habit streak', { habitId, userId, error });
      throw new AppError('Failed to calculate habit streak', 500);
    }
  }
  
  // Calculate streaks for all user habits
  static async calculateUserStreaks(userId: string): Promise<UserStreakSummary> {
    try {
      // Get all active habits for user
      const habits = await prisma.habit.findMany({
        where: { userId, isActive: true },
        select: { id: true, habitType: true }
      });
      
      if (habits.length === 0) {
        return {
          totalActiveHabits: 0,
          habitsWithStreaks: 0,
          averageStreak: 0,
          totalCompletions: 0,
          streakBreaks: 0,
          habitStreaks: []
        };
      }
      
      // Calculate streaks for each habit
      const habitStreaks = await Promise.all(
        habits.map(habit => this.calculateHabitStreak(habit.id, userId))
      );
      
      // Calculate summary statistics
      const habitsWithStreaks = habitStreaks.filter(s => s.currentStreak > 0).length;
      const averageStreak = habitStreaks.length > 0 
        ? Math.round(habitStreaks.reduce((sum, s) => sum + s.currentStreak, 0) / habitStreaks.length)
        : 0;
      
      // Get total completions count
      const totalCompletions = await prisma.habitEvent.count({
        where: { 
          userId, 
          eventType: 'COMPLETED',
          habit: { isActive: true }
        }
      });
      
      // Count streak breaks (habits with broken streaks)
      const streakBreaks = habitStreaks.filter(s => s.streakType === 'broken').length;
      
      return {
        totalActiveHabits: habits.length,
        habitsWithStreaks,
        averageStreak,
        totalCompletions,
        streakBreaks,
        habitStreaks
      };
    } catch (error) {
      Logger.error('Failed to calculate user streaks', { userId, error });
      throw new AppError('Failed to calculate user streaks', 500);
    }
  }
  
  // Get streak leaderboard (top performing habits)
  static async getStreakLeaderboard(userId: string, limit: number = 10): Promise<Array<StreakData & { habitTitle: string; habitType: string }>> {
    try {
      const habits = await prisma.habit.findMany({
        where: { userId, isActive: true },
        select: { id: true, title: true, habitType: true }
      });
      
      if (habits.length === 0) {
        return [];
      }
      
      // Calculate streaks for each habit
      const habitStreaks = await Promise.all(
        habits.map(async (habit) => {
          const streak = await this.calculateHabitStreak(habit.id, userId);
          return {
            ...streak,
            habitTitle: habit.title,
            habitType: habit.habitType
          };
        })
      );
      
      // Sort by current streak descending, then by longest streak
      return habitStreaks
        .sort((a, b) => {
          if (a.currentStreak !== b.currentStreak) {
            return b.currentStreak - a.currentStreak;
          }
          return b.longestStreak - a.longestStreak;
        })
        .slice(0, limit);
    } catch (error) {
      Logger.error('Failed to get streak leaderboard', { userId, error });
      throw new AppError('Failed to get streak leaderboard', 500);
    }
  }
  
  // Private helper: Calculate current streak from events
  private static calculateCurrentStreak(events: Array<{ eventType: string; occurredAt: Date }>, habitType: string, userTimezone: string): number {
    if (events.length === 0) return 0;
    
    const today = this.getDateInTimezone(new Date(), userTimezone);
    today.setHours(0, 0, 0, 0);
    let currentDate = new Date(today);
    let streak = 0;
    
    // Group events by date in user's timezone
    const eventsByDate = new Map<string, string>();
    events.forEach(event => {
      const eventDateInUserTz = this.getDateInTimezone(event.occurredAt, userTimezone);
      const dateKey = eventDateInUserTz.toISOString().split('T')[0];
      // For streak calculation, only track the most significant event per day
      if (!eventsByDate.has(dateKey) || 
          (habitType === 'BUILD' && event.eventType === 'COMPLETED') ||
          (habitType === 'AVOID' && event.eventType !== 'RELAPSED')) {
        eventsByDate.set(dateKey, event.eventType);
      }
    });
    
    // Count consecutive days backward from today
    while (true) {
      const dateKey = currentDate.toISOString().split('T')[0];
      const eventType = eventsByDate.get(dateKey);
      
      // Check if this day contributes to the streak
      let contributes = false;
      if (habitType === 'BUILD') {
        contributes = eventType === 'COMPLETED';
      } else { // AVOID
        contributes = eventType !== undefined && eventType !== 'RELAPSED';
      }
      
      if (contributes) {
        streak++;
      } else {
        // If this is today or yesterday and no event, streak might still continue
        const daysDiff = Math.floor((today.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 1 && !eventType) {
          // Allow for today/yesterday with no events (grace period)
          // But stop if we hit a day with a negative event
        } else {
          break;
        }
      }
      
      // Move to previous day
      currentDate.setDate(currentDate.getDate() - 1);
      
      // Limit lookup to prevent infinite loops (max 365 days)
      if (streak > 365) break;
    }
    
    return streak;
  }
  
  // Private helper: Calculate longest streak in history
  private static calculateLongestStreak(events: Array<{ eventType: string; occurredAt: Date }>, habitType: string, userTimezone: string): number {
    if (events.length === 0) return 0;
    
    // Group events by date in user's timezone (oldest first for longest streak calculation)
    const eventsByDate = new Map<string, string>();
    events.reverse().forEach(event => {
      const eventDateInUserTz = this.getDateInTimezone(event.occurredAt, userTimezone);
      const dateKey = eventDateInUserTz.toISOString().split('T')[0];
      if (!eventsByDate.has(dateKey) || 
          (habitType === 'BUILD' && event.eventType === 'COMPLETED') ||
          (habitType === 'AVOID' && event.eventType !== 'RELAPSED')) {
        eventsByDate.set(dateKey, event.eventType);
      }
    });
    
    const sortedDates = Array.from(eventsByDate.keys()).sort();
    let longestStreak = 0;
    let currentStreak = 0;
    
    // Filter to only contributing dates and iterate through them
    const contributingDates = [];
    for (const dateKey of sortedDates) {
      const eventType = eventsByDate.get(dateKey);
      let contributes = false;
      
      if (habitType === 'BUILD') {
        contributes = eventType === 'COMPLETED';
      } else { // AVOID
        contributes = eventType !== undefined && eventType !== 'RELAPSED';
      }
      
      if (contributes) {
        contributingDates.push(dateKey);
      }
    }
    
    // Now check for consecutive streaks among contributing dates only
    currentStreak = 0;
    for (let i = 0; i < contributingDates.length; i++) {
      if (i === 0) {
        currentStreak = 1; // First contributing date
      } else {
        const prevDate = new Date(contributingDates[i - 1]);
        const currentDate = new Date(contributingDates[i]);
        const daysDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          currentStreak++; // Consecutive day
        } else {
          currentStreak = 1; // Start new streak
        }
      }
      
      longestStreak = Math.max(longestStreak, currentStreak);
    }
    
    return longestStreak;
  }
  
  // Get streak history for a habit (last 30 days)
  static async getStreakHistory(habitId: string, userId: string, days: number = 30, userTimezone: string = 'UTC'): Promise<Array<{
    date: string;
    hasEvent: boolean;
    eventType?: string;
    contributes: boolean;
  }>> {
    try {
      // Verify habit exists
      const habit = await prisma.habit.findFirst({
        where: { id: habitId, userId }
      });
      
      if (!habit) {
        throw new AppError('Habit not found', 404);
      }
      
      // Get events for the last N days
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - days);
      
      const events = await prisma.habitEvent.findMany({
        where: {
          habitId,
          userId,
          occurredAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { occurredAt: 'desc' },
        select: {
          eventType: true,
          occurredAt: true
        }
      });
      
      // Group events by date in user's timezone
      const eventsByDate = new Map<string, string>();
      events.forEach(event => {
        const eventDateInUserTz = this.getDateInTimezone(event.occurredAt, userTimezone);
        const dateKey = eventDateInUserTz.toISOString().split('T')[0];
        if (!eventsByDate.has(dateKey) || 
            (habit.habitType === 'BUILD' && event.eventType === 'COMPLETED') ||
            (habit.habitType === 'AVOID' && event.eventType !== 'RELAPSED')) {
          eventsByDate.set(dateKey, event.eventType);
        }
      });
      
      // Generate history array using user's timezone
      const history = [];
      const currentDate = new Date(endDate);
      
      for (let i = 0; i < days; i++) {
        const currentDateInUserTz = this.getDateInTimezone(currentDate, userTimezone);
        const dateKey = currentDateInUserTz.toISOString().split('T')[0];
        const eventType = eventsByDate.get(dateKey);
        const hasEvent = !!eventType;
        
        let contributes = false;
        if (hasEvent) {
          if (habit.habitType === 'BUILD') {
            contributes = eventType === 'COMPLETED';
          } else {
            contributes = eventType !== 'RELAPSED';
          }
        }
        
        history.unshift({
          date: dateKey,
          hasEvent,
          eventType,
          contributes
        });
        
        currentDate.setDate(currentDate.getDate() - 1);
      }
      
      return history;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Failed to get streak history', { habitId, userId, error });
      throw new AppError('Failed to get streak history', 500);
    }
  }

  // Helper method to convert a date to a specific timezone
  private static getDateInTimezone(date: Date, timezone: string): Date {
    try {
      // Use Intl.DateTimeFormat to get the date in the specified timezone
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      
      const parts = formatter.formatToParts(date);
      const partsMap = parts.reduce((acc, part) => {
        acc[part.type] = part.value;
        return acc;
      }, {} as Record<string, string>);
      
      return new Date(
        `${partsMap.year}-${partsMap.month}-${partsMap.day}T${partsMap.hour}:${partsMap.minute}:${partsMap.second}.000Z`
      );
    } catch (error) {
      // Fallback to UTC if timezone is invalid
      Logger.error('Invalid timezone, falling back to UTC', { timezone, error });
      return new Date(date);
    }
  }
}

// Instance export for backward compatibility
export const streakService = StreakService;