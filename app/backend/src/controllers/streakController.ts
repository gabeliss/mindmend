import { Request, Response } from 'express';
import { StreakService } from '../services/streakService';
import ResponseHandler from '../utils/response';
import { AppError } from '../types';
import { ValidationError } from '../middleware/validation';

export class StreakController {
  // Get streak data for a specific habit
  static getHabitStreak = async (req: Request, res: Response) => {
    const { habitId } = req.params;
    const userId = req.user!.id;
    
    try {
      const streak = await StreakService.calculateHabitStreak(habitId, userId);
      return ResponseHandler.success(res, streak, 'Habit streak calculated successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return ResponseHandler.error(res, error.message, error.statusCode);
      }
      return ResponseHandler.error(res, 'Failed to calculate habit streak', 500);
    }
  };
  
  // Get streak summary for all user habits
  static getUserStreakSummary = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    
    try {
      const summary = await StreakService.calculateUserStreaks(userId);
      return ResponseHandler.success(res, summary, 'User streak summary retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return ResponseHandler.error(res, error.message, error.statusCode);
      }
      return ResponseHandler.error(res, 'Failed to get user streak summary', 500);
    }
  };
  
  // Get streak leaderboard (top performing habits)
  static getStreakLeaderboard = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    
    try {
      // Parse limit parameter
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50); // Max 50
      
      const leaderboard = await StreakService.getStreakLeaderboard(userId, limit);
      
      return ResponseHandler.success(res, {
        leaderboard,
        meta: {
          count: leaderboard.length,
          limit
        }
      }, 'Streak leaderboard retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return ResponseHandler.error(res, error.message, error.statusCode);
      }
      return ResponseHandler.error(res, 'Failed to get streak leaderboard', 500);
    }
  };
  
  // Get streak history for a habit (calendar view)
  static getHabitStreakHistory = async (req: Request, res: Response) => {
    const { habitId } = req.params;
    const userId = req.user!.id;
    
    try {
      // Parse days parameter
      const days = Math.min(parseInt(req.query.days as string) || 30, 365); // Max 365 days
      
      if (days < 1) {
        throw new ValidationError('Days parameter must be at least 1');
      }
      
      const history = await StreakService.getStreakHistory(habitId, userId, days);
      
      return ResponseHandler.success(res, {
        history,
        meta: {
          days,
          totalDays: history.length,
          daysWithEvents: history.filter(h => h.hasEvent).length,
          streakContributions: history.filter(h => h.contributes).length
        }
      }, 'Habit streak history retrieved successfully');
    } catch (error) {
      if (error instanceof AppError || error instanceof ValidationError) {
        return ResponseHandler.error(res, error.message, error.statusCode || 400);
      }
      return ResponseHandler.error(res, 'Failed to get habit streak history', 500);
    }
  };
  
  // Get combined streak dashboard data
  static getStreakDashboard = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    
    try {
      // Get both summary and leaderboard
      const [summary, leaderboard] = await Promise.all([
        StreakService.calculateUserStreaks(userId),
        StreakService.getStreakLeaderboard(userId, 5) // Top 5 for dashboard
      ]);
      
      // Calculate additional dashboard metrics
      const activeStreaks = summary.habitStreaks.filter(s => s.currentStreak > 0);
      const longestCurrentStreak = activeStreaks.length > 0 
        ? Math.max(...activeStreaks.map(s => s.currentStreak))
        : 0;
      
      const overallLongestStreak = summary.habitStreaks.length > 0
        ? Math.max(...summary.habitStreaks.map(s => s.longestStreak))
        : 0;
      
      const dashboard = {
        overview: {
          totalActiveHabits: summary.totalActiveHabits,
          habitsWithStreaks: summary.habitsWithStreaks,
          averageStreak: summary.averageStreak,
          longestCurrentStreak,
          overallLongestStreak,
          totalCompletions: summary.totalCompletions,
          streakBreaks: summary.streakBreaks
        },
        topHabits: leaderboard,
        streakDistribution: {
          withoutStreaks: summary.totalActiveHabits - summary.habitsWithStreaks,
          shortStreaks: activeStreaks.filter(s => s.currentStreak >= 1 && s.currentStreak <= 7).length,
          mediumStreaks: activeStreaks.filter(s => s.currentStreak >= 8 && s.currentStreak <= 30).length,
          longStreaks: activeStreaks.filter(s => s.currentStreak > 30).length
        },
        recentActivity: {
          brokenStreaks: summary.habitStreaks.filter(s => s.streakType === 'broken').length,
          newStreaks: summary.habitStreaks.filter(s => s.streakType === 'new').length,
          activeStreaks: summary.habitStreaks.filter(s => s.streakType === 'current' && s.currentStreak > 0).length
        }
      };
      
      return ResponseHandler.success(res, dashboard, 'Streak dashboard retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return ResponseHandler.error(res, error.message, error.statusCode);
      }
      return ResponseHandler.error(res, 'Failed to get streak dashboard', 500);
    }
  };
  
  // Get streak insights and achievements
  static getStreakInsights = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    
    try {
      const summary = await StreakService.calculateUserStreaks(userId);
      
      const insights = [];
      const achievements = [];
      
      // Generate insights based on streak data
      if (summary.totalActiveHabits === 0) {
        insights.push({
          type: 'getting_started',
          title: 'Ready to Start?',
          message: 'Create your first habit to begin building streaks!',
          actionable: true
        });
      } else if (summary.habitsWithStreaks === 0) {
        insights.push({
          type: 'motivation',
          title: 'Build Your First Streak',
          message: 'Complete a habit today to start your streak journey!',
          actionable: true
        });
      } else {
        // Calculate completion rate
        const activeHabits = summary.habitStreaks.filter(s => s.streakType !== 'broken');
        const completionRate = activeHabits.length > 0 
          ? Math.round((summary.habitsWithStreaks / activeHabits.length) * 100)
          : 0;
        
        if (completionRate >= 80) {
          insights.push({
            type: 'congratulations',
            title: 'Excellent Consistency!',
            message: `You're maintaining streaks on ${completionRate}% of your active habits.`,
            actionable: false
          });
        } else if (completionRate >= 50) {
          insights.push({
            type: 'encouragement',
            title: 'Good Progress',
            message: `You're on track with ${completionRate}% completion rate. Keep it up!`,
            actionable: false
          });
        } else {
          insights.push({
            type: 'improvement',
            title: 'Room for Growth',
            message: `Focus on consistency to improve your ${completionRate}% completion rate.`,
            actionable: true
          });
        }
      }
      
      // Check for achievements
      const longestStreak = Math.max(...summary.habitStreaks.map(s => s.longestStreak));
      
      // Milestone achievements
      const milestones = [7, 14, 30, 50, 100, 365];
      milestones.forEach(milestone => {
        if (longestStreak >= milestone) {
          achievements.push({
            type: 'milestone',
            title: `${milestone} Day Streak`,
            description: `Achieved a ${milestone}-day streak!`,
            earned: true,
            rarity: milestone >= 100 ? 'legendary' : milestone >= 30 ? 'rare' : 'common'
          });
        }
      });
      
      // Perfect week achievement
      const activeStreaks = summary.habitStreaks.filter(s => s.currentStreak >= 7);
      if (activeStreaks.length > 0) {
        achievements.push({
          type: 'consistency',
          title: 'Perfect Week',
          description: 'Maintained a 7-day streak!',
          earned: true,
          rarity: 'common'
        });
      }
      
      // Multiple habits achievement
      if (summary.habitsWithStreaks >= 3) {
        achievements.push({
          type: 'multitasking',
          title: 'Habit Master',
          description: 'Active streaks on 3+ habits simultaneously!',
          earned: true,
          rarity: 'rare'
        });
      }
      
      return ResponseHandler.success(res, {
        insights,
        achievements,
        stats: {
          totalInsights: insights.length,
          totalAchievements: achievements.filter(a => a.earned).length,
          actionableInsights: insights.filter(i => i.actionable).length
        }
      }, 'Streak insights retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return ResponseHandler.error(res, error.message, error.statusCode);
      }
      return ResponseHandler.error(res, 'Failed to get streak insights', 500);
    }
  };
}