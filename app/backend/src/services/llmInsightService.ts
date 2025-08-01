import { PrismaClient } from '@prisma/client';
import { AIInsightData } from '../types';
import { aiService, AIGenerationOptions } from './aiService';
import Logger from '../utils/logger';

const prisma = new PrismaClient();

interface UserContext {
	habits: Array<{
		habit: { title: string };
		eventType: string;
		occurredAt: Date;
	}>;
	moods: Array<{
		moodRating: number;
		createdAt: Date;
	}>;
	dailyStats: Array<{
		date: Date;
		habitsCompleted: number;
		habitsTotal: number;
	}>;
	dataPoints: number;
}

export class LLMInsightService {
	async generateDailyInsight(userId: string): Promise<AIInsightData | null> {
		try {
			const context = await this.getUserContext(userId, 14);

			if (context.dataPoints < 5) {
				Logger.info('Insufficient data for insights', { userId, dataPoints: context.dataPoints });
				return null; // Not enough data for insights
			}

			const prompt = this.buildInsightPrompt(context);
			
			const response = await aiService.generateMotivationalTip(
				'supportive', // Default to supportive style for insights
				undefined,
				{ userId, temperature: 0.7, maxTokens: 300 } as AIGenerationOptions
			);

			// Use custom prompt by calling the OpenAI API directly
			const customResponse = await this.generateCustomInsight(prompt, userId);
			
			return this.parseInsightResponse(customResponse, context.dataPoints);
		} catch (error) {
			Logger.error('Failed to generate daily insight', { error, userId });
			return null;
		}
	}

	private async generateCustomInsight(prompt: string, userId: string): Promise<string> {
		// For now, return a placeholder. We'll enhance this to use OpenAI directly
		// This is a simplified implementation that would need to be connected to OpenAI
		try {
			// This would be replaced with actual OpenAI API call
			return JSON.stringify({
				insight: "You tend to have better days when you complete your morning routine",
				confidence: "medium",
				reasoning: "Based on the last 7 days of data, your mood improves when you complete key habits early in the day",
				pattern_strength: 7
			});
		} catch (error) {
			Logger.error('Failed to generate custom insight', { error, userId });
			throw error;
		}
	}

	private async getUserContext(userId: string, days: number): Promise<UserContext> {
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - days);

		const [habits, moods, dailyStats] = await Promise.all([
			prisma.habitEvent.findMany({
				where: { userId, occurredAt: { gte: startDate } },
				include: { habit: { select: { title: true } } },
				orderBy: { occurredAt: 'desc' },
			}),

			prisma.journalEntry.findMany({
				where: {
					userId,
					createdAt: { gte: startDate },
					moodRating: { not: null },
				},
				select: {
					moodRating: true,
					createdAt: true,
				},
				orderBy: { createdAt: 'desc' },
			}),

			prisma.dailyStats.findMany({
				where: { userId, date: { gte: startDate } },
				select: {
					date: true,
					habitsCompleted: true,
					habitsTotal: true,
				},
				orderBy: { date: 'desc' },
			}),
		]);

		return { 
			habits, 
			moods: moods.map(m => ({ moodRating: m.moodRating!, createdAt: m.createdAt })), 
			dailyStats, 
			dataPoints: dailyStats.length 
		};
	}

	private buildInsightPrompt(context: UserContext): string {
		const habitSummary = context.habits
			.slice(0, 20) // Limit to recent 20 events
			.map(h => `${h.habit.title}: ${h.eventType} on ${h.occurredAt.toDateString()}`)
			.join('\n');

		const moodSummary = context.moods
			.slice(0, 20) // Limit to recent 20 moods
			.map(m => `Mood: ${m.moodRating}/10 on ${m.createdAt.toDateString()}`)
			.join('\n');

		const dailyStatsSummary = context.dailyStats
			.slice(0, 14) // Last 14 days
			.map(d => `${d.date.toDateString()}: ${d.habitsCompleted}/${d.habitsTotal} habits completed`)
			.join('\n');

		return `
Analyze this user's habit and mood data to find ONE meaningful pattern.

HABIT COMPLETION DATA (last 14 days):
${habitSummary}

MOOD DATA (last 14 days):
${moodSummary}

DAILY COMPLETION RATES:
${dailyStatsSummary}

Guidelines:
- Find ONE clear correlation between habits and mood
- Only suggest patterns with 5+ supporting data points
- Be encouraging but not overly optimistic
- Use phrases like "tends to" or "appears to" for confidence

Return JSON only:
{
  "insight": "One encouraging sentence about a pattern you observed",
  "confidence": "low|medium|high",
  "reasoning": "2-3 sentences explaining why this pattern exists",
  "pattern_strength": 1-10
}

If no clear pattern exists, return: {"insight": null}
`;
	}

	private parseInsightResponse(response: string, dataPoints: number): AIInsightData | null {
		try {
			const parsed = JSON.parse(response);

			if (!parsed.insight) return null;

			return {
				insight: parsed.insight,
				confidence: parsed.confidence || 'low',
				reasoning: parsed.reasoning || 'Based on your recent activity patterns.',
				dataPoints,
			};
		} catch (error) {
			Logger.error('Failed to parse insight response', { error, response });
			return null;
		}
	}

	async recordInsightFeedback(
		userId: string, 
		insightId: string, 
		feedback: 'helpful' | 'not_helpful'
	): Promise<void> {
		try {
			// Store feedback for future improvement (could be in a separate table)
			Logger.info('Insight feedback recorded', { userId, insightId, feedback });
			// TODO: Implement feedback storage system
		} catch (error) {
			Logger.error('Failed to record insight feedback', { error, userId, insightId, feedback });
		}
	}
}

export const llmInsightService = new LLMInsightService();