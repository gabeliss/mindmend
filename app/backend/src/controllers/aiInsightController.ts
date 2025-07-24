import { Request, Response } from 'express';
import { aiInsightService, InsightGenerationOptions } from '../services/aiInsightService';
import { successResponse, errorResponse } from '../utils/response';
import { AppError } from '../types';

export class AIInsightController {
  async generateDailyInsights(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const options: InsightGenerationOptions = {
        forceRegeneration: req.body.forceRegeneration || false,
        insightTypes: req.body.insightTypes,
      };

      // Validate insightTypes if provided
      if (options.insightTypes) {
        const validTypes = ['DAILY_TIP', 'PATTERN_DETECTED', 'WEEKLY_SUMMARY'];
        const invalidTypes = options.insightTypes.filter(type => !validTypes.includes(type));
        
        if (invalidTypes.length > 0) {
          errorResponse(res, `Invalid insight types: ${invalidTypes.join(', ')}`, 400);
          return;
        }
      }

      const insights = await aiInsightService.generateDailyInsights(userId, options);
      
      successResponse(res, insights, 'Daily insights generated successfully', 201);
    } catch (error) {
      console.error('Error generating daily insights:', error);
      
      if (error instanceof AppError) {
        errorResponse(res, error.message, error.statusCode);
      } else {
        errorResponse(res, 'Failed to generate daily insights', 500);
      }
    }
  }

  async generateWeeklyInsight(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const insight = await aiInsightService.generateWeeklyInsight(userId);
      
      if (!insight) {
        successResponse(res, null, 'No data available for weekly insight generation', 200);
        return;
      }

      successResponse(res, insight, 'Weekly insight generated successfully', 201);
    } catch (error) {
      console.error('Error generating weekly insight:', error);
      
      if (error instanceof AppError) {
        errorResponse(res, error.message, error.statusCode);
      } else {
        errorResponse(res, 'Failed to generate weekly insight', 500);
      }
    }
  }

  async getUserInsights(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const options = {
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        onlyUnshown: req.query.onlyUnshown === 'true',
        types: req.query.types ? (req.query.types as string).split(',') as any : undefined,
      };

      // Validate limit
      if (options.limit && (options.limit < 1 || options.limit > 100)) {
        errorResponse(res, 'Limit must be between 1 and 100', 400);
        return;
      }

      // Validate types if provided
      if (options.types) {
        const validTypes = ['DAILY_TIP', 'PATTERN_DETECTED', 'WEEKLY_SUMMARY'];
        const invalidTypes = options.types.filter((type: string) => !validTypes.includes(type));
        
        if (invalidTypes.length > 0) {
          errorResponse(res, `Invalid insight types: ${invalidTypes.join(', ')}`, 400);
          return;
        }
      }

      const insights = await aiInsightService.getUserInsights(userId, options);
      
      successResponse(res, insights, 'User insights retrieved successfully');
    } catch (error) {
      console.error('Error getting user insights:', error);
      
      if (error instanceof AppError) {
        errorResponse(res, error.message, error.statusCode);
      } else {
        errorResponse(res, 'Failed to retrieve user insights', 500);
      }
    }
  }

  async getInsightById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const insightId = req.params.id;

      if (!insightId) {
        errorResponse(res, 'Insight ID is required', 400);
        return;
      }

      // Get the specific insight
      const insights = await aiInsightService.getUserInsights(userId, { limit: 1000 });
      const insight = insights.find(i => i.id === insightId);

      if (!insight) {
        errorResponse(res, 'Insight not found', 404);
        return;
      }

      successResponse(res, insight, 'Insight retrieved successfully');
    } catch (error) {
      console.error('Error getting insight by ID:', error);
      
      if (error instanceof AppError) {
        errorResponse(res, error.message, error.statusCode);
      } else {
        errorResponse(res, 'Failed to retrieve insight', 500);
      }
    }
  }

  async markInsightAsShown(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const insightId = req.params.id;

      if (!insightId) {
        errorResponse(res, 'Insight ID is required', 400);
        return;
      }

      await aiInsightService.markInsightAsShown(userId, insightId);
      
      successResponse(res, null, 'Insight marked as shown successfully');
    } catch (error) {
      console.error('Error marking insight as shown:', error);
      
      if (error instanceof AppError) {
        errorResponse(res, error.message, error.statusCode);
      } else {
        errorResponse(res, 'Failed to mark insight as shown', 500);
      }
    }
  }

  async getTodaysInsights(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      // Get today's insights that haven't been shown yet
      const insights = await aiInsightService.getUserInsights(userId, {
        limit: 10,
        onlyUnshown: true,
        types: ['DAILY_TIP', 'PATTERN_DETECTED'],
      });

      // Filter to only today's insights
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todaysInsights = insights.filter(insight => {
        const insightDate = new Date(insight.createdAt);
        insightDate.setHours(0, 0, 0, 0);
        return insightDate.getTime() === today.getTime();
      });

      successResponse(res, todaysInsights, "Today's insights retrieved successfully");
    } catch (error) {
      console.error('Error getting today\'s insights:', error);
      
      if (error instanceof AppError) {
        errorResponse(res, error.message, error.statusCode);
      } else {
        errorResponse(res, 'Failed to retrieve today\'s insights', 500);
      }
    }
  }

  async getLatestWeeklyInsight(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const insights = await aiInsightService.getUserInsights(userId, {
        limit: 1,
        types: ['WEEKLY_SUMMARY'],
      });

      const latestWeekly = insights.length > 0 ? insights[0] : null;

      successResponse(res, latestWeekly, 'Latest weekly insight retrieved successfully');
    } catch (error) {
      console.error('Error getting latest weekly insight:', error);
      
      if (error instanceof AppError) {
        errorResponse(res, error.message, error.statusCode);
      } else {
        errorResponse(res, 'Failed to retrieve latest weekly insight', 500);
      }
    }
  }

  async regenerateInsights(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { type } = req.body;

      if (!type) {
        errorResponse(res, 'Insight type is required', 400);
        return;
      }

      if (type === 'WEEKLY_SUMMARY') {
        const insight = await aiInsightService.generateWeeklyInsight(userId);
        successResponse(res, insight, 'Weekly insight regenerated successfully', 201);
      } else {
        const insights = await aiInsightService.generateDailyInsights(userId, {
          forceRegeneration: true,
          insightTypes: [type],
        });
        successResponse(res, insights, 'Daily insights regenerated successfully', 201);
      }
    } catch (error) {
      console.error('Error regenerating insights:', error);
      
      if (error instanceof AppError) {
        errorResponse(res, error.message, error.statusCode);
      } else {
        errorResponse(res, 'Failed to regenerate insights', 500);
      }
    }
  }
}

export const aiInsightController = new AIInsightController();