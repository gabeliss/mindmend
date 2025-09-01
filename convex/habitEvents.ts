import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

// Validation function for habit events
const validateHabitEventData = async (ctx: any, args: any) => {
  const { habit_id, status, value, date } = args;

  // Verify habit exists and get its details
  const habit = await ctx.db.get(habit_id);
  if (!habit) {
    throw new Error("Habit not found");
  }

  // Verify date format (should be YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    throw new Error("Date must be in YYYY-MM-DD format");
  }

  // Type-specific validation
  if (habit.type === "quantity" || habit.type === "duration") {
    if (status === "completed" && (value === undefined || value === null)) {
      throw new Error(`${habit.type} habits require a value when completed`);
    }
    if (status === "completed" && typeof value !== "number") {
      throw new Error("Value must be a number");
    }
    if (status === "completed" && value < 0) {
      throw new Error("Value cannot be negative");
    }
  }

  // For schedule habits, we might want to validate the timestamp if provided
  if (habit.type === "schedule" && status === "completed" && args.timestamp) {
    // Basic timestamp validation - should be ISO string
    try {
      new Date(args.timestamp);
    } catch {
      throw new Error("Invalid timestamp format");
    }
  }

  return habit;
};

export const createHabitEvent = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    // Validate the habit event data
    const habit = await validateHabitEventData(ctx, args);
    
    // Verify user owns the habit
    if (habit.user_id !== args.user_id) {
      throw new Error("Unauthorized to create events for this habit");
    }

    // Check if event already exists for this habit and date
    const existingEvent = await ctx.db
      .query("habit_events")
      .withIndex("by_habit_date", q => 
        q.eq("habit_id", args.habit_id).eq("date", args.date)
      )
      .first();

    if (existingEvent) {
      throw new Error("Habit event already exists for this date");
    }

    const now = new Date().toISOString();
    
    const eventId = await ctx.db.insert("habit_events", {
      habit_id: args.habit_id,
      user_id: args.user_id,
      date: args.date,
      status: args.status,
      value: args.value,
      note: args.note,
      timestamp: args.timestamp,
      created_at: now,
      updated_at: now,
    });

    // Trigger smart correlation update in background (non-blocking)
    try {
      await ctx.runMutation(api.correlations.triggerCorrelationUpdate, {
        userId: args.user_id,
      });
    } catch (error) {
      // Don't fail the habit event creation if correlation update fails
      console.log("Correlation trigger failed (non-critical):", error);
    }

    return eventId;
  },
});

export const updateHabitEvent = mutation({
  args: {
    id: v.id("habit_events"),
    user_id: v.string(),
    status: v.optional(v.union(
      v.literal("completed"),
      v.literal("skipped"),
      v.literal("failed"),
      v.literal("not_marked")
    )),
    value: v.optional(v.number()),
    note: v.optional(v.string()),
    timestamp: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, user_id, ...updateData } = args;
    
    // Get existing event to verify ownership
    const existingEvent = await ctx.db.get(id);
    if (!existingEvent) {
      throw new Error("Habit event not found");
    }
    if (existingEvent.user_id !== user_id) {
      throw new Error("Unauthorized to update this habit event");
    }

    // If status is being updated, validate with habit data
    if (updateData.status || updateData.value !== undefined) {
      const mergedData = {
        ...existingEvent,
        ...updateData,
      };
      await validateHabitEventData(ctx, mergedData);
    }

    // Update the event
    const now = new Date().toISOString();
    await ctx.db.patch(id, {
      ...updateData,
      updated_at: now,
    });

    // Trigger smart correlation update if status changed (non-blocking)
    if (updateData.status) {
      try {
        await ctx.runMutation(api.correlations.triggerCorrelationUpdate, {
          userId: user_id,
        });
      } catch (error) {
        console.log("Correlation trigger failed (non-critical):", error);
      }
    }
    
    return id;
  },
});

