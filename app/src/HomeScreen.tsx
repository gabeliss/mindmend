import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Vibration, 
  Animated, 
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  Switch
} from 'react-native';
import { Colors, Typography, CoachingCopy, Spacing, BorderRadius, Shadows } from './lib/design-system';
import { useAuth } from './services/auth';
import { apiClient, Habit, HabitEvent, Streak, isApiError, handleApiError } from './services/api';

interface HabitWithStreak extends Habit {
  streak?: number;
  completedToday?: boolean;
  skippedToday?: boolean;
  suggestedTime?: string;
  isOverdue?: boolean;
  todayEventId?: string; // Store the event ID for today's completion to enable uncompleting
  skipEventId?: string; // Store the event ID for today's skip/relapse to enable untoggling
}

interface TodaysProgress {
  completedHabits: number;
  totalHabits: number;
  currentStreak: number;
  motivationalMessage?: string;
}

export default function HomeScreen({ navigation }: { navigation: any }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [habits, setHabits] = useState<HabitWithStreak[]>([]);
  const [todaysProgress, setTodaysProgress] = useState<TodaysProgress>({
    completedHabits: 0,
    totalHabits: 0,
    currentStreak: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [animatedValues, setAnimatedValues] = useState<{ [key: string]: Animated.Value }>({});
  const [dailyInsight, setDailyInsight] = useState<string>('');
  
  // Add Habit Modal State
  const [showAddHabitModal, setShowAddHabitModal] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitDescription, setNewHabitDescription] = useState('');
  const [newHabitType, setNewHabitType] = useState<'BUILD' | 'AVOID'>('BUILD');
  const [isCreatingHabit, setIsCreatingHabit] = useState(false);

  // Initialize animated values when habits change
  useEffect(() => {
    const newAnimatedValues = habits.reduce((acc: { [key: string]: Animated.Value }, habit) => {
      if (!animatedValues[habit.id]) {
        acc[habit.id] = new Animated.Value(1);
      } else {
        acc[habit.id] = animatedValues[habit.id];
      }
      return acc;
    }, {});
    setAnimatedValues(newAnimatedValues);
  }, [habits]);

  // Helper function to get motivational message
  const getMotivationalMessage = (completed: number, total: number, avgStreak: number): string => {
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    
    if (completionRate === 100) {
      return "Perfect day! You're absolutely crushing it! 🎉";
    } else if (completionRate >= 75) {
      return "You're doing amazing! Keep up the great work! 💪";
    } else if (completionRate >= 50) {
      return "Good progress today! You're on the right track! 🌟";
    } else if (avgStreak > 5) {
      return `Don't break your ${avgStreak}-day streak now! You've got this! 🔥`;
    } else {
      return "Every small step counts. Keep building those positive habits! 🌱";
    }
  };


  // Load habits from API
  const loadHabits = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      setIsLoading(true);

      // Fetch habits, streaks, and today's events in parallel
      const [habitsResponse, streaksResponse, todaysEventsResponse] = await Promise.all([
        apiClient.getHabits(),
        apiClient.getStreaks(),
        apiClient.getTodayEvents(),
      ]);

      if (isApiError(habitsResponse)) {
        throw new Error(handleApiError(habitsResponse));
      }

      const habitsData = habitsResponse.data?.habits || [];
      const streaksData = streaksResponse.data?.habitStreaks || [];
      const eventsData = todaysEventsResponse.data?.events || [];

      // Create a map of habit IDs to streaks
      const streakMap = new Map<string, any>();
      streaksData.forEach((streak: any) => {
        streakMap.set(streak.habitId, streak);
      });

      // Create maps of today's events by type
      const completedToday = new Map<string, string>();
      const skippedToday = new Map<string, string>();
      
      eventsData.forEach((event: any) => {
        if (event.eventType === 'COMPLETED') {
          completedToday.set(event.habitId, event.id);
        } else if (event.eventType === 'SKIPPED' || event.eventType === 'RELAPSED') {
          skippedToday.set(event.habitId, event.id);
        }
      });

      // Combine habits with their streak data and completion status
      const habitsWithStreak: HabitWithStreak[] = habitsData.map((habit: any) => {
        const streak = streakMap.get(habit.id);
        const todayEventId = completedToday.get(habit.id);
        const skipEventId = skippedToday.get(habit.id);
        const completedTodayFlag = !!todayEventId;
        const skippedTodayFlag = !!skipEventId;
        
        // Generate suggested times based on habit type and title
        let suggestedTime = '';
        const title = habit.title.toLowerCase();
        if (title.includes('morning') || title.includes('wake') || title.includes('workout')) {
          suggestedTime = '7:00 AM';
        } else if (title.includes('evening') || title.includes('bed') || title.includes('read')) {
          suggestedTime = '8:00 PM';
        } else if (title.includes('lunch') || title.includes('noon')) {
          suggestedTime = '12:00 PM';
        } else {
          suggestedTime = '6:00 PM'; // Default time
        }

        return {
          ...habit,
          streak: streak?.currentStreak || 0,
          completedToday: completedTodayFlag,
          skippedToday: skippedTodayFlag,
          todayEventId,
          skipEventId,
          suggestedTime,
          isOverdue: false, // Simplified for now
        };
      });

      setHabits(habitsWithStreak);

      // Calculate today's progress
      const completed = habitsWithStreak.filter(h => h.completedToday).length;
      const total = habitsWithStreak.length;
      const avgStreak = total > 0 
        ? Math.round(habitsWithStreak.reduce((sum, h) => sum + (h.streak || 0), 0) / total)
        : 0;

      setTodaysProgress({
        completedHabits: completed,
        totalHabits: total,
        currentStreak: avgStreak,
        motivationalMessage: getMotivationalMessage(completed, total, avgStreak),
      });

    } catch (error) {
      console.error('Failed to load habits:', error);
      Alert.alert('Error', 'Failed to load your habits. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Refresh just the streaks without affecting visual state
  const refreshStreaks = useCallback(async () => {
    try {
      const streaksResponse = await apiClient.getStreaks();
      if (!isApiError(streaksResponse)) {
        const streaksData = streaksResponse.data?.habitStreaks || [];
        
        // Create a map of habit IDs to streaks
        const streakMap = new Map<string, any>();
        streaksData.forEach((streak: any) => {
          streakMap.set(streak.habitId, streak);
        });

        // Update just the streak values in our habits
        setHabits(prevHabits => 
          prevHabits.map(habit => ({
            ...habit,
            streak: streakMap.get(habit.id)?.currentStreak || 0
          }))
        );
      }
    } catch (error) {
      console.error('Failed to refresh streaks:', error);
    }
  }, []);

  // Complete or avoid a habit
  const toggleHabitCompletion = useCallback(async (habitId: string, habitType: 'BUILD' | 'AVOID') => {
    try {
      const currentHabit = habits.find(h => h.id === habitId);
      if (!currentHabit) return;

      const isCurrentlyCompleted = currentHabit.completedToday;

      // Optimistic update
      setHabits(prevHabits => 
        prevHabits.map(habit => 
          habit.id === habitId 
            ? { 
                ...habit, 
                completedToday: !habit.completedToday,
                todayEventId: !habit.completedToday ? 'temp' : undefined
              }
            : habit
        )
      );

      // Animate the completion
      const animatedValue = animatedValues[habitId];
      if (animatedValue) {
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 0.9,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
      }

      // Vibrate for tactile feedback
      Vibration.vibrate(50);

      if (isCurrentlyCompleted && currentHabit.todayEventId) {
        // Uncomplete: Delete the existing event
        const response = await apiClient.deleteHabitEvent(currentHabit.todayEventId);
        
        if (isApiError(response)) {
          // Revert optimistic update on error
          setHabits(prevHabits => 
            prevHabits.map(habit => 
              habit.id === habitId 
                ? { ...habit, completedToday: true, todayEventId: currentHabit.todayEventId }
                : habit
            )
          );
          throw new Error(handleApiError(response));
        }
      } else {
        // Complete: Log habit event in backend
        const response = await apiClient.logHabitEvent({
          habitId,
          eventType: 'COMPLETED',
          notes: habitType === 'AVOID' ? 'Successfully avoided' : 'Completed habit',
        });

        if (isApiError(response)) {
          // Revert optimistic update on error
          setHabits(prevHabits => 
            prevHabits.map(habit => 
              habit.id === habitId 
                ? { ...habit, completedToday: false, todayEventId: undefined }
                : habit
            )
          );
          throw new Error(handleApiError(response));
        }

        // Update with the real event ID from the response
        const newEventId = response.data?.id;
        if (newEventId) {
          setHabits(prevHabits => 
            prevHabits.map(habit => 
              habit.id === habitId 
                ? { ...habit, todayEventId: newEventId }
                : habit
            )
          );
        }
      }

      // Refresh streaks to keep them updated without affecting visual state
      await refreshStreaks();

    } catch (error) {
      console.error('Failed to toggle habit completion:', error);
      Alert.alert('Error', 'Failed to update habit. Please try again.');
    }
  }, [habits, animatedValues, refreshStreaks]);

  // Skip or fail a habit (breaks streak)
  const skipHabit = useCallback(async (habitId: string, habitType: 'BUILD' | 'AVOID') => {
    try {
      const currentHabit = habits.find(h => h.id === habitId);
      if (!currentHabit || currentHabit.completedToday) return; // Can't skip if already completed

      // Determine event type based on habit type
      const eventType = habitType === 'BUILD' ? 'SKIPPED' : 'RELAPSED';
      const eventNotes = habitType === 'BUILD' ? 'Skipped habit for today' : 'Relapsed on avoiding habit';

      // Animate the skip action
      const animatedValue = animatedValues[habitId];
      if (animatedValue) {
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 0.9,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
      }

      // Vibrate for tactile feedback
      Vibration.vibrate(50);

      // Log skip event in backend
      const response = await apiClient.logHabitEvent({
        habitId,
        eventType,
        notes: eventNotes,
      });

      if (isApiError(response)) {
        throw new Error(handleApiError(response));
      }

      // Reload habits to get fresh data with skip status
      await loadHabits();

    } catch (error) {
      console.error('Failed to skip habit:', error);
      Alert.alert('Error', 'Failed to update habit. Please try again.');
    }
  }, [habits, animatedValues, refreshStreaks]);

  // Undo skip/relapse (un-toggle skipped state)
  const undoSkip = useCallback(async (habitId: string) => {
    try {
      const currentHabit = habits.find(h => h.id === habitId);
      if (!currentHabit || !currentHabit.skipEventId) return;

      // Animate the undo action
      const animatedValue = animatedValues[habitId];
      if (animatedValue) {
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 0.9,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
      }

      // Vibrate for tactile feedback
      Vibration.vibrate(50);

      // Delete the skip/relapse event
      const response = await apiClient.deleteHabitEvent(currentHabit.skipEventId);
      
      if (isApiError(response)) {
        throw new Error(handleApiError(response));
      }

      // Reload habits to get fresh data
      await loadHabits();

    } catch (error) {
      console.error('Failed to undo skip:', error);
      Alert.alert('Error', 'Failed to undo. Please try again.');
    }
  }, [habits, animatedValues, loadHabits]);

  // Create a new habit
  const createHabit = useCallback(async () => {
    if (!newHabitTitle.trim()) {
      Alert.alert('Error', 'Please enter a habit title');
      return;
    }

    try {
      setIsCreatingHabit(true);
      
      const response = await apiClient.createHabit({
        title: newHabitTitle.trim(),
        description: newHabitDescription.trim() || undefined,
        habitType: newHabitType,
      });

      if (isApiError(response)) {
        throw new Error(handleApiError(response));
      }

      // Reset form
      setNewHabitTitle('');
      setNewHabitDescription('');
      setNewHabitType('BUILD');
      setShowAddHabitModal(false);

      // Reload habits to show the new one
      await loadHabits();

      Alert.alert('Success', 'Habit created successfully!');
    } catch (error) {
      console.error('Failed to create habit:', error);
      Alert.alert('Error', 'Failed to create habit. Please try again.');
    } finally {
      setIsCreatingHabit(false);
    }
  }, [newHabitTitle, newHabitDescription, newHabitType, loadHabits]);

  // Navigate to morning check-in
  const startMorningCheckIn = useCallback(() => {
    navigation.navigate('Check-In');
  }, [navigation]);

  // Load habits when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadHabits();
    }
  }, [isAuthenticated, user, loadHabits]);

  // Update progress when habits change
  useEffect(() => {
    const completed = habits.filter(h => h.completedToday).length;
    const total = habits.length;
    const avgStreak = total > 0 
      ? Math.round(habits.reduce((sum, h) => sum + (h.streak || 0), 0) / total)
      : 0;

    setTodaysProgress({
      completedHabits: completed,
      totalHabits: total,
      currentStreak: avgStreak,
      motivationalMessage: getMotivationalMessage(completed, total, avgStreak),
    });
  }, [habits]);

  // Show loading state
  if (authLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4F8EF7" />
        <Text style={styles.loadingText}>Loading your habits...</Text>
      </View>
    );
  }

  // Show authentication prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text style={styles.authPrompt}>Please sign in to view your habits</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {user?.displayName && (
        <Text style={styles.welcomeText}>Welcome back, {user.displayName}! 👋</Text>
      )}
      <Text style={styles.header}>{CoachingCopy.headers.todaysPlan}</Text>
      
      {/* Progress Summary */}
      <View style={styles.progressSection}>
        <Text style={styles.progressText}>
          {todaysProgress.completedHabits} of {todaysProgress.totalHabits} habits completed
        </Text>
        {todaysProgress.motivationalMessage && (
          <Text style={styles.motivation}>{todaysProgress.motivationalMessage}</Text>
        )}
        
        {/* Start Day Button */}
        <TouchableOpacity style={styles.startDayButton} onPress={startMorningCheckIn}>
          <Text style={styles.startDayButtonText}>🌅 Start Day Check-In</Text>
        </TouchableOpacity>
      </View>

      {/* Daily Insight */}
      {dailyInsight ? (
        <View style={styles.insightSection}>
          <Text style={styles.insightLabel}>Today's AI Insight</Text>
          <Text style={styles.insightText}>{dailyInsight}</Text>
        </View>
      ) : null}

      {/* Habits List */}
      <FlatList
        data={habits}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={loadHabits}
            colors={['#4F8EF7']}
            tintColor="#4F8EF7"
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No habits yet! Add some habits to get started.
            </Text>
            <TouchableOpacity style={styles.addHabitButton} onPress={() => setShowAddHabitModal(true)}>
              <Text style={styles.addHabitButtonText}>+ Add Your First Habit</Text>
            </TouchableOpacity>
          </View>
        )}
        ListFooterComponent={() => (
          habits.length > 0 ? (
            <TouchableOpacity style={styles.addHabitButton} onPress={() => setShowAddHabitModal(true)}>
              <Text style={styles.addHabitButtonText}>+ Add Another Habit</Text>
            </TouchableOpacity>
          ) : null
        )}
        renderItem={({ item }) => {
          const isCompleted = item.completedToday || false;
          const isSkipped = item.skippedToday || false;
          const isOverdue = item.isOverdue || false;
          
          return (
            <Animated.View 
              style={[
                styles.habitCard,
                item.habitType === 'BUILD' ? styles.buildHabit : styles.breakHabit,
                isOverdue && styles.overdueHabit,
                isCompleted && styles.habitCardCompleted,
                isSkipped && styles.habitCardSkipped,
                { transform: [{ scale: animatedValues[item.id] || new Animated.Value(1) }] }
              ]}
            >
              {/* Header with title and streak */}
              <View style={styles.habitHeader}>
                <Text style={[
                  styles.habitTitle, 
                  isCompleted && styles.habitTitleCompleted,
                  isSkipped && styles.habitTitleSkipped
                ]}>
                  {item.title}
                </Text>
                {item.streak && item.streak > 0 && (
                  <View style={styles.streakBadge}>
                    <Text style={styles.streakText}>
                      🔥 {item.streak} day{item.streak > 1 ? 's' : ''} {item.habitType === 'AVOID' ? 'clean' : 'streak'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Description and time */}
              <View style={styles.habitDetails}>
                <Text style={styles.habitDescription}>{item.description}</Text>
                <Text style={[styles.habitTime, isOverdue && styles.habitTimeOverdue]}>
                  {`${item.suggestedTime}${isOverdue ? ' (Missed)' : ''}`}
                </Text>
              </View>

              {/* Actions at bottom */}
              <View style={styles.habitActions}>
                <View style={styles.habitTypeIndicator}>
                  <Text style={styles.habitTypeText}>
                    {item.habitType === 'BUILD' ? 'Build' : 'Break'}
                  </Text>
                </View>
                
                {item.habitType === 'BUILD' ? (
                  <>
                    {isSkipped ? (
                      <TouchableOpacity 
                        style={styles.skippedStatus}
                        onPress={() => undoSkip(item.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.skippedStatusText}>Skipped ✕</Text>
                      </TouchableOpacity>
                    ) : (
                      <>
                        <TouchableOpacity 
                          style={[styles.checkbox, isCompleted && styles.checkboxCompleted]}
                          onPress={() => toggleHabitCompletion(item.id, item.habitType)}
                          activeOpacity={0.7}
                        >
                          {isCompleted && <Text style={styles.checkmark}>✓</Text>}
                        </TouchableOpacity>
                        {!isCompleted && (
                          <TouchableOpacity 
                            style={styles.skipButton}
                            onPress={() => skipHabit(item.id, item.habitType)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.skipButtonText}>Skip</Text>
                          </TouchableOpacity>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {isSkipped ? (
                      <TouchableOpacity 
                        style={styles.relapsedStatus}
                        onPress={() => undoSkip(item.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.relapsedStatusText}>Relapsed ✕</Text>
                      </TouchableOpacity>
                    ) : (
                      <>
                        <TouchableOpacity 
                          style={[styles.avoidTag, isCompleted && styles.avoidTagCompleted]}
                          onPress={() => toggleHabitCompletion(item.id, item.habitType)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.avoidTagText, isCompleted && styles.avoidTagTextCompleted]}>
                            {isCompleted ? 'Avoided ✓' : 'Avoid'}
                          </Text>
                        </TouchableOpacity>
                        {!isCompleted && (
                          <TouchableOpacity 
                            style={styles.relapseButton}
                            onPress={() => skipHabit(item.id, item.habitType)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.relapseButtonText}>Relapse</Text>
                          </TouchableOpacity>
                        )}
                      </>
                    )}
                  </>
                )}
              </View>
            </Animated.View>
          );
        }}
      />

      {/* Add Habit Modal */}
      <Modal
        visible={showAddHabitModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddHabitModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddHabitModal(false)}>
              <Text style={styles.modalCancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New Habit</Text>
            <TouchableOpacity onPress={createHabit} disabled={isCreatingHabit}>
              <Text style={[styles.modalSaveButton, isCreatingHabit && styles.modalButtonDisabled]}>
                {isCreatingHabit ? 'Creating...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Habit Type</Text>
              <View style={styles.habitTypeContainer}>
                <TouchableOpacity 
                  style={[styles.habitTypeButton, newHabitType === 'BUILD' && styles.habitTypeButtonActive]}
                  onPress={() => setNewHabitType('BUILD')}
                >
                  <Text style={[styles.habitTypeButtonText, newHabitType === 'BUILD' && styles.habitTypeButtonTextActive]}>
                    ✅ Build Good Habit
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.habitTypeButton, newHabitType === 'AVOID' && styles.habitTypeButtonActive]}
                  onPress={() => setNewHabitType('AVOID')}
                >
                  <Text style={[styles.habitTypeButtonText, newHabitType === 'AVOID' && styles.habitTypeButtonTextActive]}>
                    🚫 Break Bad Habit
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Habit Title *</Text>
              <TextInput
                style={styles.textInput}
                value={newHabitTitle}
                onChangeText={setNewHabitTitle}
                placeholder="e.g., Exercise for 30 minutes"
                placeholderTextColor="#9CA3AF"
                maxLength={100}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textAreaInput]}
                value={newHabitDescription}
                onChangeText={setNewHabitDescription}
                placeholder="Add more details about your habit..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                maxLength={500}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC', 
    padding: 20 
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4F8EF7',
    marginBottom: 8,
  },
  header: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 16, 
    color: '#2D3748' 
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  authPrompt: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  progressSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressText: {
    fontSize: 16,
    color: '#2D3748',
    textAlign: 'center',
    fontWeight: '600',
  },
  motivation: {
    fontSize: 14,
    color: '#4F8EF7',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  startDayButton: {
    backgroundColor: '#4F8EF7',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#4F8EF7',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  startDayButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  insightSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#E6F3FF',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4F8EF7',
  },
  insightLabel: {
    fontSize: 12,
    color: '#4F8EF7',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  insightText: {
    fontSize: 14,
    color: '#2D3748',
    lineHeight: 20,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  habitCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  buildHabit: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  breakHabit: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  overdueHabit: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  habitIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  checkboxCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  avoidTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#EBF8FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  avoidTagCompleted: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  avoidTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369A1',
  },
  avoidTagTextCompleted: {
    color: '#059669',
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  skipButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  relapseButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  relapseButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  // Skipped/relapsed card states
  habitCardSkipped: {
    backgroundColor: '#FEF2F2',
    opacity: 0.8,
    borderLeftColor: '#DC2626',
  },
  // Status displays for skipped/relapsed habits (tappable to undo)
  skippedStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    shadowColor: '#DC2626',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  skippedStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  relapsedStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    shadowColor: '#DC2626',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  relapsedStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  // New card layout styles
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  habitTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  habitTitleCompleted: {
    color: '#6B7280',
    textDecorationLine: 'line-through',
  },
  habitTitleSkipped: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  habitDetails: {
    marginBottom: 16,
  },
  // Updated actions styling
  habitActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
  },
  habitTypeIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  habitTypeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  // Legacy styles (kept for backward compatibility)
  habitNameSkipped: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  habitInfo: {
    flex: 1,
  },
  habitNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  habitNameCompleted: {
    color: '#6B7280',
    textDecorationLine: 'line-through',
  },
  streakBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  habitDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  habitTime: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  habitTimeOverdue: {
    color: '#EF4444',
    fontWeight: '600',
  },
  habitCardCompleted: {
    backgroundColor: '#F0FDF4',
    opacity: 0.9,
  },
  addHabitButton: {
    backgroundColor: '#4F8EF7',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginHorizontal: 20,
  },
  addHabitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalCancelButton: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalSaveButton: {
    fontSize: 16,
    color: '#4F8EF7',
    fontWeight: '600',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  habitTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  habitTypeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  habitTypeButtonActive: {
    borderColor: '#4F8EF7',
    backgroundColor: '#EBF4FF',
  },
  habitTypeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  habitTypeButtonTextActive: {
    color: '#4F8EF7',
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#fff',
  },
  textAreaInput: {
    height: 80,
    textAlignVertical: 'top',
  },
});