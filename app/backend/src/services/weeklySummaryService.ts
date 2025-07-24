import { PrismaClient, User, Habit } from '@prisma/client';
import { aiService, WeeklySummaryData } from './aiService';
import { journalService } from './journalService';
import { habitService } from './habitService';
import { streakService } from './streakService';
import { analyticsService } from './analyticsService';
import { AppError } from '../types';
import Logger from '../utils/logger';

const prisma = new PrismaClient();

export interface WeeklySummaryOptions {
  weekOffset?: number; // 0 = current week, 1 = last week, etc.
  includeComparison?: boolean;
  includePredictions?: boolean;
  forceRegeneration?: boolean;
}

export interface EnhancedWeeklySummary {
  id: string;
  userId: string;
  weekStart: string;
  weekEnd: string;
  aiSummary: string;
  statistics: WeeklyStatistics;
  achievements: Achievement[];
  insights: WeeklyInsight[];
  recommendations: Recommendation[];
  moodAnalysis: MoodAnalysis;
  habitAnalysis: HabitAnalysis;
  comparison?: WeeklyComparison;
  predictions?: WeeklyPredictions;
  createdAt: Date;
  expiresAt: Date;
}

export interface WeeklyStatistics {
  journalEntries: number;
  averageMood: number | null;
  moodVariance: number | null;
  habitsCompleted: number;
  habitsTotal: number;
  completionRate: number;
  streaksStarted: number;
  streaksEnded: number;
  longestStreak: number;
  totalActiveHabits: number;
}

export interface Achievement {
  type: 'streak' | 'mood' | 'consistency' | 'milestone';
  title: string;
  description: string;
  icon: string;
  earnedAt: Date;
}

export interface WeeklyInsight {
  type: 'pattern' | 'improvement' | 'concern' | 'milestone';
  title: string;
  description: string;
  confidence: number; // 0-1
  dataPoints: string[];
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  category: 'habit' | 'mood' | 'journal' | 'general';
  title: string;
  description: string;
  actionItems: string[];
}

export interface MoodAnalysis {
  averageMood: number | null;
  moodTrend: 'improving' | 'declining' | 'stable';
  bestDay: { date: string; mood: number } | null;
  worstDay: { date: string; mood: number } | null;
  moodPatterns: Array<{
    pattern: string;
    strength: number;
    description: string;
  }>;
}

export interface HabitAnalysis {
  totalHabits: number;
  completionRate: number;
  bestPerformingHabit: { name: string; rate: number } | null;
  strugglingHabit: { name: string; rate: number } | null;
  consistencyScore: number; // 0-100
  streakChanges: {
    started: number;
    ended: number;
    maintained: number;
  };
}

export interface WeeklyComparison {
  previousWeek: {
    completionRate: number;
    averageMood: number | null;
    journalEntries: number;
  };
  changes: {
    completionRateChange: number;
    moodChange: number | null;
    journalEntriesChange: number;
  };
  improvements: string[];
  regressions: string[];
}

export interface WeeklyPredictions {
  nextWeekMood: {
    predicted: number;
    confidence: number;
    factors: string[];
  };
  habitRisk: Array<{
    habitName: string;
    riskLevel: 'low' | 'medium' | 'high';
    reason: string;
  }>;
  recommendations: string[];
}

export class WeeklySummaryService {
  async generateWeeklySummary(
    userId: string,
    options: WeeklySummaryOptions = {}
  ): Promise<EnhancedWeeklySummary> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const { weekStart, weekEnd } = this.getWeekBounds(options.weekOffset || 0);

      // Check for existing summary
      if (!options.forceRegeneration) {
        const existing = await this.getExistingSummary(userId, weekStart, weekEnd);
        if (existing) {
          Logger.info('Returning existing weekly summary', { userId, weekStart });
          return existing;
        }
      }

      // Generate comprehensive weekly data
      const weeklyData = await this.gatherWeeklyData(userId, weekStart, weekEnd);
      const statistics = await this.calculateWeeklyStatistics(userId, weekStart, weekEnd);
      const achievements = await this.identifyAchievements(userId, weekStart, weekEnd, statistics);
      const insights = await this.generateInsights(userId, weeklyData, statistics);
      const recommendations = await this.generateRecommendations(userId, weeklyData, statistics);
      const moodAnalysis = await this.analyzeMood(userId, weekStart, weekEnd);
      const habitAnalysis = await this.analyzeHabits(userId, weekStart, weekEnd);

