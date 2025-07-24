import { journalService } from '../../src/services/journalService';
import { prisma, createTestUser } from '../setup';
import { CreateJournalEntryData, UpdateJournalEntryData, JournalFilters } from '../../src/types';

// Jest globals
declare global {
  var describe: (name: string, fn: () => void) => void;
  var it: (name: string, fn: () => void | Promise<void>) => void;
  var expect: any;
  var beforeEach: (fn: () => void | Promise<void>) => void;
}

describe('JournalService', () => {
  let testUser: any;

  beforeEach(async () => {
    testUser = await createTestUser();
  });

  describe('createEntry', () => {
    it('should create a journal entry successfully', async () => {
      const entryData: CreateJournalEntryData = {
        title: 'Test Entry',
        content: 'This is a test journal entry',
        moodRating: 8,
      };

      const entry = await journalService.createEntry(testUser.id, entryData);

      expect(entry).toBeDefined();
      expect(entry.title).toBe(entryData.title);
      expect(entry.content).toBe(entryData.content);
      expect(entry.moodRating).toBe(entryData.moodRating);
      expect(entry.userId).toBe(testUser.id);
    });

    it('should create entry without title and mood rating', async () => {
      const entryData: CreateJournalEntryData = {
        content: 'Entry without extras',
      };

      const entry = await journalService.createEntry(testUser.id, entryData);

      expect(entry).toBeDefined();
      expect(entry.title).toBeNull();
      expect(entry.content).toBe(entryData.content);
      expect(entry.moodRating).toBeNull();
      expect(entry.userId).toBe(testUser.id);
    });

    it('should update daily stats when mood rating is provided', async () => {
      const entryData: CreateJournalEntryData = {
        content: 'Entry with mood',
        moodRating: 7,
      };

      await journalService.createEntry(testUser.id, entryData);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dailyStats = await prisma.dailyStats.findFirst({
        where: {
          userId: testUser.id,
          date: today,
        },
      });

      expect(dailyStats).toBeDefined();
      expect(dailyStats!.journalEntries).toBe(1);
      expect(dailyStats!.avgMood).toBe(7);
    });
  });

  describe('getEntries', () => {
    beforeEach(async () => {
      // Create test entries one by one to avoid foreign key issues
      await prisma.journalEntry.create({
        data: {
          userId: testUser.id,
          title: 'First Entry',
          content: 'First entry content',
          moodRating: 7,
          createdAt: new Date('2024-01-01'),
        }
      });
      
      await prisma.journalEntry.create({
        data: {
          userId: testUser.id,
          title: 'Second Entry',
          content: 'Second entry content',
          moodRating: 5,
          createdAt: new Date('2024-01-02'),
        }
      });
      
      await prisma.journalEntry.create({
        data: {
          userId: testUser.id,
          content: 'Third entry without title',
          moodRating: 9,
          createdAt: new Date('2024-01-03'),
        }
      });
    });

    it('should retrieve all entries for user', async () => {
      const entries = await journalService.getEntries(testUser.id);

      expect(entries).toHaveLength(3);
      // Should be ordered by createdAt desc
      expect(entries[0].content).toBe('Third entry without title');
      expect(entries[1].content).toBe('Second entry content');
      expect(entries[2].content).toBe('First entry content');
    });

    it('should apply date filters correctly', async () => {
      const filters: JournalFilters = {
        startDate: '2024-01-01',
        endDate: '2024-01-02',
      };

      const entries = await journalService.getEntries(testUser.id, filters);

      expect(entries).toHaveLength(2);
      expect(entries.every(entry => 
        entry.createdAt >= new Date('2024-01-01') &&
        entry.createdAt <= new Date('2024-01-02')
      )).toBe(true);
    });

    it('should apply mood rating filters correctly', async () => {
      const filters: JournalFilters = {
        minMoodRating: 6,
        maxMoodRating: 8,
      };

      const entries = await journalService.getEntries(testUser.id, filters);

      expect(entries).toHaveLength(1);
      expect(entries[0].moodRating).toBe(7);
    });

    it('should apply search filters correctly', async () => {
      const filters: JournalFilters = {
        search: 'Second',
      };

      const entries = await journalService.getEntries(testUser.id, filters);

      expect(entries).toHaveLength(1);
      expect(entries[0].title).toBe('Second Entry');
    });

    it('should apply pagination correctly', async () => {
      const filters: JournalFilters = {
        limit: 2,
        offset: 1,
      };

      const entries = await journalService.getEntries(testUser.id, filters);

      expect(entries).toHaveLength(2);
    });
  });

  describe('getEntryById', () => {
    let testEntryId: string;

    beforeEach(async () => {
      const entry = await prisma.journalEntry.create({
        data: {
          userId: testUser.id,
          title: 'Test Entry',
          content: 'Test content',
          moodRating: 7,
        },
      });
      testEntryId = entry.id;
    });

    it('should retrieve entry by ID', async () => {
      const entry = await journalService.getEntryById(testUser.id, testEntryId);

      expect(entry).toBeDefined();
      expect(entry!.id).toBe(testEntryId);
      expect(entry!.title).toBe('Test Entry');
    });

    it('should return null if entry not found', async () => {
      const entry = await journalService.getEntryById(testUser.id, '00000000-0000-0000-0000-000000000000');

      expect(entry).toBeNull();
    });

    it('should return null if entry belongs to different user', async () => {
      const otherUser = await createTestUser();
      const entry = await journalService.getEntryById(otherUser.id, testEntryId);

      expect(entry).toBeNull();
    });
  });

  describe('updateEntry', () => {
    let testEntryId: string;

    beforeEach(async () => {
      const entry = await prisma.journalEntry.create({
        data: {
          userId: testUser.id,
          title: 'Original Title',
          content: 'Original content',
          moodRating: 5,
        },
      });
      testEntryId = entry.id;
    });

    it('should update entry successfully', async () => {
      const updateData: UpdateJournalEntryData = {
        title: 'Updated Title',
        content: 'Updated content',
        moodRating: 8,
      };

      const updatedEntry = await journalService.updateEntry(testUser.id, testEntryId, updateData);

      expect(updatedEntry).toBeDefined();
      expect(updatedEntry!.title).toBe(updateData.title);
      expect(updatedEntry!.content).toBe(updateData.content);
      expect(updatedEntry!.moodRating).toBe(updateData.moodRating);
    });

    it('should update partial fields', async () => {
      const updateData: UpdateJournalEntryData = {
        moodRating: 9,
      };

      const updatedEntry = await journalService.updateEntry(testUser.id, testEntryId, updateData);

      expect(updatedEntry).toBeDefined();
      expect(updatedEntry!.title).toBe('Original Title'); // Unchanged
      expect(updatedEntry!.content).toBe('Original content'); // Unchanged
      expect(updatedEntry!.moodRating).toBe(9); // Updated
    });

    it('should return null if entry not found', async () => {
      const result = await journalService.updateEntry(testUser.id, '00000000-0000-0000-0000-000000000000', {
        content: 'Updated content',
      });

      expect(result).toBeNull();
    });
  });

  describe('deleteEntry', () => {
    let testEntryId: string;

    beforeEach(async () => {
      const entry = await prisma.journalEntry.create({
        data: {
          userId: testUser.id,
          content: 'Entry to delete',
          moodRating: 7,
        },
      });
      testEntryId = entry.id;
    });

    it('should delete entry successfully', async () => {
      const result = await journalService.deleteEntry(testUser.id, testEntryId);

      expect(result).toBe(true);

      // Verify entry is deleted
      const deletedEntry = await prisma.journalEntry.findUnique({
        where: { id: testEntryId },
      });
      expect(deletedEntry).toBeNull();
    });

    it('should return false if entry not found', async () => {
      const result = await journalService.deleteEntry(testUser.id, '00000000-0000-0000-0000-000000000000');

      expect(result).toBe(false);
    });
  });

  describe('getEntriesByDate', () => {
    beforeEach(async () => {
      await prisma.journalEntry.create({
        data: {
          userId: testUser.id,
          content: 'Entry from Jan 1',
          createdAt: new Date('2024-01-01T10:00:00Z'),
        }
      });
      
      await prisma.journalEntry.create({
        data: {
          userId: testUser.id,
          content: 'Another entry from Jan 1',
          createdAt: new Date('2024-01-01T15:00:00Z'),
        }
      });
      
      await prisma.journalEntry.create({
        data: {
          userId: testUser.id,
          content: 'Entry from Jan 2',
          createdAt: new Date('2024-01-02T10:00:00Z'),
        }
      });
    });

    it('should retrieve entries for specific date', async () => {
      const entries = await journalService.getEntriesByDate(testUser.id, new Date('2024-01-01'));

      expect(entries).toHaveLength(2);
      expect(entries.every(entry => 
        entry.createdAt.toDateString() === new Date('2024-01-01').toDateString()
      )).toBe(true);
    });

    it('should return empty array for date with no entries', async () => {
      const entries = await journalService.getEntriesByDate(testUser.id, new Date('2024-12-31'));

      expect(entries).toHaveLength(0);
    });
  });

  describe('getMoodTrend', () => {
    beforeEach(async () => {
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

      await prisma.journalEntry.create({
        data: {
          userId: testUser.id,
          content: 'Happy day',
          moodRating: 8,
          createdAt: twoDaysAgo,
        }
      });
      
      await prisma.journalEntry.create({
        data: {
          userId: testUser.id,
          content: 'Another happy day',
          moodRating: 9,
          createdAt: twoDaysAgo,
        }
      });
      
      await prisma.journalEntry.create({
        data: {
          userId: testUser.id,
          content: 'Okay day',
          moodRating: 6,
          createdAt: yesterday,
        }
      });
    });

    it('should calculate mood trend correctly', async () => {
      const trend = await journalService.getMoodTrend(testUser.id, 7);

      expect(trend).toHaveLength(7);
      
      // Check that we have the expected mood averages
      const dayWithMultipleEntries = trend.find(day => day.avgMood === 8.5);
      const dayWithSingleEntry = trend.find(day => day.avgMood === 6);
      
      expect(dayWithMultipleEntries).toBeDefined(); // Average of 8 and 9
      expect(dayWithSingleEntry).toBeDefined();
    });

    it('should handle empty results', async () => {
      // Create a user with no mood entries
      const emptyUser = await createTestUser();
      const trend = await journalService.getMoodTrend(emptyUser.id, 7);

      expect(trend).toHaveLength(7);
      expect(trend.every(day => day.avgMood === null)).toBe(true);
    });

    it('should respect the days parameter', async () => {
      const trend = await journalService.getMoodTrend(testUser.id, 3);

      expect(trend).toHaveLength(3);
    });
  });
});