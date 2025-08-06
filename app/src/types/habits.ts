export interface Habit {
  id: string;
  user_id: string;
  name: string;
  type: "binary" | "time_based" | "count_based" | "time_since";
  is_positive: boolean;
  frequency: {
    type: "daily" | "weekly" | "specific_days";
    goal_per_week?: number;
    days_of_week?: string[];
  };
  comparison_type?: "time_of_day" | "duration";
  goal_time?: string;
  goal_times_by_day?: Record<string, string>;
  weekly_time_goal?: number;
  goal_count?: number;
  failure_tolerance?: {
    window: "weekly" | "monthly";
    max_failures: number;
  };
  created_at: string;
  archived: boolean;
}

export interface HabitEvent {
  id: string;
  habit_id: string;
  user_id: string;
  date: string;
  status: "completed" | "skipped" | "failed" | "not_marked";
  value?: number;
  score?: number;
  note?: string;
  timestamp?: string; // Optional UTC timestamp for when the event actually occurred
  created_at: string;
  updated_at: string;
}

export interface DailyPlan {
  id: string;
  user_id: string;
  date: string;
  entries: DailyPlanItem[];
  note?: string;
  created_at: string;
}

export interface DailyPlanItem {
  id: string;
  daily_plan_id: string;
  time: string;
  description: string;
  linked_habit_id?: string;
  completed: boolean;
}