export const deleteHabitEvent = mutation({
  args: {
    id: v.id("habit_events"),
    user_id: v.string(),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.id);
    if (!event) {
      throw new Error("Habit event not found");
    }
    if (event.user_id !== args.user_id) {
      throw new Error("Unauthorized to delete this habit event");
    }

    await ctx.db.delete(args.id);
    
    return args.id;
  },
});

export const getHabitEvents = query({
  args: {
    user_id: v.string(),
    habit_id: v.optional(v.id("habits")),
    date: v.optional(v.string()),
    start_date: v.optional(v.string()),
    end_date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query;

    if (args.habit_id) {
      // Get events for specific habit
      query = ctx.db
        .query("habit_events")
        .withIndex("by_habit", q => q.eq("habit_id", args.habit_id));
    } else {
      // Get all events for user
      query = ctx.db
        .query("habit_events")
        .withIndex("by_user", q => q.eq("user_id", args.user_id));
    }

    let events = await query.collect();

    // Filter by date if specified
    if (args.date) {
      events = events.filter(event => event.date === args.date);
    } else if (args.start_date && args.end_date) {
      events = events.filter(event => 
        event.date >= args.start_date! && event.date <= args.end_date!
      );
    } else if (args.start_date) {
      events = events.filter(event => event.date >= args.start_date!);
    } else if (args.end_date) {
      events = events.filter(event => event.date <= args.end_date!);
    }

    // Verify user authorization for all events
    events = events.filter(event => event.user_id === args.user_id);

    return events.map(event => ({
      id: event._id,
      habit_id: event.habit_id,
      user_id: event.user_id,
      date: event.date,
      status: event.status,
      value: event.value,
      note: event.note,
      timestamp: event.timestamp,
      created_at: event.created_at,
      updated_at: event.updated_at,
    }));
  },
});

export const getHabitEvent = query({
  args: {
    id: v.id("habit_events"),
    user_id: v.string(),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.id);
    if (!event) {
      return null;
    }
    if (event.user_id !== args.user_id) {
      throw new Error("Unauthorized to view this habit event");
    }

    return {
      id: event._id,
      habit_id: event.habit_id,
      user_id: event.user_id,
      date: event.date,
      status: event.status,
      value: event.value,
      note: event.note,
      timestamp: event.timestamp,
      created_at: event.created_at,
      updated_at: event.updated_at,
    };
  },
});

export const getHabitEventByDate = query({
  args: {
    habit_id: v.id("habits"),
    user_id: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify user owns the habit
    const habit = await ctx.db.get(args.habit_id);
    if (!habit || habit.user_id !== args.user_id) {
      throw new Error("Unauthorized to view events for this habit");
    }

    const event = await ctx.db
      .query("habit_events")
      .withIndex("by_habit_date", q => 
        q.eq("habit_id", args.habit_id).eq("date", args.date)
      )
      .first();

    if (!event) {
      return null;
    }

    return {
      id: event._id,
      habit_id: event.habit_id,
      user_id: event.user_id,
      date: event.date,
      status: event.status,
      value: event.value,
      note: event.note,
      timestamp: event.timestamp,
      created_at: event.created_at,
      updated_at: event.updated_at,
    };
  },
});

export const bulkCreateHabitEvents = mutation({
  args: {
    events: v.array(v.object({
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
    })),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const createdEvents = [];

    for (const eventData of args.events) {
      // Validate each event
      await validateHabitEventData(ctx, eventData);
      
      // Verify user owns the habit
      const habit = await ctx.db.get(eventData.habit_id);
      if (!habit || habit.user_id !== eventData.user_id) {
        throw new Error(`Unauthorized to create events for habit ${eventData.habit_id}`);
      }

      // Check if event already exists
      const existingEvent = await ctx.db
        .query("habit_events")
        .withIndex("by_habit_date", q => 
          q.eq("habit_id", eventData.habit_id).eq("date", eventData.date)
        )
        .first();

      if (!existingEvent) {
        const eventId = await ctx.db.insert("habit_events", {
          ...eventData,
          created_at: now,
          updated_at: now,
        });
        createdEvents.push(eventId);
      }
    }

    return createdEvents;
  },
});