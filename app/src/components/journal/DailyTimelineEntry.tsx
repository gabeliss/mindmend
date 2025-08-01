import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

interface HabitCorrelation {
	id: string;
	title: string;
	status: 'completed' | 'skipped' | 'pending';
	habitType: 'BUILD' | 'AVOID';
}

interface DailyTimelineEntryProps {
	date: string;
	mood: {
		rating: number;
		display: string;
	} | null;
	habits: HabitCorrelation[];
	journalEntry?: {
		id: string;
		title?: string;
		content: string;
		preview: string;
	} | null;
	checkInSummary?: string | null;
	aiInsight?: string | null;
	onViewJournal?: () => void;
	onViewHabits?: () => void;
}

export function DailyTimelineEntry({
	date,
	mood,
	habits,
	journalEntry,
	checkInSummary,
	aiInsight,
	onViewJournal,
	onViewHabits,
}: DailyTimelineEntryProps) {
	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		if (date.toDateString() === today.toDateString()) {
			return "Today";
		} else if (date.toDateString() === yesterday.toDateString()) {
			return "Yesterday";
		} else {
			return date.toLocaleDateString('en-US', { 
				weekday: 'short', 
				month: 'short', 
				day: 'numeric' 
			});
		}
	};

	const getMoodEmoji = (rating: number): string => {
		if (rating <= 3) return "😢";
		if (rating <= 5) return "😐";
		if (rating <= 7) return "🙂";
		if (rating <= 8) return "😊";
		return "😍";
	};

	const getHabitStatusEmoji = (habit: HabitCorrelation): string => {
		switch (habit.status) {
			case 'completed':
				return habit.habitType === 'BUILD' ? '✅' : '🚫';
			case 'skipped':
				return '⏸️';
			default:
				return '⏳';
		}
	};

	const completedHabits = habits.filter(h => h.status === 'completed').length;
	const totalHabits = habits.length;

	return (
		<View style={styles.container}>
			{/* Date Header */}
			<View style={styles.dateHeader}>
				<Text style={styles.date}>{formatDate(date)}</Text>
				{mood && (
					<View style={styles.moodBadge}>
						<Text style={styles.moodEmoji}>{getMoodEmoji(mood.rating)}</Text>
						<Text style={styles.moodText}>{mood.rating}/10</Text>
					</View>
				)}
			</View>

			{/* Habits Summary */}
			{habits.length > 0 && (
				<TouchableOpacity 
					style={styles.habitsSection}
					onPress={onViewHabits}
					activeOpacity={0.7}
				>
					<View style={styles.habitsSummary}>
						<Text style={styles.habitsText}>
							Habits: {completedHabits}/{totalHabits} completed
						</Text>
						<View style={styles.habitsPreview}>
							{habits.slice(0, 3).map((habit) => (
								<Text key={habit.id} style={styles.habitEmoji}>
									{getHabitStatusEmoji(habit)}
								</Text>
							))}
							{habits.length > 3 && (
								<Text style={styles.moreHabits}>+{habits.length - 3}</Text>
							)}
						</View>
					</View>
				</TouchableOpacity>
			)}

			{/* Check-in Summary */}
			{checkInSummary && (
				<View style={styles.checkInSection}>
					<Text style={styles.checkInLabel}>Check-in:</Text>
					<Text style={styles.checkInText} numberOfLines={2}>
						{checkInSummary}
					</Text>
				</View>
			)}

			{/* Journal Entry */}
			{journalEntry && (
				<TouchableOpacity 
					style={styles.journalSection}
					onPress={onViewJournal}
					activeOpacity={0.7}
				>
					<Text style={styles.journalLabel}>
						{journalEntry.title || 'Journal Entry'}
					</Text>
					<Text style={styles.journalPreview} numberOfLines={2}>
						{journalEntry.preview}
					</Text>
				</TouchableOpacity>
			)}

			{/* AI Insight Badge */}
			{aiInsight && (
				<View style={styles.insightBadge}>
					<Text style={styles.insightEmoji}>💡</Text>
					<Text style={styles.insightText} numberOfLines={1}>
						{aiInsight}
					</Text>
				</View>
			)}

			{/* Enhanced Correlation Indicators */}
			{(mood || habits.length > 0) && (
				<View style={styles.correlationSection}>
					{/* Perfect Day Badge */}
					{completedHabits === totalHabits && totalHabits > 0 && mood && mood.rating >= 8 && (
						<View style={[styles.correlationBadge, styles.perfectDayBadge]}>
							<Text style={styles.correlationEmoji}>🌟</Text>
							<Text style={styles.correlationText}>Perfect day!</Text>
						</View>
					)}
					
					{/* Strong Performance Badge */}
					{completedHabits === totalHabits && totalHabits > 0 && mood && mood.rating >= 6 && mood.rating < 8 && (
						<View style={styles.correlationBadge}>
							<Text style={styles.correlationEmoji}>💪</Text>
							<Text style={styles.correlationText}>Strong performance</Text>
						</View>
					)}
					
					{/* Habit Streak Badge */}
					{completedHabits === totalHabits && totalHabits >= 3 && (
						<View style={[styles.correlationBadge, styles.streakBadge]}>
							<Text style={styles.correlationEmoji}>🔥</Text>
							<Text style={styles.correlationText}>All habits completed</Text>
						</View>
					)}
					
					{/* Mood Boost Badge */}
					{mood && mood.rating >= 8 && completedHabits >= totalHabits * 0.7 && (
						<View style={[styles.correlationBadge, styles.moodBoostBadge]}>
							<Text style={styles.correlationEmoji}>😍</Text>
							<Text style={styles.correlationText}>Feeling amazing</Text>
						</View>
					)}
					
					{/* Recovery Badge */}
					{completedHabits >= totalHabits * 0.5 && mood && mood.rating >= 6 && completedHabits < totalHabits && (
						<View style={[styles.correlationBadge, styles.recoveryBadge]}>
							<Text style={styles.correlationEmoji}>📈</Text>
							<Text style={styles.correlationText}>Getting back on track</Text>
						</View>
					)}
					
					{/* Struggle Badge */}
					{completedHabits < totalHabits * 0.3 && mood && mood.rating <= 4 && totalHabits > 0 && (
						<View style={[styles.correlationBadge, styles.challengeBadge]}>
							<Text style={styles.correlationEmoji}>💙</Text>
							<Text style={styles.correlationText}>Tough day - be kind to yourself</Text>
						</View>
					)}
					
					{/* Mixed Performance Badge */}
					{completedHabits >= totalHabits * 0.5 && completedHabits < totalHabits && mood && mood.rating <= 5 && (
						<View style={[styles.correlationBadge, styles.mixedBadge]}>
							<Text style={styles.correlationEmoji}>⚖️</Text>
							<Text style={styles.correlationText}>Mixed day</Text>
						</View>
					)}
					
					{/* Low Mood Alert */}
					{mood && mood.rating <= 3 && (
						<View style={[styles.correlationBadge, styles.alertBadge]}>
							<Text style={styles.correlationEmoji}>🫂</Text>
							<Text style={styles.correlationText}>Remember: you're not alone</Text>
						</View>
					)}
					
					{/* High Mood Celebration */}
					{mood && mood.rating >= 9 && (
						<View style={[styles.correlationBadge, styles.celebrationBadge]}>
							<Text style={styles.correlationEmoji}>🎉</Text>
							<Text style={styles.correlationText}>What a fantastic day!</Text>
						</View>
					)}
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
		shadowColor: "#000",
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 2,
		borderLeftWidth: 4,
		borderLeftColor: "#E2E8F0",
	},
	dateHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 12,
		paddingBottom: 8,
		borderBottomWidth: 1,
		borderBottomColor: "#F1F5F9",
	},
	date: {
		fontSize: 16,
		fontWeight: "600",
		color: "#2D3748",
	},
	moodBadge: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#F0FFF4",
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 12,
	},
	moodEmoji: {
		fontSize: 16,
		marginRight: 4,
	},
	moodText: {
		fontSize: 12,
		color: "#22543D",
		fontWeight: "500",
	},
	habitsSection: {
		marginBottom: 8,
	},
	habitsSummary: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	habitsText: {
		fontSize: 14,
		color: "#4A5568",
		fontWeight: "500",
	},
	habitsPreview: {
		flexDirection: "row",
		alignItems: "center",
	},
	habitEmoji: {
		fontSize: 16,
		marginLeft: 4,
	},
	moreHabits: {
		fontSize: 12,
		color: "#718096",
		marginLeft: 4,
	},
	checkInSection: {
		backgroundColor: "#F8FAFC",
		borderRadius: 8,
		padding: 12,
		marginBottom: 8,
	},
	checkInLabel: {
		fontSize: 12,
		fontWeight: "600",
		color: "#4A5568",
		marginBottom: 4,
	},
	checkInText: {
		fontSize: 14,
		color: "#2D3748",
		lineHeight: 18,
	},
	journalSection: {
		backgroundColor: "#FEF5E7",
		borderRadius: 8,
		padding: 12,
		marginBottom: 8,
		borderLeftWidth: 3,
		borderLeftColor: "#F6AD55",
	},
	journalLabel: {
		fontSize: 12,
		fontWeight: "600",
		color: "#C05621",
		marginBottom: 4,
	},
	journalPreview: {
		fontSize: 14,
		color: "#2D3748",
		lineHeight: 18,
	},
	insightBadge: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#EDF2F7",
		borderRadius: 8,
		padding: 8,
		marginBottom: 8,
	},
	insightEmoji: {
		fontSize: 14,
		marginRight: 6,
	},
	insightText: {
		fontSize: 12,
		color: "#4A5568",
		flex: 1,
	},
	correlationSection: {
		marginTop: 4,
	},
	correlationBadge: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#F0FFF4",
		borderRadius: 16,
		paddingHorizontal: 8,
		paddingVertical: 4,
		alignSelf: "flex-start",
	},
	challengeBadge: {
		backgroundColor: "#FFF5F5",
	},
	perfectDayBadge: {
		backgroundColor: "#FFFBEB",
		borderColor: "#F59E0B",
		borderWidth: 1,
	},
	streakBadge: {
		backgroundColor: "#FEF2F2",
		borderColor: "#EF4444",
		borderWidth: 1,
	},
	moodBoostBadge: {
		backgroundColor: "#FDF4FF",
		borderColor: "#A855F7",
		borderWidth: 1,
	},
	recoveryBadge: {
		backgroundColor: "#F0F9FF",
		borderColor: "#3B82F6",
		borderWidth: 1,
	},
	mixedBadge: {
		backgroundColor: "#F9FAFB",
		borderColor: "#6B7280",
		borderWidth: 1,
	},
	alertBadge: {
		backgroundColor: "#FEF2F2",
		borderColor: "#F87171",
		borderWidth: 1,
	},
	celebrationBadge: {
		backgroundColor: "#ECFDF5",
		borderColor: "#22C55E",
		borderWidth: 1,
	},
	correlationEmoji: {
		fontSize: 12,
		marginRight: 4,
	},
	correlationText: {
		fontSize: 11,
		color: "#2F855A",
		fontWeight: "500",
	},
});