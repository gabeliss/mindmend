import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analyticsService';
import ResponseHandler from '../utils/response';
import { AppError } from '../types';
import { ValidationError } from '../middleware/validation';

export class AnalyticsController {
  // Get comprehensive user analytics
  static getUserAnalytics = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    
    try {
      // Parse and validate date parameters
      const { startDate, endDate, period } = req.query;
      
      let start: Date, end: Date;
      
      if (startDate && endDate) {
        start = new Date(startDate as string);
        end = new Date(endDate as string);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          throw new ValidationError('Invalid date format. Use ISO format (YYYY-MM-DD)');
        }
        
        if (start >= end) {
          throw new ValidationError('Start date must be before end date');
        }
      } else {
        // Default to last 30 days
        end = new Date();
        start = new Date(end);
        start.setDate(start.getDate() - 30);
      }
      
      // Validate period parameter
      const validPeriods = ['day', 'week', 'month', 'year'];
      const selectedPeriod = validPeriods.includes(period as string) 
        ? (period as 'day' | 'week' | 'month' | 'year')
        : 'month';
      
      // Limit date range to prevent performance issues
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > 365) {
        throw new ValidationError('Date range cannot exceed 365 days');
      }
      
      const analytics = await AnalyticsService.getUserAnalytics(userId, start, end, selectedPeriod);
      
      return ResponseHandler.success(res, analytics, 'User analytics retrieved successfully');
    } catch (error) {
      if (error instanceof AppError || error instanceof ValidationError) {
        return ResponseHandler.error(res, error.message, error.statusCode || 400);
      }
      return ResponseHandler.error(res, 'Failed to retrieve user analytics', 500);
    }
  };
  
  // Get habit-specific analytics
  static getHabitAnalytics = async (req: Request, res: Response) => {
    const { habitId } = req.params;
    const userId = req.user!.id;
    
    try {
      // Parse date parameters
      const { startDate, endDate } = req.query;
      
      let start: Date, end: Date;
      
      if (startDate && endDate) {
        start = new Date(startDate as string);
        end = new Date(endDate as string);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          throw new ValidationError('Invalid date format. Use ISO format (YYYY-MM-DD)');
        }
      } else {
        // Default to last 30 days
        end = new Date();
        start = new Date(end);
        start.setDate(start.getDate() - 30);
      }
      
      const analytics = await AnalyticsService.getHabitAnalytics(habitId, userId, start, end);
      
      return ResponseHandler.success(res, analytics, 'Habit analytics retrieved successfully');
    } catch (error) {
      if (error instanceof AppError || error instanceof ValidationError) {
        return ResponseHandler.error(res, error.message, error.statusCode || 400);
      }
      return ResponseHandler.error(res, 'Failed to retrieve habit analytics', 500);
    }
  };
  
  // Get activity heatmap data
  static getActivityHeatmap = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    
    try {
      // Parse date parameters
      const { startDate, endDate } = req.query;
      
      let start: Date, end: Date;
      
      if (startDate && endDate) {
        start = new Date(startDate as string);
        end = new Date(endDate as string);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          throw new ValidationError('Invalid date format. Use ISO format (YYYY-MM-DD)');
        }
      } else {
        // Default to last 365 days for heatmap
        end = new Date();
        start = new Date(end);
        start.setDate(start.getDate() - 365);
      }
      
      // Limit to max 2 years
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > 730) {
        throw new ValidationError('Date range cannot exceed 2 years for heatmap');
      }
      
      const heatmapData = await AnalyticsService.getActivityHeatmap(userId, start, end);
      
      return ResponseHandler.success(res, {
        heatmap: heatmapData,
        meta: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
          totalDays: heatmapData.length,
          activeDays: heatmapData.filter(d => d.value > 0).length,
          averageActivity: heatmapData.length > 0 
            ? Math.round((heatmapData.reduce((sum, d) => sum + d.value, 0) / heatmapData.length) * 100) / 100
            : 0
        }
      }, 'Activity heatmap retrieved successfully');
    } catch (error) {
      if (error instanceof AppError || error instanceof ValidationError) {
        return ResponseHandler.error(res, error.message, error.statusCode || 400);
      }
      return ResponseHandler.error(res, 'Failed to retrieve activity heatmap', 500);
    }
  };
  
  // Get completion rate trends
  static getCompletionTrends = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    
    try {
      // Parse parameters
      const { startDate, endDate, groupBy } = req.query;
      
      let start: Date, end: Date;
      
      if (startDate && endDate) {
        start = new Date(startDate as string);
        end = new Date(endDate as string);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          throw new ValidationError('Invalid date format. Use ISO format (YYYY-MM-DD)');
        }
      } else {
        // Default to last 90 days for trends
        end = new Date();
        start = new Date(end);
        start.setDate(start.getDate() - 90);
      }
      
      // Validate groupBy parameter
      const validGroupBy = ['day', 'week', 'month'];
      const selectedGroupBy = validGroupBy.includes(groupBy as string)
        ? (groupBy as 'day' | 'week' | 'month')
        : 'week';
      
      const trends = await AnalyticsService.getCompletionTrends(userId, start, end, selectedGroupBy);
      
      // Calculate trend statistics
      const completionRates = trends.map(t => t.completionRate);
      const avgCompletionRate = completionRates.length > 0
        ? Math.round(completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length)
        : 0;
      
      // Calculate trend direction
      let trendDirection: 'improving' | 'declining' | 'stable' = 'stable';
      if (completionRates.length >= 2) {
        const firstHalf = completionRates.slice(0, Math.floor(completionRates.length / 2));
        const secondHalf = completionRates.slice(Math.floor(completionRates.length / 2));
        
        const firstAvg = firstHalf.reduce((sum, rate) => sum + rate, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, rate) => sum + rate, 0) / secondHalf.length;
        
        if (secondAvg > firstAvg + 5) {
          trendDirection = 'improving';
        } else if (secondAvg < firstAvg - 5) {
          trendDirection = 'declining';
        }
      }
      
      return ResponseHandler.success(res, {
        trends,
        meta: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
          groupBy: selectedGroupBy,
          totalPeriods: trends.length,
          averageCompletionRate: avgCompletionRate,
          trendDirection,
          bestPeriod: trends.length > 0 
            ? trends.reduce((best, current) => current.completionRate > best.completionRate ? current : best)
            : null,
          worstPeriod: trends.length > 0
            ? trends.reduce((worst, current) => current.completionRate < worst.completionRate ? current : worst)
            : null
        }
      }, 'Completion trends retrieved successfully');
    } catch (error) {
      if (error instanceof AppError || error instanceof ValidationError) {
        return ResponseHandler.error(res, error.message, error.statusCode || 400);
      }
      return ResponseHandler.error(res, 'Failed to retrieve completion trends', 500);
    }
  };
  
  // Get analytics dashboard (combined overview)
  static getAnalyticsDashboard = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    
    try {
      // Get analytics for different time periods
      const now = new Date();
      
      // Last 7 days
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7);
      
      // Last 30 days
      const monthStart = new Date(now);
      monthStart.setDate(monthStart.getDate() - 30);
      
      // Last 90 days for trends
      const quarterStart = new Date(now);
      quarterStart.setDate(quarterStart.getDate() - 90);
      
      const [weeklyAnalytics, monthlyAnalytics, trends, heatmapData] = await Promise.all([
        AnalyticsService.getUserAnalytics(userId, weekStart, now, 'week'),
        AnalyticsService.getUserAnalytics(userId, monthStart, now, 'month'),
        AnalyticsService.getCompletionTrends(userId, quarterStart, now, 'week'),
        AnalyticsService.getActivityHeatmap(userId, monthStart, now)
      ]);
      
      const dashboard = {
        summary: {
          weekly: {
            completionRate: weeklyAnalytics.overview.overallCompletionRate,
            totalEvents: weeklyAnalytics.overview.totalEvents,
            activeHabits: weeklyAnalytics.overview.activeHabits
          },
          monthly: {
            completionRate: monthlyAnalytics.overview.overallCompletionRate,
            totalEvents: monthlyAnalytics.overview.totalEvents,
            activeHabits: monthlyAnalytics.overview.activeHabits
          }
        },
        performance: {
          bestHabit: monthlyAnalytics.performance.bestPerformingHabit,
          worstHabit: monthlyAnalytics.performance.worstPerformingHabit,
          consistentHabit: monthlyAnalytics.performance.mostConsistentHabit
        },
        activity: {
          heatmap: heatmapData.slice(-30), // Last 30 days
          totalActiveDays: heatmapData.filter(d => d.value > 0).length,
          averageIntensity: heatmapData.length > 0
            ? Math.round((heatmapData.reduce((sum, d) => sum + d.value, 0) / heatmapData.length) * 100) / 100
            : 0
        },
        trends: {
          completionTrend: trends.slice(-8), // Last 8 weeks
          trendDirection: trends.length >= 2 ? (
            trends[trends.length - 1].completionRate > trends[trends.length - 2].completionRate
              ? 'improving' : 'declining'
          ) : 'stable'
        },
        topHabits: monthlyAnalytics.habitAnalytics
          .sort((a, b) => b.completionRate - a.completionRate)
          .slice(0, 5)
          .map(h => ({
            id: h.habitId,
            title: h.habitTitle,
            type: h.habitType,
            completionRate: h.completionRate,
            totalEvents: h.totalEvents
          }))
      };
      
      return ResponseHandler.success(res, dashboard, 'Analytics dashboard retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return ResponseHandler.error(res, error.message, error.statusCode);
      }
      return ResponseHandler.error(res, 'Failed to retrieve analytics dashboard', 500);
    }
  };
}