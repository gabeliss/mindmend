import React from "react";
import { View, StyleSheet, Animated } from "react-native";

interface SkeletonLoaderProps {
	type: "summary" | "timeline" | "insights" | "habit";
}

export function SkeletonLoader({ type }: SkeletonLoaderProps) {
	const animatedValue = React.useRef(new Animated.Value(0)).current;

	React.useEffect(() => {
		Animated.loop(
			Animated.sequence([
				Animated.timing(animatedValue, {
					toValue: 1,
					duration: 1000,
					useNativeDriver: true,
				}),
				Animated.timing(animatedValue, {
					toValue: 0,
					duration: 1000,
					useNativeDriver: true,
				}),
			])
		).start();
	}, [animatedValue]);

	const opacity = animatedValue.interpolate({
		inputRange: [0, 1],
		outputRange: [0.3, 0.7],
	});

	const renderSkeleton = () => {
		switch (type) {
			case "summary":
				return (
					<View style={styles.summaryContainer}>
						<Animated.View
							style={[styles.skeletonLine, styles.titleLine, { opacity }]}
						/>
						<Animated.View
							style={[styles.skeletonLine, styles.shortLine, { opacity }]}
						/>
						<Animated.View
							style={[styles.skeletonLine, styles.mediumLine, { opacity }]}
						/>
					</View>
				);
			case "timeline":
				return (
					<View style={styles.timelineContainer}>
						{[...Array(3)].map((_, index) => (
							<View
								key={index}
								style={styles.timelineItem}
							>
								<Animated.View
									style={[styles.skeletonLine, styles.dateLine, { opacity }]}
								/>
								<Animated.View
									style={[styles.skeletonLine, styles.contentLine, { opacity }]}
								/>
							</View>
						))}
					</View>
				);
			default:
				return (
					<Animated.View
						style={[styles.skeletonLine, styles.defaultLine, { opacity }]}
					/>
				);
		}
	};

	return <View style={styles.container}>{renderSkeleton()}</View>;
}

const styles = StyleSheet.create({
	container: {
		padding: 16,
	},
	summaryContainer: {
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 16,
	},
	timelineContainer: {
		gap: 12,
	},
	timelineItem: {
		backgroundColor: "#fff",
		borderRadius: 8,
		padding: 12,
	},
	skeletonLine: {
		backgroundColor: "#E2E8F0",
		borderRadius: 4,
		marginBottom: 8,
	},
	titleLine: {
		height: 20,
		width: "60%",
	},
	shortLine: {
		height: 16,
		width: "40%",
	},
	mediumLine: {
		height: 16,
		width: "80%",
	},
	dateLine: {
		height: 14,
		width: "30%",
	},
	contentLine: {
		height: 16,
		width: "90%",
	},
	defaultLine: {
		height: 16,
		width: "100%",
	},
});