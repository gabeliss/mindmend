import React, { useState } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Animated,
} from "react-native";

interface ExpandableDetailsProps {
	isExpanded: boolean;
	onToggle: () => void;
	content: React.ReactNode;
	toggleText?: {
		show: string;
		hide: string;
	};
}

export function ExpandableDetails({
	isExpanded,
	onToggle,
	content,
	toggleText = { show: "Show details", hide: "Hide details" },
}: ExpandableDetailsProps) {
	const [animation] = useState(new Animated.Value(isExpanded ? 1 : 0));

	React.useEffect(() => {
		Animated.timing(animation, {
			toValue: isExpanded ? 1 : 0,
			duration: 300,
			useNativeDriver: false,
		}).start();
	}, [isExpanded, animation]);

	const heightInterpolate = animation.interpolate({
		inputRange: [0, 1],
		outputRange: [0, 200], // Adjust based on content
	});

	return (
		<View style={styles.container}>
			<TouchableOpacity
				onPress={onToggle}
				style={styles.toggle}
			>
				<Text style={styles.toggleText}>
					{isExpanded ? toggleText.hide : toggleText.show}
				</Text>
				<Text style={styles.arrow}>{isExpanded ? "▼" : "▶"}</Text>
			</TouchableOpacity>

			<Animated.View style={[styles.content, { maxHeight: heightInterpolate }]}>
				{content}
			</Animated.View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		marginTop: 8,
	},
	toggle: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 8,
	},
	toggleText: {
		fontSize: 14,
		color: "#4F8EF7",
		fontWeight: "500",
	},
	arrow: {
		fontSize: 12,
		color: "#4F8EF7",
	},
	content: {
		overflow: "hidden",
	},
});