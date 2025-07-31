# MindMend Step-by-Step Implementation Guide

_Individual steps for LLM execution_

## 🎯 Overview

Transform MindMend into a unified personal growth companion by connecting habits, check-ins, and journal through data integration and AI insights.

**Total Steps**: 45 individual steps
**Estimated Duration**: 15 days (3 steps per day average)
**Execution**: Each step can be executed independently by an LLM

## 🏗️ CODE QUALITY & ARCHITECTURE PRINCIPLES

### **Modular Component Design**

- **Single Responsibility**: Each component has one clear purpose
- **Composition over Inheritance**: Build complex UIs from simple, reusable pieces
- **Props Interface**: Clearly defined TypeScript interfaces for all props
- **Size Limits**: Components <200 lines, services <300 lines, controllers <150 lines (not strict guidelines, can go a little over if necessary)

### **File Organization Standards**

```
src/
├── components/
│   ├── common/           # Reusable UI components
│   ├── home/            # Home screen specific components
│   ├── checkin/         # Check-in screen components
│   ├── journal/         # Journal screen components
│   └── insights/        # AI insights components
├── services/
│   ├── api/             # API client and endpoints
│   ├── ai/              # LLM and insight services
│   ├── data/            # Data processing and aggregation
│   └── cache/           # Caching and optimization
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
├── utils/               # Pure utility functions
└── constants/           # App constants and configuration
```

### **Legacy Code Cleanup Strategy**

**During Each Step**:

1. **Identify unused code** - Mark with TODO comments during development
2. **Remove immediately** - Don't let dead code accumulate
3. **Update imports** - Clean up unused imports as you go
4. **Verify no regressions** - Test after each cleanup

**End of Each Phase**:

- Dedicated cleanup step with comprehensive review
- Remove all TODO comments and console.logs
- Verify all files follow size guidelines
- Ensure consistent naming conventions

### **Code Maintainability Checklist**

**For Every Step**:

- [ ] Clear, descriptive naming conventions
- [ ] Comprehensive TypeScript types (no `any` types)
- [ ] Proper error handling and logging
- [ ] Components follow single responsibility principle
- [ ] Reusable components placed in `/common/`
- [ ] No duplicate logic between files
- [ ] All imports are used and necessary

---

## 📊 PHASE 1: DATA FOUNDATION (Steps 1-15)

### **Step 1: Database Schema Enhancement**

**Objective**: Add mood aggregation and check-in tracking to existing daily_stats table
**Files to modify**: `backend/prisma/schema.prisma`

```sql
// Add to existing daily_stats model
model DailyStats {
  // ... existing fields
  morningCheckinAt  DateTime?  @map("morning_checkin_at")
  eveningCheckinAt  DateTime?  @map("evening_checkin_at")
  checkinSummary    String?    @map("checkin_summary")
  moodRangeStart    Int?       @map("mood_range_start")
  moodRangeEnd      Int?       @map("mood_range_end")
  moodEntryCount    Int        @default(0) @map("mood_entry_count")
}
```

**Steps**:

1. Add new columns to daily_stats model
2. Run migration: `npx prisma migrate dev --name add-checkin-mood-tracking`
3. Update Prisma client: `npx prisma generate`
4. Test migration with sample query

**Validation**: Query daily_stats table and verify new columns exist
**Estimated Time**: 30 minutes

---

### **Step 2: Create TypeScript Type Definitions**

**Objective**: Define shared TypeScript interfaces for new data structures
**Files to create**: `app/src/types/insights.ts`, `app/src/types/mood.ts`

