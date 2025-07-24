import { HabitService } from '../../src/services/habitService';
import { HabitEventService } from '../../src/services/habitEventService';
import { StreakService } from '../../src/services/streakService';
import { prisma } from '../setup';

// Jest globals
declare global {
  var describe: (name: string, fn: () => void) => void;
  var it: (name: string, fn: () => void | Promise<void>) => void;
  var expect: any;
  var beforeEach: (fn: () => void | Promise<void>) => void;
}

describe('Basic Habit Workflow Integration', () => {
  let testUser: any;
  let testHabit: any;

  beforeEach(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        firebaseUid: `test-${Date.now()}-${Math.random()}`,
        email: `test-${Date.now()}@example.com`,
        displayName: 'Test User'
      }
    });

    // Create test habit
    testHabit = await prisma.habit.create({
      data: {
        userId: testUser.id,
        title: 'Exercise Daily',
        description: 'Work out for 30 minutes',
        habitType: 'BUILD'
      }
    });
  });

  it('should complete basic habit workflow', async () => {
    // 1. Verify habit was created
    expect(testHabit.title).toBe('Exercise Daily');
    expect(testHabit.habitType).toBe('BUILD');
    expect(testHabit.userId).toBe(testUser.id);

    // 2. Log a habit event
    const eventData = {
      eventType: 'COMPLETED' as const,
      notes: 'Great workout today!',
      occurredAt: new Date()
    };

    const event = await HabitEventService.logEvent(
      testUser.id,
      testHabit.id,
      eventData
    );

    expect(event.eventType).toBe('COMPLETED');
    expect(event.notes).toBe('Great workout today!');
    expect(event.userId).toBe(testUser.id);
    expect(event.habitId).toBe(testHabit.id);

    // 3. Get habit events
    const events = await HabitEventService.getHabitEvents(testUser.id, testHabit.id);
    expect(events.events).toHaveLength(1);
    expect(events.events[0].eventType).toBe('COMPLETED');

    // 4. Calculate streak
    const streak = await StreakService.calculateHabitStreak(testHabit.id, testUser.id);
    expect(streak.currentStreak).toBe(1);
    expect(streak.longestStreak).toBe(1);
    expect(streak.streakType).toBe('current');

    // 5. Get user habits
    const habits = await HabitService.getUserHabits(testUser.id);
    expect(habits).toHaveLength(1);
    expect(habits[0].id).toBe(testHabit.id);

    // 6. Update habit
    const updatedHabit = await HabitService.updateHabit(testHabit.id, testUser.id, {
      title: 'Exercise Daily - Updated',
      description: 'Work out for 45 minutes'
    });
    expect(updatedHabit.title).toBe('Exercise Daily - Updated');
    expect(updatedHabit.description).toBe('Work out for 45 minutes');
  });

  it('should handle multiple events and streak calculation', async () => {
    // Create events for multiple days
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // Log events for 3 consecutive days
    await HabitEventService.logEvent(testUser.id, testHabit.id, {
      eventType: 'COMPLETED',
      occurredAt: today,
      notes: 'Today'
    });

    await HabitEventService.logEvent(testUser.id, testHabit.id, {
      eventType: 'COMPLETED',
      occurredAt: yesterday,
      notes: 'Yesterday'
    });

    await HabitEventService.logEvent(testUser.id, testHabit.id, {
      eventType: 'COMPLETED',
      occurredAt: twoDaysAgo,
      notes: 'Two days ago'
    });

    // Check events
    const events = await HabitEventService.getHabitEvents(testUser.id, testHabit.id);
    expect(events.events).toHaveLength(3);

    // Check streak
    const streak = await StreakService.calculateHabitStreak(testHabit.id, testUser.id);
    expect(streak.currentStreak).toBe(3);
    expect(streak.longestStreak).toBe(3);
  });

  it('should handle user streak summary', async () => {
    // Create a second habit
    const habit2 = await prisma.habit.create({
      data: {
        userId: testUser.id,
        title: 'Read Daily',
        description: 'Read for 20 minutes',
        habitType: 'BUILD'
      }
    });

    // Add events to both habits
    await HabitEventService.logEvent(testUser.id, testHabit.id, {
      eventType: 'COMPLETED',
      occurredAt: new Date(),
      notes: 'Exercise completed'
    });

    await HabitEventService.logEvent(testUser.id, habit2.id, {
      eventType: 'COMPLETED',
      occurredAt: new Date(),
      notes: 'Reading completed'
    });

    // Get user streak summary
    const summary = await StreakService.calculateUserStreaks(testUser.id);
    expect(summary.totalActiveHabits).toBe(2);
    expect(summary.habitStreaks).toHaveLength(2);
  });
}); 