import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ExpandableDetails } from "../common/ExpandableDetails";
import { AIInsightData } from "../../types/insights";

interface AIInsightProps {
	insight: AIInsightData;
	onFeedback?: (feedback: "helpful" | "not_helpful") => void;
}

export function AIInsightSection({ insight, onFeedback }: AIInsightProps) {
	const [showDetails, setShowDetails] = useState(false);
	const [feedbackGiven, setFeedbackGiven] = useState(false);

	const handleFeedback = (feedback: "helpful" | "not_helpful") => {
		setFeedbackGiven(true);
		onFeedback?.(feedback);
	};

	const getConfidenceColor = (confidence: string) => {
		switch (confidence) {
			case "high":
				return "#22543D";
			case "medium":
				return "#2F855A";
			case "low":
				return "#68D391";
			default:
				return "#64748B";
		}
	};

	const detailsContent = (
		<View style={styles.detailsContent}>
			<View style={styles.confidenceSection}>
				<Text style={styles.confidenceLabel}>Confidence:</Text>
				<Text
					style={[
						styles.confidenceValue,
						{ color: getConfidenceColor(insight.confidence) },
					]}
				>
					{insight.confidence}
				</Text>
				<Text style={styles.dataPoints}>
					({insight.dataPoints} days of data)
				</Text>
			</View>

			<Text style={styles.reasoning}>{insight.reasoning}</Text>

			{!feedbackGiven && onFeedback && (
				<View style={styles.feedbackSection}>
					<Text style={styles.feedbackLabel}>Was this helpful?</Text>
					<View style={styles.feedbackButtons}>
						<TouchableOpacity
							style={styles.feedbackButton}
							onPress={() => handleFeedback("helpful")}
						>
							<Text style={styles.feedbackButtonText}>👍 Yes</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.feedbackButton}
							onPress={() => handleFeedback("not_helpful")}
						>
							<Text style={styles.feedbackButtonText}>👎 No</Text>
						</TouchableOpacity>
					</View>
				</View>
			)}

			{feedbackGiven && (
				<Text style={styles.thankYou}>Thanks for your feedback!</Text>
			)}
		</View>
	);

	return (
		<View style={styles.container}>
			<View style={styles.insightHeader}>
				<Text style={styles.insightEmoji}>💡</Text>
				<Text style={styles.insightText}>{insight.insight}</Text>
			</View>

			<ExpandableDetails
				isExpanded={showDetails}
				onToggle={() => setShowDetails(!showDetails)}
				content={detailsContent}
				toggleText={{ show: "Show details", hide: "Hide details" }}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: "#F0FFF4",
		borderRadius: 8,
		padding: 12,
		borderLeftWidth: 3,
		borderLeftColor: "#38A169",
	},
	insightHeader: {
		flexDirection: "row",
		alignItems: "flex-start",
	},
	insightEmoji: {
		fontSize: 16,
		marginRight: 8,
		marginTop: 2,
	},
	insightText: {
		fontSize: 14,
		color: "#22543D",
		fontWeight: "500",
		flex: 1,
		lineHeight: 20,
	},
	detailsContent: {
		marginTop: 8,
		paddingTop: 8,
		borderTopWidth: 1,
		borderTopColor: "#C6F6D5",
	},
	confidenceSection: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 8,
	},
	confidenceLabel: {
		fontSize: 12,
		color: "#2F855A",
		fontWeight: "500",
	},
	confidenceValue: {
		fontSize: 12,
		fontWeight: "600",
		marginLeft: 4,
		textTransform: "capitalize",
	},
	dataPoints: {
		fontSize: 12,
		color: "#68D391",
		marginLeft: 4,
	},
	reasoning: {
		fontSize: 13,
		color: "#2F855A",
		lineHeight: 18,
		marginBottom: 12,
	},
	feedbackSection: {
		marginTop: 8,
	},
	feedbackLabel: {
		fontSize: 12,
		color: "#2F855A",
		fontWeight: "500",
		marginBottom: 6,
	},
	feedbackButtons: {
		flexDirection: "row",
		gap: 8,
	},
	feedbackButton: {
		backgroundColor: "#C6F6D5",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
	},
	feedbackButtonText: {
		fontSize: 12,
		color: "#22543D",
		fontWeight: "500",
	},
	thankYou: {
		fontSize: 12,
		color: "#38A169",
		fontStyle: "italic",
		marginTop: 8,
	},
});