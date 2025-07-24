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
        res.status(400).json(errorResponse('Week offset must be between 0 and 12'));
        return;
      }

      const summary = await weeklySummaryService.generateWeeklySummary(userId, options);
      
      res.status(201).json(successResponse(summary, 'Weekly summary generated successfully'));
    } catch (error) {
      console.error('Error generating weekly summary:', error);
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Failed to generate weekly summary'));
      }
    }
  }

  async getWeeklySummary(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const weekOffset = req.query.weekOffset ? parseInt(req.query.weekOffset as string) : 0;

      // Validate weekOffset
      if (weekOffset < 0 || weekOffset > 12) {
        res.status(400).json(errorResponse('Week offset must be between 0 and 12'));
        return;
      }

      const summary = await weeklySummaryService.getWeeklySummary(userId, weekOffset);
      
      if (!summary) {
        res.status(404).json(errorResponse('Weekly summary not found'));
        return;
      }

      res.json(successResponse(summary, 'Weekly summary retrieved successfully'));
    } catch (error) {
      console.error('Error getting weekly summary:', error);
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Failed to retrieve weekly summary'));
      }
    }
  }

  async getUserWeeklySummaries(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      // Validate limit
      if (limit < 1 || limit > 52) {
        res.status(400).json(errorResponse('Limit must be between 1 and 52'));
        return;
      }

      const summaries = await weeklySummaryService.getUserWeeklySummaries(userId, limit);
      
      res.json(successResponse(summaries, 'Weekly summaries retrieved successfully'));
    } catch (error) {
      console.error('Error getting user weekly summaries:', error);
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Failed to retrieve weekly summaries'));
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
        res.status(201).json(successResponse(newSummary, 'Current week summary generated'));
        return;
      }

      res.json(successResponse(summary, 'Current week summary retrieved successfully'));
    } catch (error) {
      console.error('Error getting current week summary:', error);
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Failed to retrieve current week summary'));
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
        res.status(201).json(successResponse(newSummary, 'Last week summary generated'));
        return;
      }

      res.json(successResponse(summary, 'Last week summary retrieved successfully'));
    } catch (error) {
      console.error('Error getting last week summary:', error);
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Failed to retrieve last week summary'));
      }
    }
  }

  async getSummaryAchievements(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const weekOffset = req.query.weekOffset ? parseInt(req.query.weekOffset as string) : 0;

      const summary = await weeklySummaryService.getWeeklySummary(userId, weekOffset);
      
      if (!summary) {
        res.status(404).json(errorResponse('Weekly summary not found'));
        return;
      }

      res.json(successResponse(summary.achievements, 'Weekly achievements retrieved successfully'));
    } catch (error) {
      console.error('Error getting weekly achievements:', error);
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Failed to retrieve weekly achievements'));
      }
    }
  }

  async getSummaryInsights(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const weekOffset = req.query.weekOffset ? parseInt(req.query.weekOffset as string) : 0;

      const summary = await weeklySummaryService.getWeeklySummary(userId, weekOffset);
      
      if (!summary) {
        res.status(404).json(errorResponse('Weekly summary not found'));
        return;
      }

      res.json(successResponse(summary.insights, 'Weekly insights retrieved successfully'));
    } catch (error) {
      console.error('Error getting weekly insights:', error);
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Failed to retrieve weekly insights'));
      }
    }
  }

  async getSummaryRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const weekOffset = req.query.weekOffset ? parseInt(req.query.weekOffset as string) : 0;

      const summary = await weeklySummaryService.getWeeklySummary(userId, weekOffset);
      
      if (!summary) {
        res.status(404).json(errorResponse('Weekly summary not found'));
        return;
      }

      res.json(successResponse(summary.recommendations, 'Weekly recommendations retrieved successfully'));
    } catch (error) {
      console.error('Error getting weekly recommendations:', error);
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Failed to retrieve weekly recommendations'));
      }
    }
  }

  async getSummaryStatistics(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const weekOffset = req.query.weekOffset ? parseInt(req.query.weekOffset as string) : 0;

      const summary = await weeklySummaryService.getWeeklySummary(userId, weekOffset);
      
      if (!summary) {
        res.status(404).json(errorResponse('Weekly summary not found'));
        return;
      }

      const response = {
        statistics: summary.statistics,
        moodAnalysis: summary.moodAnalysis,
        habitAnalysis: summary.habitAnalysis,
        comparison: summary.comparison,
      };

      res.json(successResponse(response, 'Weekly statistics retrieved successfully'));
    } catch (error) {
      console.error('Error getting weekly statistics:', error);
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Failed to retrieve weekly statistics'));
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
        res.status(400).json(errorResponse('Week offset must be between 0 and 12'));
        return;
      }

      const summary = await weeklySummaryService.generateWeeklySummary(userId, options);
      
      res.status(201).json(successResponse(summary, 'Weekly summary regenerated successfully'));
    } catch (error) {
      console.error('Error regenerating weekly summary:', error);
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Failed to regenerate weekly summary'));
      }
    }
  }
}

export const weeklySummaryController = new WeeklySummaryController();