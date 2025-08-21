import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "convex-auth/server";

// Validation functions for different habit types
const validateHabitData = (args: any) => {
  const { type, frequency, goal_value, goal_direction, unit, goal_time, goal_times_by_day, failure_tolerance } = args;

  // Basic validation
  if (!type || !frequency) {
    throw new Error("Type and frequency are required");
  }

  // Type-specific validation
  switch (type) {
    case "simple":
      // Simple habits don't need additional fields
      break;
      
    case "quantity":
      if (goal_value === undefined || !unit) {
        throw new Error("Quantity habits require goal_value and unit");
      }
      if (!goal_direction || !["at_least", "no_more_than"].includes(goal_direction)) {
        throw new Error("Quantity habits require valid goal_direction (at_least or no_more_than)");
      }
      break;
      
    case "duration":
      if (goal_value === undefined || !unit) {
        throw new Error("Duration habits require goal_value and unit");
      }
      if (!goal_direction || !["at_least", "no_more_than"].includes(goal_direction)) {
        throw new Error("Duration habits require valid goal_direction (at_least or no_more_than)");
      }
      break;
      
    case "schedule":
      if (!goal_time && !goal_times_by_day) {
        throw new Error("Schedule habits require either goal_time or goal_times_by_day");
      }
      if (goal_direction && !["by", "after"].includes(goal_direction)) {
        throw new Error("Schedule habits can only use 'by' or 'after' for goal_direction");
      }
      break;
      
    case "avoidance":
      if (!failure_tolerance) {
        throw new Error("Avoidance habits require failure_tolerance");
      }
      if (!failure_tolerance.window || !["weekly", "monthly"].includes(failure_tolerance.window)) {
        throw new Error("Failure tolerance window must be 'weekly' or 'monthly'");
      }
      if (typeof failure_tolerance.max_failures !== "number" || failure_tolerance.max_failures < 0) {
        throw new Error("Max failures must be a non-negative number");
      }
      break;
      
    default:
      throw new Error(`Invalid habit type: ${type}`);
  }

  // Frequency validation
  if (frequency.type === "weekly" && !frequency.goal_per_week) {
    throw new Error("Weekly frequency requires goal_per_week");
  }
  if (frequency.type === "specific_days" && (!frequency.days_of_week || frequency.days_of_week.length === 0)) {
    throw new Error("Specific days frequency requires days_of_week");
  }
};

