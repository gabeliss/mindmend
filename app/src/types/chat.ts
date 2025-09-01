export interface ChatContext {
  currentDate: string;
  timezone: string;
  activeHabits: HabitSummary[];
  todayHabitStatus: HabitStatus[];
  todayPlan: DailyPlanSummary | null;
}

export interface QueryContext extends ChatContext {
  query: string;
  relevantHabits: RelevantHabit[];
  primaryHabitContext: HabitContext | null;
  relevantJournals: JournalEntrySummary[] | null;
  contextGeneratedAt: string;
}

export interface HabitSummary {
  id: string;
  name: string;
  type: "simple" | "quantity" | "duration" | "schedule" | "avoidance";
  frequency: {
    type: "daily" | "weekly" | "specific_days";
    goal_per_week?: number;
    days_of_week?: string[];
  };
  goal_value?: number;
  goal_direction?: "at_least" | "no_more_than" | "by" | "after";
  unit?: string;
  goal_time?: string;
  order?: number;
}

export interface HabitStatus {
  id: string;
  name: string;
  type: "simple" | "quantity" | "duration" | "schedule" | "avoidance";
  status: "completed" | "skipped" | "failed" | "not_marked";
  value?: number;
  note?: string;
}

export interface DailyPlanSummary {
  hasItems: boolean;
  completedCount: number;
  totalCount: number;
}

export interface RelevantHabit {
  id: string;
  name: string;
  type: "simple" | "quantity" | "duration" | "schedule" | "avoidance";
}

export interface HabitContext {
  habit: HabitDetail;
  recentEvents: HabitEventDetail[];
  currentStreak: number;
  completionRate: number;
  totalEvents: number;
  completedEvents: number;
  periodStart: string;
  periodEnd: string;
}

export interface HabitDetail {
  id: string;
  name: string;
  type: "simple" | "quantity" | "duration" | "schedule" | "avoidance";
  frequency: {
    type: "daily" | "weekly" | "specific_days";
    goal_per_week?: number;
    days_of_week?: string[];
  };
  goal_value?: number;
  goal_direction?: "at_least" | "no_more_than" | "by" | "after";
  unit?: string;
  goal_time?: string;
  created_at: string;
}

export interface HabitEventDetail {
  id: string;
  date: string;
  status: "completed" | "skipped" | "failed" | "not_marked";
  value?: number;
  note?: string;
  timestamp?: string;
  created_at: string;
}

export interface JournalEntrySummary {
  id: string;
  date: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}