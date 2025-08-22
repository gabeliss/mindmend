export interface Habit {
  id: string;
  user_id: string;
  name: string;
  type: "simple" | "quantity" | "duration" | "schedule" | "avoidance";
  frequency: {
    type: "daily" | "weekly" | "specific_days";
    goal_per_week?: number;
    days_of_week?: string[];
  };
  
  // For quantity/duration/schedule habits
  goal_value?: number;
  goal_direction?: "at_least" | "no_more_than" | "by" | "after";
  unit?: string;
  
  // For schedule habits  
  goal_time?: string;
  goal_times_by_day?: Record<string, string>;
  
  // For avoidance habits
  failure_tolerance?: {
    window: "weekly" | "monthly";
    max_failures: number;
  };
  
  order?: number; // For drag-and-drop reordering
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
  time?: string; // Optional timestamp (e.g., "14:30" or "2:30 PM")
  description: string;
  completed: boolean;
  order: number; // For drag-and-drop reordering
}