// Common types and interfaces for the MindMend API

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// User types (will be expanded later)
export interface User {
  id: string;
  firebaseUid: string;
  email: string;
  displayName?: string;
  timezone: string;
  coachStyle: 'supportive' | 'direct' | 'motivational';
  createdAt: Date;
  updatedAt: Date;
}

// Habit types (will be expanded later)
export interface Habit {
  id: string;
  userId: string;
  title: string;
  description?: string;
  habitType: 'avoid' | 'build';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface HabitEvent {
  id: string;
  userId: string;
  habitId: string;
  eventType: 'completed' | 'skipped' | 'relapsed';
  notes?: string;
  occurredAt: Date;
  createdAt: Date;
}

// Journal types
export interface JournalEntry {
  id: string;
  userId: string;
  title?: string;
  content: string;
  moodRating?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateJournalEntryData {
  title?: string;
  content: string;
  moodRating?: number;
}

export interface UpdateJournalEntryData {
  title?: string;
  content?: string;
  moodRating?: number;
}

export interface JournalFilters {
  startDate?: string;
  endDate?: string;
  minMoodRating?: number;
  maxMoodRating?: number;
  search?: string;
  limit?: number;
  offset?: number;
}

// AI types
export interface AIInsight {
  id: string;
  userId: string;
  insightType: 'weekly_summary' | 'daily_tip' | 'pattern_detected';
  title: string;
  content: string;
  dataUsed?: any;
  wasShown: boolean;
  shownAt?: Date;
  createdAt: Date;
  expiresAt?: Date;
}

export interface AIGenerationRequest {
  type: 'daily_insight' | 'weekly_summary' | 'pattern_detection' | 'motivational_tip';
  userId: string;
  data?: any;
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    coachStyle?: 'supportive' | 'direct' | 'motivational';
  };
}

export interface AIUsageStats {
  userId: string;
  month: string;
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  lastUpdated: Date;
}

// Daily Summary types
export interface DailySummaryData {
  date: string;
  checkInStatus: {
    morning: boolean;
    evening: boolean;
  };
  mood: MoodDisplayData | null;
  habits: {
    completed: number;
    total: number;
  };
  aiInsight: AIInsightData | null;
  yesterdayComparison?: string;
}

export interface AIInsightData {
  insight: string;
  confidence: "low" | "medium" | "high";
  reasoning: string;
  dataPoints: number;
}

// Mood types
export interface MoodDisplayData {
  type: "single" | "range";
  current?: number;
  start?: number;
  end?: number;
  display: string;
}

export interface MoodAggregationResult {
  date: string;
  moodRangeStart: number;
  moodRangeEnd: number;
  moodEntryCount: number;
  entries: Array<{
    moodRating: number;
    createdAt: string;
  }>;
}

// Error types
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Environment types
export interface Environment {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  DATABASE_URL: string;
  REDIS_URL: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_PRIVATE_KEY: string;
  FIREBASE_CLIENT_EMAIL: string;
  OPENAI_API_KEY: string;
  JWT_SECRET: string;
  APP_NAME: string;
  API_VERSION: string;
}