      // Generate AI summary
      const aiResponse = await aiService.generateWeeklySummary(weeklyData, {
        userId,
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
      });

      // Generate optional enhancements
      let comparison: WeeklyComparison | undefined;
      let predictions: WeeklyPredictions | undefined;

      if (options.includeComparison) {
        comparison = await this.generateComparison(userId, weekStart, weekEnd);
      }

      if (options.includePredictions) {
        predictions = await this.generatePredictions(userId, weeklyData, statistics);
      }

      // Create enhanced summary
      const summary: EnhancedWeeklySummary = {
        id: '', // Will be set when stored
        userId,
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        aiSummary: aiResponse.content,
        statistics,
        achievements,
        insights,
        recommendations,
        moodAnalysis,
        habitAnalysis,
        comparison,
        predictions,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Expires in 30 days
      };

      // Store the summary
      const storedSummary = await this.storeSummary(summary);

      Logger.info('Generated enhanced weekly summary', { 
        userId, 
        weekStart: summary.weekStart,
        achievementsCount: achievements.length,
        insightsCount: insights.length 
      });

      return storedSummary;
    } catch (error) {
      Logger.error('Failed to generate weekly summary', { error, userId });
      throw new AppError('Failed to generate weekly summary', 500);
    }
  }

  async getWeeklySummary(
    userId: string,
    weekOffset: number = 0
  ): Promise<EnhancedWeeklySummary | null> {
    try {
      const { weekStart, weekEnd } = this.getWeekBounds(weekOffset);
      return await this.getExistingSummary(userId, weekStart, weekEnd);
    } catch (error) {
      Logger.error('Failed to get weekly summary', { error, userId, weekOffset });
      throw new AppError('Failed to get weekly summary', 500);
    }
  }

  async getUserWeeklySummaries(
    userId: string,
    limit: number = 10
  ): Promise<EnhancedWeeklySummary[]> {
    try {
      const summaries = await prisma.weeklySummary.findMany({
        where: { userId },
        orderBy: { weekStart: 'desc' },
        take: limit,
      });

      return summaries.map(summary => this.parseSummaryFromDb(summary));
    } catch (error) {
      Logger.error('Failed to get user weekly summaries', { error, userId });
      throw new AppError('Failed to get user weekly summaries', 500);
    }
  }

  private async gatherWeeklyData(
    userId: string, 
    weekStart: Date, 
    weekEnd: Date
  ): Promise<WeeklySummaryData> {
    // Get weekly journal entries
    const journalEntries = await journalService.getEntries(userId, {
      startDate: weekStart.toISOString().split('T')[0],
      endDate: weekEnd.toISOString().split('T')[0],
    });

    // Get mood trend for the week
    const moodTrend = await journalService.getMoodTrend(userId, 7);
    const weekMoodTrend = moodTrend.slice(-7);

    // Get habit data
    const habits = await habitService.getUserHabits(userId);
    
    const habitData = await Promise.all(
      habits.slice(0, 10).map(async (habit: Habit) => {
        const events = await prisma.habitEvent.findMany({
          where: {
            userId,
            habitId: habit.id,
            occurredAt: { gte: weekStart, lte: weekEnd },
          },
        });

        const completedEvents = events.filter(event => event.eventType === 'COMPLETED').length;
        const completionRate = Math.round((completedEvents / 7) * 100);
        
        const streak = await streakService.calculateHabitStreak(habit.id, userId);

        return {
          habitTitle: habit.title,
          completionRate,
          streakLength: streak?.currentStreak || 0,
        };
      })
    );

    // Calculate overall stats
    const moodRatings = journalEntries
      .map(entry => entry.moodRating)
      .filter(rating => rating !== null) as number[];
    
    const avgMood = moodRatings.length > 0
      ? moodRatings.reduce((sum, rating) => sum + rating, 0) / moodRatings.length
      : null;

    const overallHabitCompletionRate = habitData.length > 0 
      ? Math.round(habitData.reduce((sum: number, habit: any) => sum + habit.completionRate, 0) / habitData.length)
      : 0;

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

  private async calculateWeeklyStatistics(
    userId: string, 
    weekStart: Date, 
    weekEnd: Date
  ): Promise<WeeklyStatistics> {
    // Get journal entries for the week
    const journalEntries = await prisma.journalEntry.findMany({
      where: {
        userId,
        createdAt: { gte: weekStart, lte: weekEnd },
      },
    });

    // Calculate mood statistics
    const moodRatings = journalEntries
      .map(entry => entry.moodRating)
      .filter(rating => rating !== null) as number[];

    const averageMood = moodRatings.length > 0
      ? moodRatings.reduce((sum, rating) => sum + rating, 0) / moodRatings.length
      : null;

    const moodVariance = moodRatings.length > 1 && averageMood !== null
      ? moodRatings.reduce((sum, rating) => sum + Math.pow(rating - averageMood, 2), 0) / moodRatings.length
      : null;

    // Get habit statistics
    const habits = await habitService.getUserHabits(userId);
    const habitEvents = await prisma.habitEvent.findMany({
      where: {
        userId,
        occurredAt: { gte: weekStart, lte: weekEnd },
      },
    });

    const completedEvents = habitEvents.filter(event => event.eventType === 'COMPLETED').length;
    const totalPossibleCompletions = habits.length * 7; // 7 days
    const completionRate = totalPossibleCompletions > 0 
      ? Math.round((completedEvents / totalPossibleCompletions) * 100)
      : 0;

    // Calculate streak statistics
    let streaksStarted = 0;
    let streaksEnded = 0;
    let longestStreak = 0;

    for (const habit of habits) {
      const streak = await streakService.calculateHabitStreak(habit.id, userId);
      if (streak) {
        longestStreak = Math.max(longestStreak, streak.currentStreak);
        
        // Check if streak started this week (simplified - would need more complex logic)
        if (streak.currentStreak > 0 && streak.lastEventDate && streak.lastEventDate >= weekStart && streak.lastEventDate <= weekEnd) {
          streaksStarted++;
        }
        
        // Check if streak ended this week (would need additional logic)
        // This is a simplified implementation
      }
    }

    return {
      journalEntries: journalEntries.length,
      averageMood,
      moodVariance,
      habitsCompleted: completedEvents,
      habitsTotal: totalPossibleCompletions,
      completionRate,
      streaksStarted,
      streaksEnded,
      longestStreak,
      totalActiveHabits: habits.length,
    };
  }

  private async identifyAchievements(
    userId: string,
    weekStart: Date,
    weekEnd: Date,
    statistics: WeeklyStatistics
  ): Promise<Achievement[]> {
    const achievements: Achievement[] = [];

    // High completion rate achievement
    if (statistics.completionRate >= 80) {
      achievements.push({
        type: 'consistency',
        title: 'Consistency Champion',
        description: `Achieved ${statistics.completionRate}% habit completion rate this week!`,
        icon: '🏆',
        earnedAt: weekEnd,
      });
    }

    // Mood stability achievement
    if (statistics.averageMood && statistics.averageMood >= 7 && statistics.moodVariance && statistics.moodVariance < 2) {
      achievements.push({
        type: 'mood',
        title: 'Mood Master',
        description: `Maintained consistently high mood (${statistics.averageMood.toFixed(1)}/10) throughout the week!`,
        icon: '😊',
        earnedAt: weekEnd,
      });
    }

    // Streak achievements
    if (statistics.longestStreak >= 7) {
      achievements.push({
        type: 'streak',
        title: 'Week-Long Warrior',
        description: `Maintained a ${statistics.longestStreak}-day streak!`,
        icon: '🔥',
        earnedAt: weekEnd,
      });
    }

    // Journal consistency
    if (statistics.journalEntries >= 5) {
      achievements.push({
        type: 'milestone',
        title: 'Reflection Regular',
        description: `Wrote ${statistics.journalEntries} journal entries this week!`,
        icon: '📖',
        earnedAt: weekEnd,
      });
    }

    return achievements;
  }

  private async generateInsights(
    userId: string,
    weeklyData: WeeklySummaryData,
    statistics: WeeklyStatistics
  ): Promise<WeeklyInsight[]> {
    const insights: WeeklyInsight[] = [];

    // Mood-habit correlation insight
    if (weeklyData.habitData && weeklyData.habitData.length > 0 && statistics.averageMood) {
      const highPerformingHabits = weeklyData.habitData.filter(habit => habit.completionRate >= 70);
      if (highPerformingHabits.length > 0 && statistics.averageMood >= 7) {
        insights.push({
          type: 'pattern',
          title: 'Positive Habit-Mood Connection',
          description: 'Your consistent habit completion correlates with higher mood ratings.',
          confidence: 0.8,
          dataPoints: [
            `${statistics.completionRate}% habit completion rate`,
            `${statistics.averageMood.toFixed(1)}/10 average mood`,
          ],
        });
      }
    }

    // Improvement insight
    if (statistics.completionRate >= 60 && statistics.streaksStarted > 0) {
      insights.push({
        type: 'improvement',
        title: 'Building Momentum',
        description: 'You\'re successfully establishing new habit patterns.',
        confidence: 0.7,
        dataPoints: [
          `${statistics.streaksStarted} new streaks started`,
          `${statistics.completionRate}% overall completion rate`,
        ],
      });
    }

    // Concern insight
    if (statistics.completionRate < 40 && statistics.averageMood && statistics.averageMood < 5) {
      insights.push({
        type: 'concern',
        title: 'Support Needed',
        description: 'Lower habit completion and mood may indicate need for additional support.',
        confidence: 0.6,
        dataPoints: [
          `${statistics.completionRate}% completion rate`,
          `${statistics.averageMood.toFixed(1)}/10 average mood`,
        ],
      });
    }

    return insights;
  }

  private async generateRecommendations(
    userId: string,
    weeklyData: WeeklySummaryData,
    statistics: WeeklyStatistics
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Low completion rate recommendation
    if (statistics.completionRate < 50) {
      recommendations.push({
        priority: 'high',
        category: 'habit',
        title: 'Simplify Your Habits',
        description: 'Your completion rate suggests you may have taken on too much.',
        actionItems: [
          'Focus on 1-2 most important habits',
          'Reduce habit difficulty or frequency',
          'Set smaller, more achievable goals',
        ],
      });
    }

    // Low journaling recommendation  
    if (statistics.journalEntries < 3) {
      recommendations.push({
        priority: 'medium',
        category: 'journal',
        title: 'Increase Reflection Practice',
        description: 'Regular journaling can improve self-awareness and mood.',
        actionItems: [
          'Set a daily 5-minute journaling reminder',
          'Use simple prompts to get started',
          'Track mood alongside entries',
        ],
      });
    }

    // Mood improvement recommendation
    if (statistics.averageMood && statistics.averageMood < 6) {
      recommendations.push({
        priority: 'high',
        category: 'mood',
        title: 'Focus on Mood Support',
        description: 'Your mood has been lower than ideal this week.',
        actionItems: [
          'Identify mood triggers in your journal',
          'Consider adding mood-boosting habits',
          'Reach out for support if needed',
        ],
      });
    }

    return recommendations;
  }

  private async analyzeMood(
    userId: string,
    weekStart: Date,
    weekEnd: Date
  ): Promise<MoodAnalysis> {
    const entries = await prisma.journalEntry.findMany({
      where: {
        userId,
        createdAt: { gte: weekStart, lte: weekEnd },
        moodRating: { not: null },
      },
      orderBy: { createdAt: 'asc' },
    });

    const moodRatings = entries.map(entry => entry.moodRating!);
    const averageMood = moodRatings.length > 0
      ? moodRatings.reduce((sum, rating) => sum + rating, 0) / moodRatings.length
      : null;

    let moodTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (moodRatings.length >= 2) {
      const firstHalf = moodRatings.slice(0, Math.ceil(moodRatings.length / 2));
      const secondHalf = moodRatings.slice(Math.ceil(moodRatings.length / 2));
      
      const firstAvg = firstHalf.reduce((sum, rating) => sum + rating, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, rating) => sum + rating, 0) / secondHalf.length;

      if (secondAvg > firstAvg + 0.5) moodTrend = 'improving';
      else if (secondAvg < firstAvg - 0.5) moodTrend = 'declining';
    }

    const bestDay = entries.length > 0 
      ? entries.reduce((best, entry) => 
          entry.moodRating! > best.moodRating! ? entry : best
        )
      : null;

    const worstDay = entries.length > 0
      ? entries.reduce((worst, entry) => 
          entry.moodRating! < worst.moodRating! ? entry : worst
        )
      : null;

    return {
      averageMood,
      moodTrend,
      bestDay: bestDay ? {
        date: bestDay.createdAt.toISOString().split('T')[0],
        mood: bestDay.moodRating!,
      } : null,
      worstDay: worstDay ? {
        date: worstDay.createdAt.toISOString().split('T')[0],
        mood: worstDay.moodRating!,
      } : null,
      moodPatterns: [], // Could be enhanced with pattern detection
    };
  }

  private async analyzeHabits(
    userId: string,
    weekStart: Date,
    weekEnd: Date
  ): Promise<HabitAnalysis> {
    const habits = await habitService.getUserHabits(userId);
    const events = await prisma.habitEvent.findMany({
      where: {
        userId,
        occurredAt: { gte: weekStart, lte: weekEnd },
      },
      include: { habit: true },
    });

    const habitPerformance = new Map<string, { completed: number; total: number }>();
    
    // Calculate performance for each habit
    for (const habit of habits) {
      const completedEvents = events.filter(
        event => event.habitId === habit.id && event.eventType === 'COMPLETED'
      ).length;
      
      habitPerformance.set(habit.id, {
        completed: completedEvents,
        total: 7, // Days in week
      });
    }

    const completionRates = Array.from(habitPerformance.values())
      .map(perf => (perf.completed / perf.total) * 100);

    const overallCompletionRate = completionRates.length > 0
      ? completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length
      : 0;

    const bestPerforming = habits.length > 0 ? (() => {
      let best = { habit: habits[0], rate: 0 };
      for (const habit of habits) {
        const perf = habitPerformance.get(habit.id)!;
        const rate = (perf.completed / perf.total) * 100;
        if (rate > best.rate) {
          best = { habit, rate };
        }
      }
      return best.rate > 0 ? { name: best.habit.title, rate: best.rate } : null;
    })() : null;

    const struggling = habits.length > 0 ? (() => {
      let worst = { habit: habits[0], rate: 100 };
      for (const habit of habits) {
        const perf = habitPerformance.get(habit.id)!;
        const rate = (perf.completed / perf.total) * 100;
        if (rate < worst.rate) {
          worst = { habit, rate };
        }
      }
      return worst.rate < 100 ? { name: worst.habit.title, rate: worst.rate } : null;
    })() : null;

    return {
      totalHabits: habits.length,
      completionRate: Math.round(overallCompletionRate),
      bestPerformingHabit: bestPerforming,
      strugglingHabit: struggling,
      consistencyScore: Math.round(overallCompletionRate),
      streakChanges: {
        started: 0, // Would need more complex logic
        ended: 0,
        maintained: 0,
      },
    };
  }

  private async generateComparison(
    userId: string,
    currentWeekStart: Date,
    currentWeekEnd: Date
  ): Promise<WeeklyComparison> {
    // Get previous week bounds
    const prevWeekStart = new Date(currentWeekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekEnd = new Date(currentWeekEnd);
    prevWeekEnd.setDate(prevWeekEnd.getDate() - 7);

    // Get previous week statistics
    const prevStats = await this.calculateWeeklyStatistics(userId, prevWeekStart, prevWeekEnd);
    const currentStats = await this.calculateWeeklyStatistics(userId, currentWeekStart, currentWeekEnd);

    const changes = {
      completionRateChange: currentStats.completionRate - prevStats.completionRate,
      moodChange: (currentStats.averageMood && prevStats.averageMood) 
        ? currentStats.averageMood - prevStats.averageMood 
        : null,
      journalEntriesChange: currentStats.journalEntries - prevStats.journalEntries,
    };

    const improvements: string[] = [];
    const regressions: string[] = [];

    if (changes.completionRateChange > 5) {
      improvements.push(`Habit completion improved by ${changes.completionRateChange}%`);
    } else if (changes.completionRateChange < -5) {
      regressions.push(`Habit completion decreased by ${Math.abs(changes.completionRateChange)}%`);
    }

    if (changes.moodChange && changes.moodChange > 0.5) {
      improvements.push(`Mood improved by ${changes.moodChange.toFixed(1)} points`);
    } else if (changes.moodChange && changes.moodChange < -0.5) {
      regressions.push(`Mood decreased by ${Math.abs(changes.moodChange).toFixed(1)} points`);
    }

    return {
      previousWeek: {
        completionRate: prevStats.completionRate,
        averageMood: prevStats.averageMood,
        journalEntries: prevStats.journalEntries,
      },
      changes,
      improvements,
      regressions,
    };
  }

  private async generatePredictions(
    userId: string,
    weeklyData: WeeklySummaryData,
    statistics: WeeklyStatistics
  ): Promise<WeeklyPredictions> {
    // This is a simplified prediction system
    // In a real implementation, you'd use more sophisticated ML models
    
    const predictedMood = statistics.averageMood || 5;
    const confidence = statistics.moodVariance ? Math.max(0.1, 1 - (statistics.moodVariance / 10)) : 0.5;

    const habitRisks = weeklyData.habitData?.map(habit => ({
      habitName: habit.habitTitle,
      riskLevel: (habit.completionRate < 40 ? 'high' : 
                 habit.completionRate < 70 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
      reason: habit.completionRate < 40 ? 'Very low completion rate' :
              habit.completionRate < 70 ? 'Below average performance' : 'Performing well',
    })) || [];

    return {
      nextWeekMood: {
        predicted: Math.round(predictedMood * 10) / 10,
        confidence: Math.round(confidence * 100) / 100,
        factors: ['Recent mood trend', 'Habit completion rate', 'Journal sentiment'],
      },
      habitRisk: habitRisks,
      recommendations: [
        'Focus on maintaining high-performing habits',
        'Address struggling habits with easier goals',
        'Continue regular journaling for mood tracking',
      ],
    };
  }

  private getWeekBounds(weekOffset: number = 0): { weekStart: Date; weekEnd: Date } {
    const now = new Date();
    const currentWeekStart = new Date(now);
    const dayOfWeek = currentWeekStart.getDay(); // 0 = Sunday
    
    // Go to Sunday of current week
    currentWeekStart.setDate(currentWeekStart.getDate() - dayOfWeek);
    currentWeekStart.setHours(0, 0, 0, 0);
    
    // Apply offset
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(weekStart.getDate() - (weekOffset * 7));
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return { weekStart, weekEnd };
  }

  private async getExistingSummary(
    userId: string,
    weekStart: Date,
    weekEnd: Date
  ): Promise<EnhancedWeeklySummary | null> {
    try {
      const summary = await prisma.weeklySummary.findFirst({
        where: {
          userId,
          weekStart: weekStart.toISOString().split('T')[0],
          weekEnd: weekEnd.toISOString().split('T')[0],
        },
      });

      return summary ? this.parseSummaryFromDb(summary) : null;
    } catch (error) {
      Logger.error('Error getting existing summary', { error, userId });
      return null;
    }
  }

  private async storeSummary(summary: EnhancedWeeklySummary): Promise<EnhancedWeeklySummary> {
    const stored = await prisma.weeklySummary.create({
      data: {
        userId: summary.userId,
        weekStart: summary.weekStart,
        weekEnd: summary.weekEnd,
        aiSummary: summary.aiSummary,
        statistics: summary.statistics as any,
        achievements: summary.achievements as any,
        insights: summary.insights as any,
        recommendations: summary.recommendations as any,
        moodAnalysis: summary.moodAnalysis as any,
        habitAnalysis: summary.habitAnalysis as any,
        comparison: summary.comparison as any,
        predictions: summary.predictions as any,
        expiresAt: summary.expiresAt,
      },
    });

    return {
      ...summary,
      id: stored.id,
      createdAt: stored.createdAt,
    };
  }

  private parseSummaryFromDb(dbSummary: any): EnhancedWeeklySummary {
    return {
      id: dbSummary.id,
      userId: dbSummary.userId,
      weekStart: dbSummary.weekStart,
      weekEnd: dbSummary.weekEnd,
      aiSummary: dbSummary.aiSummary,
      statistics: dbSummary.statistics,
      achievements: dbSummary.achievements,
      insights: dbSummary.insights,
      recommendations: dbSummary.recommendations,
      moodAnalysis: dbSummary.moodAnalysis,
      habitAnalysis: dbSummary.habitAnalysis,
      comparison: dbSummary.comparison,
      predictions: dbSummary.predictions,
      createdAt: dbSummary.createdAt,
      expiresAt: dbSummary.expiresAt,
    };
  }
}

export const weeklySummaryService = new WeeklySummaryService();