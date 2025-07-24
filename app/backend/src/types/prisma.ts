// Export Prisma generated types for use throughout the application
export type {
  User,
  Habit,
  HabitEvent,
  JournalEntry,
  AIInsight,
  DailyStats,
  CoachStyle,
  HabitType,
  EventType,
  InsightType,
  Prisma
} from '@prisma/client';

// Additional utility types
import type { User, Habit, HabitEvent, JournalEntry, AIInsight, DailyStats, EventType, InsightType, HabitType } from '@prisma/client';

// User with relations
export type UserWithHabits = User & {
  habits: Habit[];
};

export type UserWithStats = User & {
  dailyStats: DailyStats[];
};

// Habit with relations
export type HabitWithEvents = Habit & {
  habitEvents: HabitEvent[];
};

// Habit event with relations
export type HabitEventWithHabit = HabitEvent & {
  habit: Habit;
};

// Create types (for input validation)
export type CreateUserInput = Pick<User, 'firebaseUid' | 'email' | 'displayName' | 'timezone' | 'coachStyle'>;
export type UpdateUserInput = Partial<Pick<User, 'displayName' | 'timezone' | 'coachStyle'>>;

export type CreateHabitInput = {
  title: string;
  description?: string;
  habitType: HabitType;
};
export type UpdateHabitInput = {
  title?: string;
  description?: string | null;
  isActive?: boolean;
};

export type CreateHabitEventInput = Pick<HabitEvent, 'eventType' | 'notes' | 'occurredAt'>;

export type CreateJournalEntryInput = Pick<JournalEntry, 'title' | 'content' | 'moodRating'>;
export type UpdateJournalEntryInput = Partial<Pick<JournalEntry, 'title' | 'content' | 'moodRating'>>;

export type CreateAIInsightInput = Pick<AIInsight, 'insightType' | 'title' | 'content' | 'dataUsed' | 'expiresAt'>;

// Query filters
export interface HabitEventFilters {
  startDate?: Date;
  endDate?: Date;
  eventType?: EventType;
  habitId?: string;
}

export interface JournalEntryFilters {
  startDate?: Date;
  endDate?: Date;
  moodRating?: {
    min?: number;
    max?: number;
  };
  search?: string;
}

export interface AIInsightFilters {
  insightType?: InsightType;
  wasShown?: boolean;
  startDate?: Date;
  endDate?: Date;
}