import { PrismaClient, AIInsight, User, Habit } from '@prisma/client';
import { aiService, JournalInsightData, WeeklySummaryData } from './aiService';
import { journalService } from './journalService';
import { habitService } from './habitService';
import { streakService } from './streakService';
import { AppError } from '../types';
import Logger from '../utils/logger';

const prisma = new PrismaClient();

export interface InsightGenerationOptions {
  forceRegeneration?: boolean;
  insightTypes?: ('DAILY_TIP' | 'PATTERN_DETECTED' | 'WEEKLY_SUMMARY')[];
}

export interface GeneratedInsight {
  id: string;
  type: 'DAILY_TIP' | 'PATTERN_DETECTED' | 'WEEKLY_SUMMARY';
  title: string;
  content: string;
  dataUsed: any;
  expiresAt?: Date;
}

export class AIInsightService {
  async generateDailyInsights(
    userId: string,
    options: InsightGenerationOptions = {}
  ): Promise<GeneratedInsight[]> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const insights: GeneratedInsight[] = [];
      const typesToGenerate = options.insightTypes || ['DAILY_TIP', 'PATTERN_DETECTED'];

      // Check for existing insights today unless force regeneration
      if (!options.forceRegeneration) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const existingInsights = await prisma.aIInsight.findMany({
          where: {
            userId,
            createdAt: { gte: today },
            insightType: { in: typesToGenerate },
          },
        });

