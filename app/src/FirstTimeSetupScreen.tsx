import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from './services/auth';
import { apiClient } from './services/api';

interface CoachStyle {
  id: 'SUPPORTIVE' | 'DIRECT' | 'MOTIVATIONAL' | 'GENTLE';
  name: string;
  description: string;
  icon: string;
  example: string;
}

interface SuggestedHabit {
  id: string;
  title: string;
  description: string;
  habitType: 'BUILD' | 'BREAK';
  category: string;
  icon: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  selected: boolean;
}

const coachStyles: CoachStyle[] = [
  {
    id: 'SUPPORTIVE',
    name: 'Supportive Coach',
    description: 'Encouraging and understanding',
    icon: '🤗',
    example: '"You\'re doing great! Every small step counts toward your goals."',
  },
  {
    id: 'MOTIVATIONAL',
    name: 'Motivational Coach',
    description: 'High-energy and inspiring',
    icon: '🔥',
    example: '"You\'ve got this! Push through and achieve greatness!"',
  },
  {
    id: 'DIRECT',
    name: 'Direct Coach',
    description: 'Straightforward and honest',
    icon: '🎯',
    example: '"Let\'s focus on what matters. Here\'s your next step."',
  },
  {
    id: 'GENTLE',
    name: 'Gentle Coach',
    description: 'Calm and mindful guidance',
    icon: '🌱',
    example: '"Take your time. Progress happens at your own pace."',
  },
];

const suggestedHabits: SuggestedHabit[] = [
  // Build Habits - Health
  {
    id: '1',
    title: 'Drink 8 glasses of water',
    description: 'Stay hydrated throughout the day',
    habitType: 'BUILD',
    category: 'Health',
    icon: '💧',
    difficulty: 'Easy',
    selected: false,
  },
  {
    id: '2',
    title: 'Exercise for 30 minutes',
    description: 'Any physical activity counts',
    habitType: 'BUILD',
    category: 'Health',
    icon: '🏃',
    difficulty: 'Medium',
    selected: false,
  },
  {
    id: '3',
    title: 'Get 8 hours of sleep',
    description: 'Prioritize quality rest',
    habitType: 'BUILD',
    category: 'Health',
    icon: '😴',
    difficulty: 'Medium',
    selected: false,
  },
  {
    id: '4',
    title: 'Eat 5 servings of fruits/vegetables',
    description: 'Nourish your body with healthy foods',
    habitType: 'BUILD',
    category: 'Health',
    icon: '🥗',
    difficulty: 'Medium',
    selected: false,
  },

  // Build Habits - Productivity
  {
    id: '5',
    title: 'Read for 20 minutes',
    description: 'Books, articles, or learning materials',
    habitType: 'BUILD',
    category: 'Growth',
    icon: '📚',
    difficulty: 'Easy',
    selected: false,
  },
  {
    id: '6',
    title: 'Meditate for 10 minutes',
    description: 'Mindfulness and mental clarity',
    habitType: 'BUILD',
    category: 'Mindfulness',
    icon: '🧘',
    difficulty: 'Easy',
    selected: false,
  },
  {
    id: '7',
    title: 'Practice gratitude',
    description: 'Write down 3 things you\'re grateful for',
    habitType: 'BUILD',
    category: 'Mindfulness',
    icon: '🙏',
    difficulty: 'Easy',
    selected: false,
  },
  {
    id: '8',
    title: 'Learn something new',
    description: 'Dedicate time to learning a skill',
    habitType: 'BUILD',
    category: 'Growth',
    icon: '🎓',
    difficulty: 'Medium',
    selected: false,
  },

  // Break Habits
  {
    id: '9',
    title: 'No phone during meals',
    description: 'Be present while eating',
    habitType: 'BREAK',
    category: 'Digital Wellness',
    icon: '📵',
    difficulty: 'Medium',
    selected: false,
  },
  {
    id: '10',
    title: 'No social media scrolling',
    description: 'Avoid mindless scrolling',
    habitType: 'BREAK',
    category: 'Digital Wellness',
    icon: '🚫',
    difficulty: 'Hard',
    selected: false,
  },
  {
    id: '11',
    title: 'No snacking after 8 PM',
    description: 'Avoid late-night eating',
    habitType: 'BREAK',
    category: 'Health',
    icon: '🍪',
    difficulty: 'Medium',
    selected: false,
  },
  {
    id: '12',
    title: 'No checking phone before bed',
    description: 'Better sleep hygiene',
    habitType: 'BREAK',
    category: 'Digital Wellness',
    icon: '📱',
    difficulty: 'Medium',
    selected: false,
  },
];

interface FirstTimeSetupScreenProps {
  onComplete: () => void;
}

