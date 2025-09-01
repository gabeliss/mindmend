import { query, mutation } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

interface CorrelationResult {
  habitA: string;
  habitB: string;
  correlation: number;
  confidence: number;
  sampleSize: number;
  description: string;
}

interface HabitCorrelationCache {
  userId: string;
  correlations: CorrelationResult[];
  calculatedAt: string;
  validUntil: string;
}

// Calculate correlations between habits based on completion patterns
export const calculateHabitCorrelations = query({
  args: {
    minSampleSize: v.optional(v.number()),
    daysBack: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    const minSampleSize = args.minSampleSize || 14;
    const daysBack = args.daysBack || 60;

    // Get user's active habits
    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user_active", q => q.eq("user_id", userId).eq("archived", false))
      .collect();

    if (habits.length < 2) {
      return []; // Need at least 2 habits to correlate
    }

    // Get habit events for the analysis period
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    const events = await ctx.db
      .query("habit_events")
      .withIndex("by_user_date", q => q.eq("user_id", userId).gte("date", cutoffDateStr))
      .collect();

    // Group events by date
    const eventsByDate: Record<string, Record<string, boolean>> = {};
    events.forEach(event => {
      if (!eventsByDate[event.date]) {
        eventsByDate[event.date] = {};
      }
      eventsByDate[event.date][event.habit_id] = event.status === 'completed';
    });

    const correlations: CorrelationResult[] = [];

    // Calculate correlations between all habit pairs
    for (let i = 0; i < habits.length; i++) {
      for (let j = i + 1; j < habits.length; j++) {
        const habitA = habits[i];
        const habitB = habits[j];

        const correlation = calculatePairCorrelation(
          habitA,
          habitB,
          eventsByDate,
          minSampleSize
        );

        if (correlation) {
          correlations.push(correlation);
        }
      }
    }

    // Sort by correlation strength (absolute value)
    correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

    return correlations.slice(0, 10); // Return top 10 correlations
  },
});

// Helper function to calculate correlation between two habits
function calculatePairCorrelation(
  habitA: any,
  habitB: any,
  eventsByDate: Record<string, Record<string, boolean>>,
  minSampleSize: number
): CorrelationResult | null {
  const dates = Object.keys(eventsByDate);
  
  // Count different scenarios
  let bothCompleted = 0;
  let aCompletedBNot = 0;
  let aNotBCompleted = 0;
  let neitherCompleted = 0;
  let validDays = 0;

  dates.forEach(date => {
    const dayEvents = eventsByDate[date];
    
    // Only count days where we have data for both habits
    const aCompleted = dayEvents[habitA._id] || false;
    const bCompleted = dayEvents[habitB._id] || false;
    const hasAData = habitA._id in dayEvents;
    const hasBData = habitB._id in dayEvents;

    if (hasAData || hasBData) {
      validDays++;
      
      if (aCompleted && bCompleted) bothCompleted++;
      else if (aCompleted && !bCompleted) aCompletedBNot++;
      else if (!aCompleted && bCompleted) aNotBCompleted++;
      else neitherCompleted++;
    }
  });

  if (validDays < minSampleSize) {
    return null; // Not enough data
  }

  // Calculate conditional probabilities
  const totalACompleted = bothCompleted + aCompletedBNot;
  const totalBCompleted = bothCompleted + aNotBCompleted;
  
  if (totalACompleted === 0 || totalBCompleted === 0) {
    return null; // One habit never completed
  }

  // P(B | A) = P(B completed when A completed)
  const probBGivenA = bothCompleted / totalACompleted;
  
  // P(B | ~A) = P(B completed when A not completed) 
  const totalANotCompleted = aNotBCompleted + neitherCompleted;
  const probBGivenNotA = totalANotCompleted > 0 ? aNotBCompleted / totalANotCompleted : 0;

  // Correlation strength = difference in probabilities
  const correlation = probBGivenA - probBGivenNotA;

  // Only return significant correlations (>15% difference)
  if (Math.abs(correlation) < 0.15) {
    return null;
  }

  // Calculate confidence based on sample size
  const confidence = Math.min(validDays / 30, 1); // Full confidence at 30+ days

  // Generate description
  const percentage = Math.round(Math.abs(correlation) * 100);
  const direction = correlation > 0 ? "more likely" : "less likely";
  const description = `When you complete ${habitA.name}, you're ${percentage}% ${direction} to complete ${habitB.name}`;

  return {
    habitA: habitA.name,
    habitB: habitB.name,
    correlation,
    confidence,
    sampleSize: validDays,
    description,
  };
}

// Cache correlation results to avoid recalculating frequently
export const getCachedCorrelations = query({
  args: {},
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    // Look for cached results
    const cache = await ctx.db
      .query("correlation_cache")
      .withIndex("by_user", q => q.eq("user_id", userId))
      .first();

    if (!cache) {
      return null; // No cache found
    }

    const now = new Date();
    const validUntil = new Date(cache.validUntil);

    if (now > validUntil) {
      return null; // Cache expired
    }

    return cache.correlations;
  },
});

// Store correlation results in cache
export const cacheCorrelations = mutation({
  args: {
    correlations: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    const now = new Date();
    const validUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Valid for 1 week

    // Check if cache already exists
    const existingCache = await ctx.db
      .query("correlation_cache")
      .withIndex("by_user", q => q.eq("user_id", userId))
      .first();

    if (existingCache) {
      // Update existing cache
      await ctx.db.patch(existingCache._id, {
        correlations: args.correlations,
        calculatedAt: now.toISOString(),
        validUntil: validUntil.toISOString(),
      });
    } else {
      // Create new cache
      await ctx.db.insert("correlation_cache", {
        user_id: userId,
        correlations: args.correlations,
        calculatedAt: now.toISOString(),
        validUntil: validUntil.toISOString(),
      });
    }

    return args.correlations;
  },
});

