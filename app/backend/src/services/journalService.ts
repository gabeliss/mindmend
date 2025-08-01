import { PrismaClient, JournalEntry } from '@prisma/client';
import { CreateJournalEntryData, UpdateJournalEntryData, JournalFilters } from '../types';

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

    // Update daily stats if mood rating is provided
    if (data.moodRating) {
      await this.updateDailyStats(userId, new Date());
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

    // Update daily stats if mood rating changed
    if (data.moodRating !== undefined) {
      await this.updateDailyStats(userId, entry.createdAt);
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

    // Update daily stats
    await this.updateDailyStats(userId, entry.createdAt);

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