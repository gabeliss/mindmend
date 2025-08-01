import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { CheckInStatusSection } from "./CheckInStatusSection";
import { MoodDisplaySection } from "./MoodDisplaySection";
import { AIInsightSection } from "./AIInsightSection";
import { DailySummaryData } from "../../types/insights";

interface DailySummaryProps {
	summary: DailySummaryData;
	onInsightFeedback?: (feedback: "helpful" | "not_helpful") => void;
}

export function DailySummaryCard({
	summary,
	onInsightFeedback,
}: DailySummaryProps) {
	return (
		<View style={styles.summaryCard}>
			<Text style={styles.title}>Today's Summary</Text>

			<CheckInStatusSection status={summary.checkInStatus} />

			{summary.mood && <MoodDisplaySection mood={summary.mood} />}

			{summary.habits.total > 0 && (
				<View style={styles.habitsSection}>
					<Text style={styles.habitsText}>
						Habits: {summary.habits.completed}/{summary.habits.total} completed
					</Text>
				</View>
			)}

			{summary.yesterdayComparison && (
				<View style={styles.comparisonSection}>
					<Text style={styles.comparisonText}>
						{summary.yesterdayComparison}
					</Text>
				</View>
			)}

			{summary.aiInsight && (
				<AIInsightSection
					insight={summary.aiInsight}
					onFeedback={onInsightFeedback}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	summaryCard: {
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 16,
		marginBottom: 16,
		shadowColor: "#000",
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 2,
	},
	title: {
		fontSize: 18,
		fontWeight: "600",
		color: "#2D3748",
		marginBottom: 16,
	},
	habitsSection: {
		marginBottom: 12,
	},
	habitsText: {
		fontSize: 14,
		color: "#4A5568",
		fontWeight: "500",
	},
	comparisonSection: {
		marginBottom: 12,
	},
	comparisonText: {
		fontSize: 14,
		color: "#4A5568",
		fontWeight: "500",
	},
});