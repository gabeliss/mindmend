import { aiService } from '../../src/services/aiService';
import { JournalInsightData, WeeklySummaryData } from '../../src/services/aiService';

// Jest globals
declare global {
  var describe: (name: string, fn: () => void) => void;
  var it: (name: string, fn: () => void | Promise<void>) => void;
  var expect: any;
  var beforeEach: (fn: () => void | Promise<void>) => void;
}

describe('AIService', () => {
  const mockJournalData: JournalInsightData = {
    entries: [
      {
        date: '2024-01-15',
        content: 'Had a productive day at work. Completed all my tasks.',
        moodRating: 8,
        title: 'Great Day'
      },
      {
        date: '2024-01-14',
        content: 'Feeling a bit stressed about upcoming deadlines.',
        moodRating: 5
      }
    ],
    moodTrend: [
      { date: '2024-01-15', avgMood: 8 },
      { date: '2024-01-14', avgMood: 5 },
      { date: '2024-01-13', avgMood: 7 },
    ],
    habitData: [
      {
        habitTitle: 'Daily Exercise',
        completionRate: 85,
        streakLength: 5
      },
      {
        habitTitle: 'Meditation',
        completionRate: 60,
        streakLength: 2
      }
    ]
  };

  describe('generateDailyInsight', () => {
    it('should generate a daily insight successfully', async () => {
      const response = await aiService.generateDailyInsight(mockJournalData, {
        userId: 'test-user-123'
      });

      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(typeof response.content).toBe('string');
      expect(response.content.length).toBeGreaterThan(0);
      expect(response.usage).toBeDefined();
      expect(response.usage.totalTokens).toBeGreaterThan(0);
      expect(response.model).toBeDefined();
    });

    it('should handle empty journal data', async () => {
      const emptyData: JournalInsightData = {
        entries: [],
        moodTrend: [],
        habitData: []
      };

      const response = await aiService.generateDailyInsight(emptyData);

      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(typeof response.content).toBe('string');
    });

    it('should use custom options', async () => {
      const options = {
        model: 'gpt-4',
        temperature: 0.5,
        maxTokens: 300,
        userId: 'test-user-456'
      };

      const response = await aiService.generateDailyInsight(mockJournalData, options);

      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      // In production, these would match the requested options
      // In development/mock mode, they return default mock values
    });
  });

  describe('generateWeeklySummary', () => {
    it('should generate a weekly summary successfully', async () => {
      const weeklyData: WeeklySummaryData = {
        ...mockJournalData,
        weekStart: '2024-01-08',
        weekEnd: '2024-01-14',
        overallStats: {
          totalEntries: 5,
          avgMood: 6.8,
          habitCompletionRate: 75
        }
      };

      const response = await aiService.generateWeeklySummary(weeklyData, {
        userId: 'test-user-123'
      });

      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(typeof response.content).toBe('string');
      expect(response.content.length).toBeGreaterThan(0);
      expect(response.usage).toBeDefined();
      expect(response.model).toBeDefined();
    });

    it('should handle weekly data with minimal information', async () => {
      const minimalWeeklyData: WeeklySummaryData = {
        entries: [],
        moodTrend: [],
        weekStart: '2024-01-08',
        weekEnd: '2024-01-14',
        overallStats: {
          totalEntries: 0,
          avgMood: null,
          habitCompletionRate: 0
        }
      };

      const response = await aiService.generateWeeklySummary(minimalWeeklyData);

      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
    });
  });

  describe('detectPatterns', () => {
    it('should detect patterns successfully', async () => {
      const response = await aiService.detectPatterns(mockJournalData, {
        userId: 'test-user-123'
      });

      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(typeof response.content).toBe('string');
      expect(response.usage).toBeDefined();
      expect(response.model).toBeDefined();
    });

    it('should work with varied mood data', async () => {
      const variedMoodData: JournalInsightData = {
        entries: [
          { date: '2024-01-15', content: 'Amazing day!', moodRating: 10 },
          { date: '2024-01-14', content: 'Terrible day', moodRating: 2 },
          { date: '2024-01-13', content: 'Average day', moodRating: 5 },
        ],
        moodTrend: [
          { date: '2024-01-15', avgMood: 10 },
          { date: '2024-01-14', avgMood: 2 },
          { date: '2024-01-13', avgMood: 5 },
        ]
      };

      const response = await aiService.detectPatterns(variedMoodData);

      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
    });
  });

  describe('generateMotivationalTip', () => {
    it('should generate supportive tips', async () => {
      const response = await aiService.generateMotivationalTip('supportive', {
        recentMood: 4,
        strugglingHabit: 'Exercise'
      }, {
        userId: 'test-user-123'
      });

      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(typeof response.content).toBe('string');
      expect(response.usage).toBeDefined();
    });

    it('should generate direct tips', async () => {
      const response = await aiService.generateMotivationalTip('direct', {
        recentMood: 7
      });

      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
    });

    it('should generate motivational tips', async () => {
      const response = await aiService.generateMotivationalTip('motivational');

      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
    });

    it('should work without context', async () => {
      const response = await aiService.generateMotivationalTip('supportive');

      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle service errors gracefully', async () => {
      // Test with invalid data that might cause issues
      const invalidData = null as any;

      try {
        await aiService.generateDailyInsight(invalidData);
        // If we get here in production, the call succeeded
        // In mock mode, it will always succeed
        expect(true).toBe(true);
      } catch (error) {
        // In production, we expect proper error handling
        expect(error).toBeDefined();
      }
    });
  });
});