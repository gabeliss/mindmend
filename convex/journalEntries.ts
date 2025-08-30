import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get journal entries for a user
export const getJournalEntries = query({
  args: { 
    userId: v.string(),
    limit: v.optional(v.number()), // Optional limit for pagination
  },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("journal_entries")
      .withIndex("by_user", (q) => q.eq("user_id", args.userId))
      .order("desc") // Most recent first
      .take(args.limit ?? 100); // Default to 100 entries

    return entries.map(entry => ({
      id: entry._id,
      user_id: entry.user_id,
      date: entry.date,
      title: entry.title,
      content: entry.content,
      created_at: entry.created_at,
      updated_at: entry.updated_at,
    }));
  },
});

// Get a specific journal entry by ID
export const getJournalEntry = query({
  args: {
    entryId: v.id("journal_entries"),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.entryId);
    
    if (!entry) return null;

    return {
      id: entry._id,
      user_id: entry.user_id,
      date: entry.date,
      title: entry.title,
      content: entry.content,
      created_at: entry.created_at,
      updated_at: entry.updated_at,
    };
  },
});

// Get journal entries within a date range
export const getJournalEntriesInRange = query({
  args: {
    userId: v.string(),
    startDate: v.string(), // YYYY-MM-DD
    endDate: v.string(),   // YYYY-MM-DD
  },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("journal_entries")
      .withIndex("by_user_date", (q) =>
        q.eq("user_id", args.userId)
         .gte("date", args.startDate)
         .lte("date", args.endDate)
      )
      .order("desc")
      .collect();

    return entries.map(entry => ({
      id: entry._id,
      user_id: entry.user_id,
      date: entry.date,
      title: entry.title,
      content: entry.content,
      created_at: entry.created_at,
      updated_at: entry.updated_at,
    }));
  },
});

// Create a new journal entry
export const createJournalEntry = mutation({
  args: {
    userId: v.string(),
    date: v.string(), // YYYY-MM-DD
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    const entryId = await ctx.db.insert("journal_entries", {
      user_id: args.userId,
      date: args.date,
      title: args.title,
      content: args.content,
      created_at: now,
      updated_at: now,
    });

    return entryId;
  },
});

// Update a journal entry
export const updateJournalEntry = mutation({
  args: {
    entryId: v.id("journal_entries"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { entryId, ...updates } = args;
    
    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    // Add updated timestamp
    filteredUpdates.updated_at = new Date().toISOString();

    await ctx.db.patch(entryId, filteredUpdates);
    return entryId;
  },
});

// Delete a journal entry
export const deleteJournalEntry = mutation({
  args: {
    entryId: v.id("journal_entries"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.entryId);
    return args.entryId;
  },
});

// Get journal entries count for a user
export const getJournalEntriesCount = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("journal_entries")
      .withIndex("by_user", (q) => q.eq("user_id", args.userId))
      .collect();

    return entries.length;
  },
});

// Get journal entries for a specific month/year (for grouping)
export const getJournalEntriesForMonth = query({
  args: {
    userId: v.string(),
    year: v.number(),
    month: v.number(), // 1-12
  },
  handler: async (ctx, args) => {
    // Create start and end dates for the month
    const startDate = `${args.year}-${String(args.month).padStart(2, '0')}-01`;
    const nextMonth = args.month === 12 ? 1 : args.month + 1;
    const nextYear = args.month === 12 ? args.year + 1 : args.year;
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
    
    const entries = await ctx.db
      .query("journal_entries")
      .withIndex("by_user_date", (q) =>
        q.eq("user_id", args.userId)
         .gte("date", startDate)
         .lt("date", endDate)
      )
      .order("desc")
      .collect();

    return entries.map(entry => ({
      id: entry._id,
      user_id: entry.user_id,
      date: entry.date,
      title: entry.title,
      content: entry.content,
      created_at: entry.created_at,
      updated_at: entry.updated_at,
    }));
  },
});