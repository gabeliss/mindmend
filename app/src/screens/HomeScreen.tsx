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
import { ProgressSection, HabitCard, AddHabitModal } from '../components/home';

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

  // Load habits when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('HomeScreen useEffect: Loading habits on mount');
      loadHabits();
    }
  }, [isAuthenticated, user, loadHabits]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && user) {
        console.log('HomeScreen focused, refreshing habits data...');
        const timeoutId = setTimeout(() => {
          loadHabits();
        }, 200);
        
        return () => clearTimeout(timeoutId);
      }
    }, [isAuthenticated, user, loadHabits])
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
      
      {/* Progress Summary */}
      <ProgressSection 
        todaysProgress={todaysProgress}
        user={user}
        onStartDayCheckIn={startMorningCheckIn}
      />

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
        keyExtractor={(item: HabitWithStreak) => item.id}
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