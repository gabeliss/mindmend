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
        const validTypes = ['daily_tip', 'pattern_detected', 'weekly_summary'];
        const invalidTypes = options.insightTypes.filter(type => !validTypes.includes(type));
        
        if (invalidTypes.length > 0) {
          res.status(400).json(errorResponse(`Invalid insight types: ${invalidTypes.join(', ')}`));
          return;
        }
      }

      const insights = await aiInsightService.generateDailyInsights(userId, options);
      
      res.status(201).json(successResponse(insights, 'Daily insights generated successfully'));
    } catch (error) {
      console.error('Error generating daily insights:', error);
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Failed to generate daily insights'));
      }
    }
  }

  async generateWeeklyInsight(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const insight = await aiInsightService.generateWeeklyInsight(userId);
      
      if (!insight) {
        res.status(200).json(successResponse(null, 'No data available for weekly insight generation'));
        return;
      }

      res.status(201).json(successResponse(insight, 'Weekly insight generated successfully'));
    } catch (error) {
      console.error('Error generating weekly insight:', error);
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Failed to generate weekly insight'));
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
        res.status(400).json(errorResponse('Limit must be between 1 and 100'));
        return;
      }

      // Validate types if provided
      if (options.types) {
        const validTypes = ['daily_tip', 'pattern_detected', 'weekly_summary'];
        const invalidTypes = options.types.filter(type => !validTypes.includes(type));
        
        if (invalidTypes.length > 0) {
          res.status(400).json(errorResponse(`Invalid insight types: ${invalidTypes.join(', ')}`));
          return;
        }
      }

      const insights = await aiInsightService.getUserInsights(userId, options);
      
      res.json(successResponse(insights, 'User insights retrieved successfully'));
    } catch (error) {
      console.error('Error getting user insights:', error);
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Failed to retrieve user insights'));
      }
    }
  }

  async getInsightById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const insightId = req.params.id;

      if (!insightId) {
        res.status(400).json(errorResponse('Insight ID is required'));
        return;
      }

      // Get the specific insight
      const insights = await aiInsightService.getUserInsights(userId, { limit: 1000 });
      const insight = insights.find(i => i.id === insightId);

      if (!insight) {
        res.status(404).json(errorResponse('Insight not found'));
        return;
      }

      res.json(successResponse(insight, 'Insight retrieved successfully'));
    } catch (error) {
      console.error('Error getting insight by ID:', error);
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Failed to retrieve insight'));
      }
    }
  }

  async markInsightAsShown(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const insightId = req.params.id;

      if (!insightId) {
        res.status(400).json(errorResponse('Insight ID is required'));
        return;
      }

      await aiInsightService.markInsightAsShown(userId, insightId);
      
      res.json(successResponse(null, 'Insight marked as shown successfully'));
    } catch (error) {
      console.error('Error marking insight as shown:', error);
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Failed to mark insight as shown'));
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
        types: ['daily_tip', 'pattern_detected'],
      });

      // Filter to only today's insights
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todaysInsights = insights.filter(insight => {
        const insightDate = new Date(insight.createdAt);
        insightDate.setHours(0, 0, 0, 0);
        return insightDate.getTime() === today.getTime();
      });

      res.json(successResponse(todaysInsights, "Today's insights retrieved successfully"));
    } catch (error) {
      console.error('Error getting today\'s insights:', error);
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Failed to retrieve today\'s insights'));
      }
    }
  }

  async getLatestWeeklyInsight(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const insights = await aiInsightService.getUserInsights(userId, {
        limit: 1,
        types: ['weekly_summary'],
      });

      const latestWeekly = insights.length > 0 ? insights[0] : null;

      res.json(successResponse(latestWeekly, 'Latest weekly insight retrieved successfully'));
    } catch (error) {
      console.error('Error getting latest weekly insight:', error);
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Failed to retrieve latest weekly insight'));
      }
    }
  }

  async regenerateInsights(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { type } = req.body;

      if (!type) {
        res.status(400).json(errorResponse('Insight type is required'));
        return;
      }

      if (type === 'weekly_summary') {
        const insight = await aiInsightService.generateWeeklyInsight(userId);
        res.status(201).json(successResponse(insight, 'Weekly insight regenerated successfully'));
      } else {
        const insights = await aiInsightService.generateDailyInsights(userId, {
          forceRegeneration: true,
          insightTypes: [type],
        });
        res.status(201).json(successResponse(insights, 'Daily insights regenerated successfully'));
      }
    } catch (error) {
      console.error('Error regenerating insights:', error);
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Failed to regenerate insights'));
      }
    }
  }
}

export const aiInsightController = new AIInsightController();