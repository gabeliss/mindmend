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
  RefreshControl 
} from 'react-native';
import { Colors, Typography, CoachingCopy, Spacing, BorderRadius, Shadows } from './lib/design-system';
import { useAuth } from './services/auth';
import { apiClient, Habit, HabitEvent, Streak, isApiError, handleApiError } from './services/api';

interface HabitWithStreak extends Habit {
  streak?: number;
  completedToday?: boolean;
  suggestedTime?: string;
  isOverdue?: boolean;
}

interface TodaysProgress {
  completedHabits: number;
  totalHabits: number;
  currentStreak: number;
  motivationalMessage?: string;
}

export default function HomeScreen() {
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
        apiClient.getHabitEvents({
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
        }),
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

      // Create a map of completed habits today
      const completedToday = new Set<string>();
      eventsData.forEach((event: any) => {
        if (event.eventType === 'COMPLETED') {
          completedToday.add(event.habitId);
        }
      });

      // Combine habits with their streak data and completion status
      const habitsWithStreak: HabitWithStreak[] = habitsData.map((habit: any) => {
        const streak = streakMap.get(habit.id);
        const completedTodayFlag = completedToday.has(habit.id);
        
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

  // Complete or avoid a habit
  const toggleHabitCompletion = useCallback(async (habitId: string, habitType: 'BUILD' | 'BREAK') => {
    try {
      // Optimistic update
      setHabits(prevHabits => 
        prevHabits.map(habit => 
          habit.id === habitId 
            ? { ...habit, completedToday: !habit.completedToday }
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

      // Log habit event in backend
      const response = await apiClient.logHabitEvent({
        habitId,
        eventType: 'COMPLETED',
        notes: habitType === 'BREAK' ? 'Successfully avoided' : 'Completed habit',
      });

      if (isApiError(response)) {
        // Revert optimistic update on error
        setHabits(prevHabits => 
          prevHabits.map(habit => 
            habit.id === habitId 
              ? { ...habit, completedToday: !habit.completedToday }
              : habit
          )
        );
        throw new Error(handleApiError(response));
      }

      // Reload habits to get updated streak information
      await loadHabits();

    } catch (error) {
      console.error('Failed to toggle habit completion:', error);
      Alert.alert('Error', 'Failed to update habit. Please try again.');
    }
  }, [animatedValues, loadHabits]);

  // Load habits when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadHabits();
    }
  }, [isAuthenticated, user, loadHabits]);

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
      <Text style={styles.header}>{CoachingCopy.headers.todaysPlan}</Text>
      
      {/* Progress Summary */}
      <View style={styles.progressSection}>
        <Text style={styles.progressText}>
          {todaysProgress.completedHabits} of {todaysProgress.totalHabits} habits completed
        </Text>
        {todaysProgress.motivationalMessage && (
          <Text style={styles.motivation}>{todaysProgress.motivationalMessage}</Text>
        )}
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
          </View>
        )}
        renderItem={({ item }) => {
          const isCompleted = item.completedToday || false;
          const isOverdue = item.isOverdue || false;
          
          return (
            <Animated.View 
              style={[
                styles.habitRow,
                item.habitType === 'BUILD' ? styles.buildHabit : styles.breakHabit,
                isOverdue && styles.overdueHabit,
                { transform: [{ scale: animatedValues[item.id] || new Animated.Value(1) }] }
              ]}
            >
              <Text style={styles.habitIcon}>
                {item.habitType === 'BUILD' ? '✅' : '🚫'}
              </Text>
              
              {item.habitType === 'BUILD' ? (
                <TouchableOpacity 
                  style={[styles.checkbox, isCompleted && styles.checkboxCompleted]}
                  onPress={() => toggleHabitCompletion(item.id, item.habitType)}
                  activeOpacity={0.7}
                >
                  {isCompleted && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.avoidTag, isCompleted && styles.avoidTagCompleted]}
                  onPress={() => toggleHabitCompletion(item.id, item.habitType)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.avoidTagText, isCompleted && styles.avoidTagTextCompleted]}>
                    {isCompleted ? 'Avoided ✓' : 'Avoid'}
                  </Text>
                </TouchableOpacity>
              )}
              
              <View style={styles.habitInfo}>
                <View style={styles.habitNameRow}>
                  <Text style={[styles.habitName, isCompleted && styles.habitNameCompleted]}>
                    {item.title}
                  </Text>
                  {item.streak && item.streak > 0 && (
                    <View style={styles.streakBadge}>
                      <Text style={styles.streakText}>🔥{item.streak}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.habitDescription}>{item.description}</Text>
                <Text style={[styles.habitTime, isOverdue && styles.habitTimeOverdue]}>
                  {item.suggestedTime}{isOverdue && ' (Missed)'}
                </Text>
              </View>
            </Animated.View>
          );
        }}
      />
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
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: '#FEE2E2',
    marginRight: 12,
  },
  avoidTagCompleted: {
    backgroundColor: '#DCFCE7',
  },
  avoidTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  avoidTagTextCompleted: {
    color: '#059669',
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
});