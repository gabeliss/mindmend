import { QueryContext } from '../types/chat';
import { formatContextForAI } from '../hooks/useChatContext';
import { api, convex } from '../services/convex';

// AI-powered chat with context via Convex backend
export async function sendMessageWithContext(
  userMessage: string,
  context: QueryContext | null
): Promise<string> {
  try {
    // Get user's timezone offset
    const timezoneOffset = new Date().getTimezoneOffset() * -1;

    // Call Convex backend function
    const result = await convex.action(api.chat.sendChatMessage, {
      message: userMessage,
      includeJournals: true,
      maxJournalEntries: 3,
      habitHistoryDays: 30,
      timezoneOffset,
    });

    return result.response;
    
  } catch (error) {
    console.error('Error sending message with context:', error);
    
    // Fallback to mock response if backend fails
    console.log('Falling back to mock response...');
    return generateMockResponse(userMessage, context);
  }
}

// Mock response generator that demonstrates context awareness
function generateMockResponse(userMessage: string, context: QueryContext | null): string {
  const message = userMessage.toLowerCase();
  
  if (!context) {
    return "I'd love to help you! Let me gather some context about your habits and progress first.";
  }

  // Habit-related queries
  if (message.includes('habit') || message.includes('doing') || message.includes('progress')) {
    const completedToday = context.todayHabitStatus.filter(h => h.status === 'completed').length;
    const totalHabits = context.activeHabits.length;
    
    let response = `Looking at your habits today, you've completed ${completedToday} out of ${totalHabits} habits. `;
    
    if (context.primaryHabitContext) {
      const habit = context.primaryHabitContext;
      response += `Your ${habit.habit.name} habit has a ${habit.currentStreak}-day streak and ${(habit.completionRate * 100).toFixed(0)}% completion rate recently. `;
      
      if (habit.currentStreak === 0) {
        response += `Don't worry about breaking your streak - what matters is getting back on track! `;
      } else if (habit.currentStreak >= 7) {
        response += `Great job maintaining this streak! `;
      }
    }
    
    return response + "What specific aspect would you like to work on?";
  }

  // Planning queries
  if (message.includes('plan') || message.includes('today') || message.includes('tomorrow')) {
    if (context.todayPlan) {
      const { completedCount, totalCount } = context.todayPlan;
      return `You have ${totalCount} tasks planned for today and have completed ${completedCount} so far. ${
        completedCount === totalCount ? "Fantastic work completing everything! " : 
        completedCount > totalCount / 2 ? "You're doing great - keep it up! " : 
        "There's still time to tackle more tasks. "
      }What would you like to focus on next?`;
    } else {
      return "I don't see a daily plan for today. Would you like help creating one based on your habits and goals?";
    }
  }

  // Journal queries
  if (message.includes('feel') || message.includes('reflect') || message.includes('journal')) {
    if (context.relevantJournals && context.relevantJournals.length > 0) {
      const recentEntry = context.relevantJournals[0];
      return `I found some relevant thoughts in your journal entry from ${recentEntry.date}: "${recentEntry.title}". ${
        recentEntry.content.substring(0, 100)
      }... How are you feeling about this now?`;
    } else {
      return "I don't see any recent journal entries related to this topic. Would you like to talk through your thoughts, or would you prefer to write a journal entry first?";
    }
  }

  // Default response with context awareness
  let response = "I understand you're asking about ";
  if (context.relevantHabits.length > 0) {
    response += `something related to your ${context.relevantHabits[0].name} habit. `;
  }
  response += `Based on your current progress (${context.todayHabitStatus.filter(h => h.status === 'completed').length} habits completed today), `;
  response += "I think we can definitely work on this together. Could you tell me more about what specifically you'd like help with?";
  
  return response;
}