```typescript
// app/src/types/insights.ts
export interface DailySummaryData {
	date: string;
	checkInStatus: {
		morning: boolean;
		evening: boolean;
	};
	mood: MoodDisplayData | null;
	habits: {
		completed: number;
		total: number;
	};
	aiInsight: AIInsightData | null;
	yesterdayComparison?: string;
}

export interface AIInsightData {
	insight: string;
	confidence: "low" | "medium" | "high";
	reasoning: string;
	dataPoints: number;
}

// app/src/types/mood.ts
export interface MoodDisplayData {
	type: "single" | "range";
	current?: number;
	start?: number;
	end?: number;
	display: string;
}

export interface MoodAggregationResult {
	date: string;
	moodRangeStart: number;
	moodRangeEnd: number;
	moodEntryCount: number;
	entries: Array<{
		moodRating: number;
		createdAt: string;
	}>;
}
```

**Validation**: TypeScript compilation succeeds, no type errors
**Estimated Time**: 20 minutes

---

### **Step 3: Create Mood Aggregation Service**

**Objective**: Handle multiple mood entries per day and calculate daily ranges
**Files to create**: `backend/src/services/moodAggregationService.ts`

```typescript
import { prisma } from "../lib/prisma";

export class MoodAggregationService {
	async updateDailyMoodStats(userId: string, date: string): Promise<void> {
		const dayEntries = await prisma.journalEntry.findMany({
			where: {
				userId,
				createdAt: {
					gte: new Date(`${date}T00:00:00`),
					lt: new Date(`${date}T23:59:59`),
				},
				moodRating: { not: null },
			},
			orderBy: { createdAt: "asc" },
		});

		if (dayEntries.length === 0) return;

		const moods = dayEntries.map((entry) => entry.moodRating!);
		const moodRangeStart = Math.min(...moods);
		const moodRangeEnd = Math.max(...moods);

		await prisma.dailyStats.upsert({
			where: {
				userId_date: {
					userId,
					date: new Date(date),
				},
			},
			update: {
				moodRangeStart,
				moodRangeEnd,
				moodEntryCount: moods.length,
				updatedAt: new Date(),
			},
			create: {
				userId,
				date: new Date(date),
				moodRangeStart,
				moodRangeEnd,
				moodEntryCount: moods.length,
			},
		});
	}

	async getMoodDisplayData(
		userId: string,
		date: string
	): Promise<MoodDisplayData | null> {
		const dailyStat = await prisma.dailyStats.findFirst({
			where: { userId, date: new Date(date) },
		});

		if (!dailyStat || !dailyStat.moodRangeStart) return null;

		if (dailyStat.moodEntryCount === 1) {
			return {
				type: "single",
				current: dailyStat.moodRangeStart,
				display: `😊 ${dailyStat.moodRangeStart}/10`,
			};
		}

		return {
			type: "range",
			start: dailyStat.moodRangeStart,
			end: dailyStat.moodRangeEnd,
			display: `😐→😊 ${dailyStat.moodRangeStart}→${dailyStat.moodRangeEnd}`,
		};
	}
}

export const moodAggregationService = new MoodAggregationService();
```

**Validation**: Create test journal entries, verify daily_stats updates correctly
**Estimated Time**: 45 minutes

---

### **Step 4: Create LLM Insight Service Foundation**

**Objective**: Build service for generating AI insights using LLM prompting
**Files to create**: `backend/src/services/llmInsightService.ts`

```typescript
import { prisma } from "../lib/prisma";
import { aiService } from "./aiService"; // Use existing AI service

export class LLMInsightService {
	async generateDailyInsight(userId: string): Promise<AIInsightData | null> {
		const context = await this.getUserContext(userId, 14);

		if (context.dataPoints < 5) {
			return null; // Not enough data for insights
		}

		const prompt = this.buildInsightPrompt(context);

		try {
			const response = await aiService.generateContent(prompt);
			return this.parseInsightResponse(response, context.dataPoints);
		} catch (error) {
			console.error("Failed to generate insight:", error);
			return null;
		}
	}

	private async getUserContext(userId: string, days: number) {
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - days);

		const [habits, moods, dailyStats] = await Promise.all([
			prisma.habitEvent.findMany({
				where: { userId, occurredAt: { gte: startDate } },
				include: { habit: true },
				orderBy: { occurredAt: "desc" },
			}),

			prisma.journalEntry.findMany({
				where: {
					userId,
					createdAt: { gte: startDate },
					moodRating: { not: null },
				},
				orderBy: { createdAt: "desc" },
			}),

			prisma.dailyStats.findMany({
				where: { userId, date: { gte: startDate } },
				orderBy: { date: "desc" },
			}),
		]);

		return { habits, moods, dailyStats, dataPoints: dailyStats.length };
	}

	private buildInsightPrompt(context: any): string {
		return `
