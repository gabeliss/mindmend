import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});


// Helper function to format context for AI (server-side version)
function formatContextForAI(context: any, correlationInsights?: any[]): string {
  if (!context) return "";

  let prompt = `Current Context (${context.currentDate}):\n\n`;

  // Basic info
  prompt += `Active Habits (${context.activeHabits.length}):\n`;
  context.activeHabits.forEach((habit: any) => {
    const status = context.todayHabitStatus.find((s: any) => s.id === habit.id);
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
      .sort((a: any, b: any) => b.date.localeCompare(a.date))
      .slice(0, 7);
    
    prompt += recentEvents.map((e: any) => {
      let eventStr = `${e.date}: ${e.status}`;
      if (e.value) eventStr += ` (${e.value})`;
      if (e.note) eventStr += ` - ${e.note}`;
      return eventStr;
    }).join(', ') + `\n`;
  }

  // Relevant journal entries
  if (context.relevantJournals && context.relevantJournals.length > 0) {
    prompt += `\nRelevant Journal Entries:\n`;
    context.relevantJournals.forEach((entry: any) => {
      prompt += `- ${entry.date}: "${entry.title}"\n`;
      prompt += `  ${entry.content.substring(0, 200)}${entry.content.length > 200 ? '...' : ''}\n\n`;
    });
  }

  // Habit correlation insights
  if (correlationInsights && correlationInsights.length > 0) {
    prompt += `\nHabit Pattern Insights:\n`;
    correlationInsights.forEach((insight: any) => {
      prompt += `- ${insight.description} (${Math.round(insight.confidence * 100)}% confidence, ${insight.sampleSize} days data)\n`;
    });
    prompt += `\n`;
  }

  return prompt;
}


export const sendChatMessage = action({
  args: {
    message: v.string(),
    includeJournals: v.optional(v.boolean()),
    maxJournalEntries: v.optional(v.number()),
    habitHistoryDays: v.optional(v.number()),
    timezoneOffset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    try {
      // Get chat context using the existing query
      const context = await ctx.runQuery(api.chatContext.getChatContext, {
        timezoneOffset: args.timezoneOffset,
      });

      // Get ALL correlation insights for AI to understand and filter intelligently
      const allCorrelationInsights = await ctx.runQuery(api.correlations.getFastCorrelationInsights, {
        relevantHabits: [], // Get all correlations, let AI decide what's relevant
        maxInsights: 10, // Give AI more data to work with
      });

      // Format context for AI
      const contextPrompt = formatContextForAI(context, allCorrelationInsights);
      
      // Create system prompt
      const systemPrompt = `You are a helpful AI assistant for a personal development app called MindMend. You help users with their habits, daily planning, and journaling.

Key principles:
- Be encouraging and supportive, especially when users struggle or fail at habits
- Provide actionable insights based on their actual data
- Suggest specific improvements or patterns you notice
- Keep responses concise but helpful (2-4 sentences max)
- Reference their actual habit data, streaks, and progress when relevant
- If they mention failing or struggling, acknowledge it warmly and offer practical next steps
- Focus on progress over perfection - celebrate small wins
- Be conversational and friendly, not robotic

Natural Language Understanding:
- When users ask about correlations between habits, understand the INTENT behind their words
- Bridge the gap between their question and the actual habit data
- Example: "Does PMO avoidance affect my workouts?" → Look for correlations between "Avoid PMO" habit and exercise habits
- Example: "How does my morning routine impact my day?" → Look for correlations involving early habits and later habits
- Example: "When I skip meditation, what happens?" → Look for patterns when meditation is missed

Progressive Enhancement Strategy:
- ALWAYS provide helpful responses based on basic habit data (streaks, completion rates)  
- Use your understanding of human behavior and the user's specific habits to interpret vague questions
- When correlation data is available, reference specific patterns you see in their data
- Connect user's natural language to their actual habit names (even if names are different from common terms)
- If asking about specific correlations, prioritize those insights in your response
- Focus on actionable insights: "I notice when you do X, Y tends to happen - try leveraging this pattern"

${contextPrompt}

Respond to the user's message with this context in mind. Always reference their specific data when available.`;

      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: args.message }
        ],
        max_tokens: 200,
        temperature: 0.7,
      });

      const aiResponse = response.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No response from OpenAI');
      }

      return {
        response: aiResponse,
        context: context,
      };

    } catch (error) {
      console.error('Error in sendChatMessage:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined,
      });
      
      // Return a helpful fallback message with error details for debugging
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        response: `I'm having trouble connecting to my AI brain right now (Error: ${errorMessage}). Let me know if you'd like me to try again!`,
        context: null,
      };
    }
  },
});