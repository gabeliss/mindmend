import { Request, Response } from 'express';
import { moodAggregationService } from '../services/moodAggregationService';
import { llmInsightService } from '../services/llmInsightService';
import { contextAwareCheckInService } from '../services/contextAwareCheckInService';
import ResponseHandler from '../utils/response';
import { AppError, DailySummaryData } from '../types';
import { PrismaClient } from '@prisma/client';
import Logger from '../utils/logger';

const prisma = new PrismaClient();

export class InsightsController {
	static getDailySummary = async (req: Request, res: Response) => {
		const userId = req.user!.id;
		const today = new Date().toISOString().split('T')[0];

		try {
			const [dailyStats, moodDisplay, aiInsight] = await Promise.all([
				// Get today's daily stats
				prisma.dailyStats.findFirst({
					where: { userId, date: new Date(today) },
				}),

				// Get today's mood display data
				moodAggregationService.getMoodDisplayData(userId, today),

				// Generate AI insight
				llmInsightService.generateDailyInsight(userId),
			]);

			const checkInStatus = {
				morning: !!dailyStats?.morningCheckinAt,
				evening: !!dailyStats?.eveningCheckinAt,
			};

			const habits = {
				completed: dailyStats?.habitsCompleted || 0,
				total: dailyStats?.habitsTotal || 0,
			};

			const yesterdayComparison = await calculateYesterdayComparison(userId, today);

			const response: DailySummaryData = {
				date: today,
				checkInStatus,
				mood: moodDisplay,
				habits,
				aiInsight,
				yesterdayComparison,
			};

			Logger.info('Daily summary generated', { userId, hasInsight: !!aiInsight });
			ResponseHandler.success(res, response, 'Daily summary retrieved successfully');
		} catch (error) {
			Logger.error('Error getting daily summary', { error, userId });
			ResponseHandler.error(res, 'Failed to get daily summary', 500);
		}
	};

	static recordInsightFeedback = async (req: Request, res: Response) => {
		const userId = req.user!.id;
		const { insightId, feedback } = req.body;

		try {
			if (!insightId || !feedback) {
				throw new AppError('Insight ID and feedback are required', 400);
			}

			if (feedback !== 'helpful' && feedback !== 'not_helpful') {
				throw new AppError('Feedback must be either "helpful" or "not_helpful"', 400);
			}

			await llmInsightService.recordInsightFeedback(userId, insightId, feedback);

			Logger.info('Insight feedback recorded', { userId, insightId, feedback });
			ResponseHandler.success(res, { recorded: true }, 'Feedback recorded successfully');
		} catch (error) {
			Logger.error('Error recording insight feedback', { error, userId });
			if (error instanceof AppError) {
				ResponseHandler.error(res, error.message, error.statusCode);
			} else {
				ResponseHandler.error(res, 'Failed to record feedback', 500);
			}
		}
	};

	static getTodaysContext = async (req: Request, res: Response) => {
		const userId = req.user!.id;
		const today = new Date().toISOString().split('T')[0];

		try {
			const [habits, moodDisplay, dailyStats] = await Promise.all([
				// Get today's habits with their completion status
				getTodaysHabitsWithStatus(userId, today),

				// Get today's mood display data
				moodAggregationService.getMoodDisplayData(userId, today),

				// Get daily stats
				prisma.dailyStats.findFirst({
					where: { userId, date: new Date(today) },
				}),
			]);

			const response = {
				date: today,
				habits,
				mood: moodDisplay,
				stats: {
					habitsCompleted: dailyStats?.habitsCompleted || 0,
					habitsTotal: dailyStats?.habitsTotal || 0,
					journalEntries: dailyStats?.journalEntries || 0,
				},
			};

			Logger.info('Today\'s context retrieved', { userId, habitsCount: habits.length });
			ResponseHandler.success(res, response, 'Today\'s context retrieved successfully');
		} catch (error) {
			Logger.error('Error getting today\'s context', { error, userId });
			ResponseHandler.error(res, 'Failed to get today\'s context', 500);
		}
	};

