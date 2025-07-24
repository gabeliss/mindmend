import OpenAI from 'openai';
import OpenAIConfig from '../config/openai';
import { AppError } from '../types';
import Logger from '../utils/logger';
import { aiRateLimitService } from './aiRateLimitService';

export interface AIGenerationOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  userId?: string;
}

export interface AIResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

export interface JournalInsightData {
  entries: Array<{
    date: string;
    content: string;
    moodRating?: number;
    title?: string;
  }>;
  moodTrend: Array<{
    date: string;
    avgMood: number | null;
  }>;
  habitData?: Array<{
    habitTitle: string;
    completionRate: number;
    streakLength: number;
  }>;
}

export interface WeeklySummaryData extends JournalInsightData {
  weekStart: string;
  weekEnd: string;
  overallStats: {
    totalEntries: number;
    avgMood: number | null;
    habitCompletionRate: number;
  };
}

export class AIService {
  private openai: OpenAI;
  private readonly DEFAULT_MODEL = 'gpt-3.5-turbo';
  private readonly DEFAULT_TEMPERATURE = 0.7;
  private readonly DEFAULT_MAX_TOKENS = 500;

  constructor() {
    this.openai = OpenAIConfig.getClient();
  }

  private async executeWithRateLimit(
    userId: string | undefined,
    estimatedTokens: number,
    model: string,
    operation: () => Promise<OpenAI.Chat.Completions.ChatCompletion>
  ): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    // Check rate limits if userId is provided
    if (userId) {
      const rateCheck = await aiRateLimitService.checkRateLimit(
        userId,
        estimatedTokens,
        model
      );

      if (!rateCheck.allowed) {
        throw new AppError(`Rate limit exceeded: ${rateCheck.reason}`, 429);
      }
    }

    const response = await operation();

    // Record usage for rate limiting and cost tracking
    if (userId && response.usage) {
      await aiRateLimitService.recordUsage(
        userId,
        response.model,
        response.usage.prompt_tokens || 0,
        response.usage.completion_tokens || 0
      );
    }

