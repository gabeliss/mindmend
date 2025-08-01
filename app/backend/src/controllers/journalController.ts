import { Request, Response } from 'express';
import { journalService } from '../services/journalService';
import { CreateJournalEntryData, UpdateJournalEntryData, JournalFilters } from '../types';
import { successResponse, errorResponse } from '../utils/response';
import { AppError } from '../types';

export class JournalController {
  async createEntry(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const data: CreateJournalEntryData = req.body;

      // Validate required fields
      if (!data.content || data.content.trim().length === 0) {
        errorResponse(res, 'Content is required', 400);
        return;
      }

      // Validate mood rating if provided
      if (data.moodRating !== undefined) {
        const mood = Number(data.moodRating);
        if (isNaN(mood) || mood < 1 || mood > 10) {
          errorResponse(res, 'Mood rating must be between 1 and 10', 400);
          return;
        }
        data.moodRating = mood;
      }

      const entry = await journalService.createEntry(userId, data);
      successResponse(res, entry, 'Journal entry created successfully', 201);
    } catch (error) {
      console.error('Error creating journal entry:', error);
      errorResponse(res, 'Failed to create journal entry', 500);
    }
  }

  async getEntries(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const filters: JournalFilters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        minMoodRating: req.query.minMoodRating ? Number(req.query.minMoodRating) : undefined,
        maxMoodRating: req.query.maxMoodRating ? Number(req.query.maxMoodRating) : undefined,
        search: req.query.search as string,
        limit: req.query.limit ? Number(req.query.limit) : 50,
        offset: req.query.offset ? Number(req.query.offset) : 0,
      };

      // Validate date filters
      if (filters.startDate && isNaN(Date.parse(filters.startDate))) {
        errorResponse(res, 'Invalid start date format', 400);
        return;
      }

      if (filters.endDate && isNaN(Date.parse(filters.endDate))) {
        errorResponse(res, 'Invalid end date format', 400);
        return;
      }

      // Validate mood rating filters
      if (filters.minMoodRating !== undefined && (filters.minMoodRating < 1 || filters.minMoodRating > 10)) {
        errorResponse(res, 'Minimum mood rating must be between 1 and 10', 400);
        return;
      }

      if (filters.maxMoodRating !== undefined && (filters.maxMoodRating < 1 || filters.maxMoodRating > 10)) {
        errorResponse(res, 'Maximum mood rating must be between 1 and 10', 400);
        return;
      }

      // Validate limit and offset
      if (filters.limit && (filters.limit < 1 || filters.limit > 100)) {
        errorResponse(res, 'Limit must be between 1 and 100', 400);
        return;
      }

      if (filters.offset && filters.offset < 0) {
        errorResponse(res, 'Offset must be non-negative', 400);
        return;
      }

      const entries = await journalService.getEntries(userId, filters);
      successResponse(res, entries, 'Journal entries retrieved successfully');
    } catch (error) {
      console.error('Error getting journal entries:', error);
      errorResponse(res, 'Failed to retrieve journal entries', 500);
    }
  }

  async getEntryById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const entryId = req.params.id;

      if (!entryId) {
        errorResponse(res, 'Entry ID is required', 400);
        return;
      }

      const entry = await journalService.getEntryById(userId, entryId);
      
      if (!entry) {
        errorResponse(res, 'Journal entry not found', 404);
        return;
      }

      successResponse(res, entry, 'Journal entry retrieved successfully');
    } catch (error) {
      console.error('Error getting journal entry:', error);
      errorResponse(res, 'Failed to retrieve journal entry', 500);
    }
  }

  async updateEntry(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const entryId = req.params.id;
      const data: UpdateJournalEntryData = req.body;

      if (!entryId) {
        errorResponse(res, 'Entry ID is required', 400);
        return;
      }

      // Validate mood rating if provided
      if (data.moodRating !== undefined) {
        const mood = Number(data.moodRating);
        if (isNaN(mood) || mood < 1 || mood > 10) {
          errorResponse(res, 'Mood rating must be between 1 and 10', 400);
          return;
        }
        data.moodRating = mood;
      }

      // Validate content if provided
      if (data.content !== undefined && data.content.trim().length === 0) {
        errorResponse(res, 'Content cannot be empty', 400);
        return;
      }

      const entry = await journalService.updateEntry(userId, entryId, data);
      
      if (!entry) {
        errorResponse(res, 'Journal entry not found', 404);
        return;
      }

      successResponse(res, entry, 'Journal entry updated successfully');
    } catch (error) {
      console.error('Error updating journal entry:', error);
      errorResponse(res, 'Failed to update journal entry', 500);
    }
  }

  async deleteEntry(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const entryId = req.params.id;

      if (!entryId) {
        errorResponse(res, 'Entry ID is required', 400);
        return;
      }

      const deleted = await journalService.deleteEntry(userId, entryId);
      
      if (!deleted) {
        errorResponse(res, 'Journal entry not found', 404);
        return;
      }

      successResponse(res, null, 'Journal entry deleted successfully');
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      errorResponse(res, 'Failed to delete journal entry', 500);
    }
  }

  async getEntriesByDate(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const dateParam = req.params.date;

      if (!dateParam) {
        errorResponse(res, 'Date is required', 400);
        return;
      }

      const date = new Date(dateParam);
      if (isNaN(date.getTime())) {
        errorResponse(res, 'Invalid date format', 400);
        return;
      }

      const entries = await journalService.getEntriesByDate(userId, date);
      successResponse(res, entries, 'Journal entries retrieved successfully');
    } catch (error) {
      console.error('Error getting journal entries by date:', error);
      errorResponse(res, 'Failed to retrieve journal entries', 500);
    }
  }

  async getMoodTrend(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const days = req.query.days ? Number(req.query.days) : 30;

      if (isNaN(days) || days < 1 || days > 365) {
        errorResponse(res, 'Days must be between 1 and 365', 400);
        return;
      }

      const trend = await journalService.getMoodTrend(userId, days);
      successResponse(res, trend, 'Mood trend retrieved successfully');
    } catch (error) {
      console.error('Error getting mood trend:', error);
      errorResponse(res, 'Failed to retrieve mood trend', 500);
    }
  }

  async getTimelineData(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const days = req.query.days ? Number(req.query.days) : 14;
      const limit = req.query.limit ? Number(req.query.limit) : 50;

      if (isNaN(days) || days < 1 || days > 90) {
        errorResponse(res, 'Days must be between 1 and 90', 400);
        return;
      }

      if (isNaN(limit) || limit < 1 || limit > 100) {
        errorResponse(res, 'Limit must be between 1 and 100', 400);
        return;
      }

      const timelineData = await journalService.getTimelineData(userId, days, limit);
      successResponse(res, timelineData, 'Timeline data retrieved successfully');
    } catch (error) {
      console.error('Error getting timeline data:', error);
      errorResponse(res, 'Failed to retrieve timeline data', 500);
    }
  }
}

export const journalController = new JournalController();