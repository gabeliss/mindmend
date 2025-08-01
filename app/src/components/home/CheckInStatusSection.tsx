import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface CheckInStatusProps {
	status: {
		morning: boolean;
		evening: boolean;
	};
}

export function CheckInStatusSection({ status }: CheckInStatusProps) {
	const getMorningText = () => (status.morning ? "✅ Morning" : "⏳ Morning");
	const getEveningText = () => (status.evening ? "✅ Evening" : "⏳ Evening");

	return (
		<View style={styles.container}>
			<Text style={styles.label}>Check-ins:</Text>
			<View style={styles.statusRow}>
				<Text style={[styles.statusText, status.morning && styles.completed]}>
					{getMorningText()}
				</Text>
				<Text style={styles.separator}>•</Text>
				<Text style={[styles.statusText, status.evening && styles.completed]}>
					{getEveningText()}
				</Text>
			</View>
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
	statusRow: {
		flexDirection: "row",
		alignItems: "center",
	},
	statusText: {
		fontSize: 14,
		color: "#64748B",
	},
	completed: {
		color: "#22543D",
		fontWeight: "600",
	},
	separator: {
		marginHorizontal: 8,
		color: "#64748B",
	},
});