import { HabitEventService } from '../../src/services/habitEventService';
import { prisma, createTestUser, createTestHabit, createTestHabitEvent } from '../setup';

// Jest globals
declare global {
  var describe: (name: string, fn: () => void) => void;
  var it: (name: string, fn: () => void | Promise<void>) => void;
  var expect: any;
  var beforeEach: (fn: () => void | Promise<void>) => void;
}

describe('HabitEventService', () => {
  let testUser: any;
  let testHabit: any;

  beforeEach(async () => {
    testUser = await createTestUser();
    testHabit = await createTestHabit(testUser.id);
  });

  describe('logEvent', () => {
    it('should log a completed event successfully', async () => {
      const eventData = {
        eventType: 'COMPLETED' as const,
        notes: 'Great job!',
        occurredAt: new Date()
      };

      const event = await HabitEventService.logEvent(
        testUser.id,
        testHabit.id,
        eventData
      );

      expect(event).toBeDefined();
      expect(event.eventType).toBe('COMPLETED');
      expect(event.notes).toBe('Great job!');
      expect(event.userId).toBe(testUser.id);
      expect(event.habitId).toBe(testHabit.id);
    });

    it('should log a skipped event successfully', async () => {
      const eventData = {
        eventType: 'SKIPPED' as const,
        notes: 'Too tired today',
        occurredAt: new Date()
      };

      const event = await HabitEventService.logEvent(
        testUser.id,
        testHabit.id,
        eventData
      );

      expect(event.eventType).toBe('SKIPPED');
      expect(event.notes).toBe('Too tired today');
    });

    it('should log a relapsed event successfully', async () => {
      const eventData = {
        eventType: 'RELAPSED' as const,
        notes: 'Had a cigarette',
        occurredAt: new Date()
      };

      const event = await HabitEventService.logEvent(
        testUser.id,
        testHabit.id,
        eventData
      );

      expect(event.eventType).toBe('RELAPSED');
      expect(event.notes).toBe('Had a cigarette');
    });

    it('should throw error for invalid event type', async () => {
      const eventData = {
        eventType: 'INVALID' as any,
        occurredAt: new Date()
      };

      await expect(HabitEventService.logEvent(
        testUser.id,
        testHabit.id,
        eventData
      )).rejects.toThrow();
    });

    it('should throw error for non-existent habit', async () => {
      const eventData = {
        eventType: 'COMPLETED' as const,
        occurredAt: new Date()
      };

      await expect(HabitEventService.logEvent(
        testUser.id,
        'non-existent-habit-id',
        eventData
      )).rejects.toThrow();
    });
  });

  describe('getHabitEvents', () => {
    it('should return all events for a habit', async () => {
      const event1 = await createTestHabitEvent(testUser.id, testHabit.id, {
        eventType: 'COMPLETED',
        occurredAt: new Date('2024-01-01')
      });
      const event2 = await createTestHabitEvent(testUser.id, testHabit.id, {
        eventType: 'SKIPPED',
        occurredAt: new Date('2024-01-02')
      });

      const result = await HabitEventService.getHabitEvents(testUser.id, testHabit.id);

      expect(result.events).toHaveLength(2);
      expect(result.events.map((e: any) => e.id)).toContain(event1.id);
      expect(result.events.map((e: any) => e.id)).toContain(event2.id);
    });

    it('should return empty array for habit with no events', async () => {
      const result = await HabitEventService.getHabitEvents(testUser.id, testHabit.id);
      expect(result.events).toHaveLength(0);
    });

    it('should filter events by date range', async () => {
      const oldEvent = await createTestHabitEvent(testUser.id, testHabit.id, {
        eventType: 'COMPLETED',
        occurredAt: new Date('2024-01-01')
      });
      const recentEvent = await createTestHabitEvent(testUser.id, testHabit.id, {
        eventType: 'COMPLETED',
        occurredAt: new Date('2024-01-15')
      });

      const filters = {
        startDate: new Date('2024-01-10'),
        endDate: new Date('2024-01-20')
      };

      const result = await HabitEventService.getHabitEvents(
        testUser.id,
        testHabit.id,
        filters
      );

      expect(result.events).toHaveLength(1);
      expect(result.events[0].id).toBe(recentEvent.id);
    });
  });

  describe('getAllUserEvents', () => {
    it('should return all events for a user', async () => {
      const habit2 = await createTestHabit(testUser.id, { title: 'Habit 2' });
      
      const event1 = await createTestHabitEvent(testUser.id, testHabit.id, {
        eventType: 'COMPLETED'
      });
      const event2 = await createTestHabitEvent(testUser.id, habit2.id, {
        eventType: 'SKIPPED'
      });

      const result = await HabitEventService.getAllUserEvents(testUser.id);

      expect(result.events).toHaveLength(2);
      expect(result.events.map((e: any) => e.id)).toContain(event1.id);
      expect(result.events.map((e: any) => e.id)).toContain(event2.id);
    });

    it('should filter events by type', async () => {
      const completedEvent = await createTestHabitEvent(testUser.id, testHabit.id, {
        eventType: 'COMPLETED'
      });
      const skippedEvent = await createTestHabitEvent(testUser.id, testHabit.id, {
        eventType: 'SKIPPED'
      });

      const filters = { eventType: 'COMPLETED' as const };
      const result = await HabitEventService.getAllUserEvents(testUser.id, filters);

      expect(result.events).toHaveLength(1);
      expect(result.events[0].id).toBe(completedEvent.id);
    });
  });

  describe('deleteEvent', () => {
    it('should delete an event successfully', async () => {
      const event = await createTestHabitEvent(testUser.id, testHabit.id, {
        eventType: 'COMPLETED'
      });

      await HabitEventService.deleteEvent(event.id, testUser.id);

      const deletedEvent = await prisma.habitEvent.findUnique({
        where: { id: event.id }
      });

      expect(deletedEvent).toBeNull();
    });

    it('should throw error for non-existent event', async () => {
      await expect(HabitEventService.deleteEvent(
        'non-existent-event-id',
        testUser.id
      )).rejects.toThrow();
    });
  });

  describe('getEventStatistics', () => {
    it('should return correct event statistics', async () => {
      // Create various events
      await createTestHabitEvent(testUser.id, testHabit.id, {
        eventType: 'COMPLETED',
        occurredAt: new Date('2024-01-01')
      });
      await createTestHabitEvent(testUser.id, testHabit.id, {
        eventType: 'COMPLETED',
        occurredAt: new Date('2024-01-02')
      });
      await createTestHabitEvent(testUser.id, testHabit.id, {
        eventType: 'SKIPPED',
        occurredAt: new Date('2024-01-03')
      });
      await createTestHabitEvent(testUser.id, testHabit.id, {
        eventType: 'RELAPSED',
        occurredAt: new Date('2024-01-04')
      });

      const stats = await HabitEventService.getEventStatistics(testUser.id, testHabit.id);

      expect(stats.totalEvents).toBe(4);
      expect(stats.completedCount).toBe(2);
      expect(stats.skippedCount).toBe(1);
      expect(stats.relapsedCount).toBe(1);
      expect(stats.completionRate).toBe(0.5); // 2 completed out of 4 total
    });

    it('should return zero stats for habit with no events', async () => {
      const stats = await HabitEventService.getEventStatistics(testUser.id, testHabit.id);

      expect(stats.totalEvents).toBe(0);
      expect(stats.completedCount).toBe(0);
      expect(stats.skippedCount).toBe(0);
      expect(stats.relapsedCount).toBe(0);
      expect(stats.completionRate).toBe(0);
    });
  });
}); 