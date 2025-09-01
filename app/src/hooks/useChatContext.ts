import { useQuery } from "convex/react";
import { api } from "../services/convex";
import { QueryContext } from "../types/chat";
import { useAuth } from "./useAuth";

export interface UseChatContextOptions {
  query?: string;
  includeJournals?: boolean;
  maxJournalEntries?: number;
  habitHistoryDays?: number;
}

export function useChatContext(options?: UseChatContextOptions) {
  const { 
    query, 
    includeJournals = true, 
    maxJournalEntries = 3, 
    habitHistoryDays = 30 
  } = options || {};

  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Only make queries if user is authenticated
  const shouldQuery = isAuthenticated && !authLoading;

  // Get user's timezone offset (in minutes from UTC)
  const timezoneOffset = new Date().getTimezoneOffset() * -1; // Flip sign to match convention

  // If no query provided, just get basic context
  const basicContext = useQuery(
    api.chatContext.getChatContext,
    shouldQuery && !query ? { timezoneOffset } : "skip"
  );

  // If query provided, get enhanced context
  const queryContext = useQuery(
    api.chatContext.getQueryContext,
    shouldQuery && query ? {
      query,
      includeJournals,
      maxJournalEntries,
      habitHistoryDays,
      timezoneOffset,
    } : "skip"
  );

  // Return the appropriate context
  const context = query ? queryContext : basicContext;
  const isLoading = authLoading || context === undefined;
  
  return {
    context: context as QueryContext | null,
    isLoading,
    isAuthenticated,
  };
}

// Helper function to format context for AI prompt
export function formatContextForAI(context: QueryContext | null): string {
  if (!context) return "";

  let prompt = `Current Context (${context.currentDate}):\n\n`;

  // Basic info
  prompt += `Active Habits (${context.activeHabits.length}):\n`;
  context.activeHabits.forEach(habit => {
    const status = context.todayHabitStatus.find(s => s.id === habit.id);
    const statusText = status ? status.status : "not_marked";
    prompt += `- ${habit.name} (${habit.type}): ${statusText}`;
    if (status?.value) prompt += ` (${status.value} ${habit.unit || ''})`;
    if (status?.note) prompt += ` - Note: ${status.note}`;
    prompt += `\n`;
  });

  // Daily plan summary
  if (context.todayPlan) {
    prompt += `\nToday's Plan: ${context.todayPlan.completedCount}/${context.todayPlan.totalCount} tasks completed\n`;
  }

  // Primary habit context if available
  if (context.primaryHabitContext) {
    const habit = context.primaryHabitContext;
    prompt += `\nDetailed Context for "${habit.habit.name}":\n`;
    prompt += `- Current streak: ${habit.currentStreak} days\n`;
    prompt += `- Completion rate (last ${habit.totalEvents} events): ${(habit.completionRate * 100).toFixed(1)}%\n`;
    prompt += `- Recent pattern: `;
    
    // Show last 7 days of events
    const recentEvents = habit.recentEvents
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7);
    
    prompt += recentEvents.map(e => {
      let eventStr = `${e.date}: ${e.status}`;
      if (e.value) eventStr += ` (${e.value})`;
      if (e.note) eventStr += ` - ${e.note}`;
      return eventStr;
    }).join(', ') + `\n`;
  }

  // Relevant journal entries
  if (context.relevantJournals && context.relevantJournals.length > 0) {
    prompt += `\nRelevant Journal Entries:\n`;
    context.relevantJournals.forEach(entry => {
      prompt += `- ${entry.date}: "${entry.title}"\n`;
      prompt += `  ${entry.content.substring(0, 200)}${entry.content.length > 200 ? '...' : ''}\n\n`;
    });
  }

  return prompt;
}