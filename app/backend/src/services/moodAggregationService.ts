import { PrismaClient } from '@prisma/client';
import { MoodDisplayData, MoodAggregationResult } from '../types';

const prisma = new PrismaClient();

export class MoodAggregationService {
	async updateDailyMoodStats(userId: string, date: string): Promise<void> {
		const dayStart = new Date(`${date}T00:00:00`);
		const dayEnd = new Date(`${date}T23:59:59`);

		const dayEntries = await prisma.journalEntry.findMany({
			where: {
				userId,
				createdAt: {
					gte: dayStart,
					lte: dayEnd,
				},
				moodRating: { not: null },
			},
			orderBy: { createdAt: "asc" },
		});

		if (dayEntries.length === 0) {
			// Clear mood data if no entries exist
			await prisma.dailyStats.updateMany({
				where: {
					userId,
					date: new Date(date),
				},
				data: {
					moodRangeStart: null,
					moodRangeEnd: null,
					moodEntryCount: 0,
					updatedAt: new Date(),
				},
			});
			return;
		}

		const moods = dayEntries.map((entry) => entry.moodRating!);
		const moodRangeStart = Math.min(...moods);
		const moodRangeEnd = Math.max(...moods);

		await prisma.dailyStats.upsert({
			where: {
				user_date_unique: {
					userId,
					date: new Date(date),
				},
			},
			update: {
				moodRangeStart,
				moodRangeEnd,
				moodEntryCount: moods.length,
				updatedAt: new Date(),
			},
			create: {
				userId,
				date: new Date(date),
				moodRangeStart,
				moodRangeEnd,
				moodEntryCount: moods.length,
				habitsCompleted: 0,
				habitsTotal: 0,
				journalEntries: 0,
			},
		});
	}

	async getMoodDisplayData(
		userId: string,
		date: string
	): Promise<MoodDisplayData | null> {
		const dailyStat = await prisma.dailyStats.findFirst({
			where: { userId, date: new Date(date) },
		});

		if (!dailyStat || !dailyStat.moodRangeStart) return null;

		if (dailyStat.moodEntryCount === 1) {
			return {
				type: "single",
				current: dailyStat.moodRangeStart,
				display: `😊 ${dailyStat.moodRangeStart}/10`,
			};
		}

		return {
			type: "range",
			start: dailyStat.moodRangeStart,
			end: dailyStat.moodRangeEnd || dailyStat.moodRangeStart,
			display: `😐→😊 ${dailyStat.moodRangeStart}→${dailyStat.moodRangeEnd || dailyStat.moodRangeStart}`,
		};
	}

	async getMoodAggregationResult(
		userId: string,
		date: string
	): Promise<MoodAggregationResult | null> {
		const dayStart = new Date(`${date}T00:00:00`);
		const dayEnd = new Date(`${date}T23:59:59`);

		const [dailyStat, entries] = await Promise.all([
			prisma.dailyStats.findFirst({
				where: { userId, date: new Date(date) },
			}),
			prisma.journalEntry.findMany({
				where: {
					userId,
					createdAt: {
						gte: dayStart,
						lte: dayEnd,
					},
					moodRating: { not: null },
				},
				select: {
					moodRating: true,
					createdAt: true,
				},
				orderBy: { createdAt: "asc" },
			}),
		]);

		if (!dailyStat || !dailyStat.moodRangeStart) return null;

		return {
			date,
			moodRangeStart: dailyStat.moodRangeStart,
			moodRangeEnd: dailyStat.moodRangeEnd || dailyStat.moodRangeStart,
			moodEntryCount: dailyStat.moodEntryCount,
			entries: entries.map((entry) => ({
				moodRating: entry.moodRating!,
				createdAt: entry.createdAt.toISOString(),
			})),
		};
	}

	async getMoodTrendWithRanges(
		userId: string,
		days: number = 30
	): Promise<Array<{ date: string; mood: MoodDisplayData | null }>> {
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - days);

		const dailyStats = await prisma.dailyStats.findMany({
			where: {
				userId,
				date: { gte: startDate },
				moodRangeStart: { not: null },
			},
			orderBy: { date: "asc" },
		});

		const result: Array<{ date: string; mood: MoodDisplayData | null }> = [];

		for (let i = 0; i < days; i++) {
			const date = new Date(startDate);
			date.setDate(date.getDate() + i);
			const dateKey = date.toISOString().split("T")[0];

			const dailyStat = dailyStats.find(
				(stat) => stat.date.toISOString().split("T")[0] === dateKey
			);

			let mood: MoodDisplayData | null = null;
			if (dailyStat && dailyStat.moodRangeStart) {
				if (dailyStat.moodEntryCount === 1) {
					mood = {
						type: "single",
						current: dailyStat.moodRangeStart,
						display: `${dailyStat.moodRangeStart}/10`,
					};
				} else {
					mood = {
						type: "range",
						start: dailyStat.moodRangeStart,
						end: dailyStat.moodRangeEnd || dailyStat.moodRangeStart,
						display: `${dailyStat.moodRangeStart}→${dailyStat.moodRangeEnd || dailyStat.moodRangeStart}`,
					};
				}
			}

			result.push({ date: dateKey, mood });
		}

		return result;
	}

	private getMoodEmoji(rating: number): string {
		if (rating <= 3) return "😢";
		if (rating <= 5) return "😐";
		if (rating <= 7) return "🙂";
		if (rating <= 8) return "😊";
		return "😍";
	}
}

export const moodAggregationService = new MoodAggregationService();