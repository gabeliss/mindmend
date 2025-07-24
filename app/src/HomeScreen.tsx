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

  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return hours * 60 + minutes;
  };

  const parseTime = (timeStr: string): number => {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let hour24 = hours;
    if (period === 'PM' && hours !== 12) hour24 += 12;
    if (period === 'AM' && hours === 12) hour24 = 0;
    return hour24 * 60 + minutes;
  };

  const isHabitOverdue = (timeStr: string): boolean => {
    if (!timeStr) return false;
    const habitTime = parseTime(timeStr);
    const currentTime = getCurrentTime();
    return currentTime > habitTime;
  };

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

      const habitsData = habitsResponse.data || [];
      const streaksData = streaksResponse.data || [];
      const eventsData = todaysEventsResponse.data || [];

      // Create a map of habit IDs to streaks
      const streakMap = new Map<string, Streak>();
      streaksData.forEach(streak => {
        streakMap.set(streak.habitId, streak);
      });

      // Create a map of completed habits today
      const completedToday = new Set<string>();
      eventsData.forEach(event => {
        if (event.eventType === 'COMPLETED') {
          completedToday.add(event.habitId);
        }
      });

      // Combine habits with their streak data and completion status
      const habitsWithStreak: HabitWithStreak[] = habitsData.map(habit => {
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
          isOverdue: isHabitOverdue(suggestedTime) && !completedTodayFlag,
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
      Alert.alert(
        'Error',
        'Failed to load your habits. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  const loadDailyInsight = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      const insightsResponse = await apiClient.getTodaysInsights();
      if (!isApiError(insightsResponse) && insightsResponse.data && insightsResponse.data.length > 0) {
        const dailyTip = insightsResponse.data.find(insight => insight.insightType === 'DAILY_TIP');
        if (dailyTip) {
          setDailyInsight(dailyTip.content);
        }
      }
    } catch (error) {
      console.error('Failed to load daily insight:', error);
    }
  }, [isAuthenticated, user]);

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

  const toggleHabitCompletion = async (habit: HabitWithStreak) => {
    try {
      const eventType = habit.completedToday ? 'SKIPPED' : 'COMPLETED';
      
      // Optimistic update
      const updatedHabits = habits.map(h => 
        h.id === habit.id 
          ? { ...h, completedToday: !h.completedToday }
          : h
      );
      setHabits(updatedHabits);

      // Update progress optimistically
      const newCompleted = habit.completedToday 
        ? todaysProgress.completedHabits - 1 
        : todaysProgress.completedHabits + 1;
      
      setTodaysProgress(prev => ({
        ...prev,
        completedHabits: newCompleted,
        motivationalMessage: getMotivationalMessage(newCompleted, prev.totalHabits, prev.currentStreak),
      }));

      // Animate on completion (not skipping)
      if (!habit.completedToday) {
        Vibration.vibrate(50);
        if (animatedValues[habit.id]) {
          Animated.sequence([
            Animated.timing(animatedValues[habit.id], {
              toValue: 1.2,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(animatedValues[habit.id], {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();
        }
      }

      // Log the event to backend
      const eventResponse = await apiClient.logHabitEvent({
        habitId: habit.id,
        eventType,
        notes: eventType === 'COMPLETED' 
          ? `${habit.title} completed via mobile app`
          : `${habit.title} skipped via mobile app`,
      });

      if (isApiError(eventResponse)) {
        // Revert optimistic update on error
        setHabits(habits);
        setTodaysProgress(prev => ({
          ...prev,
          completedHabits: todaysProgress.completedHabits,
          motivationalMessage: getMotivationalMessage(
            todaysProgress.completedHabits, 
            prev.totalHabits, 
            prev.currentStreak
          ),
        }));
        
        Alert.alert(
          'Error',
          'Failed to update habit. Please try again.',
          [{ text: 'OK' }]
        );
      }

    } catch (error) {
      console.error('Failed to toggle habit completion:', error);
      
      // Revert optimistic update
      setHabits(habits);
      setTodaysProgress(prev => ({
        ...prev,
        completedHabits: todaysProgress.completedHabits,
      }));
      
      Alert.alert(
        'Error',
        'Failed to update habit. Please check your connection.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([loadHabits(), loadDailyInsight()]);
    setIsRefreshing(false);
  }, [loadHabits, loadDailyInsight]);

  // Load data when component mounts or user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      loadHabits();
      loadDailyInsight();
    }
  }, [isAuthenticated, user, loadHabits, loadDailyInsight]);

  // Show loading spinner while authenticating or loading initial data
  if (authLoading || (isLoading && !isRefreshing)) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#4F8EF7" />
        <Text style={styles.loadingText}>Loading your habits...</Text>
      </View>
    );
  }

  // Show authentication prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <View style={[styles.container, styles.centerContent]}>
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
            onRefresh={handleRefresh}
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
                  onPress={() => toggleHabitCompletion(item)}
                >
                  {isCompleted && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.avoidTag, isCompleted && styles.avoidTagCompleted]}
                  onPress={() => toggleHabitCompletion(item)}
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
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  progressSection: {
    backgroundColor: '#E6F3FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A365D',
    textAlign: 'center',
  },
  motivation: {
    fontSize: 14,
    color: '#2B6CB0',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  insightSection: {
    backgroundColor: '#F0FFF4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  insightLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22543D',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 14,
    color: '#2F855A',
    lineHeight: 20,
  },
  habitRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12, 
    backgroundColor: '#fff', 
    borderRadius: 10, 
    padding: 12, 
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 4, 
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#E2E8F0'
  },
  buildHabit: { borderLeftColor: '#4F8EF7' },
  breakHabit: { borderLeftColor: '#F56565' },
  overdueHabit: { opacity: 0.6, backgroundColor: '#F7FAFC' },
  habitIcon: { fontSize: 20, marginRight: 12 },
  checkbox: { 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    borderWidth: 2, 
    borderColor: '#4F8EF7', 
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkboxCompleted: { backgroundColor: '#4F8EF7' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  avoidTag: { 
    backgroundColor: '#FEB2B2', 
    borderRadius: 8, 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    marginRight: 12,
    minWidth: 60,
    alignItems: 'center'
  },
  avoidTagCompleted: { backgroundColor: '#48BB78' },
  avoidTagText: { 
    color: '#C53030', 
    fontWeight: 'bold',
    fontSize: 12
  },
  avoidTagTextCompleted: { color: '#fff' },
  habitInfo: { flex: 1 },
  habitNameRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 4 
  },
  habitName: { 
    fontSize: 16, 
    color: '#2D3748',
    marginRight: 8,
    fontWeight: '600',
  },
  habitNameCompleted: { 
    textDecorationLine: 'line-through',
    color: '#A0AEC0'
  },
  habitDescription: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 4,
  },
  streakBadge: {
    backgroundColor: '#FED7D7',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4
  },
  streakText: { fontSize: 10, fontWeight: 'bold' },
  habitTime: { fontSize: 14, color: '#A0AEC0' },
  habitTimeOverdue: { color: '#F56565', fontWeight: 'bold' },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});