    return response;
  }

  async generateDailyInsight(
    data: JournalInsightData,
    options: AIGenerationOptions = {}
  ): Promise<AIResponse> {
    try {
      const prompt = this.buildDailyInsightPrompt(data);
      const model = options.model || this.DEFAULT_MODEL;
      
      const response = await this.executeWithRateLimit(
        options.userId,
        500, // Estimated tokens for daily insights
        model,
        () => this.openai.chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt('daily_insight'),
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: options.temperature || this.DEFAULT_TEMPERATURE,
          max_tokens: options.maxTokens || this.DEFAULT_MAX_TOKENS,
        })
      );

      const choice = response.choices[0];
      if (!choice.message.content) {
        throw new AppError('Empty response from OpenAI', 500);
      }

      Logger.info('Generated daily insight', {
        userId: options.userId,
        usage: response.usage,
        model: response.model,
      });

      return {
        content: choice.message.content,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
        model: response.model,
      };
    } catch (error) {
      Logger.error('Failed to generate daily insight', { error, userId: options.userId });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to generate daily insight', 500);
    }
  }

  async generateWeeklySummary(
    data: WeeklySummaryData,
    options: AIGenerationOptions = {}
  ): Promise<AIResponse> {
    try {
      const prompt = this.buildWeeklySummaryPrompt(data);
      
      const response = await this.openai.chat.completions.create({
        model: options.model || this.DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt('weekly_summary'),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: options.temperature || this.DEFAULT_TEMPERATURE,
        max_tokens: options.maxTokens || 800, // Longer for weekly summaries
      });

      const choice = response.choices[0];
      if (!choice.message.content) {
        throw new AppError('Empty response from OpenAI', 500);
      }

      Logger.info('Generated weekly summary', {
        userId: options.userId,
        usage: response.usage,
        model: response.model,
      });

      return {
        content: choice.message.content,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
        model: response.model,
      };
    } catch (error) {
      Logger.error('Failed to generate weekly summary', { error, userId: options.userId });
      throw new AppError('Failed to generate weekly summary', 500);
    }
  }

  async detectPatterns(
    data: JournalInsightData,
    options: AIGenerationOptions = {}
  ): Promise<AIResponse> {
    try {
      const prompt = this.buildPatternDetectionPrompt(data);
      
      const response = await this.openai.chat.completions.create({
        model: options.model || this.DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt('pattern_detection'),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: options.temperature || 0.5, // Lower temperature for pattern detection
        max_tokens: options.maxTokens || 400,
      });

      const choice = response.choices[0];
      if (!choice.message.content) {
        throw new AppError('Empty response from OpenAI', 500);
      }

      Logger.info('Generated pattern detection', {
        userId: options.userId,
        usage: response.usage,
        model: response.model,
      });

      return {
        content: choice.message.content,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
        model: response.model,
      };
    } catch (error) {
      Logger.error('Failed to detect patterns', { error, userId: options.userId });
      throw new AppError('Failed to detect patterns', 500);
    }
  }

  async generateMotivationalTip(
    coachStyle: 'supportive' | 'direct' | 'motivational',
    context?: { recentMood?: number; strugglingHabit?: string },
    options: AIGenerationOptions = {}
  ): Promise<AIResponse> {
    try {
      const prompt = this.buildMotivationalTipPrompt(coachStyle, context);
      
      const response = await this.openai.chat.completions.create({
        model: options.model || this.DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt('motivational_tip'),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: options.temperature || 0.8, // Higher creativity for tips
        max_tokens: options.maxTokens || 200, // Shorter for tips
      });

      const choice = response.choices[0];
      if (!choice.message.content) {
        throw new AppError('Empty response from OpenAI', 500);
      }

      Logger.info('Generated motivational tip', {
        userId: options.userId,
        coachStyle,
        usage: response.usage,
        model: response.model,
      });

      return {
        content: choice.message.content,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
        model: response.model,
      };
    } catch (error) {
      Logger.error('Failed to generate motivational tip', { error, userId: options.userId });
      throw new AppError('Failed to generate motivational tip', 500);
    }
  }

  private getSystemPrompt(type: string): string {
    const prompts = {
      daily_insight: `You are a supportive mental health and habit coach. Your role is to provide encouraging, actionable insights based on a user's journal entries and habit tracking data. 

Key guidelines:
- Be empathetic and supportive
- Focus on positive progress and growth
- Provide actionable suggestions
- Keep responses concise and encouraging
- Never provide medical advice or diagnose conditions
- Celebrate small wins and progress`,

      weekly_summary: `You are a thoughtful life coach creating weekly reflection summaries. Your role is to help users understand their patterns, celebrate progress, and plan for improvement.

Key guidelines:
- Provide a balanced view of the week's highs and lows
- Identify patterns in mood, habits, and journal entries
- Celebrate achievements and progress
- Offer gentle guidance for areas of improvement
- Keep the tone hopeful and forward-looking
- Structure the summary with clear sections: highlights, patterns, and suggestions`,

      pattern_detection: `You are an analytical coach focused on identifying meaningful patterns in user behavior and mood data. Your goal is to surface insights that can help users better understand themselves.

Key guidelines:
- Look for correlations between mood, habits, and journal content
- Identify both positive and concerning patterns
- Be specific about observations with evidence
- Avoid making assumptions beyond the data
- Present findings in a clear, actionable way
- Focus on patterns that could be most helpful for the user to know`,

      motivational_tip: `You are a personalized life coach providing daily motivational tips. Your style should adapt to the user's coaching preference while maintaining a positive, encouraging tone.

Key guidelines:
- Adapt your communication style to the user's preference
- Keep tips practical and actionable
- Be encouraging without being overly cheerful
- Focus on small, achievable steps
- Relate tips to the user's current situation when possible`,
    };

    return prompts[type as keyof typeof prompts] || prompts.daily_insight;
  }

  private buildDailyInsightPrompt(data: JournalInsightData): string {
    let prompt = "Based on the following user data, provide a supportive daily insight:\n\n";

    // Recent journal entries
    if (data.entries.length > 0) {
      prompt += "RECENT JOURNAL ENTRIES:\n";
      data.entries.forEach((entry, index) => {
        prompt += `${entry.date}: "${entry.content}"`;
        if (entry.moodRating) prompt += ` (Mood: ${entry.moodRating}/10)`;
        prompt += "\n";
      });
      prompt += "\n";
    }

    // Mood trend
    if (data.moodTrend.length > 0) {
      prompt += "MOOD TREND (last 7 days):\n";
      data.moodTrend.forEach(day => {
        prompt += `${day.date}: ${day.avgMood ? `${day.avgMood}/10` : 'No data'}\n`;
      });
      prompt += "\n";
    }

    // Habit data if available
    if (data.habitData && data.habitData.length > 0) {
      prompt += "HABIT PROGRESS:\n";
      data.habitData.forEach(habit => {
        prompt += `${habit.habitTitle}: ${habit.completionRate}% completion rate, ${habit.streakLength} day streak\n`;
      });
      prompt += "\n";
    }

    prompt += "Please provide a brief, encouraging insight (2-3 sentences) that celebrates progress and offers gentle guidance.";

    return prompt;
  }

  private buildWeeklySummaryPrompt(data: WeeklySummaryData): string {
    let prompt = `Create a weekly summary for ${data.weekStart} to ${data.weekEnd}:\n\n`;

    prompt += `WEEK OVERVIEW:\n`;
    prompt += `- Total journal entries: ${data.overallStats.totalEntries}\n`;
    prompt += `- Average mood: ${data.overallStats.avgMood ? `${data.overallStats.avgMood}/10` : 'No mood data'}\n`;
    prompt += `- Habit completion rate: ${data.overallStats.habitCompletionRate}%\n\n`;

    // Journal entries for the week
    if (data.entries.length > 0) {
      prompt += "JOURNAL ENTRIES THIS WEEK:\n";
      data.entries.forEach(entry => {
        prompt += `${entry.date}: "${entry.content}"`;
        if (entry.moodRating) prompt += ` (Mood: ${entry.moodRating}/10)`;
        prompt += "\n";
      });
      prompt += "\n";
    }

    // Habit progress
    if (data.habitData && data.habitData.length > 0) {
      prompt += "HABIT PROGRESS:\n";
      data.habitData.forEach(habit => {
        prompt += `${habit.habitTitle}: ${habit.completionRate}% completion, ${habit.streakLength} day streak\n`;
      });
      prompt += "\n";
    }

    prompt += "Please create a thoughtful weekly summary with:\n";
    prompt += "1. Key highlights and wins from the week\n";
    prompt += "2. Patterns or themes you notice\n";
    prompt += "3. Gentle suggestions for the week ahead\n";
    prompt += "Keep it encouraging and forward-looking (4-5 sentences total).";

    return prompt;
  }

  private buildPatternDetectionPrompt(data: JournalInsightData): string {
    let prompt = "Analyze the following data for meaningful patterns:\n\n";

    // Journal entries
    if (data.entries.length > 0) {
      prompt += "JOURNAL ENTRIES:\n";
      data.entries.forEach(entry => {
        prompt += `${entry.date}: "${entry.content}"`;
        if (entry.moodRating) prompt += ` (Mood: ${entry.moodRating}/10)`;
        prompt += "\n";
      });
      prompt += "\n";
    }

    // Mood trend
    if (data.moodTrend.length > 0) {
      prompt += "MOOD TREND:\n";
      data.moodTrend.forEach(day => {
        prompt += `${day.date}: ${day.avgMood ? `${day.avgMood}/10` : 'No data'}\n`;
      });
      prompt += "\n";
    }

    prompt += "Look for patterns in:\n";
    prompt += "- Mood fluctuations and their potential triggers\n";
    prompt += "- Recurring themes in journal content\n";
    prompt += "- Relationships between activities and mood\n";
    prompt += "- Progress trends over time\n\n";
    prompt += "Provide 1-2 specific, evidence-based pattern observations that could be helpful for the user to know.";

    return prompt;
  }

  private buildMotivationalTipPrompt(
    coachStyle: 'supportive' | 'direct' | 'motivational',
    context?: { recentMood?: number; strugglingHabit?: string }
  ): string {
    let prompt = `Provide a motivational tip with a ${coachStyle} coaching style.\n\n`;

    const styleGuidelines = {
      supportive: "Use a gentle, understanding tone. Focus on self-compassion and gradual progress.",
      direct: "Be straightforward and practical. Give clear, actionable advice without sugar-coating.",
      motivational: "Be energetic and inspiring. Focus on potential and achievement."
    };

    prompt += `Style: ${styleGuidelines[coachStyle]}\n\n`;

    if (context?.recentMood) {
      prompt += `Recent mood level: ${context.recentMood}/10\n`;
    }

    if (context?.strugglingHabit) {
      prompt += `User is struggling with: ${context.strugglingHabit}\n`;
    }

    prompt += "\nProvide a brief, personalized tip (1-2 sentences) that matches the coaching style and addresses the context if provided.";

    return prompt;
  }
}

export const aiService = new AIService();