export default function FirstTimeSetupScreen({ onComplete }: FirstTimeSetupScreenProps) {
  const { user, updateProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCoachStyle, setSelectedCoachStyle] = useState<CoachStyle | null>(null);
  const [habits, setHabits] = useState<SuggestedHabit[]>(suggestedHabits);
  const [isLoading, setIsLoading] = useState(false);

  const steps = [
    'Choose Your Coach Style',
    'Select Starting Habits',
    'Complete Setup',
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleHabit = (habitId: string) => {
    setHabits(habits.map(habit => 
      habit.id === habitId 
        ? { ...habit, selected: !habit.selected }
        : habit
    ));
  };

  const completeSetup = async () => {
    if (!selectedCoachStyle) {
      Alert.alert('Missing Selection', 'Please choose a coach style before continuing.');
      return;
    }

    const selectedHabits = habits.filter(h => h.selected);
    if (selectedHabits.length === 0) {
      Alert.alert(
        'No Habits Selected', 
        'You can always add habits later, but starting with at least one habit is recommended.',
        [
          { text: 'Continue Anyway', onPress: () => finishSetup() },
          { text: 'Go Back', style: 'cancel' },
        ]
      );
      return;
    }

    finishSetup();
  };

  const finishSetup = async () => {
    try {
      setIsLoading(true);

      // Update user profile with selected coach style
      if (selectedCoachStyle && user) {
        const updateResult = await updateProfile({
          coachStyle: selectedCoachStyle.id,
        });

        if (updateResult.error) {
          throw new Error(updateResult.error.message);
        }
      }

      // Create selected habits
      const selectedHabits = habits.filter(h => h.selected);
      const habitPromises = selectedHabits.map(habit =>
        apiClient.createHabit({
          title: habit.title,
          description: habit.description,
          habitType: habit.habitType,
        })
      );

      const habitResults = await Promise.allSettled(habitPromises);
      
      // Count successful habit creations
      const successfulHabits = habitResults.filter(result => result.status === 'fulfilled').length;
      const failedHabits = habitResults.filter(result => result.status === 'rejected').length;

      if (failedHabits > 0) {
        console.warn(`${failedHabits} habits failed to create`);
      }

      // Mark onboarding as complete in AsyncStorage
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem('onboardingComplete', 'true');
      } catch (error) {
        console.warn('Failed to save onboarding status:', error);
      }

      // Show success message
      Alert.alert(
        'Welcome to MindMend!',
        `Setup complete! ${successfulHabits > 0 ? `${successfulHabits} habits added to get you started.` : 'You can add habits anytime from the home screen.'}`,
        [{ text: 'Start Journey', onPress: onComplete }]
      );

    } catch (error) {
      console.error('Setup completion failed:', error);
      Alert.alert(
        'Setup Error',
        'There was an issue completing your setup. You can always update your preferences later in the profile section.',
        [{ text: 'Continue', onPress: onComplete }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderCoachStyleStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Choose Your AI Coach Style</Text>
      <Text style={styles.stepDescription}>
        Your AI coach will adapt its communication style to match your preferences. You can change this anytime.
      </Text>

      <View style={styles.optionsContainer}>
        {coachStyles.map((style) => (
          <TouchableOpacity
            key={style.id}
            style={[
              styles.coachStyleCard,
              selectedCoachStyle?.id === style.id && styles.selectedCoachStyle,
            ]}
            onPress={() => setSelectedCoachStyle(style)}
          >
            <Text style={styles.coachIcon}>{style.icon}</Text>
            <Text style={styles.coachName}>{style.name}</Text>
            <Text style={styles.coachDescription}>{style.description}</Text>
            <Text style={styles.coachExample}>{style.example}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderHabitsStep = () => {
    const categories = [...new Set(habits.map(h => h.category))];
    const selectedCount = habits.filter(h => h.selected).length;

    return (
      <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Choose Your Starting Habits</Text>
        <Text style={styles.stepDescription}>
          Select 2-4 habits to begin with. Starting small increases your chance of success!
        </Text>

        <View style={styles.selectedCounter}>
          <Text style={styles.selectedCountText}>
            {selectedCount} habits selected
          </Text>
        </View>

        {categories.map((category) => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category}</Text>
            <View style={styles.habitsGrid}>
              {habits
                .filter(habit => habit.category === category)
                .map((habit) => (
                  <TouchableOpacity
                    key={habit.id}
                    style={[
                      styles.habitCard,
                      habit.selected && styles.selectedHabit,
                      habit.habitType === 'BREAK' && styles.breakHabit,
                    ]}
                    onPress={() => toggleHabit(habit.id)}
                  >
                    <Text style={styles.habitIcon}>{habit.icon}</Text>
                    <Text style={styles.habitTitle}>{habit.title}</Text>
                    <Text style={styles.habitDescription}>{habit.description}</Text>
                    <View style={styles.habitMeta}>
                      <Text style={[
                        styles.habitType,
                        habit.habitType === 'BUILD' ? styles.buildType : styles.breakType
                      ]}>
                        {habit.habitType === 'BUILD' ? '✅ Build' : '🚫 Break'}
                      </Text>
                      <Text style={styles.habitDifficulty}>{habit.difficulty}</Text>
                    </View>
                    {habit.selected && (
                      <View style={styles.selectedIndicator}>
                        <Text style={styles.selectedCheck}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderCompleteStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.summaryContainer}>
        <Text style={styles.stepTitle}>You're All Set! 🎉</Text>
        <Text style={styles.stepDescription}>
          Here's what we've prepared for your journey:
        </Text>

        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>AI Coach Style</Text>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryIcon}>{selectedCoachStyle?.icon}</Text>
            <View style={styles.summaryText}>
              <Text style={styles.summaryName}>{selectedCoachStyle?.name}</Text>
              <Text style={styles.summaryDescription}>{selectedCoachStyle?.description}</Text>
            </View>
          </View>
        </View>

        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>
            Starting Habits ({habits.filter(h => h.selected).length})
          </Text>
          {habits.filter(h => h.selected).map((habit) => (
            <View key={habit.id} style={styles.summaryCard}>
              <Text style={styles.summaryIcon}>{habit.icon}</Text>
              <View style={styles.summaryText}>
                <Text style={styles.summaryName}>{habit.title}</Text>
                <Text style={styles.summaryDescription}>{habit.description}</Text>
              </View>
            </View>
          ))}
          {habits.filter(h => h.selected).length === 0 && (
            <Text style={styles.noHabitsText}>
              No habits selected. You can add habits anytime from the home screen.
            </Text>
          )}
        </View>

        <View style={styles.motivationalSection}>
          <Text style={styles.motivationalText}>
            "The journey of a thousand miles begins with one step."
          </Text>
          <Text style={styles.motivationalSubtext}>
            Remember: consistency beats perfection. Start small, stay consistent, and celebrate your progress!
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Setup Your Profile</Text>
        <Text style={styles.headerStep}>
          Step {currentStep + 1} of {steps.length}: {steps[currentStep]}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { width: `${((currentStep + 1) / steps.length) * 100}%` }
            ]}
          />
        </View>
      </View>

      {/* Step Content */}
      <View style={styles.content}>
        {currentStep === 0 && renderCoachStyleStep()}
        {currentStep === 1 && renderHabitsStep()}
        {currentStep === 2 && renderCompleteStep()}
      </View>

      {/* Navigation */}
      <View style={styles.navigation}>
        {currentStep > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={prevStep}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        )}

        <View style={styles.spacer} />

        {currentStep < steps.length - 1 ? (
          <TouchableOpacity 
            style={[
              styles.nextButton,
              (currentStep === 0 && !selectedCoachStyle) && styles.disabledButton
            ]}
            onPress={nextStep}
            disabled={currentStep === 0 && !selectedCoachStyle}
          >
            <Text style={styles.nextButtonText}>Next →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.completeButton, isLoading && styles.disabledButton]}
            onPress={completeSetup}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.completeButtonText}>Complete Setup</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 4,
  },
  headerStep: {
    fontSize: 14,
    color: '#64748B',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F8EF7',
    borderRadius: 3,
  },
  content: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    padding: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 16,
  },
  coachStyleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  selectedCoachStyle: {
    borderColor: '#4F8EF7',
    backgroundColor: '#F0F8FF',
  },
  coachIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  coachName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  coachDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
    textAlign: 'center',
  },
  coachExample: {
    fontSize: 12,
    color: '#4F8EF7',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  selectedCounter: {
    backgroundColor: '#E6F3FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  selectedCountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F8EF7',
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 12,
  },
  habitsGrid: {
    gap: 12,
  },
  habitCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  selectedHabit: {
    borderColor: '#4F8EF7',
    backgroundColor: '#F0F8FF',
  },
  breakHabit: {
    borderLeftWidth: 4,
    borderLeftColor: '#F56565',
  },
  habitIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  habitDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  habitMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  habitType: {
    fontSize: 12,
    fontWeight: '600',
  },
  buildType: {
    color: '#38A169',
  },
  breakType: {
    color: '#F56565',
  },
  habitDifficulty: {
    fontSize: 12,
    color: '#64748B',
    backgroundColor: '#F7FAFC',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4F8EF7',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheck: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  summaryContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  summarySection: {
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 12,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  summaryIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  summaryText: {
    flex: 1,
  },
  summaryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
  },
  summaryDescription: {
    fontSize: 12,
    color: '#64748B',
  },
  noHabitsText: {
    fontSize: 14,
    color: '#64748B',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  motivationalSection: {
    backgroundColor: '#F0FFF4',
    borderRadius: 12,
    padding: 20,
    marginTop: 12,
    alignItems: 'center',
  },
  motivationalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22543D',
    textAlign: 'center',
    marginBottom: 8,
  },
  motivationalSubtext: {
    fontSize: 14,
    color: '#2F855A',
    textAlign: 'center',
    lineHeight: 20,
  },
  navigation: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  spacer: {
    flex: 1,
  },
  nextButton: {
    backgroundColor: '#4F8EF7',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#38A169',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 140,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});