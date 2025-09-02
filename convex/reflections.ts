import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get current draft reflection for today
export const getCurrentDraft = query({
  args: {
    userId: v.string(),
    date: v.string(), // YYYY-MM-DD
    promptType: v.union(v.literal("morning"), v.literal("evening")),
  },
  handler: async (ctx, args) => {
    const draft = await ctx.db
      .query("daily_reflections")
      .withIndex("by_user_date_type", (q) =>
        q.eq("user_id", args.userId)
         .eq("date", args.date)
         .eq("prompt_type", args.promptType)
      )
      .filter((q) => q.eq(q.field("is_draft"), true))
      .first();

    if (!draft) return null;

    return {
      id: draft._id,
      user_id: draft.user_id,
      date: draft.date,
      prompt_type: draft.prompt_type,
      content: draft.content,
      is_draft: draft.is_draft,
      is_journaled: draft.is_journaled,
      created_at: draft.created_at,
      updated_at: draft.updated_at,
    };
  },
});

// Save or update draft reflection
export const saveDraft = mutation({
  args: {
    userId: v.string(),
    date: v.string(), // YYYY-MM-DD
    promptType: v.union(v.literal("morning"), v.literal("evening")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    // Check if draft already exists
    const existingDraft = await ctx.db
      .query("daily_reflections")
      .withIndex("by_user_date_type", (q) =>
        q.eq("user_id", args.userId)
         .eq("date", args.date)
         .eq("prompt_type", args.promptType)
      )
      .filter((q) => q.eq(q.field("is_draft"), true))
      .first();

    if (existingDraft) {
      // Update existing draft (preserve journaled status)
      await ctx.db.patch(existingDraft._id, {
        content: args.content,
        updated_at: now,
        // Reset journaled status if user is editing after journaling
        is_journaled: false,
      });
      return existingDraft._id;
    } else {
      // Create new draft
      const draftId = await ctx.db.insert("daily_reflections", {
        user_id: args.userId,
        date: args.date,
        prompt_type: args.promptType,
        content: args.content,
        is_draft: true,
        created_at: now,
        updated_at: now,
      });
      return draftId;
    }
  },
});

// Convert draft to journal entry and remove draft
export const saveToJournal = mutation({
  args: {
    userId: v.string(),
    date: v.string(), // YYYY-MM-DD
    promptType: v.union(v.literal("morning"), v.literal("evening")),
    content: v.string(),
    promptText: v.string(), // The original prompt question
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    // Create journal entry title based on prompt type
    const title = args.promptType === 'morning' 
      ? `Morning Reflection`
      : `Evening Reflection`;
    
    const journalContent = `${args.promptText}\n\n${args.content}`;

    // Create journal entry
    const journalId = await ctx.db.insert("journal_entries", {
      user_id: args.userId,
      date: args.date,
      title: title,
      content: journalContent,
      created_at: now,
      updated_at: now,
    });

    // Mark the draft as journaled (keep it for Today screen)
    const existingDraft = await ctx.db
      .query("daily_reflections")
      .withIndex("by_user_date_type", (q) =>
        q.eq("user_id", args.userId)
         .eq("date", args.date)
         .eq("prompt_type", args.promptType)
      )
      .filter((q) => q.eq(q.field("is_draft"), true))
      .first();

    if (existingDraft) {
      await ctx.db.patch(existingDraft._id, {
        is_journaled: true,
        updated_at: now,
      });
    }

    return journalId;
  },
});

// Delete draft reflection
export const deleteDraft = mutation({
  args: {
    userId: v.string(),
    date: v.string(), // YYYY-MM-DD
    promptType: v.union(v.literal("morning"), v.literal("evening")),
  },
  handler: async (ctx, args) => {
    const existingDraft = await ctx.db
      .query("daily_reflections")
      .withIndex("by_user_date_type", (q) =>
        q.eq("user_id", args.userId)
         .eq("date", args.date)
         .eq("prompt_type", args.promptType)
      )
      .filter((q) => q.eq(q.field("is_draft"), true))
      .first();

    if (existingDraft) {
      await ctx.db.delete(existingDraft._id);
      return existingDraft._id;
    }
    
    return null;
  },
});

// Clean up old drafts (older than 48 hours)
export const cleanupOldDrafts = mutation({
  args: {},
  handler: async (ctx) => {
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const cutoffDate = twoDaysAgo.toISOString().split('T')[0]; // YYYY-MM-DD
    
    const oldDrafts = await ctx.db
      .query("daily_reflections")
      .withIndex("by_draft_status", (q) => q.eq("is_draft", true))
      .filter((q) => q.lt(q.field("date"), cutoffDate))
      .collect();

    // Delete old drafts
    for (const draft of oldDrafts) {
      await ctx.db.delete(draft._id);
    }

    return oldDrafts.length;
  },
});

// Get all reflections for a user (both drafts and saved)
export const getUserReflections = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const reflections = await ctx.db
      .query("daily_reflections")
      .withIndex("by_user", (q) => q.eq("user_id", args.userId))
      .order("desc")
      .take(args.limit ?? 50);

    return reflections.map(reflection => ({
      id: reflection._id,
      user_id: reflection.user_id,
      date: reflection.date,
      prompt_type: reflection.prompt_type,
      content: reflection.content,
      is_draft: reflection.is_draft,
      is_journaled: reflection.is_journaled,
      created_at: reflection.created_at,
      updated_at: reflection.updated_at,
    }));
  },
});