Analyze this user's habit and mood data to find ONE meaningful pattern.

HABIT COMPLETION DATA (last 14 days):
${context.habits
	.map(
		(h) => `${h.habit.title}: ${h.eventType} on ${h.occurredAt.toDateString()}`
	)
	.join("\n")}

MOOD DATA (last 14 days):
${context.moods
	.map((m) => `Mood: ${m.moodRating}/10 on ${m.createdAt.toDateString()}`)
	.join("\n")}

DAILY COMPLETION RATES:
${context.dailyStats
	.map(
		(d) =>
			`${d.date.toDateString()}: ${d.habitsCompleted}/${
				d.habitsTotal
			} habits completed`
	)
	.join("\n")}

Guidelines:
- Find ONE clear correlation between habits and mood
- Only suggest patterns with 5+ supporting data points
- Be encouraging but not overly optimistic
- Use phrases like "tends to" or "appears to" for confidence

Return JSON only:
{
  "insight": "One encouraging sentence about a pattern you observed",
  "confidence": "low|medium|high",
  "reasoning": "2-3 sentences explaining why this pattern exists",
  "pattern_strength": 1-10
}

If no clear pattern exists, return: {"insight": null}
`;
	}

	private parseInsightResponse(
		response: string,
		dataPoints: number
	): AIInsightData | null {
		try {
			const parsed = JSON.parse(response);

			if (!parsed.insight) return null;

			return {
				insight: parsed.insight,
				confidence: parsed.confidence || "low",
				reasoning:
					parsed.reasoning || "Based on your recent activity patterns.",
				dataPoints,
			};
		} catch (error) {
			console.error("Failed to parse insight response:", error);
			return null;
		}
	}
}

export const llmInsightService = new LLMInsightService();
```

**Validation**: Test with sample user data, verify meaningful insights generated
**Estimated Time**: 60 minutes

---

### **Step 5: Create Daily Summary API Endpoint**

**Objective**: Build API endpoint to serve home screen summary data
**Files to create**: `backend/src/controllers/insightsController.ts`

