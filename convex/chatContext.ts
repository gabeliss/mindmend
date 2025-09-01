import { query } from "./_generated/server";
import { v } from "convex/values";

// Helper function to identify relevant habits from a query
function identifyRelevantHabits(query: string, habits: any[]): any[] {
  const queryLower = query.toLowerCase();
  const relevantHabits = [];

  // Direct name matching
  for (const habit of habits) {
    if (queryLower.includes(habit.name.toLowerCase())) {
      relevantHabits.push({ habit, relevanceScore: 1.0 });
    }
  }

  // Keyword matching for common habit types
  const habitKeywords = {
    'sleep': ['sleep', 'wake', 'early', 'morning', 'bed', 'tired', 'rest'],
    'exercise': ['exercise', 'workout', 'gym', 'run', 'sweat', 'fitness', 'active'],
    'diet': ['eat', 'food', 'diet', 'nutrition', 'meal', 'hungry', 'calories'],
    'screen': ['screen', 'phone', 'social media', 'instagram', 'tiktok', 'youtube'],
    'meditation': ['meditate', 'mindful', 'breathe', 'calm', 'stress', 'anxiety'],
    'journal': ['journal', 'write', 'reflect', 'thoughts'],
    'substances': ['drink', 'alcohol', 'sober', 'smoking', 'weed', 'drugs'],
    'productivity': ['work', 'focus', 'productive', 'tasks', 'goals'],
    'social': ['friends', 'family', 'social', 'relationship', 'connect'],
  };

  for (const habit of habits) {
    if (relevantHabits.some(rh => rh.habit._id === habit._id)) continue;

    const habitName = habit.name.toLowerCase();
    for (const [category, keywords] of Object.entries(habitKeywords)) {
      for (const keyword of keywords) {
        if (queryLower.includes(keyword) && 
            (habitName.includes(category) || habitName.includes(keyword))) {
          relevantHabits.push({ habit, relevanceScore: 0.7 });
          break;
        }
      }
      if (relevantHabits.some(rh => rh.habit._id === habit._id)) break;
    }
  }

  // Sort by relevance score and return just the habits
  return relevantHabits
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .map(rh => rh.habit);
}

// Helper function to get user's local date
function getUserLocalDate(timezoneOffset?: number): string {
  const now = new Date();
  
  if (timezoneOffset !== undefined) {
    // Use provided timezone offset (in minutes from UTC)
    // Positive offset means ahead of UTC (e.g., +480 for UTC+8)
    const localTime = new Date(now.getTime() + (timezoneOffset * 60000));
    return localTime.toISOString().split('T')[0];
  }
  
  // Fallback to UTC date
  return now.toISOString().split('T')[0];
}

// Internal function to get basic context
async function getBasicContextInternal(ctx: any, userId: string, timezoneOffset?: number) {
  // Use user's local date, accounting for timezone if provided
  const today = getUserLocalDate(timezoneOffset);
  
  // Get active habits
  const habits = await ctx.db
    .query("habits")
    .withIndex("by_user_active", q => q.eq("user_id", userId).eq("archived", false))
    .collect();

  // Sort habits by order
  habits.sort((a, b) => (a.order || 999) - (b.order || 999));

  // Get today's habit events
  const todayEvents = await ctx.db
    .query("habit_events")
    .withIndex("by_user_date", q => q.eq("user_id", userId).eq("date", today))
    .collect();

  // Get today's daily plan
  const todayPlan = await ctx.db
    .query("daily_plans")
    .withIndex("by_user_date", q => q.eq("user_id", userId).eq("date", today))
    .unique();

  let planSummary = null;
  if (todayPlan) {
    const planItems = await ctx.db
      .query("daily_plan_items")
      .withIndex("by_plan_order", q => q.eq("daily_plan_id", todayPlan._id))
      .collect();

    planSummary = {
      hasItems: planItems.length > 0,
      completedCount: planItems.filter(item => item.completed).length,
      totalCount: planItems.length,
    };
  }

  // Create habit status summary
  const habitStatus = habits.map(habit => {
    const todayEvent = todayEvents.find(event => event.habit_id === habit._id);
    
    return {
      id: habit._id,
      name: habit.name,
      type: habit.type,
      status: todayEvent?.status || "not_marked",
      value: todayEvent?.value,
      note: todayEvent?.note,
    };
  });

  return {
    currentDate: today,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Default timezone
    activeHabits: habits.map(habit => ({
      id: habit._id,
      name: habit.name,
      type: habit.type,
      frequency: habit.frequency,
      goal_value: habit.goal_value,
      goal_direction: habit.goal_direction,
      unit: habit.unit,
      goal_time: habit.goal_time,
      order: habit.order,
    })),
    todayHabitStatus: habitStatus,
    todayPlan: planSummary,
  };
}

