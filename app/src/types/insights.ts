// Types for AI insights and daily summary data
import { MoodDisplayData } from "./mood";

export interface DailySummaryData {
	date: string;
	checkInStatus: {
		morning: boolean;
		evening: boolean;
	};
	mood: MoodDisplayData | null;
	habits: {
		completed: number;
		total: number;
	};
	aiInsight: AIInsightData | null;
	yesterdayComparison?: string;
}

export interface AIInsightData {
	insight: string;
	confidence: "low" | "medium" | "high";
	reasoning: string;
	dataPoints: number;
}

// API response types
export interface ApiResponse<T = any> {
	success: boolean;
	data?: T;
	message?: string;
	error?: string;
	timestamp?: string;
}

// Feedback types
export type InsightFeedback = "helpful" | "not_helpful";