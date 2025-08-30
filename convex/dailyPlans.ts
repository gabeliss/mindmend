import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get daily plans for a user within a date range
export const getDailyPlans = query({
  args: { 
    userId: v.string(),
    startDate: v.string(), // YYYY-MM-DD
    endDate: v.string(),   // YYYY-MM-DD
  },
  handler: async (ctx, args) => {
    const plans = await ctx.db
      .query("daily_plans")
      .withIndex("by_user_date", (q) =>
        q.eq("user_id", args.userId)
         .gte("date", args.startDate)
         .lte("date", args.endDate)
      )
      .collect();

    // Get plan items for each plan
    const plansWithItems = await Promise.all(
      plans.map(async (plan) => {
        const items = await ctx.db
          .query("daily_plan_items")
          .withIndex("by_plan_order", (q) =>
            q.eq("daily_plan_id", plan._id)
          )
          .collect();

        return {
          id: plan._id,
          user_id: plan.user_id,
          date: plan.date,
          note: plan.note,
          created_at: plan.created_at,
          entries: items.map(item => ({
            id: item._id,
            daily_plan_id: item.daily_plan_id,
            time: item.time,
            description: item.description,
            completed: item.completed,
            order: item.order,
          }))
        };
      })
    );

    return plansWithItems;
  },
});

// Get a specific daily plan by date
export const getDailyPlan = query({
  args: {
    userId: v.string(),
    date: v.string(), // YYYY-MM-DD
  },
  handler: async (ctx, args) => {
    const plan = await ctx.db
      .query("daily_plans")
      .withIndex("by_user_date", (q) =>
        q.eq("user_id", args.userId).eq("date", args.date)
      )
      .unique();

    if (!plan) return null;

    const items = await ctx.db
      .query("daily_plan_items")
      .withIndex("by_plan_order", (q) =>
        q.eq("daily_plan_id", plan._id)
      )
      .collect();

    return {
      id: plan._id,
      user_id: plan.user_id,
      date: plan.date,
      note: plan.note,
      created_at: plan.created_at,
      entries: items.map(item => ({
        id: item._id,
        daily_plan_id: item.daily_plan_id,
        time: item.time,
        description: item.description,
        completed: item.completed,
        order: item.order,
      }))
    };
  },
});

// Create or update a daily plan
export const upsertDailyPlan = mutation({
  args: {
    userId: v.string(),
    date: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingPlan = await ctx.db
      .query("daily_plans")
      .withIndex("by_user_date", (q) =>
        q.eq("user_id", args.userId).eq("date", args.date)
      )
      .unique();

    if (existingPlan) {
      // Update existing plan
      await ctx.db.patch(existingPlan._id, {
        note: args.note,
      });
      return existingPlan._id;
    } else {
      // Create new plan
      const planId = await ctx.db.insert("daily_plans", {
        user_id: args.userId,
        date: args.date,
        note: args.note,
        created_at: new Date().toISOString(),
      });
      return planId;
    }
  },
});

// Add a plan item
export const addPlanItem = mutation({
  args: {
    userId: v.string(),
    date: v.string(),
    description: v.string(),
    time: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Ensure plan exists
    let plan = await ctx.db
      .query("daily_plans")
      .withIndex("by_user_date", (q) =>
        q.eq("user_id", args.userId).eq("date", args.date)
      )
      .unique();

    if (!plan) {
      const newPlanId = await ctx.db.insert("daily_plans", {
        user_id: args.userId,
        date: args.date,
        created_at: new Date().toISOString(),
      });
      plan = await ctx.db.get(newPlanId);
      if (!plan) throw new Error("Failed to create plan");
    }

    // Get current max order for this plan
    const existingItems = await ctx.db
      .query("daily_plan_items")
      .withIndex("by_plan", (q) => q.eq("daily_plan_id", plan._id))
      .collect();

    const maxOrder = existingItems.length > 0 
      ? Math.max(...existingItems.map(item => item.order))
      : 0;

    // Insert the new item
    const itemId = await ctx.db.insert("daily_plan_items", {
      daily_plan_id: plan._id,
      description: args.description,
      time: args.time,
      completed: false,
      order: maxOrder + 1,
    });

    return itemId;
  },
});

// Update a plan item
export const updatePlanItem = mutation({
  args: {
    itemId: v.id("daily_plan_items"),
    description: v.optional(v.string()),
    time: v.optional(v.string()),
    completed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { itemId, ...updates } = args;
    
    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(itemId, filteredUpdates);
    return itemId;
  },
});

// Delete a plan item
export const deletePlanItem = mutation({
  args: {
    itemId: v.id("daily_plan_items"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.itemId);
    return args.itemId;
  },
});

// Toggle plan item completion
export const togglePlanItem = mutation({
  args: {
    itemId: v.id("daily_plan_items"),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Plan item not found");

    await ctx.db.patch(args.itemId, {
      completed: !item.completed,
    });

    return args.itemId;
  },
});

