import { PrismaClient } from '@prisma/client';
import { aiInsightService } from './aiInsightService';
import { weeklySummaryService } from './weeklySummaryService';
import Logger from '../utils/logger';

const prisma = new PrismaClient();

export class InsightSchedulerService {
  private dailyInsightTimer?: NodeJS.Timeout;
  private weeklyInsightTimer?: NodeJS.Timeout;
  private isRunning: boolean = false;

  start(): void {
    if (this.isRunning) {
      Logger.warn('Insight scheduler is already running');
      return;
    }

    this.isRunning = true;
    this.scheduleDailyInsights();
    this.scheduleWeeklyInsights();
    
    Logger.info('Insight scheduler started');
  }

  stop(): void {
    if (this.dailyInsightTimer) {
      clearTimeout(this.dailyInsightTimer);
      this.dailyInsightTimer = undefined;
    }

    if (this.weeklyInsightTimer) {
      clearTimeout(this.weeklyInsightTimer);
      this.weeklyInsightTimer = undefined;
    }

    this.isRunning = false;
    Logger.info('Insight scheduler stopped');
  }

  private scheduleDailyInsights(): void {
    const now = new Date();
    const nextRun = new Date();
    
    // Schedule for 8 AM local time
    nextRun.setHours(8, 0, 0, 0);
    
    // If it's already past 8 AM today, schedule for tomorrow
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    const timeUntilRun = nextRun.getTime() - now.getTime();

    this.dailyInsightTimer = setTimeout(async () => {
      await this.runDailyInsightGeneration();
      
      // Schedule the next run (24 hours later)
      this.scheduleDailyInsights();
    }, timeUntilRun);

    Logger.info('Daily insight generation scheduled', { 
      nextRun: nextRun.toISOString(),
      timeUntilRun: Math.round(timeUntilRun / 1000 / 60) + ' minutes'
    });
  }

