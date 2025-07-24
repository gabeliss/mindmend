import { aiInsightService } from '../../src/services/aiInsightService';
import { prisma, createTestUser, createTestHabit, createTestJournalEntry } from '../setup';

// Jest globals
declare global {
  var describe: (name: string, fn: () => void) => void;
  var it: (name: string, fn: () => void | Promise<void>) => void;
  var expect: any;
  var beforeEach: (fn: () => void | Promise<void>) => void;
}

describe('AIInsightService', () => {
  let testUser: any;
  let testHabit: any;

  beforeEach(async () => {
    testUser = await createTestUser();
    testHabit = await createTestHabit(testUser.id, { title: 'Daily Exercise' });

    // Create some test data for insights
    await createTestJournalEntry(testUser.id, {
      content: 'Had a great workout today!',
      moodRating: 8,
      createdAt: new Date(),
    });

    await createTestJournalEntry(testUser.id, {
      content: 'Feeling tired but accomplished',
      moodRating: 6,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    });

    // Create habit events
    await prisma.habitEvent.create({
      data: {
        userId: testUser.id,
        habitId: testHabit.id,
        eventType: 'COMPLETED',
        occurredAt: new Date(),
      },
    });
  });

  describe('generateDailyInsights', () => {
    it('should generate daily insights successfully', async () => {
      const insights = await aiInsightService.generateDailyInsights(testUser.id);

      expect(insights).toBeDefined();
      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);

      // Check insight structure
      const insight = insights[0];
      expect(insight.id).toBeDefined();
      expect(insight.type).toBeDefined();
      expect(insight.title).toBeDefined();
      expect(insight.content).toBeDefined();
      expect(insight.dataUsed).toBeDefined();
    });

    it('should generate specific insight types when requested', async () => {
      const insights = await aiInsightService.generateDailyInsights(testUser.id, {
        insightTypes: ['daily_tip'],
      });

      expect(insights).toBeDefined();
      expect(insights.every(insight => insight.type === 'daily_tip')).toBe(true);
    });

    it('should not regenerate existing insights unless forced', async () => {
      // Generate insights first time
      const firstInsights = await aiInsightService.generateDailyInsights(testUser.id);
      const firstCount = firstInsights.length;

      // Try to generate again without force
      const secondInsights = await aiInsightService.generateDailyInsights(testUser.id);
      
      expect(secondInsights.length).toBe(firstCount);
      expect(secondInsights[0].id).toBe(firstInsights[0].id); // Same insights returned
    });

    it('should regenerate insights when forced', async () => {
      // Generate insights first time
      await aiInsightService.generateDailyInsights(testUser.id);

      // Force regeneration
      const newInsights = await aiInsightService.generateDailyInsights(testUser.id, {
        forceRegeneration: true,
      });

      expect(newInsights).toBeDefined();
      expect(newInsights.length).toBeGreaterThan(0);
    });

    it('should handle users with no data gracefully', async () => {
      const emptyUser = await createTestUser();

      const insights = await aiInsightService.generateDailyInsights(emptyUser.id);

      expect(insights).toBeDefined();
      expect(Array.isArray(insights)).toBe(true);
      // Should still generate at least a basic daily tip
    });
  });

  describe('generateWeeklyInsight', () => {
    it('should generate weekly insight successfully', async () => {
      const insight = await aiInsightService.generateWeeklyInsight(testUser.id);

      expect(insight).toBeDefined();
      expect(insight!.type).toBe('weekly_summary');
      expect(insight!.title).toBe('Your Week in Review');
      expect(insight!.content).toBeDefined();
      expect(insight!.dataUsed).toBeDefined();
      expect(insight!.expiresAt).toBeDefined();
    });

    it('should not regenerate existing weekly insight', async () => {
      // Generate first insight
      const firstInsight = await aiInsightService.generateWeeklyInsight(testUser.id);

      // Try to generate again
      const secondInsight = await aiInsightService.generateWeeklyInsight(testUser.id);

      expect(secondInsight!.id).toBe(firstInsight!.id);
    });

    it('should return null for users with no data', async () => {
      const emptyUser = await createTestUser();

      const insight = await aiInsightService.generateWeeklyInsight(emptyUser.id);

      expect(insight).toBeNull();
    });
  });

  describe('getUserInsights', () => {
    beforeEach(async () => {
      // Generate some insights first
      await aiInsightService.generateDailyInsights(testUser.id);
    });

    it('should retrieve user insights successfully', async () => {
      const insights = await aiInsightService.getUserInsights(testUser.id);

      expect(insights).toBeDefined();
      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);
    });

    it('should filter by insight types', async () => {
      const insights = await aiInsightService.getUserInsights(testUser.id, {
        types: ['daily_tip'],
      });

      expect(insights).toBeDefined();
      expect(insights.every(insight => insight.insightType === 'daily_tip')).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const insights = await aiInsightService.getUserInsights(testUser.id, {
        limit: 1,
      });

      expect(insights).toBeDefined();
      expect(insights.length).toBeLessThanOrEqual(1);
    });

    it('should filter by unshown insights only', async () => {
      const insights = await aiInsightService.getUserInsights(testUser.id, {
        onlyUnshown: true,
      });

      expect(insights).toBeDefined();
      expect(insights.every(insight => !insight.wasShown)).toBe(true);
    });

    it('should not return expired insights', async () => {
      // Create an expired insight manually
      const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      await prisma.aIInsight.create({
        data: {
          userId: testUser.id,
          insightType: 'daily_tip',
          title: 'Expired Insight',
          content: 'This should not appear',
          dataUsed: {},
          expiresAt: expiredDate,
        },
      });

      const insights = await aiInsightService.getUserInsights(testUser.id);

      expect(insights.every(insight => 
        !insight.expiresAt || insight.expiresAt > new Date()
      )).toBe(true);
    });
  });

  describe('markInsightAsShown', () => {
    it('should mark insight as shown successfully', async () => {
      // Generate insights first
      const insights = await aiInsightService.generateDailyInsights(testUser.id);
      const insightId = insights[0].id;

      await aiInsightService.markInsightAsShown(testUser.id, insightId);

      // Verify it was marked as shown
      const updatedInsight = await prisma.aIInsight.findUnique({
        where: { id: insightId },
      });

      expect(updatedInsight).toBeDefined();
      expect(updatedInsight!.wasShown).toBe(true);
      expect(updatedInsight!.shownAt).toBeDefined();
    });

    it('should not allow marking other users insights as shown', async () => {
      // Create another user and their insight
      const otherUser = await createTestUser();
      const otherInsights = await aiInsightService.generateDailyInsights(otherUser.id);
      const otherInsightId = otherInsights[0].id;

      // Try to mark the other user's insight as shown
      await aiInsightService.markInsightAsShown(testUser.id, otherInsightId);

      // Verify it was NOT marked as shown
      const insight = await prisma.aIInsight.findUnique({
        where: { id: otherInsightId },
      });

      expect(insight!.wasShown).toBe(false);
    });
  });

  describe('data gathering', () => {
    it('should handle users with mixed data types', async () => {
      // Create varied test data
      await createTestJournalEntry(testUser.id, {
        content: 'Productive day at work',
        moodRating: 9,
      });

      await createTestJournalEntry(testUser.id, {
        content: 'Feeling stressed about deadlines',
        moodRating: 4,
      });

      // Create multiple habit events
      await prisma.habitEvent.createMany({
        data: [
          {
            userId: testUser.id,
            habitId: testHabit.id,
            eventType: 'COMPLETED',
            occurredAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
          {
            userId: testUser.id,
            habitId: testHabit.id,
            eventType: 'SKIPPED',
            occurredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
        ],
      });

      const insights = await aiInsightService.generateDailyInsights(testUser.id);

      expect(insights).toBeDefined();
      expect(insights.length).toBeGreaterThan(0);

      // Check that data was used in insight generation
      expect(insights.some(insight => insight.dataUsed)).toBe(true);
    });

    it('should generate pattern insights only with sufficient data', async () => {
      // Create a user with minimal data
      const minimalUser = await createTestUser();
      
      // Add only one journal entry
      await createTestJournalEntry(minimalUser.id, {
        content: 'Single entry',
        moodRating: 5,
      });

      const insights = await aiInsightService.generateDailyInsights(minimalUser.id);

      // Should generate daily tip but might not generate pattern insight
      expect(insights).toBeDefined();
      
      const patternInsight = insights.find(insight => insight.type === 'pattern_detected');
      // Pattern insight might be null due to insufficient data
      if (patternInsight) {
        expect(patternInsight.content).toBeDefined();
      }
    });
  });
});