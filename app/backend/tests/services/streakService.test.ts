import { StreakService } from '../../src/services/streakService';
import { prisma, createTestUser, createTestHabit, createTestHabitEvent } from '../setup';

// Jest globals
declare global {
  var describe: (name: string, fn: () => void) => void;
  var it: (name: string, fn: () => void | Promise<void>) => void;
  var expect: any;
  var beforeEach: (fn: () => void | Promise<void>) => void;
}

describe('StreakService', () => {
  let testUser: any;
  let testHabit: any;

  beforeEach(async () => {
    testUser = await createTestUser();
    testHabit = await createTestHabit(testUser.id);
  });

  describe('calculateHabitStreak', () => {
    it('should return zero streak for habit with no events', async () => {
      const streak = await StreakService.calculateHabitStreak(testHabit.id, testUser.id);
      
      expect(streak.currentStreak).toBe(0);
      expect(streak.longestStreak).toBe(0);
      expect(streak.lastEventDate).toBeNull();
      expect(streak.streakType).toBe('new');
    });

    it('should calculate current streak correctly', async () => {
      // Create events for the last 3 days
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      await createTestHabitEvent(testUser.id, testHabit.id, {
        eventType: 'COMPLETED',
        occurredAt: today,
        notes: 'Today'
      });
      await createTestHabitEvent(testUser.id, testHabit.id, {
        eventType: 'COMPLETED',
        occurredAt: yesterday,
        notes: 'Yesterday'
      });
      await createTestHabitEvent(testUser.id, testHabit.id, {
        eventType: 'COMPLETED',
        occurredAt: twoDaysAgo,
        notes: 'Two days ago'
      });

      const streak = await StreakService.calculateHabitStreak(testHabit.id, testUser.id);
      expect(streak.currentStreak).toBe(3);
      expect(streak.longestStreak).toBe(3);
      expect(streak.streakType).toBe('current');
    });

    it('should break streak on skipped day', async () => {
      // Create events with a gap
      const today = new Date();
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      await createTestHabitEvent(testUser.id, testHabit.id, {
        eventType: 'COMPLETED',
        occurredAt: today,
        notes: 'Today'
      });
      await createTestHabitEvent(testUser.id, testHabit.id, {
        eventType: 'COMPLETED',
        occurredAt: threeDaysAgo,
        notes: 'Three days ago'
      });

      const streak = await StreakService.calculateHabitStreak(testHabit.id, testUser.id);
      expect(streak.currentStreak).toBe(1); // Only today counts
      expect(streak.longestStreak).toBe(1);
    });
  });

  describe('calculateUserStreaks', () => {
    it('should return summary for user with no habits', async () => {
      const summary = await StreakService.calculateUserStreaks(testUser.id);
      
      expect(summary.totalActiveHabits).toBe(0);
      expect(summary.habitsWithStreaks).toBe(0);
      expect(summary.averageStreak).toBe(0);
      expect(summary.totalCompletions).toBe(0);
      expect(summary.streakBreaks).toBe(0);
      expect(summary.habitStreaks).toHaveLength(0);
    });

    it('should return summary for user with habits', async () => {
      const habit2 = await createTestHabit(testUser.id, { title: 'Habit 2' });

      // Add some events to both habits
      await createTestHabitEvent(testUser.id, testHabit.id, {
        eventType: 'COMPLETED',
        occurredAt: new Date(),
        notes: 'Today'
      });
      await createTestHabitEvent(testUser.id, habit2.id, {
        eventType: 'COMPLETED',
        occurredAt: new Date(),
        notes: 'Today'
      });

      const summary = await StreakService.calculateUserStreaks(testUser.id);
      expect(summary.totalActiveHabits).toBe(2);
      expect(summary.habitStreaks).toHaveLength(2);
    });
  });

  describe('getStreakHistory', () => {
    it('should return empty array for habit with no events', async () => {
      const history = await StreakService.getStreakHistory(testHabit.id, testUser.id);
      expect(history).toHaveLength(0);
    });

    it('should return streak history', async () => {
      // Create events to form a streak
      const dates = [
        new Date('2024-01-01'),
        new Date('2024-01-02'),
        new Date('2024-01-03')
      ];

      for (const date of dates) {
        await createTestHabitEvent(testUser.id, testHabit.id, {
          eventType: 'COMPLETED',
          occurredAt: date,
          notes: `Event on ${date.toISOString().split('T')[0]}`
        });
      }

      const history = await StreakService.getStreakHistory(testHabit.id, testUser.id);
      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('getStreakLeaderboard', () => {
    it('should return empty array for user with no habits', async () => {
      const leaderboard = await StreakService.getStreakLeaderboard(testUser.id);
      expect(leaderboard).toHaveLength(0);
    });

    it('should return leaderboard for user with habits', async () => {
      const habit2 = await createTestHabit(testUser.id, { title: 'Habit 2' });

      // Add events to create different streaks
      await createTestHabitEvent(testUser.id, testHabit.id, {
        eventType: 'COMPLETED',
        occurredAt: new Date(),
        notes: 'Today'
      });
      await createTestHabitEvent(testUser.id, habit2.id, {
        eventType: 'COMPLETED',
        occurredAt: new Date(),
        notes: 'Today'
      });

      const leaderboard = await StreakService.getStreakLeaderboard(testUser.id);
      expect(leaderboard.length).toBeGreaterThan(0);
    });
  });
}); 