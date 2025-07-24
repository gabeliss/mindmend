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
        res.status(400).json(errorResponse('Content is required'));
        return;
      }

      // Validate mood rating if provided
      if (data.moodRating !== undefined) {
        const mood = Number(data.moodRating);
        if (isNaN(mood) || mood < 1 || mood > 10) {
          res.status(400).json(errorResponse('Mood rating must be between 1 and 10'));
          return;
        }
        data.moodRating = mood;
      }

      const entry = await journalService.createEntry(userId, data);
      res.status(201).json(successResponse(entry, 'Journal entry created successfully'));
    } catch (error) {
      console.error('Error creating journal entry:', error);
      res.status(500).json(errorResponse('Failed to create journal entry'));
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
        res.status(400).json(errorResponse('Invalid start date format'));
        return;
      }

      if (filters.endDate && isNaN(Date.parse(filters.endDate))) {
        res.status(400).json(errorResponse('Invalid end date format'));
        return;
      }

      // Validate mood rating filters
      if (filters.minMoodRating !== undefined && (filters.minMoodRating < 1 || filters.minMoodRating > 10)) {
        res.status(400).json(errorResponse('Minimum mood rating must be between 1 and 10'));
        return;
      }

      if (filters.maxMoodRating !== undefined && (filters.maxMoodRating < 1 || filters.maxMoodRating > 10)) {
        res.status(400).json(errorResponse('Maximum mood rating must be between 1 and 10'));
        return;
      }

      // Validate limit and offset
      if (filters.limit && (filters.limit < 1 || filters.limit > 100)) {
        res.status(400).json(errorResponse('Limit must be between 1 and 100'));
        return;
      }

      if (filters.offset && filters.offset < 0) {
        res.status(400).json(errorResponse('Offset must be non-negative'));
        return;
      }

      const entries = await journalService.getEntries(userId, filters);
      res.json(successResponse(entries, 'Journal entries retrieved successfully'));
    } catch (error) {
      console.error('Error getting journal entries:', error);
      res.status(500).json(errorResponse('Failed to retrieve journal entries'));
    }
  }

  async getEntryById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const entryId = req.params.id;

      if (!entryId) {
        res.status(400).json(errorResponse('Entry ID is required'));
        return;
      }

      const entry = await journalService.getEntryById(userId, entryId);
      
      if (!entry) {
        res.status(404).json(errorResponse('Journal entry not found'));
        return;
      }

      res.json(successResponse(entry, 'Journal entry retrieved successfully'));
    } catch (error) {
      console.error('Error getting journal entry:', error);
      res.status(500).json(errorResponse('Failed to retrieve journal entry'));
    }
  }

  async updateEntry(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const entryId = req.params.id;
      const data: UpdateJournalEntryData = req.body;

      if (!entryId) {
        res.status(400).json(errorResponse('Entry ID is required'));
        return;
      }

      // Validate mood rating if provided
      if (data.moodRating !== undefined) {
        const mood = Number(data.moodRating);
        if (isNaN(mood) || mood < 1 || mood > 10) {
          res.status(400).json(errorResponse('Mood rating must be between 1 and 10'));
          return;
        }
        data.moodRating = mood;
      }

      // Validate content if provided
      if (data.content !== undefined && data.content.trim().length === 0) {
        res.status(400).json(errorResponse('Content cannot be empty'));
        return;
      }

      const entry = await journalService.updateEntry(userId, entryId, data);
      
      if (!entry) {
        res.status(404).json(errorResponse('Journal entry not found'));
        return;
      }

      res.json(successResponse(entry, 'Journal entry updated successfully'));
    } catch (error) {
      console.error('Error updating journal entry:', error);
      res.status(500).json(errorResponse('Failed to update journal entry'));
    }
  }

  async deleteEntry(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const entryId = req.params.id;

      if (!entryId) {
        res.status(400).json(errorResponse('Entry ID is required'));
        return;
      }

      const deleted = await journalService.deleteEntry(userId, entryId);
      
      if (!deleted) {
        res.status(404).json(errorResponse('Journal entry not found'));
        return;
      }

      res.json(successResponse(null, 'Journal entry deleted successfully'));
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      res.status(500).json(errorResponse('Failed to delete journal entry'));
    }
  }

  async getEntriesByDate(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const dateParam = req.params.date;

      if (!dateParam) {
        res.status(400).json(errorResponse('Date is required'));
        return;
      }

      const date = new Date(dateParam);
      if (isNaN(date.getTime())) {
        res.status(400).json(errorResponse('Invalid date format'));
        return;
      }

      const entries = await journalService.getEntriesByDate(userId, date);
      res.json(successResponse(entries, 'Journal entries retrieved successfully'));
    } catch (error) {
      console.error('Error getting journal entries by date:', error);
      res.status(500).json(errorResponse('Failed to retrieve journal entries'));
    }
  }

  async getMoodTrend(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const days = req.query.days ? Number(req.query.days) : 30;

      if (isNaN(days) || days < 1 || days > 365) {
        res.status(400).json(errorResponse('Days must be between 1 and 365'));
        return;
      }

      const trend = await journalService.getMoodTrend(userId, days);
      res.json(successResponse(trend, 'Mood trend retrieved successfully'));
    } catch (error) {
      console.error('Error getting mood trend:', error);
      res.status(500).json(errorResponse('Failed to retrieve mood trend'));
    }
  }
}

export const journalController = new JournalController();