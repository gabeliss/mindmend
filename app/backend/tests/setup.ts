import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Jest globals
declare global {
  var beforeAll: (fn: () => Promise<void>) => void;
  var afterAll: (fn: () => Promise<void>) => void;
  var afterEach: (fn: () => Promise<void>) => void;
}

const prisma = new PrismaClient();

// Global test setup
beforeAll(async () => {
  // Connect to test database
  await prisma.$connect();
  
  // Clean up any existing test data
  await cleanupTestData();
});

// Global test teardown
afterAll(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

// Clean up after each test
afterEach(async () => {
  await cleanupTestData();
});

// Helper function to clean up test data
async function cleanupTestData() {
  const tables = [
    'habit_events',
    'habits', 
    'daily_stats',
    'ai_insights',
    'journal_entries',
    'users'
  ];
  
  for (const table of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
  }
}

// Export test utilities
export { prisma };
export const createTestUser = async (userData: any = {}) => {
  return await prisma.user.create({
    data: {
      firebaseUid: `test-${Date.now()}-${Math.random()}`,
      email: `test-${Date.now()}@example.com`,
      displayName: 'Test User',
      ...userData
    }
  });
};

export const createTestHabit = async (userId: string, habitData: any = {}) => {
  return await prisma.habit.create({
    data: {
      userId,
      title: 'Test Habit',
      description: 'A test habit',
      habitType: 'BUILD',
      ...habitData
    }
  });
};

export const createTestHabitEvent = async (userId: string, habitId: string, eventData: any = {}) => {
  return await prisma.habitEvent.create({
    data: {
      userId,
      habitId,
      eventType: 'COMPLETED',
      occurredAt: new Date(),
      ...eventData
    }
  });
};

export const createTestJournalEntry = async (userId: string, entryData: any = {}) => {
  return await prisma.journalEntry.create({
    data: {
      userId,
      content: 'Test journal entry content',
      ...entryData
    }
  });
}; 