  private scheduleWeeklyInsights(): void {
    const now = new Date();
    const nextRun = new Date();
    
    // Schedule for Sunday at 9 AM
    const daysUntilSunday = (7 - now.getDay()) % 7;
    nextRun.setDate(now.getDate() + daysUntilSunday);
    nextRun.setHours(9, 0, 0, 0);
    
    // If it's already past the time this week, schedule for next week
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 7);
    }

    const timeUntilRun = nextRun.getTime() - now.getTime();

    this.weeklyInsightTimer = setTimeout(async () => {
      await this.runWeeklyInsightGeneration();
      
      // Schedule the next run (7 days later)
      this.scheduleWeeklyInsights();
    }, timeUntilRun);

    Logger.info('Weekly insight generation scheduled', { 
      nextRun: nextRun.toISOString(),
      timeUntilRun: Math.round(timeUntilRun / 1000 / 60 / 60) + ' hours'
    });
  }

  private async runDailyInsightGeneration(): Promise<void> {
    try {
      Logger.info('Starting daily insight generation for all users');

      // Get all active users
      const users = await prisma.user.findMany({
        select: { id: true, displayName: true },
      });

      let successCount = 0;
      let errorCount = 0;

      // Generate insights for each user
      for (const user of users) {
        try {
          await aiInsightService.generateDailyInsights(user.id);
          successCount++;
          
          Logger.debug('Generated daily insights for user', { userId: user.id });
        } catch (error) {
          errorCount++;
          Logger.error('Failed to generate daily insights for user', { 
            error, 
            userId: user.id,
            userName: user.displayName 
          });
        }

        // Add a small delay to avoid rate limiting
        await this.delay(1000);
      }

      Logger.info('Daily insight generation completed', { 
        totalUsers: users.length,
        successCount,
        errorCount 
      });
    } catch (error) {
      Logger.error('Failed to run daily insight generation', { error });
    }
  }

  private async runWeeklyInsightGeneration(): Promise<void> {
    try {
      Logger.info('Starting weekly summary generation for all users');

      // Get all active users
      const users = await prisma.user.findMany({
        select: { id: true, displayName: true },
      });

      let successCount = 0;
      let errorCount = 0;

      // Generate enhanced weekly summaries for each user
      for (const user of users) {
        try {
          // Generate comprehensive weekly summary with comparison and predictions
          const summary = await weeklySummaryService.generateWeeklySummary(user.id, {
            weekOffset: 1, // Generate for last week (completed week)
            includeComparison: true,
            includePredictions: true,
          });
          
          if (summary) {
            successCount++;
            Logger.debug('Generated weekly summary for user', { 
              userId: user.id,
              weekStart: summary.weekStart,
              achievementsCount: summary.achievements.length,
              insightsCount: summary.insights.length,
            });
          }
          
          // Also generate the AI insight for compatibility
          await aiInsightService.generateWeeklyInsight(user.id);
          
        } catch (error) {
          errorCount++;
          Logger.error('Failed to generate weekly summary for user', { 
            error, 
            userId: user.id,
            userName: user.displayName 
          });
        }

        // Add a delay to avoid overwhelming the OpenAI API
        await this.delay(3000); // Increased delay for more comprehensive processing
      }

      Logger.info('Weekly summary generation completed', { 
        totalUsers: users.length,
        successCount,
        errorCount 
      });
    } catch (error) {
      Logger.error('Failed to run weekly summary generation', { error });
    }
  }

  async generateInsightsForUser(userId: string): Promise<void> {
    try {
      Logger.info('Manually triggering insight generation for user', { userId });
      
      await aiInsightService.generateDailyInsights(userId);
      Logger.info('Manual insight generation completed for user', { userId });
    } catch (error) {
      Logger.error('Failed to manually generate insights for user', { error, userId });
      throw error;
    }
  }

  async generateWeeklyInsightForUser(userId: string): Promise<void> {
    try {
      Logger.info('Manually triggering weekly summary generation for user', { userId });
      
      // Generate enhanced weekly summary
      const summary = await weeklySummaryService.generateWeeklySummary(userId, {
        includeComparison: true,
        includePredictions: true,
      });
      
      // Also generate the AI insight for compatibility
      await aiInsightService.generateWeeklyInsight(userId);
      
      Logger.info('Manual weekly summary generation completed for user', { 
        userId,
        weekStart: summary.weekStart,
        achievementsCount: summary.achievements.length 
      });
    } catch (error) {
      Logger.error('Failed to manually generate weekly summary for user', { error, userId });
      throw error;
    }
  }

  async generateWeeklySummaryForUser(
    userId: string, 
    options: { weekOffset?: number; includeComparison?: boolean; includePredictions?: boolean } = {}
  ): Promise<void> {
    try {
      Logger.info('Manually triggering enhanced weekly summary generation for user', { userId, options });
      
      const summary = await weeklySummaryService.generateWeeklySummary(userId, {
        weekOffset: options.weekOffset || 0,
        includeComparison: options.includeComparison !== false, // Default to true
        includePredictions: options.includePredictions !== false, // Default to true
      });
      
      Logger.info('Manual enhanced weekly summary generation completed for user', { 
        userId,
        weekStart: summary.weekStart,
        weekEnd: summary.weekEnd,
        achievementsCount: summary.achievements.length,
        insightsCount: summary.insights.length,
        recommendationsCount: summary.recommendations.length,
      });
    } catch (error) {
      Logger.error('Failed to manually generate enhanced weekly summary for user', { error, userId });
      throw error;
    }
  }

  getStatus(): { isRunning: boolean; nextDailyRun?: Date; nextWeeklyRun?: Date } {
    return {
      isRunning: this.isRunning,
      // Note: In a production environment, you'd want to store these timestamps
      // in a database or use a more robust scheduling system like Bull Queue
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const insightSchedulerService = new InsightSchedulerService();

// Auto-start the scheduler in production
if (process.env.NODE_ENV === 'production') {
  insightSchedulerService.start();
}

// Graceful shutdown
process.on('SIGTERM', () => {
  insightSchedulerService.stop();
});

process.on('SIGINT', () => {
  insightSchedulerService.stop();
});