```typescript
import { Request, Response } from "express";
import { moodAggregationService } from "../services/moodAggregationService";
import { llmInsightService } from "../services/llmInsightService";
import { prisma } from "../lib/prisma";

export const getDailySummary = async (req: Request, res: Response) => {
	const userId = req.user.id;
	const today = new Date().toISOString().split("T")[0];

	try {
		const [dailyStats, moodDisplay, aiInsight] = await Promise.all([
			// Get today's daily stats
			prisma.dailyStats.findFirst({
				where: { userId, date: new Date(today) },
			}),

			// Get today's mood display data
			moodAggregationService.getMoodDisplayData(userId, today),

			// Generate AI insight
			llmInsightService.generateDailyInsight(userId),
		]);

		const checkInStatus = {
			morning: !!dailyStats?.morningCheckinAt,
			evening: !!dailyStats?.eveningCheckinAt,
		};

		const habits = {
			completed: dailyStats?.habitsCompleted || 0,
			total: dailyStats?.habitsTotal || 0,
		};

		const yesterdayComparison = await calculateYesterdayComparison(
			userId,
			today
		);

		const response: DailySummaryData = {
			date: today,
			checkInStatus,
			mood: moodDisplay,
			habits,
			aiInsight,
			yesterdayComparison,
		};

		res.json({ success: true, data: response });
	} catch (error) {
		console.error("Error getting daily summary:", error);
		res.status(500).json({
			success: false,
			error: "Failed to get daily summary",
		});
	}
};

async function calculateYesterdayComparison(
	userId: string,
	today: string
): Promise<string | undefined> {
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);

	const [todayStats, yesterdayStats] = await Promise.all([
		prisma.dailyStats.findFirst({
			where: { userId, date: new Date(today) },
		}),
		prisma.dailyStats.findFirst({
			where: { userId, date: yesterday },
		}),
	]);

	if (!todayStats || !yesterdayStats) return undefined;

	const todayMood = todayStats.moodRangeEnd || todayStats.moodRangeStart;
	const yesterdayMood =
		yesterdayStats.moodRangeEnd || yesterdayStats.moodRangeStart;

	if (!todayMood || !yesterdayMood) return undefined;

	const moodDiff = todayMood - yesterdayMood;

	if (moodDiff > 0) {
		return `↗️ +${moodDiff.toFixed(1)} mood improvement`;
	} else if (moodDiff < 0) {
		return `↘️ ${moodDiff.toFixed(1)} from yesterday`;
	} else {
		return `➡️ Similar mood to yesterday`;
	}
}
```

**Files to modify**: `backend/src/routes/insights.ts`

```typescript
import express from "express";
import { getDailySummary } from "../controllers/insightsController";
import { authenticateUser } from "../middleware/auth";

const router = express.Router();

router.get("/daily-summary", authenticateUser, getDailySummary);

export default router;
```

**Files to modify**: `backend/src/app.ts`

```typescript
// Add to existing routes
import insightsRoutes from "./routes/insights";
app.use("/api/insights", insightsRoutes);
```

**Validation**: Test API endpoint with Postman, verify correct response format
**Estimated Time**: 45 minutes

---

### **Step 6: Update Journal Entry Creation to Trigger Mood Aggregation**

**Objective**: Ensure mood aggregation runs when journal entries are created
**Files to modify**: `backend/src/controllers/journalController.ts`

```typescript
// Add to existing createJournalEntry function
import { moodAggregationService } from "../services/moodAggregationService";

export const createJournalEntry = async (req: Request, res: Response) => {
	// ... existing code for creating journal entry

	try {
		const journalEntry = await prisma.journalEntry.create({
			data: {
				userId: req.user.id,
				content: req.body.content,
				moodRating: req.body.moodRating,
				// ... other fields
			},
		});

		// NEW: Update mood aggregation if mood was provided
		if (req.body.moodRating) {
			const today = new Date().toISOString().split("T")[0];
			await moodAggregationService.updateDailyMoodStats(req.user.id, today);
		}

		res.json({ success: true, data: journalEntry });
	} catch (error) {
		// ... existing error handling
	}
};
```

**Validation**: Create journal entry with mood, verify daily_stats updates
**Estimated Time**: 20 minutes

---

### **Step 7: Create Common UI Components**

**Objective**: Build reusable UI components for consistent design
**Files to create**: `app/src/components/common/ExpandableDetails.tsx`

```typescript
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
		outputRange: [0, 100], // Adjust based on content
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
```

**Files to create**: `app/src/components/common/SkeletonLoader.tsx`

```typescript
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
									style={[styles.skeletonLine, styles.dateeLine, { opacity }]}
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
	dateeLine: {
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
```

**Validation**: Components render correctly and animate smoothly
**Estimated Time**: 40 minutes

---

### **Step 8: Create Check-In Status Component**

**Objective**: Build modular component for displaying check-in status
**Files to create**: `app/src/components/home/CheckInStatusSection.tsx`

```typescript
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
```

**Validation**: Component displays check-in status correctly
**Estimated Time**: 25 minutes

---

### **Step 9: Create Mood Display Component**

