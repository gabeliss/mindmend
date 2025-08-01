// Types for mood display and aggregation

export interface MoodDisplayData {
	type: "single" | "range";
	current?: number;
	start?: number;
	end?: number;
	display: string;
}

export interface MoodAggregationResult {
	date: string;
	moodRangeStart: number;
	moodRangeEnd: number;
	moodEntryCount: number;
	entries: Array<{
		moodRating: number;
		createdAt: string;
	}>;
}

// Mood utilities
export const getMoodEmoji = (rating: number): string => {
	if (rating <= 3) return "😢";
	if (rating <= 5) return "😐";
	if (rating <= 7) return "🙂";
	if (rating <= 8) return "😊";
	return "😍";
};

export const formatMoodDisplay = (mood: MoodDisplayData): string => {
	if (mood.type === "single") {
		return `${getMoodEmoji(mood.current!)} ${mood.current}/10`;
	}
	return `${getMoodEmoji(mood.start!)}→${getMoodEmoji(mood.end!)} ${mood.start}→${mood.end}`;
};