	static getContextualCheckInQuestions = async (req: Request, res: Response) => {
		const userId = req.user!.id;
		const { checkInType } = req.query; // 'morning' or 'evening'
		const today = new Date().toISOString().split('T')[0];

		try {
			if (!checkInType || (checkInType !== 'morning' && checkInType !== 'evening')) {
				throw new AppError('Check-in type must be either "morning" or "evening"', 400);
			}

			const [habits, moodDisplay] = await Promise.all([
				getTodaysHabitsWithStatus(userId, today),
				moodAggregationService.getMoodDisplayData(userId, today),
			]);

			const questions = checkInType === 'morning'
				? contextAwareCheckInService.generateMorningQuestions(habits, moodDisplay)
				: contextAwareCheckInService.generateEveningQuestions(habits, moodDisplay);

			const contextualPrompt = await contextAwareCheckInService.generateContextualPrompt(
				checkInType as 'morning' | 'evening',
				habits,
				moodDisplay
			);

			const response = {
				checkInType,
				questions,
				contextualPrompt,
				context: {
					habits,
					mood: moodDisplay,
				},
			};

			Logger.info('Contextual check-in questions generated', { 
				userId, 
				checkInType, 
				questionsCount: questions.length 
			});
			ResponseHandler.success(res, response, 'Contextual questions generated successfully');
		} catch (error) {
			Logger.error('Error generating contextual check-in questions', { error, userId });
			if (error instanceof AppError) {
				ResponseHandler.error(res, error.message, error.statusCode);
			} else {
				ResponseHandler.error(res, 'Failed to generate contextual questions', 500);
			}
		}
	};

	static submitCheckIn = async (req: Request, res: Response) => {
		const userId = req.user!.id;
		const { checkInType, responses, mood, mindset } = req.body;
		const today = new Date().toISOString().split('T')[0];

		try {
			if (!checkInType || (checkInType !== 'morning' && checkInType !== 'evening')) {
				throw new AppError('Check-in type must be either "morning" or "evening"', 400);
			}

			// Create a summary of the check-in
			const summary = responses.filter((r: string) => r.trim().length > 0).join('; ');
			const moodValue = mood?.value;
			const mindsetValue = mindset?.label;

			// Update daily stats with check-in timestamp and summary
			const updateData: any = {
				checkinSummary: summary.length > 0 ? summary : null,
				updatedAt: new Date(),
			};

			if (checkInType === 'morning') {
				updateData.morningCheckinAt = new Date();
			} else {
				updateData.eveningCheckinAt = new Date();
			}

			await prisma.dailyStats.upsert({
				where: {
					user_date_unique: {
						userId,
						date: new Date(today),
					},
				},
				update: updateData,
				create: {
					userId,
					date: new Date(today),
					...updateData,
					habitsCompleted: 0,
					habitsTotal: 0,
					journalEntries: 0,
				},
			});

			// If mood was provided, also create a journal entry to track it
			if (moodValue) {
				try {
					await prisma.journalEntry.create({
						data: {
							userId,
							content: `${checkInType} check-in: ${summary || 'Completed check-in'}`,
							moodRating: moodValue,
							title: `${checkInType.charAt(0).toUpperCase() + checkInType.slice(1)} Check-in`,
						},
					});

					// Update mood aggregation
					await moodAggregationService.updateDailyMoodStats(userId, today);
				} catch (moodError) {
					Logger.warn('Failed to create mood entry from check-in', { error: moodError, userId });
				}
			}

			const response = {
				checkInType,
				timestamp: new Date().toISOString(),
				summary: summary.length > 0 ? summary : 'Check-in completed',
				mood: moodValue,
				mindset: mindsetValue,
			};

			Logger.info('Check-in submitted successfully', { 
				userId, 
				checkInType, 
				hasMood: !!moodValue,
				hasSummary: summary.length > 0
			});
			ResponseHandler.success(res, response, 'Check-in submitted successfully');
		} catch (error) {
			Logger.error('Error submitting check-in', { error, userId });
			if (error instanceof AppError) {
				ResponseHandler.error(res, error.message, error.statusCode);
			} else {
				ResponseHandler.error(res, 'Failed to submit check-in', 500);
			}
		}
	};
}