// Copy plan items from one date to another
export const copyPlanToDate = mutation({
  args: {
    userId: v.string(),
    fromDate: v.string(),
    toDate: v.string(),
  },
  handler: async (ctx, args) => {
    // Get source plan
    const sourcePlan = await ctx.db
      .query("daily_plans")
      .withIndex("by_user_date", (q) =>
        q.eq("user_id", args.userId).eq("date", args.fromDate)
      )
      .unique();

    if (!sourcePlan) return null;

    // Get source items
    const sourceItems = await ctx.db
      .query("daily_plan_items")
      .withIndex("by_plan_order", (q) =>
        q.eq("daily_plan_id", sourcePlan._id)
      )
      .collect();

    if (sourceItems.length === 0) return null;

    // Create or get target plan
    let targetPlan = await ctx.db
      .query("daily_plans")
      .withIndex("by_user_date", (q) =>
        q.eq("user_id", args.userId).eq("date", args.toDate)
      )
      .unique();

    if (!targetPlan) {
      const newPlanId = await ctx.db.insert("daily_plans", {
        user_id: args.userId,
        date: args.toDate,
        created_at: new Date().toISOString(),
      });
      targetPlan = await ctx.db.get(newPlanId);
      if (!targetPlan) throw new Error("Failed to create target plan");
    }

    // Get existing items count for proper ordering
    const existingItems = await ctx.db
      .query("daily_plan_items")
      .withIndex("by_plan", (q) => q.eq("daily_plan_id", targetPlan._id))
      .collect();

    const baseOrder = existingItems.length > 0 
      ? Math.max(...existingItems.map(item => item.order))
      : 0;

    // Copy items to target plan
    const copiedItemIds = await Promise.all(
      sourceItems.map(async (item, index) => {
        return await ctx.db.insert("daily_plan_items", {
          daily_plan_id: targetPlan._id,
          description: item.description,
          time: item.time,
          completed: false, // Reset completion status
          order: baseOrder + index + 1,
        });
      })
    );

    return copiedItemIds;
  },
});

// Move incomplete items from one date to another
export const moveIncompleteTasks = mutation({
  args: {
    userId: v.string(),
    fromDate: v.string(),
    toDate: v.string(),
  },
  handler: async (ctx, args) => {
    // Get source plan
    const sourcePlan = await ctx.db
      .query("daily_plans")
      .withIndex("by_user_date", (q) =>
        q.eq("user_id", args.userId).eq("date", args.fromDate)
      )
      .unique();

    if (!sourcePlan) return null;

    // Get incomplete items
    const sourceItems = await ctx.db
      .query("daily_plan_items")
      .withIndex("by_plan", (q) => q.eq("daily_plan_id", sourcePlan._id))
      .collect();

    const incompleteItems = sourceItems.filter(item => !item.completed);
    
    if (incompleteItems.length === 0) return null;

    // Create or get target plan
    let targetPlan = await ctx.db
      .query("daily_plans")
      .withIndex("by_user_date", (q) =>
        q.eq("user_id", args.userId).eq("date", args.toDate)
      )
      .unique();

    if (!targetPlan) {
      const newPlanId = await ctx.db.insert("daily_plans", {
        user_id: args.userId,
        date: args.toDate,
        created_at: new Date().toISOString(),
      });
      targetPlan = await ctx.db.get(newPlanId);
      if (!targetPlan) throw new Error("Failed to create target plan");
    }

    // Get existing items count for proper ordering
    const existingItems = await ctx.db
      .query("daily_plan_items")
      .withIndex("by_plan", (q) => q.eq("daily_plan_id", targetPlan._id))
      .collect();

    const baseOrder = existingItems.length > 0 
      ? Math.max(...existingItems.map(item => item.order))
      : 0;

    // Move incomplete items to target plan
    const movedItemIds = await Promise.all(
      incompleteItems.map(async (item, index) => {
        // Create new item in target plan
        const newItemId = await ctx.db.insert("daily_plan_items", {
          daily_plan_id: targetPlan._id,
          description: item.description,
          time: item.time,
          completed: false,
          order: baseOrder + index + 1,
        });

        // Delete from source plan
        await ctx.db.delete(item._id);

        return newItemId;
      })
    );

    return movedItemIds;
  },
});

// Clean up old plans (optional - for maintenance)
export const cleanupOldPlans = mutation({
  args: {
    userId: v.string(),
    daysToKeep: v.number(), // Keep plans from the last N days
  },
  handler: async (ctx, args) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - args.daysToKeep);
    const cutoffString = cutoffDate.toISOString().split('T')[0];

    const oldPlans = await ctx.db
      .query("daily_plans")
      .withIndex("by_user", (q) => q.eq("user_id", args.userId))
      .filter((q) => q.lt(q.field("date"), cutoffString))
      .collect();

    // Delete plan items first (due to foreign key relationship)
    for (const plan of oldPlans) {
      const items = await ctx.db
        .query("daily_plan_items")
        .withIndex("by_plan", (q) => q.eq("daily_plan_id", plan._id))
        .collect();

      for (const item of items) {
        await ctx.db.delete(item._id);
      }

      await ctx.db.delete(plan._id);
    }

    return oldPlans.length;
  },
});