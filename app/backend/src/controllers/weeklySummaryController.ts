import { Request, Response } from 'express';
import { weeklySummaryService, WeeklySummaryOptions } from '../services/weeklySummaryService';
import { successResponse, errorResponse } from '../utils/response';
import { AppError } from '../types';

export class WeeklySummaryController {
  async generateWeeklySummary(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const options: WeeklySummaryOptions = {
        weekOffset: req.body.weekOffset ? parseInt(req.body.weekOffset) : 0,
        includeComparison: req.body.includeComparison === true,
        includePredictions: req.body.includePredictions === true,
        forceRegeneration: req.body.forceRegeneration === true,
      };

      // Validate weekOffset
      if (options.weekOffset !== undefined && (options.weekOffset < 0 || options.weekOffset > 12)) {
        errorResponse(res, 'Week offset must be between 0 and 12', 400);
        return;
      }

      const summary = await weeklySummaryService.generateWeeklySummary(userId, options);
      
      successResponse(res, summary, 'Weekly summary generated successfully', 201);
    } catch (error) {
      console.error('Error generating weekly summary:', error);
      
      if (error instanceof AppError) {
        errorResponse(res, error.message, error.statusCode);
      } else {
        errorResponse(res, 'Failed to generate weekly summary', 500);
      }
    }
  }

  async getWeeklySummary(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const weekOffset = req.query.weekOffset ? parseInt(req.query.weekOffset as string) : 0;

      // Validate weekOffset
      if (weekOffset < 0 || weekOffset > 12) {
        errorResponse(res, 'Week offset must be between 0 and 12', 400);
        return;
      }

      const summary = await weeklySummaryService.getWeeklySummary(userId, weekOffset);
      
      if (!summary) {
        errorResponse(res, 'Weekly summary not found', 404);
        return;
      }

      successResponse(res, summary, 'Weekly summary retrieved successfully');
    } catch (error) {
      console.error('Error getting weekly summary:', error);
      
      if (error instanceof AppError) {
        errorResponse(res, error.message, error.statusCode);
      } else {
        errorResponse(res, 'Failed to retrieve weekly summary', 500);
      }
    }
  }

  async getUserWeeklySummaries(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      // Validate limit
      if (limit < 1 || limit > 52) {
        errorResponse(res, 'Limit must be between 1 and 52', 400);
        return;
      }

      const summaries = await weeklySummaryService.getUserWeeklySummaries(userId, limit);
      
      successResponse(res, summaries, 'Weekly summaries retrieved successfully');
    } catch (error) {
      console.error('Error getting user weekly summaries:', error);
      
      if (error instanceof AppError) {
        errorResponse(res, error.message, error.statusCode);
      } else {
        errorResponse(res, 'Failed to retrieve weekly summaries', 500);
      }
    }
  }

  async getCurrentWeekSummary(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const summary = await weeklySummaryService.getWeeklySummary(userId, 0);
      
      if (!summary) {
        // Generate if not exists
        const newSummary = await weeklySummaryService.generateWeeklySummary(userId, {
          includeComparison: true,
        });
        successResponse(res, newSummary, 'Current week summary generated', 201);
        return;
      }

      successResponse(res, summary, 'Current week summary retrieved successfully');
    } catch (error) {
      console.error('Error getting current week summary:', error);
      
      if (error instanceof AppError) {
        errorResponse(res, error.message, error.statusCode);
      } else {
        errorResponse(res, 'Failed to retrieve current week summary', 500);
      }
    }
  }

  async getLastWeekSummary(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const summary = await weeklySummaryService.getWeeklySummary(userId, 1);
      
      if (!summary) {
        // Generate if not exists
        const newSummary = await weeklySummaryService.generateWeeklySummary(userId, {
          weekOffset: 1,
          includeComparison: true,
          includePredictions: true,
        });
        successResponse(res, newSummary, 'Last week summary generated', 201);
        return;
      }

      successResponse(res, summary, 'Last week summary retrieved successfully');
    } catch (error) {
      console.error('Error getting last week summary:', error);
      
      if (error instanceof AppError) {
        errorResponse(res, error.message, error.statusCode);
      } else {
        errorResponse(res, 'Failed to retrieve last week summary', 500);
      }
    }
  }

  async getSummaryAchievements(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const weekOffset = req.query.weekOffset ? parseInt(req.query.weekOffset as string) : 0;

      const summary = await weeklySummaryService.getWeeklySummary(userId, weekOffset);
      
      if (!summary) {
        errorResponse(res, 'Weekly summary not found', 404);
        return;
      }

      successResponse(res, summary.achievements, 'Weekly achievements retrieved successfully');
    } catch (error) {
      console.error('Error getting weekly achievements:', error);
      
      if (error instanceof AppError) {
        errorResponse(res, error.message, error.statusCode);
      } else {
        errorResponse(res, 'Failed to retrieve weekly achievements', 500);
      }
    }
  }

  async getSummaryInsights(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const weekOffset = req.query.weekOffset ? parseInt(req.query.weekOffset as string) : 0;

      const summary = await weeklySummaryService.getWeeklySummary(userId, weekOffset);
      
      if (!summary) {
        errorResponse(res, 'Weekly summary not found', 404);
        return;
      }

      successResponse(res, summary.insights, 'Weekly insights retrieved successfully');
    } catch (error) {
      console.error('Error getting weekly insights:', error);
      
      if (error instanceof AppError) {
        errorResponse(res, error.message, error.statusCode);
      } else {
        errorResponse(res, 'Failed to retrieve weekly insights', 500);
      }
    }
  }

  async getSummaryRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const weekOffset = req.query.weekOffset ? parseInt(req.query.weekOffset as string) : 0;

      const summary = await weeklySummaryService.getWeeklySummary(userId, weekOffset);
      
      if (!summary) {
        errorResponse(res, 'Weekly summary not found', 404);
        return;
      }

      successResponse(res, summary.recommendations, 'Weekly recommendations retrieved successfully');
    } catch (error) {
      console.error('Error getting weekly recommendations:', error);
      
      if (error instanceof AppError) {
        errorResponse(res, error.message, error.statusCode);
      } else {
        errorResponse(res, 'Failed to retrieve weekly recommendations', 500);
      }
    }
  }

  async getSummaryStatistics(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const weekOffset = req.query.weekOffset ? parseInt(req.query.weekOffset as string) : 0;

      const summary = await weeklySummaryService.getWeeklySummary(userId, weekOffset);
      
      if (!summary) {
        errorResponse(res, 'Weekly summary not found', 404);
        return;
      }

      const response = {
        statistics: summary.statistics,
        moodAnalysis: summary.moodAnalysis,
        habitAnalysis: summary.habitAnalysis,
        comparison: summary.comparison,
      };

      successResponse(res, response, 'Weekly statistics retrieved successfully');
    } catch (error) {
      console.error('Error getting weekly statistics:', error);
      
      if (error instanceof AppError) {
        errorResponse(res, error.message, error.statusCode);
      } else {
        errorResponse(res, 'Failed to retrieve weekly statistics', 500);
      }
    }
  }

  async regenerateSummary(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { weekOffset, includeComparison, includePredictions } = req.body;

      const options: WeeklySummaryOptions = {
        weekOffset: weekOffset !== undefined ? parseInt(weekOffset) : 0,
        includeComparison: includeComparison === true,
        includePredictions: includePredictions === true,
        forceRegeneration: true,
      };

      // Validate weekOffset
      if (options.weekOffset !== undefined && (options.weekOffset < 0 || options.weekOffset > 12)) {
        errorResponse(res, 'Week offset must be between 0 and 12', 400);
        return;
      }

      const summary = await weeklySummaryService.generateWeeklySummary(userId, options);
      
      successResponse(res, summary, 'Weekly summary regenerated successfully', 201);
    } catch (error) {
      console.error('Error regenerating weekly summary:', error);
      
      if (error instanceof AppError) {
        errorResponse(res, error.message, error.statusCode);
      } else {
        errorResponse(res, 'Failed to regenerate weekly summary', 500);
      }
    }
  }
}

export const weeklySummaryController = new WeeklySummaryController();