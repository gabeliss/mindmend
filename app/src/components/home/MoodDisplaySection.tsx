import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MoodDisplayData } from "../../types/mood";

interface MoodDisplayProps {
	mood: MoodDisplayData;
}

export function MoodDisplaySection({ mood }: MoodDisplayProps) {
	const getMoodEmoji = (rating: number): string => {
		if (rating <= 3) return "😢";
		if (rating <= 5) return "😐";
		if (rating <= 7) return "🙂";
		if (rating <= 8) return "😊";
		return "😍";
	};

	const renderMoodContent = () => {
		if (mood.type === "single") {
			return (
				<View style={styles.moodContent}>
					<Text style={styles.moodEmoji}>{getMoodEmoji(mood.current!)}</Text>
					<Text style={styles.moodText}>{mood.display}</Text>
				</View>
			);
		}

		return (
			<View style={styles.moodContent}>
				<Text style={styles.moodEmoji}>
					{getMoodEmoji(mood.start!)} → {getMoodEmoji(mood.end!)}
				</Text>
				<Text style={styles.moodText}>{mood.display}</Text>
				<Text style={styles.moodSubtext}>Today's mood range</Text>
			</View>
		);
	};

	return (
		<View style={styles.container}>
			<Text style={styles.label}>Today's mood:</Text>
			{renderMoodContent()}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		marginBottom: 12,
	},
	label: {
		fontSize: 14,
		fontWeight: "500",
		color: "#64748B",
		marginBottom: 4,
	},
	moodContent: {
		flexDirection: "row",
		alignItems: "center",
	},
	moodEmoji: {
		fontSize: 20,
		marginRight: 8,
	},
	moodText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#2D3748",
		flex: 1,
	},
	moodSubtext: {
		fontSize: 12,
		color: "#64748B",
		fontStyle: "italic",
	},
});