export const createHabit = mutation({
  args: {
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
    goal_value: v.optional(v.number()),
    goal_direction: v.optional(v.union(
      v.literal("at_least"),
      v.literal("no_more_than"),
      v.literal("by"),
      v.literal("after")
    )),
    unit: v.optional(v.string()),
    goal_time: v.optional(v.string()),
    goal_times_by_day: v.optional(v.any()),
    failure_tolerance: v.optional(v.object({
      window: v.union(v.literal("weekly"), v.literal("monthly")),
      max_failures: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    // Get authenticated user ID
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Validate the habit data
    validateHabitData(args);

    const now = new Date().toISOString();
    
    const habitId = await ctx.db.insert("habits", {
      user_id: userId,
      name: args.name,
      type: args.type,
      frequency: args.frequency,
      goal_value: args.goal_value,
      goal_direction: args.goal_direction,
      unit: args.unit,
      goal_time: args.goal_time,
      goal_times_by_day: args.goal_times_by_day,
      failure_tolerance: args.failure_tolerance,
      archived: false,
      created_at: now,
    });

    return habitId;
  },
});

export const updateHabit = mutation({
  args: {
    id: v.id("habits"),
    user_id: v.string(),
    name: v.optional(v.string()),
    type: v.optional(v.union(
      v.literal("simple"),
      v.literal("quantity"),
      v.literal("duration"),
      v.literal("schedule"),
      v.literal("avoidance")
    )),
    frequency: v.optional(v.object({
      type: v.union(
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("specific_days")
      ),
      goal_per_week: v.optional(v.number()),
      days_of_week: v.optional(v.array(v.string())),
    })),
    goal_value: v.optional(v.number()),
    goal_direction: v.optional(v.union(
      v.literal("at_least"),
      v.literal("no_more_than"),
      v.literal("by"),
      v.literal("after")
    )),
    unit: v.optional(v.string()),
    goal_time: v.optional(v.string()),
    goal_times_by_day: v.optional(v.any()),
    failure_tolerance: v.optional(v.object({
      window: v.union(v.literal("weekly"), v.literal("monthly")),
      max_failures: v.number(),
    })),
    archived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, user_id, ...updateData } = args;
    
    // Get existing habit to verify ownership and merge data for validation
    const existingHabit = await ctx.db.get(id);
    if (!existingHabit) {
      throw new Error("Habit not found");
    }
    if (existingHabit.user_id !== user_id) {
      throw new Error("Unauthorized to update this habit");
    }

    // Merge existing data with updates for validation
    const mergedData = {
      ...existingHabit,
      ...updateData,
    };

    // Validate the merged habit data
    validateHabitData(mergedData);

    // Update the habit
    await ctx.db.patch(id, updateData);
    
    return id;
  },
});

export const deleteHabit = mutation({
  args: {
    id: v.id("habits"),
    user_id: v.string(),
  },
  handler: async (ctx, args) => {
    const habit = await ctx.db.get(args.id);
    if (!habit) {
      throw new Error("Habit not found");
    }
    if (habit.user_id !== args.user_id) {
      throw new Error("Unauthorized to delete this habit");
    }

    // Delete the habit
    await ctx.db.delete(args.id);
    
    // Note: In a production app, you might want to also clean up related habit_events
    // or archive them instead of hard deleting
    
    return args.id;
  },
});

export const archiveHabit = mutation({
  args: {
    id: v.id("habits"),
    user_id: v.string(),
    archived: v.boolean(),
  },
  handler: async (ctx, args) => {
    const habit = await ctx.db.get(args.id);
    if (!habit) {
      throw new Error("Habit not found");
    }
    if (habit.user_id !== args.user_id) {
      throw new Error("Unauthorized to modify this habit");
    }

    await ctx.db.patch(args.id, { archived: args.archived });
    
    return args.id;
  },
});

export const getHabits = query({
  args: {
    include_archived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Get authenticated user ID
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    let query = ctx.db
      .query("habits")
      .withIndex("by_user", q => q.eq("user_id", userId));

    if (!args.include_archived) {
      query = query.filter(q => q.eq(q.field("archived"), false));
    }

    const habits = await query.collect();
    
    return habits.map(habit => ({
      id: habit._id,
      user_id: habit.user_id,
      name: habit.name,
      type: habit.type,
      frequency: habit.frequency,
      goal_value: habit.goal_value,
      goal_direction: habit.goal_direction,
      unit: habit.unit,
      goal_time: habit.goal_time,
      goal_times_by_day: habit.goal_times_by_day,
      failure_tolerance: habit.failure_tolerance,
      archived: habit.archived,
      created_at: habit.created_at,
    }));
  },
});

export const getHabit = query({
  args: {
    id: v.id("habits"),
    user_id: v.string(),
  },
  handler: async (ctx, args) => {
    const habit = await ctx.db.get(args.id);
    if (!habit) {
      return null;
    }
    if (habit.user_id !== args.user_id) {
      throw new Error("Unauthorized to view this habit");
    }

    return {
      id: habit._id,
      user_id: habit.user_id,
      name: habit.name,
      type: habit.type,
      frequency: habit.frequency,
      goal_value: habit.goal_value,
      goal_direction: habit.goal_direction,
      unit: habit.unit,
      goal_time: habit.goal_time,
      goal_times_by_day: habit.goal_times_by_day,
      failure_tolerance: habit.failure_tolerance,
      archived: habit.archived,
      created_at: habit.created_at,
    };
  },
});