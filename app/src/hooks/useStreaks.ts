import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { apiClient, Streak, isApiError, handleApiError } from '../services/api';
import { 
  calculateStreakStats, 
  generateMilestones, 
  StreakStats, 
  Milestone
} from '../utils';

export const useStreaks = (isAuthenticated: boolean, user: any) => {
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [streakStats, setStreakStats] = useState<StreakStats>({
    totalStreaks: 0,
    activeStreaks: 0,
    averageStreak: 0,
    longestEverStreak: 0,
    totalDaysLogged: 0,
  });
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [streakHistories, setStreakHistories] = useState<Map<string, any[]>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  const loadStreaks = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      console.log('Loading streaks data...');
      setIsLoading(true);
      setRecentEvents([]);

      const [streaksResponse, habitsResponse, todayEventsResponse] = await Promise.all([
        apiClient.getStreaks(),
        apiClient.getHabits(),
        apiClient.getTodayEvents(),
      ]);

      if (isApiError(streaksResponse)) {
        throw new Error(handleApiError(streaksResponse));
      }

      if (isApiError(habitsResponse)) {
        throw new Error(handleApiError(habitsResponse));
      }

      if (isApiError(todayEventsResponse)) {
        throw new Error(handleApiError(todayEventsResponse));
      }

      const streaksData = streaksResponse.data?.habitStreaks || [];
      const habitsData = habitsResponse.data?.habits || [];
      const todayEventsData = todayEventsResponse.data?.events || [];

      setRecentEvents(todayEventsData);

      const habitMap = new Map();
      habitsData.forEach((habit: any) => {
        habitMap.set(habit.id, habit);
      });

      const streaksWithHabits = streaksData.map((streak: any) => ({
        ...streak,
        habit: habitMap.get(streak.habitId) || { title: 'Unknown Habit', habitType: 'BUILD' }
      }));

      setStreaks(streaksWithHabits);

      // Fetch timezone-aware streak history for each habit
      const historyPromises = streaksWithHabits.map(async (streak: any) => {
        try {
          const historyResponse = await apiClient.getHabitStreakHistory(streak.habitId, 7);
          if (!isApiError(historyResponse)) {
            return { habitId: streak.habitId, history: historyResponse.data?.history || [] };
          }
        } catch (error) {
          console.error(`Failed to load history for habit ${streak.habitId}:`, error);
        }
        return { habitId: streak.habitId, history: [] };
      });

      const historyResults = await Promise.all(historyPromises);
      const historyMap = new Map();
      historyResults.forEach(result => {
        historyMap.set(result.habitId, result.history);
      });
      setStreakHistories(historyMap);

      const stats = calculateStreakStats(streaksData);
      setStreakStats(stats);

      const milestonesData = generateMilestones(stats);
      setMilestones(milestonesData);

    } catch (error) {
      console.error('Failed to load streaks:', error);
      Alert.alert(
        'Error',
        'Failed to load your streaks. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  const handleEditAction = useCallback(async (
    habitId: string,
    editingDate: string,
    action: 'COMPLETED' | 'SKIPPED' | 'RELAPSED' | null,
    editableEvents: any[]
  ) => {
    try {
      const existingEvent = editableEvents.find(event => 
        event.habitId === habitId && 
        event.occurredAt.startsWith(editingDate)
      );

      if (action === null) {
        if (existingEvent) {
          const response = await apiClient.deleteHabitEvent(existingEvent.id);
          if (isApiError(response)) {
            throw new Error(handleApiError(response));
          }
        }
      } else {
        if (existingEvent) {
          const deleteResponse = await apiClient.deleteHabitEvent(existingEvent.id);
          if (isApiError(deleteResponse)) {
            throw new Error(handleApiError(deleteResponse));
          }
        }
        
        // Create a timestamp using the selected date but with current time
        // This ensures the event is recorded on the correct date in the user's timezone
        const now = new Date();
        const selectedDate = new Date(editingDate + 'T00:00:00');
        
        const occurredAtTimestamp = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          now.getHours(),
          now.getMinutes(),
          now.getSeconds(),
          now.getMilliseconds()
        );
        
        const response = await apiClient.logHabitEvent({
          habitId,
          eventType: action,
          notes: action === 'COMPLETED' ? 'Completed habit' : 
                 action === 'SKIPPED' ? 'Skipped habit' : 'Relapsed on habit',
          occurredAt: occurredAtTimestamp.toISOString(),
        });
        if (isApiError(response)) {
          throw new Error(handleApiError(response));
        }
      }

      await loadStreaks();
      return true;
      
    } catch (error) {
      console.error('Failed to update habit event:', error);
      Alert.alert('Error', 'Failed to update habit log. Please try again.');
      return false;
    }
  }, [loadStreaks]);

  return {
    streaks,
    streakStats,
    milestones,
    recentEvents,
    streakHistories,
    isLoading,
    loadStreaks,
    handleEditAction,
  };
};