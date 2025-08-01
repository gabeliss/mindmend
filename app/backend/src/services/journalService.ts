import { PrismaClient, JournalEntry } from '@prisma/client';
import { CreateJournalEntryData, UpdateJournalEntryData, JournalFilters } from '../types';
import { moodAggregationService } from './moodAggregationService';

const prisma = new PrismaClient();

export class JournalService {
  async createEntry(userId: string, data: CreateJournalEntryData): Promise<JournalEntry> {
    const entry = await prisma.journalEntry.create({
      data: {
        userId,
        title: data.title,
        content: data.content,
        moodRating: data.moodRating,
      },
    });

    // Update daily stats and mood aggregation if mood rating is provided
    if (data.moodRating) {
      const today = new Date().toISOString().split('T')[0];
      await Promise.all([
        this.updateDailyStats(userId, new Date()),
        moodAggregationService.updateDailyMoodStats(userId, today)
      ]);
    }

    return entry;
  }

  async getEntries(userId: string, filters?: JournalFilters): Promise<JournalEntry[]> {
    const where: any = { userId };

    // Add date filtering
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    // Add mood filtering
    if (filters?.minMoodRating) {
      where.moodRating = { gte: filters.minMoodRating };
    }
    if (filters?.maxMoodRating) {
      where.moodRating = { ...where.moodRating, lte: filters.maxMoodRating };
    }

    // Add search filtering
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return prisma.journalEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || undefined,
      skip: filters?.offset || undefined,
    });
  }

  async getEntryById(userId: string, entryId: string): Promise<JournalEntry | null> {
    return prisma.journalEntry.findFirst({
      where: { id: entryId, userId },
    });
  }

  async updateEntry(
    userId: string,
    entryId: string,
    data: UpdateJournalEntryData
  ): Promise<JournalEntry | null> {
    const entry = await prisma.journalEntry.findFirst({
      where: { id: entryId, userId },
    });

    if (!entry) {
      return null;
    }

    const updatedEntry = await prisma.journalEntry.update({
      where: { id: entryId },
      data: {
        title: data.title ?? entry.title,
        content: data.content ?? entry.content,
        moodRating: data.moodRating ?? entry.moodRating,
      },
    });

    // Update daily stats and mood aggregation if mood rating changed
    if (data.moodRating !== undefined) {
      const entryDate = entry.createdAt.toISOString().split('T')[0];
      await Promise.all([
        this.updateDailyStats(userId, entry.createdAt),
        moodAggregationService.updateDailyMoodStats(userId, entryDate)
      ]);
    }

    return updatedEntry;
  }

  async deleteEntry(userId: string, entryId: string): Promise<boolean> {
    const entry = await prisma.journalEntry.findFirst({
      where: { id: entryId, userId },
    });

    if (!entry) {
      return false;
    }

    await prisma.journalEntry.delete({
      where: { id: entryId },
    });

    // Update daily stats and mood aggregation
    const entryDate = entry.createdAt.toISOString().split('T')[0];
    await Promise.all([
      this.updateDailyStats(userId, entry.createdAt),
      moodAggregationService.updateDailyMoodStats(userId, entryDate)
    ]);

    return true;
  }

  async getEntriesByDate(userId: string, date: Date): Promise<JournalEntry[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return prisma.journalEntry.findMany({
      where: {
        userId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMoodTrend(userId: string, days: number = 30): Promise<Array<{ date: string; avgMood: number | null }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const entries = await prisma.journalEntry.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
        moodRating: { not: null },
      },
      select: {
        createdAt: true,
        moodRating: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date and calculate average mood
    const moodByDate = new Map<string, { total: number; count: number }>();
    
    entries.forEach(entry => {
      const dateKey = entry.createdAt.toISOString().split('T')[0];
      const mood = entry.moodRating!;
      
      if (moodByDate.has(dateKey)) {
        const existing = moodByDate.get(dateKey)!;
        existing.total += mood;
        existing.count += 1;
      } else {
        moodByDate.set(dateKey, { total: mood, count: 1 });
      }
    });

    // Convert to array format
    const result: Array<{ date: string; avgMood: number | null }> = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      
      const moodData = moodByDate.get(dateKey);
      result.push({
        date: dateKey,
        avgMood: moodData ? Math.round((moodData.total / moodData.count) * 10) / 10 : null,
      });
    }

    return result;
  }

  async getTimelineData(userId: string, days: number = 14, limit: number = 50): Promise<any[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Get all active habits for the user
    const activeHabits = await prisma.habit.findMany({
      where: { 
        userId, 
        isActive: true 
      },
      select: {
        id: true,
        title: true,
        habitType: true,
      },
    });

    // Get all daily stats for the date range
    const dailyStats = await prisma.dailyStats.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'desc' },
    });

    // Get all journal entries for the date range
    const journalEntries = await prisma.journalEntry.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Get habit events for the date range
    const habitEvents = await prisma.habitEvent.findMany({
      where: {
        userId,
        occurredAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { occurredAt: 'desc' },
    });

    // Create a map of daily stats by date
    const statsByDate = new Map();
    dailyStats.forEach(stat => {
      const dateKey = stat.date.toISOString().split('T')[0];
      statsByDate.set(dateKey, stat);
    });

    // Create a map of journal entries by date
    const journalByDate = new Map();
    journalEntries.forEach(entry => {
      const dateKey = entry.createdAt.toISOString().split('T')[0];
      if (!journalByDate.has(dateKey)) {
        journalByDate.set(dateKey, []);
      }
      journalByDate.get(dateKey).push(entry);
    });

    // Create a map of habit events by date and habit
    const eventsByDateAndHabit = new Map();
    habitEvents.forEach(event => {
      const dateKey = event.occurredAt.toISOString().split('T')[0];
      if (!eventsByDateAndHabit.has(dateKey)) {
        eventsByDateAndHabit.set(dateKey, new Map());
      }
      const dayEvents = eventsByDateAndHabit.get(dateKey);
      if (!dayEvents.has(event.habitId)) {
        dayEvents.set(event.habitId, []);
      }
      dayEvents.get(event.habitId).push(event);
    });

    // Generate timeline data for each day
    const timelineData = [];
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      const dateKey = currentDate.toISOString().split('T')[0];

      const dayStats = statsByDate.get(dateKey);
      const dayJournalEntries = journalByDate.get(dateKey) || [];
      const dayEvents = eventsByDateAndHabit.get(dateKey) || new Map();

      // Build habit status for the day
      const habits = activeHabits.map(habit => {
        const habitEvents = dayEvents.get(habit.id) || [];
        const latestEvent = habitEvents.length > 0 ? habitEvents[habitEvents.length - 1] : null;
        
        let status = 'pending';
        if (latestEvent) {
          switch (latestEvent.eventType) {
            case 'COMPLETED':
              status = 'completed';
              break;
            case 'SKIPPED':
              status = 'skipped';
              break;
            default:
              status = 'pending';
          }
        }

        return {
          id: habit.id,
          title: habit.title,
          status,
          habitType: habit.habitType,
        };
      });

      // Build mood data
      let mood = null;
      if (dayStats && (dayStats.moodRangeStart || dayStats.moodRangeEnd)) {
        const rating = dayStats.moodRangeEnd || dayStats.moodRangeStart || 5;
        mood = {
          rating,
          display: this.getMoodDisplay(rating),
        };
      }

      // Get the main journal entry for the day (most recent one)
      const mainJournalEntry = dayJournalEntries.length > 0 ? dayJournalEntries[0] : null;
      let journalEntry = null;
      if (mainJournalEntry) {
        journalEntry = {
          id: mainJournalEntry.id,
          title: mainJournalEntry.title,
          content: mainJournalEntry.content,
          preview: this.generatePreview(mainJournalEntry.content),
        };
      }

      // Only include days that have some activity
      const hasActivity = habits.some(h => h.status !== 'pending') || 
                         mood !== null || 
                         journalEntry !== null || 
                         dayStats?.checkinSummary;

      if (hasActivity) {
        timelineData.push({
          date: dateKey,
          mood,
          habits,
          journalEntry,
          checkInSummary: dayStats?.checkinSummary || null,
          aiInsight: null, // We can add AI insights later if needed
        });
      }
    }

    return timelineData.slice(0, limit);
  }

  private getMoodDisplay(rating: number): string {
    if (rating <= 3) return "Low";
    if (rating <= 5) return "Neutral";
    if (rating <= 7) return "Good";
    if (rating <= 8) return "Great";
    return "Excellent";
  }

  private generatePreview(content: string, maxLength: number = 120): string {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength).trim() + '...';
  }

  private async updateDailyStats(userId: string, date: Date): Promise<void> {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    // Get all journal entries for this day
    const entries = await this.getEntriesByDate(userId, dateOnly);
    
    // Calculate average mood
    const moodEntries = entries.filter(entry => entry.moodRating !== null);
    const avgMood = moodEntries.length > 0
      ? moodEntries.reduce((sum, entry) => sum + entry.moodRating!, 0) / moodEntries.length
      : null;

    // Upsert daily stats
    await prisma.dailyStats.upsert({
      where: {
        user_date_unique: {
          userId,
          date: dateOnly,
        },
      },
      update: {
        journalEntries: entries.length,
        avgMood,
      },
      create: {
        userId,
        date: dateOnly,
        journalEntries: entries.length,
        avgMood,
        habitsCompleted: 0,
        habitsTotal: 0,
      },
    });
  }
}

export const journalService = new JournalService();