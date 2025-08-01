import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { DailyTimelineEntry } from "./DailyTimelineEntry";

interface TimelineData {
	date: string;
	mood: {
		rating: number;
		display: string;
	} | null;
	habits: Array<{
		id: string;
		title: string;
		status: 'completed' | 'skipped' | 'pending';
		habitType: 'BUILD' | 'AVOID';
	}>;
	journalEntry?: {
		id: string;
		title?: string;
		content: string;
		preview: string;
	} | null;
	checkInSummary?: string | null;
	aiInsight?: string | null;
}

interface DailyTimelineProps {
	timelineData: TimelineData[];
	loading?: boolean;
	onViewJournal?: (date: string, entryId?: string) => void;
	onViewHabits?: (date: string) => void;
	emptyMessage?: string;
}

export function DailyTimeline({
	timelineData,
	loading = false,
	onViewJournal,
	onViewHabits,
	emptyMessage = "No entries found. Start by adding a journal entry or completing some habits!",
}: DailyTimelineProps) {
	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<Text style={styles.loadingText}>Loading your timeline...</Text>
			</View>
		);
	}

	if (timelineData.length === 0) {
		return (
			<View style={styles.emptyContainer}>
				<Text style={styles.emptyText}>{emptyMessage}</Text>
			</View>
		);
	}

	return (
		<ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
			<View style={styles.timelineHeader}>
				<Text style={styles.timelineTitle}>Your Journey</Text>
				<Text style={styles.timelineSubtitle}>
					{timelineData.length} {timelineData.length === 1 ? 'day' : 'days'} of progress
				</Text>
			</View>

			<View style={styles.timeline}>
				{timelineData.map((dayData, index) => (
					<View key={dayData.date} style={styles.timelineEntry}>
						{/* Timeline connector line */}
						{index < timelineData.length - 1 && (
							<View style={styles.timelineConnector} />
						)}
						
						{/* Timeline dot */}
						<View style={[
							styles.timelineDot,
							dayData.mood && styles.timelineDotWithMood,
							dayData.habits.some(h => h.status === 'completed') && styles.timelineDotActive
						]} />

						{/* Daily timeline entry */}
						<View style={styles.entryContainer}>
							<DailyTimelineEntry
								date={dayData.date}
								mood={dayData.mood}
								habits={dayData.habits}
								journalEntry={dayData.journalEntry}
								checkInSummary={dayData.checkInSummary}
								aiInsight={dayData.aiInsight}
								onViewJournal={() => onViewJournal?.(dayData.date, dayData.journalEntry?.id)}
								onViewHabits={() => onViewHabits?.(dayData.date)}
							/>
						</View>
					</View>
				))}
			</View>

			{/* Timeline end indicator */}
			<View style={styles.timelineEnd}>
				<View style={styles.timelineEndDot} />
				<Text style={styles.timelineEndText}>Your journey continues...</Text>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F8FAFC",
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#F8FAFC",
	},
	loadingText: {
		fontSize: 16,
		color: "#64748B",
		fontWeight: "500",
	},
	emptyContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#F8FAFC",
		padding: 32,
	},
	emptyText: {
		fontSize: 16,
		color: "#64748B",
		textAlign: "center",
		lineHeight: 24,
	},
	timelineHeader: {
		padding: 20,
		paddingBottom: 12,
	},
	timelineTitle: {
		fontSize: 24,
		fontWeight: "700",
		color: "#1A202C",
		marginBottom: 4,
	},
	timelineSubtitle: {
		fontSize: 14,
		color: "#64748B",
		fontWeight: "500",
	},
	timeline: {
		paddingHorizontal: 16,
	},
	timelineEntry: {
		flexDirection: "row",
		alignItems: "flex-start",
		marginBottom: 8,
		position: "relative",
	},
	timelineConnector: {
		position: "absolute",
		left: 15,
		top: 32,
		bottom: -8,
		width: 2,
		backgroundColor: "#E2E8F0",
		zIndex: 0,
	},
	timelineDot: {
		width: 12,
		height: 12,
		borderRadius: 6,
		backgroundColor: "#CBD5E0",
		marginTop: 20,
		marginRight: 16,
		zIndex: 1,
		borderWidth: 2,
		borderColor: "#F8FAFC",
	},
	timelineDotWithMood: {
		backgroundColor: "#9F7AEA",
	},
	timelineDotActive: {
		backgroundColor: "#48BB78",
	},
	entryContainer: {
		flex: 1,
	},
	timelineEnd: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 20,
	},
	timelineEndDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: "#E2E8F0",
		marginRight: 16,
	},
	timelineEndText: {
		fontSize: 14,
		color: "#64748B",
		fontStyle: "italic",
	},
});