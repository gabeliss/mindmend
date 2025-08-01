import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Animated, 
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { CoachingCopy } from '../lib/design-system';
import { useAuth } from '../services/auth';
import { useHabits, HabitWithStreak, TodaysProgress } from '../hooks';
import { ProgressSection, HabitCard, AddHabitModal, DailySummaryCard } from '../components/home';
import { SkeletonLoader } from '../components/common';
import { DailySummaryData } from '../types/insights';
import { apiClient } from '../services/api';

export default function HomeScreen({ navigation }: { navigation: any }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    habits,
    todaysProgress,
    isLoading,
    loadHabits,
    toggleHabitCompletion,
    skipHabit,
    undoSkip,
    createHabit,
  } = useHabits(isAuthenticated, user);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [animatedValues, setAnimatedValues] = useState<{ [key: string]: Animated.Value }>({});
  
  // Daily Summary state
  const [dailySummary, setDailySummary] = useState<DailySummaryData | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  
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




  // Wrapper functions to pass animatedValues to hooks
  const handleToggleHabitCompletion = useCallback(async (habitId: string, habitType: 'BUILD' | 'AVOID') => {
    console.log('HomeScreen: handleToggleHabitCompletion called for habit:', habitId);
    await toggleHabitCompletion(habitId, habitType, animatedValues);
  }, [toggleHabitCompletion, animatedValues]);

  const handleSkipHabit = useCallback(async (habitId: string, habitType: 'BUILD' | 'AVOID') => {
    console.log('HomeScreen: handleSkipHabit called for habit:', habitId);
    await skipHabit(habitId, habitType, animatedValues);
  }, [skipHabit, animatedValues]);

  const handleUndoSkip = useCallback(async (habitId: string) => {
    console.log('HomeScreen: handleUndoSkip called for habit:', habitId);
    await undoSkip(habitId, animatedValues);
  }, [undoSkip, animatedValues]);

  // Handle creating a new habit
  const handleCreateHabit = useCallback(async () => {
    setIsCreatingHabit(true);
    const success = await createHabit(newHabitTitle, newHabitDescription, newHabitType);
    
    if (success) {
      setNewHabitTitle('');
      setNewHabitDescription('');
      setNewHabitType('BUILD');
      setShowAddHabitModal(false);
    }
    
    setIsCreatingHabit(false);
  }, [createHabit, newHabitTitle, newHabitDescription, newHabitType]);

  // Navigate to morning check-in
  const startMorningCheckIn = useCallback(() => {
    navigation.navigate('Check-In');
  }, [navigation]);

  // Load daily summary
  const loadDailySummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      const response = await apiClient.getDailySummary();
      if (response.success && response.data) {
        setDailySummary(response.data);
      }
    } catch (error) {
      console.error('Failed to load daily summary:', error);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // Handle insight feedback
  const handleInsightFeedback = useCallback(async (feedback: "helpful" | "not_helpful") => {
    try {
      await apiClient.recordInsightFeedback('daily-insight', feedback);
      console.log('Insight feedback recorded:', feedback);
    } catch (error) {
      console.error('Failed to record insight feedback:', error);
    }
  }, []);

  // Handle refresh - load both habits and daily summary
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      loadHabits(),
      loadDailySummary()
    ]);
    setIsRefreshing(false);
  }, [loadHabits, loadDailySummary]);

  // Load habits and daily summary when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('HomeScreen useEffect: Loading habits and daily summary on mount');
      loadHabits();
      loadDailySummary();
    }
  }, [isAuthenticated, user, loadHabits, loadDailySummary]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && user) {
        console.log('HomeScreen focused, refreshing habits and daily summary data...');
        const timeoutId = setTimeout(() => {
          loadHabits();
          loadDailySummary();
        }, 200);
        
        return () => clearTimeout(timeoutId);
      }
    }, [isAuthenticated, user, loadHabits, loadDailySummary])
  );


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
      
      {/* Daily Summary */}
      {summaryLoading ? (
        <SkeletonLoader type="summary" />
      ) : dailySummary ? (
        <DailySummaryCard
          summary={dailySummary}
          onInsightFeedback={handleInsightFeedback}
        />
      ) : null}

      {/* Progress Summary */}
      <ProgressSection 
        todaysProgress={todaysProgress}
        user={user}
        onStartDayCheckIn={startMorningCheckIn}
      />

      {/* Habits List */}
      <FlatList
        data={habits}
        keyExtractor={(item: HabitWithStreak) => item.id}
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
        renderItem={({ item }: { item: HabitWithStreak }) => (
          <HabitCard
            habit={item}
            animatedValue={animatedValues[item.id] || new Animated.Value(1)}
            onToggleCompletion={handleToggleHabitCompletion}
            onSkipHabit={handleSkipHabit}
            onUndoSkip={handleUndoSkip}
          />
        )}
      />

      {/* Add Habit Modal */}
      <AddHabitModal
        visible={showAddHabitModal}
        onClose={() => setShowAddHabitModal(false)}
        onCreateHabit={handleCreateHabit}
        newHabitTitle={newHabitTitle}
        setNewHabitTitle={setNewHabitTitle}
        newHabitDescription={newHabitDescription}
        setNewHabitDescription={setNewHabitDescription}
        newHabitType={newHabitType}
        setNewHabitType={setNewHabitType}
        isCreatingHabit={isCreatingHabit}
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
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
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
});