**Objective**: Build component for displaying mood ranges or single moods
**Files to create**: `app/src/components/home/MoodDisplaySection.tsx`

```typescript
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
```

**Validation**: Component displays both single moods and mood ranges correctly
**Estimated Time**: 30 minutes

---

### **Step 10: Create AI Insight Component**

**Objective**: Build component for displaying AI insights with expandable details
**Files to create**: `app/src/components/home/AIInsightSection.tsx`

```typescript
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
```

**Validation**: Component displays insights with proper expandable functionality
**Estimated Time**: 45 minutes

---

### **Step 11: Create Main Daily Summary Card Component**

**Objective**: Build main container component that composes all sub-components
**Files to create**: `app/src/components/home/DailySummaryCard.tsx`

```typescript
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
```

**Validation**: Main component composes all sub-components correctly
**Estimated Time**: 25 minutes

---

### **Step 12: Add Daily Summary API Client Method**

**Objective**: Add API client method for fetching daily summary
**Files to modify**: `app/src/services/api.ts`

```typescript
// Add to existing apiClient object
const apiClient = {
	// ... existing methods

	async getDailySummary(): Promise<ApiResponse<DailySummaryData>> {
		const token = await this.getAuthToken();

		const response = await fetch(`${API_BASE_URL}/insights/daily-summary`, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
		});

		return await response.json();
	},

	// ... rest of existing methods
};
```

**Validation**: API client method works correctly with test calls
**Estimated Time**: 15 minutes

---

### **Step 13: Integrate Daily Summary into Home Screen**

**Objective**: Add daily summary card to Home screen above existing habit cards
**Files to modify**: `app/src/screens/HomeScreen.tsx`

```typescript
// Add imports
import { DailySummaryCard } from "../components/home/DailySummaryCard";
import { SkeletonLoader } from "../components/common/SkeletonLoader";
import { DailySummaryData } from "../types/insights";

// Add state for daily summary
const [dailySummary, setDailySummary] = useState<DailySummaryData | null>(null);
const [summaryLoading, setSummaryLoading] = useState(true);

// Add useEffect to load summary
useEffect(() => {
	if (isAuthenticated && user) {
		loadDailySummary();
	}
}, [isAuthenticated, user]);

const loadDailySummary = async () => {
	try {
		setSummaryLoading(true);
		const response = await apiClient.getDailySummary();
		if (!isApiError(response)) {
			setDailySummary(response.data);
		}
	} catch (error) {
		console.error("Failed to load daily summary:", error);
	} finally {
		setSummaryLoading(false);
	}
};

const handleInsightFeedback = async (feedback: "helpful" | "not_helpful") => {
	// TODO: Implement insight feedback API call
	console.log("Insight feedback:", feedback);
};

// Add to render method, before existing ProgressSection
const renderDailySummary = () => {
	if (summaryLoading) {
		return <SkeletonLoader type="summary" />;
	}

	if (!dailySummary) return null;

	return (
		<DailySummaryCard
			summary={dailySummary}
			onInsightFeedback={handleInsightFeedback}
		/>
	);
};

// In the main render return:
return (
	<FlatList
		data={habits}
		keyExtractor={(item) => item.id}
		refreshControl={
			<RefreshControl
				refreshing={isRefreshing}
				onRefresh={handleRefresh}
				colors={["#4F8EF7"]}
				tintColor="#4F8EF7"
			/>
		}
		ListHeaderComponent={() => (
			<View>
				{renderDailySummary()}
				<ProgressSection todaysProgress={todaysProgress} />
			</View>
		)}
		// ... rest of existing FlatList props
	/>
);
```

**Validation**: Home screen displays daily summary card with live data
**Estimated Time**: 30 minutes

---

### **Step 14: Update Refresh Logic to Include Summary**

**Objective**: Ensure daily summary refreshes when user pulls to refresh
**Files to modify**: `app/src/screens/HomeScreen.tsx`

