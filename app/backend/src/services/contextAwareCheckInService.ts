import Logger from '../utils/logger';

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

interface ContextAwareQuestion {
	text: string;
	type: 'text' | 'mindset' | 'mood';
	prefill?: string;
	context?: string; // Explanation of why this question is being asked
}

export class ContextAwareCheckInService {
	generateMorningQuestions(
		habits: HabitStatus[],
		mood: MoodDisplayData | null
	): ContextAwareQuestion[] {
		const baseQuestions: ContextAwareQuestion[] = [];
		
		// Always include goal-setting question
		baseQuestions.push({
			text: "What's your #1 goal today?",
			type: 'text',
			prefill: this.generateGoalPrefill(habits),
			context: 'Setting clear daily intentions helps maintain focus'
		});

		// Add habit-specific questions
		const skippedHabits = habits.filter(h => h.status === 'skipped');
		const strugglingHabits = habits.filter(h => h.streakCount && h.streakCount < 3);
		const strongHabits = habits.filter(h => h.streakCount && h.streakCount >= 7);

		if (skippedHabits.length > 0) {
			baseQuestions.push({
				text: `You skipped ${skippedHabits.map(h => h.title).join(', ')} recently. What's your plan for today?`,
				type: 'text',
				prefill: this.generateSkippedHabitPrefill(skippedHabits[0]),
				context: 'Addressing recent challenges helps build resilience'
			});
		}

		if (strugglingHabits.length > 0) {
			baseQuestions.push({
				text: `${strugglingHabits[0].title} seems challenging lately. What support do you need?`,
				type: 'text',
				prefill: 'I need to identify my triggers and create a backup plan',
				context: 'Building support systems strengthens habit formation'
			});
		}

		if (strongHabits.length > 0) {
			baseQuestions.push({
				text: `You're doing great with ${strongHabits[0].title}! How can you maintain this momentum?`,
				type: 'text',
				prefill: 'I can keep using the same strategies that are working',
				context: 'Celebrating success reinforces positive behavior'
			});
		}

		// Add mood and mindset questions
		baseQuestions.push(
			{
				text: "What potential challenges do you see today?",
				type: 'text',
				prefill: this.generateChallengesPrefill(habits),
				context: 'Anticipating obstacles improves preparation'
			},
			{
				text: "How are you feeling right now?",
				type: 'mood',
				context: 'Tracking mood helps identify patterns'
			},
			{
				text: "Choose your mindset for today",
				type: 'mindset',
				context: 'Setting intention shapes your approach to challenges'
			}
		);

		// Limit to 5 questions to avoid overwhelming
		return baseQuestions.slice(0, 5);
	}

	generateEveningQuestions(
		habits: HabitStatus[],
		mood: MoodDisplayData | null
	): ContextAwareQuestion[] {
		const baseQuestions: ContextAwareQuestion[] = [];
		const completedHabits = habits.filter(h => h.status === 'completed');
		const skippedHabits = habits.filter(h => h.status === 'skipped');
		const pendingHabits = habits.filter(h => h.status === 'pending');

		// Reflection on goal achievement
		if (completedHabits.length === habits.length && habits.length > 0) {
			baseQuestions.push({
				text: "Amazing! You completed all your habits today. How does that feel?",
				type: 'text',
				prefill: 'I feel proud and motivated to keep building these positive habits',
				context: 'Celebrating complete success reinforces commitment'
			});
		} else if (completedHabits.length > 0) {
			baseQuestions.push({
				text: `You completed ${completedHabits.length} of ${habits.length} habits today. How do you feel about your progress?`,
				type: 'text',
				prefill: 'I made good progress and learned something about myself',
				context: 'Reflecting on partial success builds resilience'
			});
		} else if (habits.length > 0) {
			baseQuestions.push({
				text: "Today was challenging with your habits. What did you learn?",
				type: 'text',
				prefill: 'I understand my triggers better and can plan differently tomorrow',
				context: 'Learning from difficult days is valuable for growth'
			});
		}

		// Specific habit reflection
		if (skippedHabits.length > 0) {
			const skippedHabit = skippedHabits[0];
			baseQuestions.push({
				text: `What led to skipping ${skippedHabit.title} today?`,
				type: 'text',
				prefill: this.generateSkipReflectionPrefill(skippedHabit),
				context: 'Understanding triggers helps prevent future setbacks'
			});
		}

		if (completedHabits.length > 0) {
			const completedHabit = completedHabits[0];
			baseQuestions.push({
				text: `What helped you succeed with ${completedHabit.title} today?`,
				type: 'text',
				prefill: 'I stayed consistent with my routine and reminded myself why it matters',
				context: 'Identifying success factors helps replicate positive outcomes'
			});
		}

		// Overall reflection questions
		baseQuestions.push(
			{
				text: "What was the highlight of your day?",
				type: 'text',
				prefill: 'I felt good about staying focused on what matters most',
				context: 'Recognizing positive moments builds gratitude'
			},
			{
				text: "How do you feel about today overall?",
				type: 'mood',
				context: 'Evening mood tracking shows daily emotional patterns'
			}
		);

		// Limit to 5 questions
		return baseQuestions.slice(0, 5);
	}

