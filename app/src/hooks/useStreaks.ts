import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { apiClient, Streak, isApiError, handleApiError } from '../services/api';
import { 
  calculateStreakStats, 
  generateMilestones, 
  StreakStats, 
  Milestone,
  getDateRange 
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
  const [isLoading, setIsLoading] = useState(true);

  const loadStreaks = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      console.log('Loading streaks data...');
      setIsLoading(true);
      setRecentEvents([]);

      const { startDate, endDate } = getDateRange(6);
      
      const [streaksResponse, habitsResponse, eventsResponse, todayEventsResponse] = await Promise.all([
        apiClient.getStreaks(),
        apiClient.getHabits(),
        apiClient.getHabitEvents({ startDate, endDate }),
        apiClient.getTodayEvents(),
      ]);

      if (isApiError(streaksResponse)) {
        throw new Error(handleApiError(streaksResponse));
      }

      if (isApiError(habitsResponse)) {
        throw new Error(handleApiError(habitsResponse));
      }

      if (isApiError(eventsResponse)) {
        throw new Error(handleApiError(eventsResponse));
      }

      if (isApiError(todayEventsResponse)) {
        throw new Error(handleApiError(todayEventsResponse));
      }

      const streaksData = streaksResponse.data?.habitStreaks || [];
      const habitsData = habitsResponse.data?.habits || [];
      const eventsData = eventsResponse.data?.events || [];
      const todayEventsData = todayEventsResponse.data?.events || [];

      const eventIds = new Set(eventsData.map((e: any) => e.id));
      const additionalTodayEvents = todayEventsData.filter((e: any) => !eventIds.has(e.id));
      const allEvents = [...eventsData, ...additionalTodayEvents];

      setRecentEvents(allEvents);

      const habitMap = new Map();
      habitsData.forEach((habit: any) => {
        habitMap.set(habit.id, habit);
      });

      const streaksWithHabits = streaksData.map((streak: any) => ({
        ...streak,
        habit: habitMap.get(streak.habitId) || { title: 'Unknown Habit', habitType: 'BUILD' }
      }));

      setStreaks(streaksWithHabits);

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
        
        const response = await apiClient.logHabitEvent({
          habitId,
          eventType: action,
          notes: action === 'COMPLETED' ? 'Completed habit' : 
                 action === 'SKIPPED' ? 'Skipped habit' : 'Relapsed on habit',
          occurredAt: editingDate,
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
    isLoading,
    loadStreaks,
    handleEditAction,
  };
};