```typescript
// Update existing handleRefresh function
const handleRefresh = useCallback(async () => {
	setIsRefreshing(true);
	await Promise.all([
		loadHabits(),
		loadDailySummary(), // Add this line
	]);
	setIsRefreshing(false);
}, [loadHabits, loadDailySummary]);

// Also update focus effect to refresh summary
useFocusEffect(
	useCallback(() => {
		if (isAuthenticated && user) {
			loadHabits();
			loadDailySummary(); // Add this line
		}
	}, [isAuthenticated, user, loadHabits, loadDailySummary])
);
```

**Validation**: Pull to refresh updates both habits and daily summary
**Estimated Time**: 15 minutes

---

### **Step 15: Phase 1 Code Cleanup and Testing**

**Objective**: Clean up code, remove unused imports, and test all Phase 1 functionality
**Files to review**: All files created/modified in Steps 1-14

**Cleanup Tasks**:

1. Remove any unused imports from all modified files
2. Ensure all TypeScript interfaces are properly exported
3. Verify consistent naming conventions
4. Remove any TODO comments or console.logs
5. Ensure all components follow size guidelines (<200 lines)

**Testing Tasks**:

1. Test mood aggregation: Create multiple journal entries, verify daily_stats
2. Test AI insights: Verify meaningful insights generated with sufficient data
3. Test Home screen: Verify summary card displays and updates correctly
4. Test API endpoints: Verify all endpoints return correct data format
5. Test edge cases: No data, single mood entry, no habits completed
6. Test refresh functionality: Verify pull to refresh works

**Code Quality Review**:

1. **Component Size Check**: Verify all components under 200 lines
   - If any component is over 200 lines, break into smaller sub-components
   - Move reusable parts to `/common/` folder
2. **Import Cleanup**: Remove all unused imports across modified files
3. **TypeScript Strict Mode**: Ensure no `any` types, all interfaces defined
4. **File Organization**: Verify all files are in correct domain folders
5. **Legacy Code Removal**: Remove any old code that's no longer used
6. **Naming Consistency**: Ensure consistent naming conventions

**Files to Review for Cleanup**:

- All `/components/home/` files created in this phase
- All `/services/` files for unused methods
- All `/types/` files for comprehensive coverage
- HomeScreen.tsx for any old unused code

**Success Criteria**:

- [ ] All components render without errors
- [ ] Daily summary shows correct data from API
- [ ] Mood ranges calculate and display correctly
- [ ] AI insights are relevant and well-formatted
- [ ] Home screen loads quickly with summary
- [ ] Progressive disclosure works smoothly
- [ ] No unused code or imports remain
- [ ] All TypeScript types are properly defined
- [ ] All components follow size guidelines (<200 lines)
- [ ] File organization matches established structure
- [ ] No duplicate logic between components

**Estimated Time**: 60 minutes

---

## 🔄 PHASE 2: CHECK-IN & JOURNAL ENHANCEMENTS (Steps 16-30)

_[Continue with remaining 30 steps for Phases 2 and 3...]_

---

## 📊 Step Execution Guidelines

### **For Each Step**:

1. **Read objective carefully** - understand what needs to be accomplished
2. **Review files to modify/create** - ensure you have the correct file paths
3. **Follow code examples** - use provided code as starting point, adapt as needed
4. **Run validation** - test that the step worked correctly
5. **Estimate time** - use provided time estimates for planning

### **Code Quality Standards**:

- Keep components under 200 lines
- Use TypeScript interfaces for all props
- Follow single responsibility principle
- Remove unused imports and code
- Add error handling for API calls
- Use consistent naming conventions

### **Testing Each Step**:

- Test functionality works as expected
- Verify no TypeScript errors
- Check that UI renders correctly
- Ensure API endpoints return correct data
- Test edge cases and error scenarios

This step-by-step approach allows for incremental progress with validation at each stage, making it perfect for LLM execution while maintaining code quality and architectural standards.
