import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ExpandableDetails } from "../common/ExpandableDetails";

interface HabitStatus {
	id: string;
	title: string;
	habitType: 'BUILD' | 'AVOID';
	status: 'completed' | 'skipped' | 'pending';
	streakCount?: number;
}

interface MoodDisplayData {
	type: "single" | "range";
	current?: number;
	start?: number;
	end?: number;
	display: string;
}

interface TodaysContextProps {
	habits: HabitStatus[];
	mood: MoodDisplayData | null;
	defaultOpen?: boolean;
	onUpdateHabits?: () => void;
	onAddMoodEntry?: () => void;
	onViewJournal?: () => void;
	onViewProgress?: () => void;
}

export function TodaysContextSection({
	habits,
	mood,
	defaultOpen = false,
	onUpdateHabits,
	onAddMoodEntry,
	onViewJournal,
	onViewProgress,
}: TodaysContextProps) {
	const [isExpanded, setIsExpanded] = useState(defaultOpen);

	const getHabitStatusEmoji = (status: string, habitType: string) => {
		switch (status) {
			case 'completed':
				return habitType === 'BUILD' ? '✅' : '🚫';
			case 'skipped':
				return '⏸️';
			default:
				return '⏳';
		}
	};

	const getHabitStatusText = (habit: HabitStatus) => {
		const emoji = getHabitStatusEmoji(habit.status, habit.habitType);
		const streakText = habit.streakCount ? ` (${habit.streakCount} day streak)` : '';
		return `${emoji} ${habit.title}${streakText}`;
	};

	const contextPrompt = getContextPrompt(habits, mood);

	const contextContent = (
		<View style={styles.contextContent}>
			{/* Habits Status */}
			<View style={styles.section}>
				<Text style={styles.sectionLabel}>Today's Habits:</Text>
				{habits.length > 0 ? (
					habits.map((habit) => (
						<Text key={habit.id} style={styles.habitStatus}>
							{getHabitStatusText(habit)}
						</Text>
					))
				) : (
					<Text style={styles.noDataText}>No habits tracked today</Text>
				)}
			</View>

			{/* Mood Status */}
			{mood && (
				<View style={styles.section}>
					<Text style={styles.sectionLabel}>Today's Mood:</Text>
					<Text style={styles.moodDisplay}>{mood.display}</Text>
				</View>
			)}

			{/* Quick Actions */}
			<View style={styles.quickActions}>
				{onUpdateHabits && (
					<TouchableOpacity style={styles.actionButton} onPress={onUpdateHabits}>
						<Text style={styles.actionButtonText}>Update Habits</Text>
					</TouchableOpacity>
				)}
				{onAddMoodEntry && (
					<TouchableOpacity style={styles.actionButton} onPress={onAddMoodEntry}>
						<Text style={styles.actionButtonText}>Add Mood Entry</Text>
					</TouchableOpacity>
				)}
			</View>

			{/* Context Links */}
			<View style={styles.contextLinks}>
				{onViewJournal && (
					<TouchableOpacity style={styles.linkButton} onPress={onViewJournal}>
						<Text style={styles.linkButtonText}>📖 View Journal Timeline</Text>
					</TouchableOpacity>
				)}
				{onViewProgress && (
					<TouchableOpacity style={styles.linkButton} onPress={onViewProgress}>
						<Text style={styles.linkButtonText}>📊 View Progress & Streaks</Text>
					</TouchableOpacity>
				)}
			</View>

			{/* AI Context Prompt */}
			{contextPrompt && (
				<View style={styles.aiPromptSection}>
					<Text style={styles.aiPromptLabel}>💡 Reflection Prompt:</Text>
					<Text style={styles.aiPromptText}>{contextPrompt}</Text>
				</View>
			)}
		</View>
	);

	return (
		<View style={styles.container}>
			<ExpandableDetails
				isExpanded={isExpanded}
				onToggle={() => setIsExpanded(!isExpanded)}
				content={contextContent}
				toggleText={{
					show: "Show today's context",
					hide: "Hide context"
				}}
			/>
		</View>
	);
}

function getContextPrompt(habits: HabitStatus[], mood: MoodDisplayData | null): string {
	const completedHabits = habits.filter(h => h.status === 'completed').length;
	const totalHabits = habits.length;
	const skippedHabits = habits.filter(h => h.status === 'skipped').length;

	if (totalHabits === 0) {
		return "How are you feeling about your personal growth journey today?";
	}

	if (completedHabits === totalHabits) {
		return `Amazing! You've completed all ${totalHabits} habits today. How does this success feel?`;
	}

	if (skippedHabits > 0) {
		return `You've skipped ${skippedHabits} habit${skippedHabits > 1 ? 's' : ''} today. What's been challenging, and how can you support yourself?`;
	}

	if (completedHabits > 0) {
		return `You've completed ${completedHabits} of ${totalHabits} habits today. How do you feel about your progress so far?`;
	}

	return `You have ${totalHabits} habits planned for today. What's your intention for following through?`;
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: "#F8FAFC",
		borderRadius: 12,
		padding: 16,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: "#E2E8F0",
	},
	contextContent: {
		marginTop: 12,
	},
	section: {
		marginBottom: 16,
	},
	sectionLabel: {
		fontSize: 14,
		fontWeight: "600",
		color: "#4A5568",
		marginBottom: 8,
	},
	habitStatus: {
		fontSize: 14,
		color: "#2D3748",
		marginBottom: 4,
		paddingLeft: 8,
	},
	noDataText: {
		fontSize: 14,
		color: "#718096",
		fontStyle: "italic",
		paddingLeft: 8,
	},
	moodDisplay: {
		fontSize: 16,
		color: "#2D3748",
		fontWeight: "500",
		paddingLeft: 8,
	},
	quickActions: {
		flexDirection: "row",
		gap: 12,
		marginBottom: 16,
	},
	actionButton: {
		backgroundColor: "#4F8EF7",
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
	},
	actionButtonText: {
		color: "#fff",
		fontSize: 12,
		fontWeight: "500",
	},
	contextLinks: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
		marginBottom: 16,
	},
	linkButton: {
		backgroundColor: "#F7FAFC",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "#E2E8F0",
	},
	linkButtonText: {
		color: "#4A5568",
		fontSize: 11,
		fontWeight: "500",
	},
	aiPromptSection: {
		backgroundColor: "#EDF2F7",
		borderRadius: 8,
		padding: 12,
		borderLeftWidth: 3,
		borderLeftColor: "#4F8EF7",
	},
	aiPromptLabel: {
		fontSize: 12,
		fontWeight: "600",
		color: "#4F8EF7",
		marginBottom: 6,
	},
	aiPromptText: {
		fontSize: 14,
		color: "#2D3748",
		lineHeight: 20,
		fontWeight: "500",
	},
});