// Get basic context for chat - always included information
export const getChatContext = query({
  args: {
    userId: v.optional(v.string()),
    timezoneOffset: v.optional(v.number()), // Minutes from UTC
  },
  handler: async (ctx, args) => {
    // Get authenticated user ID if not provided
    let userId = args.userId;
    if (!userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Not authenticated");
      }
      userId = identity.subject;
    }

    return getBasicContextInternal(ctx, userId, args.timezoneOffset);
  },
});

// Get habit-specific context for a particular habit
export const getHabitContext = query({
  args: {
    habitId: v.id("habits"),
    userId: v.optional(v.string()),
    daysBack: v.optional(v.number()), // How many days of history to include
  },
  handler: async (ctx, args) => {
    // Get authenticated user ID if not provided
    let userId = args.userId;
    if (!userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Not authenticated");
      }
      userId = identity.subject;
    }

    // Verify user owns the habit
    const habit = await ctx.db.get(args.habitId);
    if (!habit || habit.user_id !== userId) {
      throw new Error("Unauthorized to view this habit");
    }

    const daysBack = args.daysBack || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const startDateString = startDate.toISOString().split('T')[0];

    // Get habit events for the specified period
    const habitEvents = await ctx.db
      .query("habit_events")
      .withIndex("by_habit_date", q => q.eq("habit_id", args.habitId))
      .filter(q => q.gte(q.field("date"), startDateString))
      .collect();

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    let checkDate = new Date(today);
    
    while (true) {
      const dateString = checkDate.toISOString().split('T')[0];
      const event = habitEvents.find(e => e.date === dateString);
      
      if (event && event.status === "completed") {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate completion rate
    const totalEvents = habitEvents.length;
    const completedEvents = habitEvents.filter(e => e.status === "completed").length;
    const completionRate = totalEvents > 0 ? completedEvents / totalEvents : 0;

    return {
      habit: {
        id: habit._id,
        name: habit.name,
        type: habit.type,
        frequency: habit.frequency,
        goal_value: habit.goal_value,
        goal_direction: habit.goal_direction,
        unit: habit.unit,
        goal_time: habit.goal_time,
        created_at: habit.created_at,
      },
      recentEvents: habitEvents.map(event => ({
        id: event._id,
        date: event.date,
        status: event.status,
        value: event.value,
        note: event.note,
        timestamp: event.timestamp,
        created_at: event.created_at,
      })),
      currentStreak,
      completionRate,
      totalEvents,
      completedEvents,
      periodStart: startDateString,
      periodEnd: today,
    };
  },
});

// Simple journal search based on keywords
export const searchJournalEntries = query({
  args: {
    searchTerm: v.string(),
    userId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get authenticated user ID if not provided
    let userId = args.userId;
    if (!userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Not authenticated");
      }
      userId = identity.subject;
    }

    const limit = args.limit || 5;
    const searchTerm = args.searchTerm.toLowerCase();

    // Get all journal entries for the user
    const allEntries = await ctx.db
      .query("journal_entries")
      .withIndex("by_user", q => q.eq("user_id", userId))
      .collect();

    // Simple keyword matching - filter entries that contain the search term
    const matchingEntries = allEntries
      .filter(entry => 
        entry.title.toLowerCase().includes(searchTerm) ||
        entry.content.toLowerCase().includes(searchTerm)
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Most recent first
      .slice(0, limit);

    return matchingEntries.map(entry => ({
      id: entry._id,
      date: entry.date,
      title: entry.title,
      content: entry.content, // Include full content for now
      created_at: entry.created_at,
      updated_at: entry.updated_at,
    }));
  },
});

// Main query for chat context - combines basic context with query-specific context
export const getQueryContext = query({
  args: {
    query: v.string(),
    userId: v.optional(v.string()),
    includeJournals: v.optional(v.boolean()),
    maxJournalEntries: v.optional(v.number()),
    habitHistoryDays: v.optional(v.number()),
    timezoneOffset: v.optional(v.number()), // Minutes from UTC
  },
  handler: async (ctx, args) => {
    // Get authenticated user ID if not provided
    let userId = args.userId;
    if (!userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Not authenticated");
      }
      userId = identity.subject;
    }

    // Get basic context
    const basicContext = await getBasicContextInternal(ctx, userId, args.timezoneOffset);

    // Identify relevant habits from the query
    const relevantHabits = identifyRelevantHabits(args.query, basicContext.activeHabits);
    
    // Get detailed context for the most relevant habit (if any)
    let primaryHabitContext = null;
    if (relevantHabits.length > 0) {
      const primaryHabit = relevantHabits[0];
      
      // Get habit context using internal logic
      const daysBack = args.habitHistoryDays || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);
      const startDateString = startDate.toISOString().split('T')[0];

      // Get habit events for the specified period
      const habitEvents = await ctx.db
        .query("habit_events")
        .withIndex("by_habit_date", q => q.eq("habit_id", primaryHabit.id))
        .filter(q => q.gte(q.field("date"), startDateString))
        .collect();

      // Calculate current streak
      let currentStreak = 0;
      const today = getUserLocalDate(args.timezoneOffset);
      let checkDate = new Date(today);
      
      while (true) {
        const dateString = checkDate.toISOString().split('T')[0];
        const event = habitEvents.find(e => e.date === dateString);
        
        if (event && event.status === "completed") {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      // Calculate completion rate
      const totalEvents = habitEvents.length;
      const completedEvents = habitEvents.filter(e => e.status === "completed").length;
      const completionRate = totalEvents > 0 ? completedEvents / totalEvents : 0;

      primaryHabitContext = {
        habit: primaryHabit,
        recentEvents: habitEvents.map(event => ({
          id: event._id,
          date: event.date,
          status: event.status,
          value: event.value,
          note: event.note,
          timestamp: event.timestamp,
          created_at: event.created_at,
        })),
        currentStreak,
        completionRate,
        totalEvents,
        completedEvents,
        periodStart: startDateString,
        periodEnd: today,
      };
    }

    // Get relevant journal entries if requested
    let relevantJournals = null;
    if (args.includeJournals !== false) { // Default to true
      const limit = args.maxJournalEntries || 5;
      const searchTerm = args.query.toLowerCase();

      // Get all journal entries for the user
      const allEntries = await ctx.db
        .query("journal_entries")
        .withIndex("by_user", q => q.eq("user_id", userId))
        .collect();

      // Simple keyword matching - filter entries that contain the search term
      const matchingEntries = allEntries
        .filter(entry => 
          entry.title.toLowerCase().includes(searchTerm) ||
          entry.content.toLowerCase().includes(searchTerm)
        )
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Most recent first
        .slice(0, limit);

      relevantJournals = matchingEntries.map(entry => ({
        id: entry._id,
        date: entry.date,
        title: entry.title,
        content: entry.content,
        created_at: entry.created_at,
        updated_at: entry.updated_at,
      }));
    }

    return {
      ...basicContext,
      query: args.query,
      relevantHabits: relevantHabits.map(habit => ({
        id: habit.id,
        name: habit.name,
        type: habit.type,
      })).slice(0, 3), // Limit to top 3 relevant habits
      primaryHabitContext,
      relevantJournals,
      contextGeneratedAt: new Date().toISOString(),
    };
  },
});