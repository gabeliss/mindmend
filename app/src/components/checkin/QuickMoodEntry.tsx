import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { apiClient, isApiError, handleApiError } from "../../services/api";

interface QuickMoodEntryProps {
	onMoodUpdated?: (mood: number) => void;
	currentMood?: number | null;
	compact?: boolean;
}

const moodOptions = [
	{ emoji: '😢', label: 'Terrible', value: 2 },
	{ emoji: '😔', label: 'Bad', value: 3 },
	{ emoji: '😐', label: 'Okay', value: 5 },
	{ emoji: '🙂', label: 'Good', value: 7 },
	{ emoji: '😊', label: 'Great', value: 8 },
	{ emoji: '🥳', label: 'Amazing', value: 10 },
];

export function QuickMoodEntry({ 
	onMoodUpdated, 
	currentMood,
	compact = false 
}: QuickMoodEntryProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [selectedMood, setSelectedMood] = useState<number | null>(currentMood || null);

	const handleMoodSelect = async (mood: number) => {
		setSelectedMood(mood);
		setIsSubmitting(true);

		try {
			// Create a simple journal entry with just the mood rating
			const response = await apiClient.createJournalEntry({
				content: `Quick mood update: ${getMoodLabel(mood)}`,
				moodRating: mood,
			});

			if (isApiError(response)) {
				throw new Error(handleApiError(response));
			}

			onMoodUpdated?.(mood);
			
			// Show success feedback
			if (!compact) {
				Alert.alert('Mood Updated', `Your mood has been recorded as ${getMoodLabel(mood)}.`);
			}

		} catch (error) {
			console.error('Failed to update mood:', error);
			Alert.alert('Error', 'Failed to update your mood. Please try again.');
			setSelectedMood(currentMood || null); // Reset on error
		} finally {
			setIsSubmitting(false);
		}
	};

	const getMoodLabel = (value: number): string => {
		const option = moodOptions.find(opt => opt.value === value);
		return option ? option.label : 'Unknown';
	};

	const getCurrentMoodOption = () => {
		return moodOptions.find(opt => opt.value === selectedMood);
	};

	if (compact && selectedMood) {
		const currentOption = getCurrentMoodOption();
		return (
			<TouchableOpacity 
				style={styles.compactMoodDisplay}
				onPress={() => setSelectedMood(null)} // Allow changing mood
				disabled={isSubmitting}
			>
				<Text style={styles.compactMoodEmoji}>{currentOption?.emoji}</Text>
				<Text style={styles.compactMoodText}>{currentOption?.label}</Text>
				<Text style={styles.compactChangeText}>Tap to change</Text>
			</TouchableOpacity>
		);
	}

	return (
		<View style={styles.container}>
			<Text style={styles.title}>
				{compact ? 'Quick Mood Check' : 'How are you feeling right now?'}
			</Text>
			
			<View style={[styles.moodGrid, compact && styles.compactGrid]}>
				{moodOptions.map((mood) => (
					<TouchableOpacity
						key={mood.value}
						style={[
							styles.moodOption,
							compact && styles.compactMoodOption,
							selectedMood === mood.value && styles.selectedMoodOption,
							isSubmitting && styles.disabledMoodOption,
						]}
						onPress={() => handleMoodSelect(mood.value)}
						disabled={isSubmitting}
					>
						<Text style={[
							styles.moodEmoji,
							compact && styles.compactEmoji,
						]}>
							{mood.emoji}
						</Text>
						{!compact && (
							<Text style={styles.moodLabel}>{mood.label}</Text>
						)}
					</TouchableOpacity>
				))}
			</View>

			{selectedMood && !compact && (
				<View style={styles.selectedMoodFeedback}>
					<Text style={styles.feedbackText}>
						Current mood: {getMoodLabel(selectedMood)} {getCurrentMoodOption()?.emoji}
					</Text>
				</View>
			)}

			{!compact && (
				<Text style={styles.helpText}>
					Your mood will be saved automatically and included in your daily summary.
				</Text>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
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
		fontSize: 16,
		fontWeight: "600",
		color: "#2D3748",
		marginBottom: 12,
		textAlign: "center",
	},
	moodGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
		gap: 8,
	},
	compactGrid: {
		justifyContent: "center",
		gap: 4,
	},
	moodOption: {
		alignItems: "center",
		padding: 12,
		borderRadius: 12,
		backgroundColor: "#F7FAFC",
		minWidth: 80,
		flex: 1,
		maxWidth: "30%",
	},
	compactMoodOption: {
		minWidth: 50,
		maxWidth: 50,
		padding: 8,
		borderRadius: 8,
	},
	selectedMoodOption: {
		backgroundColor: "#E6F3FF",
		borderColor: "#4F8EF7",
		borderWidth: 2,
	},
	disabledMoodOption: {
		opacity: 0.6,
	},
	moodEmoji: {
		fontSize: 28,
		marginBottom: 4,
	},
	compactEmoji: {
		fontSize: 20,
		marginBottom: 0,
	},
	moodLabel: {
		fontSize: 12,
		fontWeight: "500",
		color: "#2D3748",
		textAlign: "center",
	},
	selectedMoodFeedback: {
		backgroundColor: "#F0FFF4",
		borderRadius: 8,
		padding: 12,
		marginTop: 12,
		alignItems: "center",
	},
	feedbackText: {
		fontSize: 14,
		color: "#22543D",
		fontWeight: "500",
	},
	helpText: {
		fontSize: 12,
		color: "#64748B",
		textAlign: "center",
		marginTop: 12,
		fontStyle: "italic",
	},
	compactMoodDisplay: {
		backgroundColor: "#F0FFF4",
		borderRadius: 8,
		padding: 12,
		alignItems: "center",
		borderColor: "#48BB78",
		borderWidth: 1,
	},
	compactMoodEmoji: {
		fontSize: 24,
		marginBottom: 4,
	},
	compactMoodText: {
		fontSize: 14,
		color: "#22543D",
		fontWeight: "600",
		marginBottom: 2,
	},
	compactChangeText: {
		fontSize: 10,
		color: "#68D391",
		fontStyle: "italic",
	},
});