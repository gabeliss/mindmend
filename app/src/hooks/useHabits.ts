import { useState, useCallback } from 'react';
import { Alert, Vibration, Animated } from 'react-native';
import { apiClient, Habit, isApiError, handleApiError } from '../services/api';
import { getMotivationalMessage, generateSuggestedTime } from '../utils';

export interface HabitWithStreak extends Habit {
  streak?: number;
  completedToday?: boolean;
  skippedToday?: boolean;
  suggestedTime?: string;
  isOverdue?: boolean;
  todayEventId?: string;
  skipEventId?: string;
}

export interface TodaysProgress {
  completedHabits: number;
  totalHabits: number;
  currentStreak: number;
  motivationalMessage?: string;
}

export const useHabits = (isAuthenticated: boolean, user: any) => {
  console.log('useHabits hook initialized, isAuthenticated:', isAuthenticated, 'user:', user?.email || 'no user');
  
  const [habits, setHabits] = useState<HabitWithStreak[]>([]);
  const [todaysProgress, setTodaysProgress] = useState<TodaysProgress>({
    completedHabits: 0,
    totalHabits: 0,
    currentStreak: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadHabits = useCallback(async () => {
    console.log('loadHabits called, isAuthenticated:', isAuthenticated, 'user:', user?.email || 'no user');
    if (!isAuthenticated || !user) return;

    try {
      console.log('loadHabits: Starting to load habits data...');
      setIsLoading(true);

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

      const streakMap = new Map<string, any>();
      console.log('loadHabits: Processing streak data:', JSON.stringify(streaksData, null, 2));
      streaksData.forEach((streak: any) => {
        console.log(`Setting streak for habit ${streak.habitId}: currentStreak=${streak.currentStreak}`);
        streakMap.set(streak.habitId, streak);
      });

      const completedToday = new Map<string, string>();
      const skippedToday = new Map<string, string>();
      
      eventsData.forEach((event: any) => {
        if (event.eventType === 'COMPLETED') {
          completedToday.set(event.habitId, event.id);
        } else if (event.eventType === 'SKIPPED' || event.eventType === 'RELAPSED') {
          skippedToday.set(event.habitId, event.id);
        }
      });

      const habitsWithStreak: HabitWithStreak[] = habitsData.map((habit: any) => {
        const streak = streakMap.get(habit.id);
        const todayEventId = completedToday.get(habit.id);
        const skipEventId = skippedToday.get(habit.id);
        const completedTodayFlag = !!todayEventId;
        const skippedTodayFlag = !!skipEventId;
        
        const finalStreak = streak?.currentStreak || 0;
        console.log(`Mapping habit ${habit.title} (${habit.id}): streak=${finalStreak}, completedToday=${completedTodayFlag}`);
        
        return {
          ...habit,
          streak: finalStreak,
          completedToday: completedTodayFlag,
          skippedToday: skippedTodayFlag,
          todayEventId,
          skipEventId,
          suggestedTime: generateSuggestedTime(habit.title),
          isOverdue: false,
        };
      });

      console.log('loadHabits: Setting habits state with:', habitsWithStreak.map(h => ({ title: h.title, streak: h.streak, completedToday: h.completedToday })));
      setHabits(habitsWithStreak);

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

  const refreshStreaks = useCallback(async () => {
    try {
      console.log('Fetching updated streaks...');
      const streaksResponse = await apiClient.getStreaks();
      if (!isApiError(streaksResponse)) {
        const streaksData = streaksResponse.data?.habitStreaks || [];
        console.log('Received streak data:', streaksData);
        
        const streakMap = new Map<string, any>();
        streaksData.forEach((streak: any) => {
          streakMap.set(streak.habitId, streak);
        });

        setHabits(prevHabits => 
          prevHabits.map(habit => {
            const updatedStreak = streakMap.get(habit.id)?.currentStreak || 0;
            console.log(`Updating habit ${habit.title} streak from ${habit.streak} to ${updatedStreak}`);
            return {
              ...habit,
              streak: updatedStreak
            };
          })
        );
      }
    } catch (error) {
      console.error('Failed to refresh streaks:', error);
    }
  }, []);

  const toggleHabitCompletion = useCallback(async (
    habitId: string, 
    habitType: 'BUILD' | 'AVOID',
    animatedValues: { [key: string]: Animated.Value }
  ) => {
    try {
      const currentHabit = habits.find(h => h.id === habitId);
      if (!currentHabit) return;

      const isCurrentlyCompleted = currentHabit.completedToday;
      console.log(`Toggling habit completion for ${currentHabit.title}, currently completed: ${isCurrentlyCompleted}`);

      const updatedHabits = habits.map(habit => {
        if (habit.id === habitId) {
          const willBeCompleted = !habit.completedToday;
          return { 
            ...habit, 
            completedToday: willBeCompleted,
            todayEventId: willBeCompleted ? 'temp' : undefined,
            // Optimistically update streak
            streak: willBeCompleted 
              ? (habit.streak || 0) + 1  // Increment streak when completing
              : Math.max((habit.streak || 0) - 1, 0)  // Decrement streak when uncompleting
          };
        }
        return habit;
      });

      setHabits(updatedHabits);

      // Update today's progress immediately
      const completed = updatedHabits.filter(h => h.completedToday).length;
      const total = updatedHabits.length;
      const avgStreak = total > 0 
        ? Math.round(updatedHabits.reduce((sum, h) => sum + (h.streak || 0), 0) / total)
        : 0;

      setTodaysProgress({
        completedHabits: completed,
        totalHabits: total,
        currentStreak: avgStreak,
        motivationalMessage: getMotivationalMessage(completed, total, avgStreak),
      });

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

      Vibration.vibrate(50);

      if (isCurrentlyCompleted && currentHabit.todayEventId) {
        const response = await apiClient.deleteHabitEvent(currentHabit.todayEventId);
        
        if (isApiError(response)) {
          // Revert optimistic update on error
          setHabits(prevHabits => 
            prevHabits.map(habit => 
              habit.id === habitId 
                ? { 
                    ...habit, 
                    completedToday: true, 
                    todayEventId: currentHabit.todayEventId,
                    streak: currentHabit.streak  // Revert streak
                  }
                : habit
            )
          );
          throw new Error(handleApiError(response));
        }
      } else {
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
                ? { 
                    ...habit, 
                    completedToday: false, 
                    todayEventId: undefined,
                    streak: currentHabit.streak  // Revert streak
                  }
                : habit
            )
          );
          throw new Error(handleApiError(response));
        }

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

      // Refresh streaks in background to sync with backend (no delay needed for UI)
      setTimeout(async () => {
        console.log('Syncing streaks with backend...');
        await refreshStreaks();
      }, 500); // Short delay just to ensure backend has processed

    } catch (error) {
      console.error('Failed to toggle habit completion:', error);
      Alert.alert('Error', 'Failed to update habit. Please try again.');
    }
  }, [habits, refreshStreaks]);

  const skipHabit = useCallback(async (
    habitId: string, 
    habitType: 'BUILD' | 'AVOID',
    animatedValues: { [key: string]: Animated.Value }
  ) => {
    try {
      const currentHabit = habits.find(h => h.id === habitId);
      if (!currentHabit || currentHabit.completedToday) return;

      const eventType = habitType === 'BUILD' ? 'SKIPPED' : 'RELAPSED';
      const eventNotes = habitType === 'BUILD' ? 'Skipped habit for today' : 'Relapsed on avoiding habit';

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

      Vibration.vibrate(50);

      const response = await apiClient.logHabitEvent({
        habitId,
        eventType,
        notes: eventNotes,
      });

      if (isApiError(response)) {
        throw new Error(handleApiError(response));
      }

      await loadHabits();

    } catch (error) {
      console.error('Failed to skip habit:', error);
      Alert.alert('Error', 'Failed to update habit. Please try again.');
    }
  }, [habits, loadHabits]);

  const undoSkip = useCallback(async (
    habitId: string,
    animatedValues: { [key: string]: Animated.Value }
  ) => {
    try {
      const currentHabit = habits.find(h => h.id === habitId);
      if (!currentHabit || !currentHabit.skipEventId) return;

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

      Vibration.vibrate(50);

      const response = await apiClient.deleteHabitEvent(currentHabit.skipEventId);
      
      if (isApiError(response)) {
        throw new Error(handleApiError(response));
      }

      await loadHabits();

    } catch (error) {
      console.error('Failed to undo skip:', error);
      Alert.alert('Error', 'Failed to undo. Please try again.');
    }
  }, [habits, loadHabits]);

  const createHabit = useCallback(async (
    title: string,
    description: string,
    habitType: 'BUILD' | 'AVOID'
  ) => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a habit title');
      return false;
    }

    try {
      const response = await apiClient.createHabit({
        title: title.trim(),
        description: description.trim() || undefined,
        habitType,
      });

      if (isApiError(response)) {
        throw new Error(handleApiError(response));
      }

      await loadHabits();
      Alert.alert('Success', 'Habit created successfully!');
      return true;
    } catch (error) {
      console.error('Failed to create habit:', error);
      Alert.alert('Error', 'Failed to create habit. Please try again.');
      return false;
    }
  }, [loadHabits]);

  return {
    habits,
    todaysProgress,
    isLoading,
    loadHabits,
    toggleHabitCompletion,
    skipHabit,
    undoSkip,
    createHabit,
  };
};