async function calculateYesterdayComparison(
	userId: string,
	today: string
): Promise<string | undefined> {
	try {
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		const [todayStats, yesterdayStats] = await Promise.all([
			prisma.dailyStats.findFirst({
				where: { userId, date: new Date(today) },
			}),
			prisma.dailyStats.findFirst({
				where: { userId, date: yesterday },
			}),
		]);

		if (!todayStats || !yesterdayStats) return undefined;

		const todayMood = todayStats.moodRangeEnd || todayStats.moodRangeStart;
		const yesterdayMood = yesterdayStats.moodRangeEnd || yesterdayStats.moodRangeStart;

		if (!todayMood || !yesterdayMood) return undefined;

		const moodDiff = todayMood - yesterdayMood;

		if (moodDiff > 0) {
			return `↗️ +${moodDiff.toFixed(1)} mood improvement`;
		} else if (moodDiff < 0) {
			return `↘️ ${moodDiff.toFixed(1)} from yesterday`;
		} else {
			return `➡️ Similar mood to yesterday`;
		}
	} catch (error) {
		Logger.error('Error calculating yesterday comparison', { error, userId });
		return undefined;
	}
}

async function getTodaysHabitsWithStatus(userId: string, today: string) {
	try {
		const startOfDay = new Date(`${today}T00:00:00`);
		const endOfDay = new Date(`${today}T23:59:59`);

		// Get all active habits for the user
		const habits = await prisma.habit.findMany({
			where: { 
				userId, 
				isActive: true 
			},
			select: {
				id: true,
				title: true,
				habitType: true,
			},
		});

		// Get today's habit events
		const todayEvents = await prisma.habitEvent.findMany({
			where: {
				userId,
				occurredAt: {
					gte: startOfDay,
					lte: endOfDay,
				},
			},
			orderBy: { occurredAt: 'desc' },
		});

		// Create a map of habit events by habit ID (most recent first)
		const eventsByHabit = new Map();
		todayEvents.forEach(event => {
			if (!eventsByHabit.has(event.habitId)) {
				eventsByHabit.set(event.habitId, event);
			}
		});

		// Get streak counts for each habit
		const habitStreaks = new Map();
		for (const habit of habits) {
			try {
				// This is a simplified streak calculation - you might want to use the existing streak service
				const recentEvents = await prisma.habitEvent.findMany({
					where: {
						habitId: habit.id,
						eventType: 'COMPLETED',
					},
					orderBy: { occurredAt: 'desc' },
					take: 30, // Look at last 30 events for streak calculation
				});

				let streakCount = 0;
				if (recentEvents.length > 0) {
					// Simple streak calculation - count consecutive days
					const today = new Date();
					let checkDate = new Date(today);
					
					for (let i = 0; i < 30; i++) {
						const dateStr = checkDate.toISOString().split('T')[0];
						const hasEvent = recentEvents.some(event => 
							event.occurredAt.toISOString().split('T')[0] === dateStr
						);
						
						if (hasEvent) {
							streakCount++;
						} else if (i > 0) { // Allow for today to not be completed yet
							break;
						}
						
						checkDate.setDate(checkDate.getDate() - 1);
					}
				}
				
				habitStreaks.set(habit.id, streakCount);
			} catch (streakError) {
				Logger.warn('Failed to calculate streak for habit', { habitId: habit.id, error: streakError });
				habitStreaks.set(habit.id, 0);
			}
		}

		// Combine habits with their status
		return habits.map(habit => {
			const latestEvent = eventsByHabit.get(habit.id);
			let status: 'completed' | 'skipped' | 'pending' = 'pending';
			
			if (latestEvent) {
				switch (latestEvent.eventType) {
					case 'COMPLETED':
						status = 'completed';
						break;
					case 'SKIPPED':
						status = 'skipped';
						break;
					default:
						status = 'pending';
				}
			}

			return {
				id: habit.id,
				title: habit.title,
				habitType: habit.habitType,
				status,
				streakCount: habitStreaks.get(habit.id) || 0,
			};
		});
	} catch (error) {
		Logger.error('Error getting today\'s habits with status', { error, userId });
		return [];
	}
}