        if (existingInsights.length > 0) {
          Logger.info('Using existing insights for today', { userId, count: existingInsights.length });
          return existingInsights.map(insight => ({
            id: insight.id,
            type: insight.insightType as any,
            title: insight.title,
            content: insight.content,
            dataUsed: insight.dataUsed,
            expiresAt: insight.expiresAt || undefined,
          }));
        }
      }

      // Gather user data for insights
      const userData = await this.gatherUserData(userId);

      // Generate daily tip
      if (typesToGenerate.includes('DAILY_TIP')) {
        try {
          const dailyTip = await this.generateDailyTip(user, userData);
          if (dailyTip) {
            insights.push(dailyTip);
          }
        } catch (error) {
          Logger.error('Failed to generate daily tip', { error, userId });
        }
      }

      // Generate pattern detection
      if (typesToGenerate.includes('PATTERN_DETECTED')) {
        try {
          const patternInsight = await this.generatePatternInsight(userId, userData);
          if (patternInsight) {
            insights.push(patternInsight);
          }
        } catch (error) {
          Logger.error('Failed to generate pattern insight', { error, userId });
        }
      }

      // Store insights in database
      const storedInsights = await this.storeInsights(userId, insights);

      Logger.info('Generated daily insights', { userId, count: insights.length });
      return storedInsights;
    } catch (error) {
      Logger.error('Failed to generate daily insights', { error, userId });
      throw new AppError('Failed to generate daily insights', 500);
    }
  }

  async generateWeeklyInsight(userId: string): Promise<GeneratedInsight | null> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Check if we already have a weekly summary for this week
      const weekStart = this.getWeekStart(new Date());
      const existingWeeklySummary = await prisma.aIInsight.findFirst({
        where: {
          userId,
          insightType: 'WEEKLY_SUMMARY',
          createdAt: { gte: weekStart },
        },
      });

      if (existingWeeklySummary) {
        Logger.info('Weekly summary already exists for this week', { userId });
        return {
          id: existingWeeklySummary.id,
          type: 'WEEKLY_SUMMARY',
          title: existingWeeklySummary.title,
          content: existingWeeklySummary.content,
          dataUsed: existingWeeklySummary.dataUsed,
          expiresAt: existingWeeklySummary.expiresAt || undefined,
        };
      }

      // Gather weekly data
      const weeklyData = await this.gatherWeeklyData(userId);

      if (weeklyData.entries.length === 0 && !weeklyData.habitData?.length) {
        Logger.info('No data available for weekly summary', { userId });
        return null;
      }

      // Generate weekly summary
      const aiResponse = await aiService.generateWeeklySummary(weeklyData, {
        userId,
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
      });

      const insight: GeneratedInsight = {
        id: '', // Will be set when stored
        type: 'WEEKLY_SUMMARY',
        title: 'Your Week in Review',
        content: aiResponse.content,
        dataUsed: {
          weekStart: weeklyData.weekStart,
          weekEnd: weeklyData.weekEnd,
          overallStats: weeklyData.overallStats,
          entriesCount: weeklyData.entries.length,
          habitsCount: weeklyData.habitData?.length || 0,
        },
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 1 week
      };

      const [storedInsight] = await this.storeInsights(userId, [insight]);

      Logger.info('Generated weekly insight', { userId });
      return storedInsight;
    } catch (error) {
      Logger.error('Failed to generate weekly insight', { error, userId });
      throw new AppError('Failed to generate weekly insight', 500);
    }
  }

  async getUserInsights(
    userId: string,
    options: {
      limit?: number;
      onlyUnshown?: boolean;
      types?: ('DAILY_TIP' | 'PATTERN_DETECTED' | 'WEEKLY_SUMMARY')[];
    } = {}
  ): Promise<AIInsight[]> {
    try {
      const where: any = { userId };

      if (options.onlyUnshown) {
        where.wasShown = false;
      }

      if (options.types && options.types.length > 0) {
        where.insightType = { in: options.types };
      }

      // Don't show expired insights
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ];

      const insights = await prisma.aIInsight.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options.limit || 10,
      });

      return insights;
    } catch (error) {
      Logger.error('Failed to get user insights', { error, userId });
      throw new AppError('Failed to get user insights', 500);
    }
  }

  async markInsightAsShown(userId: string, insightId: string): Promise<void> {
    try {
      await prisma.aIInsight.updateMany({
        where: {
          id: insightId,
          userId, // Ensure user owns the insight
        },
        data: {
          wasShown: true,
          shownAt: new Date(),
        },
      });

      Logger.info('Marked insight as shown', { userId, insightId });
    } catch (error) {
      Logger.error('Failed to mark insight as shown', { error, userId, insightId });
      throw new AppError('Failed to update insight', 500);
    }
  }

  private async generateDailyTip(user: User, userData: JournalInsightData): Promise<GeneratedInsight | null> {
    try {
      // Determine context for the tip
      const context: { recentMood?: number; strugglingHabit?: string } = {};
      
      // Get recent mood if available
      if (userData.moodTrend.length > 0) {
        const recentMoods = userData.moodTrend.filter(day => day.avgMood !== null).slice(0, 3);
        if (recentMoods.length > 0) {
          context.recentMood = Math.round(
            recentMoods.reduce((sum, day) => sum + day.avgMood!, 0) / recentMoods.length
          );
        }
      }

      // Find struggling habit (low completion rate)
      if (userData.habitData && userData.habitData.length > 0) {
        const strugglingHabit = userData.habitData.find(habit => habit.completionRate < 50);
        if (strugglingHabit) {
          context.strugglingHabit = strugglingHabit.habitTitle;
        }
      }

      const aiResponse = await aiService.generateMotivationalTip(
        user.coachStyle.toLowerCase() as 'supportive' | 'direct' | 'motivational',
        context,
        { userId: user.id }
      );

      return {
        id: '',
        type: 'DAILY_TIP',
        title: 'Daily Motivation',
        content: aiResponse.content,
        dataUsed: { context, coachStyle: user.coachStyle },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24 hours
      };
    } catch (error) {
      Logger.error('Failed to generate daily tip', { error, userId: user.id });
      return null;
    }
  }

  private async generatePatternInsight(userId: string, userData: JournalInsightData): Promise<GeneratedInsight | null> {
    try {
      // Only generate if we have enough data
      if (userData.entries.length < 3 && userData.moodTrend.length < 5) {
        return null;
      }

      const aiResponse = await aiService.detectPatterns(userData, { userId });

      return {
        id: '',
        type: 'PATTERN_DETECTED',
        title: 'Pattern Insights',
        content: aiResponse.content,
        dataUsed: {
          entriesAnalyzed: userData.entries.length,
          moodDaysAnalyzed: userData.moodTrend.filter(day => day.avgMood !== null).length,
          habitsAnalyzed: userData.habitData?.length || 0,
        },
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Expires in 3 days
      };
    } catch (error) {
      Logger.error('Failed to generate pattern insight', { error, userId });
      return null;
    }
  }

  private async gatherUserData(userId: string): Promise<JournalInsightData> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get recent journal entries
    const journalEntries = await journalService.getEntries(userId, {
      startDate: sevenDaysAgo.toISOString().split('T')[0],
      limit: 10,
    });

    // Get mood trend
    const moodTrend = await journalService.getMoodTrend(userId, 7);

    // Get habit data
    const habits = await habitService.getUserHabits(userId);
    const habitData = await Promise.all(
      habits.slice(0, 5).map(async (habit: Habit) => {
        const streak = await streakService.calculateHabitStreak(habit.id, userId);
        const events = await prisma.habitEvent.findMany({
          where: {
            userId,
            habitId: habit.id,
            occurredAt: { gte: sevenDaysAgo },
          },
        });

        const completedEvents = events.filter(event => event.eventType === 'COMPLETED').length;
        const totalDays = 7;
        const completionRate = Math.round((completedEvents / totalDays) * 100);

        return {
          habitTitle: habit.title,
          completionRate,
          streakLength: streak?.currentStreak || 0,
        };
      })
    );

    return {
      entries: journalEntries.map(entry => ({
        date: entry.createdAt.toISOString().split('T')[0],
        content: entry.content,
        moodRating: entry.moodRating || undefined,
        title: entry.title || undefined,
      })),
      moodTrend,
      habitData,
    };
  }

  private async gatherWeeklyData(userId: string): Promise<WeeklySummaryData> {
    const weekStart = this.getWeekStart(new Date());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Get weekly journal entries
    const journalEntries = await journalService.getEntries(userId, {
      startDate: weekStart.toISOString().split('T')[0],
      endDate: weekEnd.toISOString().split('T')[0],
    });

    // Get mood trend for the week
    const moodTrend = await journalService.getMoodTrend(userId, 7);
    const weekMoodTrend = moodTrend.slice(-7);

    // Calculate overall stats
    const moodRatings = journalEntries
      .map(entry => entry.moodRating)
      .filter(rating => rating !== null) as number[];
    
    const avgMood = moodRatings.length > 0
      ? moodRatings.reduce((sum, rating) => sum + rating, 0) / moodRatings.length
      : null;

    // Get habit completion rate for the week
    const habits = await habitService.getUserHabits(userId);
    let totalCompletionRate = 0;
    let habitCount = 0;

    const habitData = await Promise.all(
      habits.slice(0, 5).map(async (habit: Habit) => {
        const events = await prisma.habitEvent.findMany({
          where: {
            userId,
            habitId: habit.id,
            occurredAt: { gte: weekStart, lte: weekEnd },
          },
        });

        const completedEvents = events.filter(event => event.eventType === 'COMPLETED').length;
        const completionRate = Math.round((completedEvents / 7) * 100);
        
        totalCompletionRate += completionRate;
        habitCount++;

        const streak = await streakService.calculateHabitStreak(habit.id, userId);

        return {
          habitTitle: habit.title,
          completionRate,
          streakLength: streak?.currentStreak || 0,
        };
      })
    );

    const overallHabitCompletionRate = habitCount > 0 ? Math.round(totalCompletionRate / habitCount) : 0;

    return {
      entries: journalEntries.map(entry => ({
        date: entry.createdAt.toISOString().split('T')[0],
        content: entry.content,
        moodRating: entry.moodRating || undefined,
        title: entry.title || undefined,
      })),
      moodTrend: weekMoodTrend,
      habitData,
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      overallStats: {
        totalEntries: journalEntries.length,
        avgMood,
        habitCompletionRate: overallHabitCompletionRate,
      },
    };
  }

  private async storeInsights(userId: string, insights: GeneratedInsight[]): Promise<GeneratedInsight[]> {
    const storedInsights = await Promise.all(
      insights.map(async (insight) => {
        const stored = await prisma.aIInsight.create({
          data: {
            userId,
            insightType: insight.type,
            title: insight.title,
            content: insight.content,
            dataUsed: insight.dataUsed,
            expiresAt: insight.expiresAt,
            wasShown: false,
          },
        });

        return {
          ...insight,
          id: stored.id,
        };
      })
    );

    return storedInsights;
  }

  private getWeekStart(date: Date): Date {
    const weekStart = new Date(date);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day; // Sunday is day 0
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }
}

export const aiInsightService = new AIInsightService();