	private generateGoalPrefill(habits: HabitStatus[]): string {
		if (habits.length === 0) {
			return 'Focus on personal growth and stay mindful throughout the day';
		}

		const pendingHabits = habits.filter(h => h.status === 'pending');
		if (pendingHabits.length > 0) {
			return `Complete my ${pendingHabits[0].title} and stay consistent with my habits`;
		}

		return 'Maintain my positive habit momentum and build on yesterday\'s progress';
	}

	private generateSkippedHabitPrefill(habit: HabitStatus): string {
		if (habit.habitType === 'BUILD') {
			return `I'll create a specific plan for ${habit.title} and set a reminder`;
		} else {
			return `I'll identify my triggers for ${habit.title} and prepare alternative responses`;
		}
	}

	private generateChallengesPrefill(habits: HabitStatus[]): string {
		const avoidHabits = habits.filter(h => h.habitType === 'AVOID');
		if (avoidHabits.length > 0) {
			return `Stress or boredom might trigger urges around ${avoidHabits[0].title}`;
		}
		
		const buildHabits = habits.filter(h => h.habitType === 'BUILD');
		if (buildHabits.length > 0) {
			return `Time management might make it hard to fit in ${buildHabits[0].title}`;
		}

		return 'Unexpected changes to my routine might throw off my plans';
	}

	private generateSkipReflectionPrefill(habit: HabitStatus): string {
		if (habit.habitType === 'BUILD') {
			return `I got busy and didn't prioritize time for ${habit.title}`;
		} else {
			return `I felt stressed and defaulted to old patterns with ${habit.title}`;
		}
	}

	async generateContextualPrompt(
		checkInType: 'morning' | 'evening',
		habits: HabitStatus[],
		mood: MoodDisplayData | null
	): Promise<string> {
		try {
			if (checkInType === 'morning') {
				return this.generateMorningPrompt(habits, mood);
			} else {
				return this.generateEveningPrompt(habits, mood);
			}
		} catch (error) {
			Logger.error('Failed to generate contextual prompt', { error, checkInType });
			return 'Take a moment to reflect on your personal growth journey.';
		}
	}

	private generateMorningPrompt(habits: HabitStatus[], mood: MoodDisplayData | null): string {
		const completedHabits = habits.filter(h => h.status === 'completed').length;
		const totalHabits = habits.length;

		if (totalHabits === 0) {
			return "Start your day with intention. What matters most to you today?";
		}

		if (completedHabits === totalHabits) {
			return "You're already on top of your habits! How will you maintain this momentum?";
		}

		const strongHabits = habits.filter(h => h.streakCount && h.streakCount >= 7);
		if (strongHabits.length > 0) {
			return `Your consistency with ${strongHabits[0].title} is inspiring! What will you focus on next?`;
		}

		const strugglingHabits = habits.filter(h => h.streakCount && h.streakCount < 3);
		if (strugglingHabits.length > 0) {
			return `${strugglingHabits[0].title} has been challenging. What would help you succeed today?`;
		}

		return "You have important habits to focus on today. What's your strategy for success?";
	}

	private generateEveningPrompt(habits: HabitStatus[], mood: MoodDisplayData | null): string {
		const completedHabits = habits.filter(h => h.status === 'completed').length;
		const skippedHabits = habits.filter(h => h.status === 'skipped').length;
		const totalHabits = habits.length;

		if (totalHabits === 0) {
			return "Reflect on your day. What are you grateful for?";
		}

		if (completedHabits === totalHabits) {
			return `Perfect day! You completed all ${totalHabits} habits. What made today successful?`;
		}

		if (skippedHabits > completedHabits) {
			return "Today was challenging, but that's part of growth. What did you learn about yourself?";
		}

		if (completedHabits > 0) {
			return `You made progress on ${completedHabits} habits today. How do you feel about building these positive changes?`;
		}

		return "Every day is a chance to learn and grow. What insights do you have from today?";
	}
}

export const contextAwareCheckInService = new ContextAwareCheckInService();