// Get correlation insights for chat context
export const getCorrelationInsights = query({
  args: {
    relevantHabits: v.optional(v.array(v.string())), // Habit names that are relevant to current query
    maxInsights: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const maxInsights = args.maxInsights || 3;

    // Try to get cached correlations first
    let correlations = await getCachedCorrelations(ctx, {});

    if (!correlations) {
      // Calculate fresh correlations if no cache
      correlations = await calculateHabitCorrelations(ctx, {});
      
      // Cache the results
      if (correlations.length > 0) {
        await cacheCorrelations(ctx, { correlations });
      }
    }

    if (!correlations || correlations.length === 0) {
      return [];
    }

    // Filter to relevant habits if specified
    let relevantCorrelations = correlations;
    if (args.relevantHabits && args.relevantHabits.length > 0) {
      relevantCorrelations = correlations.filter(corr => 
        args.relevantHabits!.some(habit => 
          corr.habitA.toLowerCase().includes(habit.toLowerCase()) ||
          corr.habitB.toLowerCase().includes(habit.toLowerCase())
        )
      );
    }

    // Return strongest correlations, limited by maxInsights
    return relevantCorrelations.slice(0, maxInsights);
  },
});

// Smart trigger system to recalculate correlations when needed
export const triggerCorrelationUpdate = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if we should trigger a correlation update
    const shouldUpdate = await shouldTriggerCorrelationUpdate(ctx, args.userId);
    
    if (!shouldUpdate) {
      return { updated: false, reason: "Not enough new events" };
    }

    try {
      // Calculate fresh correlations
      const correlations = await ctx.runQuery(api.correlations.calculateHabitCorrelations, {
        minSampleSize: 10, // Lower threshold for smart triggers
        daysBack: 45,
      });

      // Cache the results
      if (correlations.length > 0) {
        await cacheCorrelations(ctx, { correlations });
      }

      // Update the trigger tracker
      await updateCorrelationTriggerTracker(ctx, args.userId);

      return { updated: true, correlationsFound: correlations.length };
    } catch (error) {
      console.error("Error in triggerCorrelationUpdate:", error);
      return { updated: false, reason: "Calculation failed" };
    }
  },
});

// Helper function to determine if correlations should be recalculated
async function shouldTriggerCorrelationUpdate(ctx: any, userId: string): Promise<boolean> {
  // Get or create trigger tracker
  let tracker = await ctx.db
    .query("correlation_trigger_tracker")
    .withIndex("by_user", q => q.eq("user_id", userId))
    .first();

  if (!tracker) {
    // First time user - create tracker
    await ctx.db.insert("correlation_trigger_tracker", {
      user_id: userId,
      lastUpdateAt: new Date().toISOString(),
      eventsSinceUpdate: 0,
      totalEvents: 0,
    });
    return false; // Don't trigger on first event
  }

  // Count recent habit events
  const recentEvents = await ctx.db
    .query("habit_events")
    .withIndex("by_user", q => q.eq("user_id", userId))
    .filter(q => q.gte(q.field("created_at"), tracker.lastUpdateAt))
    .collect();

  const newEventsCount = recentEvents.length;

  // Trigger conditions (UX-optimized):
  // 1. Every 6-8 events (not too frequent to avoid performance issues)
  // 2. User has at least 14 total events (minimum for meaningful correlations)
  // 3. At least 3 days since last update (prevent multiple triggers per day)
  const totalEvents = tracker.totalEvents + newEventsCount;
  const daysSinceUpdate = Math.floor(
    (new Date().getTime() - new Date(tracker.lastUpdateAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    newEventsCount >= 6 && // Smart trigger threshold
    totalEvents >= 14 && // Minimum meaningful data
    daysSinceUpdate >= 3 // Prevent spam
  );
}

// Helper function to update the trigger tracker
async function updateCorrelationTriggerTracker(ctx: any, userId: string) {
  const tracker = await ctx.db
    .query("correlation_trigger_tracker")
    .withIndex("by_user", q => q.eq("user_id", userId))
    .first();

  if (tracker) {
    // Count total events for this user
    const totalEvents = await ctx.db
      .query("habit_events")
      .withIndex("by_user", q => q.eq("user_id", userId))
      .collect()
      .then(events => events.length);

    await ctx.db.patch(tracker._id, {
      lastUpdateAt: new Date().toISOString(),
      eventsSinceUpdate: 0,
      totalEvents,
    });
  }
}

// Fast correlation insights with graceful degradation
export const getFastCorrelationInsights = query({
  args: {
    relevantHabits: v.optional(v.array(v.string())),
    maxInsights: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const maxInsights = args.maxInsights || 2;

    try {
      // Try to get cached correlations first (should be fast)
      let correlations = await getCachedCorrelations(ctx, {});
      
      if (!correlations || correlations.length === 0) {
        // Graceful degradation: return empty array instead of calculating
        // The smart trigger system will update correlations in background
        return [];
      }

      // Filter to relevant habits if specified (but allow empty array to mean "all correlations")
      let relevantCorrelations = correlations;
      if (args.relevantHabits && args.relevantHabits.length > 0) {
        relevantCorrelations = correlations.filter(corr => 
          args.relevantHabits!.some(habit => 
            corr.habitA.toLowerCase().includes(habit.toLowerCase()) ||
            corr.habitB.toLowerCase().includes(habit.toLowerCase())
          )
        );
      }

      return relevantCorrelations.slice(0, maxInsights);
    } catch (error) {
      console.error("Error in getFastCorrelationInsights:", error);
      return []; // Graceful degradation
    }
  },
});