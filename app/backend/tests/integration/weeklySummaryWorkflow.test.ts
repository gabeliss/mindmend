import { weeklySummaryService } from '../../src/services/weeklySummaryService';
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

describe('Weekly Summary Workflow Integration', () => {
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

  it('should complete full weekly summary workflow', async () => {
    // 1. Create comprehensive test data for a week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() - 7); // Last Sunday
    weekStart.setHours(0, 0, 0, 0);

    // Create habits
    const exerciseHabit = await habitService.createHabit(testUser.id, {
      title: 'Daily Exercise',
      description: 'Work out for 30 minutes',
      habitType: 'BUILD',
    });

    const meditationHabit = await habitService.createHabit(testUser.id, {
      title: 'Morning Meditation',
      description: 'Meditate for 10 minutes',
      habitType: 'BUILD',
    });

    // Create habit events throughout the week
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);
      weekDays.push(day);
    }

    // Exercise habit: completed 5/7 days
    for (let i = 0; i < 5; i++) {
      await habitEventService.logHabitEvent(testUser.id, exerciseHabit.id, {
        eventType: 'COMPLETED',
        notes: `Exercise completed on day ${i + 1}`,
        occurredAt: weekDays[i],
      });
    }

    // Meditation habit: completed 6/7 days
    for (let i = 0; i < 6; i++) {
      await habitEventService.logHabitEvent(testUser.id, meditationHabit.id, {
        eventType: 'COMPLETED',
        notes: `Meditation completed on day ${i + 1}`,
        occurredAt: weekDays[i],
      });
    }

    // Create journal entries with varying moods
    const journalEntries = [
      { content: 'Started the week strong with exercise and meditation!', moodRating: 8, day: 0 },
      { content: 'Good momentum continuing from yesterday.', moodRating: 7, day: 1 },
      { content: 'Feeling a bit tired but kept up with habits.', moodRating: 6, day: 2 },
      { content: 'Great workout today, feeling energized!', moodRating: 9, day: 3 },
      { content: 'Skipped exercise but did meditate. Mixed day.', moodRating: 5, day: 4 },
      { content: 'Back on track with both habits. Feeling good.', moodRating: 8, day: 5 },
      { content: 'Reflecting on a good week overall.', moodRating: 7, day: 6 },
    ];

    for (const entry of journalEntries) {
      const entryDate = new Date(weekDays[entry.day]);
      entryDate.setHours(20, 0, 0, 0); // Evening entries

      await journalService.createEntry(testUser.id, {
        content: entry.content,
        moodRating: entry.moodRating,
        createdAt: entryDate,
      });
    }

    // 2. Generate basic weekly summary
    const basicSummary = await weeklySummaryService.generateWeeklySummary(testUser.id, {
      weekOffset: 1, // Last week
    });

    // Verify basic summary structure
    expect(basicSummary).toBeDefined();
    expect(basicSummary.userId).toBe(testUser.id);
    expect(basicSummary.weekStart).toBeDefined();
    expect(basicSummary.weekEnd).toBeDefined();
    expect(basicSummary.aiSummary).toBeDefined();

    // 3. Verify statistics calculation
    expect(basicSummary.statistics).toBeDefined();
    expect(basicSummary.statistics.journalEntries).toBe(7);
    expect(basicSummary.statistics.averageMood).toBeCloseTo(7.1, 1); // Average of moods
    expect(basicSummary.statistics.totalActiveHabits).toBe(2);
    expect(basicSummary.statistics.completionRate).toBeGreaterThan(0);

    // 4. Verify achievements were identified
    expect(basicSummary.achievements).toBeDefined();
    expect(Array.isArray(basicSummary.achievements)).toBe(true);
    
    // Should have consistency achievement for journaling
    const journalAchievement = basicSummary.achievements.find(
      achievement => achievement.type === 'milestone' && achievement.title.includes('Reflection')
    );
    expect(journalAchievement).toBeDefined();

    // 5. Verify insights were generated
    expect(basicSummary.insights).toBeDefined();
    expect(Array.isArray(basicSummary.insights)).toBe(true);
    expect(basicSummary.insights.length).toBeGreaterThan(0);

    // 6. Verify recommendations were provided
    expect(basicSummary.recommendations).toBeDefined();
    expect(Array.isArray(basicSummary.recommendations)).toBe(true);

    // 7. Verify mood analysis
    expect(basicSummary.moodAnalysis).toBeDefined();
    expect(basicSummary.moodAnalysis.averageMood).toBeCloseTo(7.1, 1);
    expect(basicSummary.moodAnalysis.bestDay).toBeDefined();
    expect(basicSummary.moodAnalysis.worstDay).toBeDefined();
    expect(basicSummary.moodAnalysis.moodTrend).toMatch(/improving|declining|stable/);

    // 8. Verify habit analysis
    expect(basicSummary.habitAnalysis).toBeDefined();
    expect(basicSummary.habitAnalysis.totalHabits).toBe(2);
    expect(basicSummary.habitAnalysis.completionRate).toBeGreaterThan(0);
    expect(basicSummary.habitAnalysis.bestPerformingHabit).toBeDefined();

    // 9. Generate enhanced summary with comparison and predictions
    const enhancedSummary = await weeklySummaryService.generateWeeklySummary(testUser.id, {
      weekOffset: 1,
      includeComparison: true,
      includePredictions: true,
      forceRegeneration: true,
    });

    // Verify enhanced features
    expect(enhancedSummary.comparison).toBeDefined();
    expect(enhancedSummary.predictions).toBeDefined();
    expect(enhancedSummary.predictions!.nextWeekMood).toBeDefined();
    expect(enhancedSummary.predictions!.habitRisk).toBeDefined();
    expect(Array.isArray(enhancedSummary.predictions!.habitRisk)).toBe(true);

    // 10. Test retrieval functionality
    const retrievedSummary = await weeklySummaryService.getWeeklySummary(testUser.id, 1);
    expect(retrievedSummary).toBeDefined();
    expect(retrievedSummary!.id).toBe(enhancedSummary.id);

    // 11. Test user summaries listing
    const userSummaries = await weeklySummaryService.getUserWeeklySummaries(testUser.id, 5);
    expect(userSummaries).toBeDefined();
    expect(Array.isArray(userSummaries)).toBe(true);
    expect(userSummaries.length).toBeGreaterThan(0);

    // 12. Verify database storage
    const storedSummary = await prisma.weeklySummary.findFirst({
      where: { userId: testUser.id },
    });

    expect(storedSummary).toBeDefined();
    expect(storedSummary!.userId).toBe(testUser.id);
    expect(storedSummary!.aiSummary).toBeDefined();
    expect(storedSummary!.statistics).toBeDefined();
    expect(storedSummary!.achievements).toBeDefined();

    // 13. Test edge cases
    const futureWeekSummary = await weeklySummaryService.getWeeklySummary(testUser.id, -1);
    expect(futureWeekSummary).toBeNull(); // No data for future weeks
  });

  it('should handle users with minimal data gracefully', async () => {
    // Create user with minimal data
    await journalService.createEntry(testUser.id, {
      content: 'Single journal entry',
      moodRating: 6,
    });

    const summary = await weeklySummaryService.generateWeeklySummary(testUser.id);

    expect(summary).toBeDefined();
    expect(summary.statistics.journalEntries).toBe(1);
    expect(summary.statistics.totalActiveHabits).toBe(0);
    expect(summary.achievements.length).toBeGreaterThanOrEqual(0);
    expect(summary.insights.length).toBeGreaterThanOrEqual(0);
    expect(summary.recommendations.length).toBeGreaterThan(0); // Should suggest improvements
  });

  it('should generate different insights based on performance patterns', async () => {
    // Create high-performing scenario
    const highPerfHabit = await habitService.createHabit(testUser.id, {
      title: 'High Performance Habit',
      habitType: 'BUILD',
    });

    // Complete habit every day for a week
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      await habitEventService.logHabitEvent(testUser.id, highPerfHabit.id, {
        eventType: 'COMPLETED',
        occurredAt: date,
      });

      await journalService.createEntry(testUser.id, {
        content: `Great day ${i + 1}!`,
        moodRating: 8 + Math.random(), // High mood
        createdAt: date,
      });
    }

    const highPerfSummary = await weeklySummaryService.generateWeeklySummary(testUser.id);

    expect(highPerfSummary.statistics.completionRate).toBeGreaterThan(95);
    expect(highPerfSummary.achievements.length).toBeGreaterThan(0);
    
    // Should have positive insights
    const positiveInsight = highPerfSummary.insights.find(
      insight => insight.type === 'improvement' || insight.type === 'pattern'
    );
    expect(positiveInsight).toBeDefined();
  });

  it('should provide appropriate recommendations based on performance', async () => {
    // Create struggling scenario
    const strugglingHabit = await habitService.createHabit(testUser.id, {
      title: 'Struggling Habit',
      habitType: 'BUILD',
    });

    // Complete habit only 2 out of 7 days
    for (let i = 0; i < 2; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i * 3); // Spread out
      
      await habitEventService.logHabitEvent(testUser.id, strugglingHabit.id, {
        eventType: 'COMPLETED',
        occurredAt: date,
      });
    }

    // Add few journal entries with lower mood
    for (let i = 0; i < 3; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i * 2);
      
      await journalService.createEntry(testUser.id, {
        content: `Struggling day ${i + 1}`,
        moodRating: 4 + Math.random(), // Lower mood
        createdAt: date,
      });
    }

    const strugglingSummary = await weeklySummaryService.generateWeeklySummary(testUser.id);

    expect(strugglingSummary.statistics.completionRate).toBeLessThan(50);
    
    // Should have recommendations for improvement
    const habitRecommendation = strugglingSummary.recommendations.find(
      rec => rec.category === 'habit' && rec.priority === 'high'
    );
    expect(habitRecommendation).toBeDefined();
    
    // Should suggest mood support
    const moodRecommendation = strugglingSummary.recommendations.find(
      rec => rec.category === 'mood'
    );
    expect(moodRecommendation).toBeDefined();
  });
});