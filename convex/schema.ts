import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  habits: defineTable({
    user_id: v.string(),
    name: v.string(),
    type: v.union(
      v.literal("simple"),
      v.literal("quantity"), 
      v.literal("duration"),
      v.literal("schedule"),
      v.literal("avoidance")
    ),
    frequency: v.object({
      type: v.union(
        v.literal("daily"),
        v.literal("weekly"), 
        v.literal("specific_days")
      ),
      goal_per_week: v.optional(v.number()),
      days_of_week: v.optional(v.array(v.string())),
    }),
    
    // For quantity/duration/schedule habits
    goal_value: v.optional(v.number()),
    goal_direction: v.optional(v.union(
      v.literal("at_least"),
      v.literal("no_more_than"),
      v.literal("by"), 
      v.literal("after")
    )),
    unit: v.optional(v.string()),
    
    // For schedule habits
    goal_time: v.optional(v.string()),
    goal_times_by_day: v.optional(v.any()), // Record<string, string>
    
    // For avoidance habits
    failure_tolerance: v.optional(v.object({
      window: v.union(v.literal("weekly"), v.literal("monthly")),
      max_failures: v.number(),
    })),
    
    order: v.optional(v.number()),
    archived: v.boolean(),
    created_at: v.string(),
  })
    .index("by_user", ["user_id"])
    .index("by_user_active", ["user_id", "archived"])
    .index("by_user_order", ["user_id", "order"]),

  habit_events: defineTable({
    habit_id: v.id("habits"),
    user_id: v.string(),
    date: v.string(),
    status: v.union(
      v.literal("completed"),
      v.literal("skipped"), 
      v.literal("failed"),
      v.literal("not_marked")
    ),
    value: v.optional(v.number()),
    note: v.optional(v.string()),
    timestamp: v.optional(v.string()),
    created_at: v.string(),
    updated_at: v.string(),
  })
    .index("by_habit", ["habit_id"])
    .index("by_user", ["user_id"])
    .index("by_user_date", ["user_id", "date"])
    .index("by_habit_date", ["habit_id", "date"]),

  daily_plans: defineTable({
    user_id: v.string(),
    date: v.string(),
    note: v.optional(v.string()),
    created_at: v.string(),
  })
    .index("by_user", ["user_id"])
    .index("by_user_date", ["user_id", "date"]),

  daily_plan_items: defineTable({
    daily_plan_id: v.id("daily_plans"),
    time: v.optional(v.string()),
    description: v.string(),
    completed: v.boolean(),
    order: v.number(),
  })
    .index("by_plan", ["daily_plan_id"])
    .index("by_plan_order", ["daily_plan_id", "order"]),

  journal_entries: defineTable({
    user_id: v.string(),
    date: v.string(), // YYYY-MM-DD format
    title: v.string(),
    content: v.string(),
    created_at: v.string(),
    updated_at: v.string(),
  })
    .index("by_user", ["user_id"])
    .index("by_user_date", ["user_id", "date"])
    .index("by_date", ["date"]),

  correlation_cache: defineTable({
    user_id: v.string(),
    correlations: v.array(v.any()),
    calculatedAt: v.string(),
    validUntil: v.string(),
  })
    .index("by_user", ["user_id"]),

  correlation_trigger_tracker: defineTable({
    user_id: v.string(),
    lastUpdateAt: v.string(),
    eventsSinceUpdate: v.number(),
    totalEvents: v.number(),
  })
    .index("by_user", ["user_id"]),

  daily_reflections: defineTable({
    user_id: v.string(),
    date: v.string(), // YYYY-MM-DD format
    prompt_type: v.union(v.literal("morning"), v.literal("evening")),
    content: v.string(),
    is_draft: v.boolean(),
    is_journaled: v.optional(v.boolean()),
    created_at: v.string(),
    updated_at: v.string(),
  })
    .index("by_user", ["user_id"])
    .index("by_user_date", ["user_id", "date"])
    .index("by_user_date_type", ["user_id", "date", "prompt_type"])
    .index("by_draft_status", ["is_draft"])
    .index("by_user_drafts", ["user_id", "is_draft"]),
});