import { aiInsightService } from '../../src/services/aiInsightService';
import { journalService } from '../../src/services/journalService';
import { habitService } from '../../src/services/habitService';
import { habitEventService } from '../../src/services/habitEventService';
import { prisma } from '../setup';

// Jest globals
declare global {
  var describe: (name: string, fn: () => void) => void;
  var it: (name: string, fn: () => void | Promise<void>) => void;
  var expect: any;
  var beforeEach: (fn: () => void | Promise<void>) => void;
}

describe('AI Insights Workflow Integration', () => {
  let testUser: any;

  beforeEach(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        firebaseUid: `test-${Date.now()}-${Math.random()}`,
        email: `test-${Date.now()}@example.com`,
        displayName: 'Test User',
        coachStyle: 'SUPPORTIVE',
      }
    });
  });

  it('should complete full AI insights workflow', async () => {
    // 1. Create habit tracking data
    const habit = await habitService.createHabit(testUser.id, {
      title: 'Daily Meditation',
      description: 'Meditate for 10 minutes daily',
      habitType: 'BUILD',
    });

    // 2. Log some habit events over several days
    const dates = [
      new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
      new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday
    ];

    for (const date of dates) {
      await habitEventService.logHabitEvent(testUser.id, habit.id, {
        eventType: 'COMPLETED',
        notes: 'Completed meditation session',
        occurredAt: date,
      });
    }

    // Skip one day to create a realistic pattern
    await habitEventService.logHabitEvent(testUser.id, habit.id, {
      eventType: 'SKIPPED',
      notes: 'Too busy today',
      occurredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    });

    // 3. Create journal entries with varying moods
    const journalEntries = [
      {
        content: 'Great meditation session today! Feeling centered and focused.',
        moodRating: 9,
        createdAt: new Date(),
      },
      {
        content: 'Struggling to focus during meditation, but I completed it.',
        moodRating: 6,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        content: 'Skipped meditation again. Feeling overwhelmed with work.',
        moodRating: 4,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        content: 'Back on track with meditation. It really helps my anxiety.',
        moodRating: 8,
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        content: 'Meditation was peaceful today. Grateful for this practice.',
        moodRating: 9,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const entryData of journalEntries) {
      await journalService.createEntry(testUser.id, entryData);
    }

    // 4. Generate daily insights
    const dailyInsights = await aiInsightService.generateDailyInsights(testUser.id);

    // Verify daily insights were generated
    expect(dailyInsights).toBeDefined();
    expect(Array.isArray(dailyInsights)).toBe(true);
    expect(dailyInsights.length).toBeGreaterThan(0);

    // Check that we have the expected insight types
    const insightTypes = dailyInsights.map(insight => insight.type);
    expect(insightTypes).toContain('daily_tip');

    // Verify insights have proper structure
    dailyInsights.forEach(insight => {
      expect(insight.id).toBeDefined();
      expect(insight.title).toBeDefined();
      expect(insight.content).toBeDefined();
      expect(insight.dataUsed).toBeDefined();
      expect(insight.type).toMatch(/^(daily_tip|pattern_detected)$/);
    });

    // 5. Generate weekly insight
    const weeklyInsight = await aiInsightService.generateWeeklyInsight(testUser.id);

    // Verify weekly insight was generated
    expect(weeklyInsight).toBeDefined();
    expect(weeklyInsight!.type).toBe('weekly_summary');
    expect(weeklyInsight!.title).toBe('Your Week in Review');
    expect(weeklyInsight!.content).toBeDefined();
    expect(weeklyInsight!.expiresAt).toBeDefined();

    // Check that weekly insight includes data summary
    expect(weeklyInsight!.dataUsed).toBeDefined();
    expect(weeklyInsight!.dataUsed.overallStats).toBeDefined();

    // 6. Retrieve all insights for user
    const allInsights = await aiInsightService.getUserInsights(testUser.id);

    // Verify we can retrieve all generated insights
    expect(allInsights.length).toBeGreaterThanOrEqual(dailyInsights.length + 1); // Daily + weekly

    // Check insights are ordered by creation date (newest first)
    for (let i = 1; i < allInsights.length; i++) {
      expect(allInsights[i-1].createdAt >= allInsights[i].createdAt).toBe(true);
    }

    // 7. Test insight filtering
    const dailyTipsOnly = await aiInsightService.getUserInsights(testUser.id, {
      types: ['daily_tip'],
    });

    expect(dailyTipsOnly.every(insight => insight.insightType === 'daily_tip')).toBe(true);

    const weeklyOnly = await aiInsightService.getUserInsights(testUser.id, {
      types: ['weekly_summary'],
    });

    expect(weeklyOnly.every(insight => insight.insightType === 'weekly_summary')).toBe(true);

    // 8. Test marking insights as shown
    const unshownInsights = await aiInsightService.getUserInsights(testUser.id, {
      onlyUnshown: true,
    });

    expect(unshownInsights.every(insight => !insight.wasShown)).toBe(true);

    // Mark first insight as shown
    if (unshownInsights.length > 0) {
      await aiInsightService.markInsightAsShown(testUser.id, unshownInsights[0].id);

      // Verify it's marked as shown
      const afterMarking = await aiInsightService.getUserInsights(testUser.id, {
        onlyUnshown: true,
      });

      expect(afterMarking.length).toBe(unshownInsights.length - 1);
    }

    // 9. Test insight regeneration
    const originalDailyCount = dailyInsights.length;
    
    const regeneratedInsights = await aiInsightService.generateDailyInsights(testUser.id, {
      forceRegeneration: true,
      insightTypes: ['daily_tip'],
    });

    expect(regeneratedInsights).toBeDefined();
    expect(regeneratedInsights.length).toBeGreaterThan(0);
    expect(regeneratedInsights.every(insight => insight.type === 'daily_tip')).toBe(true);

    // 10. Verify data integration across services
    // Check that insights reference actual user data
    const patternInsight = dailyInsights.find(insight => insight.type === 'pattern_detected');
    if (patternInsight) {
      expect(patternInsight.dataUsed.entriesAnalyzed).toBeGreaterThan(0);
      expect(patternInsight.dataUsed.moodDaysAnalyzed).toBeGreaterThan(0);
    }

    // Check that weekly insight includes habit data
    if (weeklyInsight!.dataUsed.habitsCount) {
      expect(weeklyInsight!.dataUsed.habitsCount).toBeGreaterThan(0);
    }

    // 11. Test edge case: Insights for user with no recent activity
    const inactiveUser = await prisma.user.create({
      data: {
        firebaseUid: `inactive-${Date.now()}`,
        email: `inactive-${Date.now()}@example.com`,
        displayName: 'Inactive User',
      }
    });

    const inactiveInsights = await aiInsightService.generateDailyInsights(inactiveUser.id);
    
    // Should still generate basic insights even without data
    expect(inactiveInsights).toBeDefined();
    expect(Array.isArray(inactiveInsights)).toBe(true);

    const inactiveWeekly = await aiInsightService.generateWeeklyInsight(inactiveUser.id);
    
    // Weekly insight might be null for users with no data
    expect(inactiveWeekly === null || inactiveWeekly.type === 'weekly_summary').toBe(true);

    // 12. Verify database consistency
    const storedInsights = await prisma.aIInsight.findMany({
      where: { userId: testUser.id },
    });

    expect(storedInsights.length).toBeGreaterThan(0);
    
    // All insights should have required fields
    storedInsights.forEach(insight => {
      expect(insight.id).toBeDefined();
      expect(insight.userId).toBe(testUser.id);
      expect(insight.title).toBeDefined();
      expect(insight.content).toBeDefined();
      expect(insight.insightType).toMatch(/^(daily_tip|pattern_detected|weekly_summary)$/);
      expect(insight.createdAt).toBeDefined();
    });
  });

  it('should handle coaching style preferences in insights', async () => {
    // Test different coaching styles
    const coachStyles = ['SUPPORTIVE', 'DIRECT', 'MOTIVATIONAL'];

    for (const style of coachStyles) {
      const user = await prisma.user.create({
        data: {
          firebaseUid: `coach-test-${style}-${Date.now()}`,
          email: `coach-test-${style}@example.com`,
          displayName: `Test User ${style}`,
          coachStyle: style as any,
        }
      });

      // Add some basic data
      await journalService.createEntry(user.id, {
        content: 'Test journal entry for coaching style',
        moodRating: 6,
      });

      const insights = await aiInsightService.generateDailyInsights(user.id);

      expect(insights).toBeDefined();
      expect(insights.length).toBeGreaterThan(0);

      // Check that coaching style is included in data used
      const dailyTip = insights.find(insight => insight.type === 'daily_tip');
      if (dailyTip) {
        expect(dailyTip.dataUsed.coachStyle).toBe(style.toLowerCase());
      }
    }
  });
});