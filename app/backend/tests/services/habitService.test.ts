import { HabitService } from '../../src/services/habitService';
import { prisma, createTestUser, createTestHabit } from '../setup';

// Jest globals
declare global {
  var describe: (name: string, fn: () => void) => void;
  var it: (name: string, fn: () => void | Promise<void>) => void;
  var expect: any;
  var beforeEach: (fn: () => void | Promise<void>) => void;
}

describe('HabitService', () => {
  let testUser: any;

  beforeEach(async () => {
    testUser = await createTestUser();
  });

  describe('createHabit', () => {
    it('should create a new habit successfully', async () => {
      const habitData = {
        title: 'Exercise Daily',
        description: 'Work out for 30 minutes',
        habitType: 'BUILD' as const
      };

      const habit = await HabitService.createHabit(testUser.id, habitData);

      expect(habit).toBeDefined();
      expect(habit.title).toBe(habitData.title);
      expect(habit.description).toBe(habitData.description);
      expect(habit.habitType).toBe(habitData.habitType);
      expect(habit.userId).toBe(testUser.id);
      expect(habit.isActive).toBe(true);
    });

    it('should throw error for invalid habit type', async () => {
      const habitData = {
        title: 'Test Habit',
        habitType: 'INVALID' as any
      };

      await expect(HabitService.createHabit(testUser.id, habitData))
        .rejects.toThrow();
    });

    it('should throw error for empty title', async () => {
      const habitData = {
        title: '',
        description: 'Test description',
        habitType: 'BUILD' as const
      };

      await expect(HabitService.createHabit(testUser.id, habitData))
        .rejects.toThrow();
    });
  });

  describe('getUserHabits', () => {
    it('should return all habits for a user', async () => {
      const habit1 = await createTestHabit(testUser.id, { title: 'Habit 1' });
      const habit2 = await createTestHabit(testUser.id, { title: 'Habit 2' });

      const habits = await HabitService.getUserHabits(testUser.id);

      expect(habits).toHaveLength(2);
      expect(habits.map((h: any) => h.id)).toContain(habit1.id);
      expect(habits.map((h: any) => h.id)).toContain(habit2.id);
    });

    it('should return empty array for user with no habits', async () => {
      const habits = await HabitService.getUserHabits(testUser.id);
      expect(habits).toHaveLength(0);
    });

    it('should only return active habits by default', async () => {
      const activeHabit = await createTestHabit(testUser.id, { title: 'Active Habit' });
      const inactiveHabit = await createTestHabit(testUser.id, { 
        title: 'Inactive Habit',
        isActive: false 
      });

      const habits = await HabitService.getUserHabits(testUser.id);

      expect(habits).toHaveLength(1);
      expect(habits[0].id).toBe(activeHabit.id);
    });

    it('should return all habits when includeInactive is true', async () => {
      const activeHabit = await createTestHabit(testUser.id, { title: 'Active Habit' });
      const inactiveHabit = await createTestHabit(testUser.id, { 
        title: 'Inactive Habit',
        isActive: false 
      });

      const habits = await HabitService.getUserHabits(testUser.id, true);

      expect(habits).toHaveLength(2);
      expect(habits.map((h: any) => h.id)).toContain(activeHabit.id);
      expect(habits.map((h: any) => h.id)).toContain(inactiveHabit.id);
    });
  });

  describe('getHabitById', () => {
    it('should return habit by ID', async () => {
      const habit = await createTestHabit(testUser.id, { title: 'Test Habit' });

      const foundHabit = await HabitService.getHabitById(habit.id, testUser.id);

      expect(foundHabit).toBeDefined();
      expect(foundHabit?.id).toBe(habit.id);
      expect(foundHabit?.title).toBe('Test Habit');
    });

    it('should return null for non-existent habit', async () => {
      const foundHabit = await HabitService.getHabitById('non-existent-id', testUser.id);
      expect(foundHabit).toBeNull();
    });
  });

  describe('updateHabit', () => {
    it('should update habit successfully', async () => {
      const habit = await createTestHabit(testUser.id, { title: 'Original Title' });

      const updateData = {
        title: 'Updated Title',
        description: 'Updated description'
      };

      const updatedHabit = await HabitService.updateHabit(habit.id, testUser.id, updateData);

      expect(updatedHabit.title).toBe('Updated Title');
      expect(updatedHabit.description).toBe('Updated description');
    });

    it('should throw error for non-existent habit', async () => {
      const updateData = { title: 'Updated Title' };

      await expect(HabitService.updateHabit('non-existent-id', testUser.id, updateData))
        .rejects.toThrow();
    });

    it('should only update provided fields', async () => {
      const habit = await createTestHabit(testUser.id, { 
        title: 'Original Title',
        description: 'Original description'
      });

      const updateData = { title: 'Updated Title' };

      const updatedHabit = await HabitService.updateHabit(habit.id, testUser.id, updateData);

      expect(updatedHabit.title).toBe('Updated Title');
      expect(updatedHabit.description).toBe('Original description');
    });
  });

  describe('deleteHabit', () => {
    it('should soft delete habit (set isActive to false)', async () => {
      const habit = await createTestHabit(testUser.id, { title: 'Test Habit' });

      await HabitService.deleteHabit(habit.id, testUser.id);

      const deletedHabit = await prisma.habit.findUnique({
        where: { id: habit.id }
      });

      expect(deletedHabit?.isActive).toBe(false);
    });

    it('should throw error for non-existent habit', async () => {
      await expect(HabitService.deleteHabit('non-existent-id', testUser.id))
        .rejects.toThrow();
    });
  });
}); 