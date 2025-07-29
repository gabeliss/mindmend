import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  Alert,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput
} from 'react-native';
// @ts-ignore
import { ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from './services/auth';
import { apiClient, Streak, isApiError, handleApiError } from './services/api';

interface StreakStats {
  totalStreaks: number;
  activeStreaks: number;
  averageStreak: number;
  longestEverStreak: number;
  totalDaysLogged: number;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  achieved: boolean;
  icon: string;
}

export default function StreaksScreen() {
  const { user, isAuthenticated } = useAuth();
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Edit past habit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Streak | null>(null);
  const [editingDate, setEditingDate] = useState<string>('');
  const [editableEvents, setEditableEvents] = useState<any[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Load streaks and calculate stats
  const loadStreaks = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      setIsLoading(true);
      
      // Clear old data to ensure fresh state
      setRecentEvents([]);

      // Calculate date range for last 7 days (using local timezone)
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);
      
      // Use local date format to avoid timezone issues
      const startDate = sevenDaysAgo.getFullYear() + '-' + 
        String(sevenDaysAgo.getMonth() + 1).padStart(2, '0') + '-' + 
        String(sevenDaysAgo.getDate()).padStart(2, '0');
      const endDate = today.getFullYear() + '-' + 
        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
        String(today.getDate()).padStart(2, '0');
      
      // Load streaks, habits, recent events, and today's events in parallel
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

      // Merge today's events with recent events, ensuring no duplicates
      const eventIds = new Set(eventsData.map((e: any) => e.id));
      const additionalTodayEvents = todayEventsData.filter((e: any) => !eventIds.has(e.id));
      const allEvents = [...eventsData, ...additionalTodayEvents];

      // Store recent events for calendar view
      setRecentEvents(allEvents);


      // Create a map of habit IDs to habits
      const habitMap = new Map();
      habitsData.forEach((habit: any) => {
        habitMap.set(habit.id, habit);
      });

      // Combine streaks with habit information
      const streaksWithHabits = streaksData.map((streak: any) => ({
        ...streak,
        habit: habitMap.get(streak.habitId) || { title: 'Unknown Habit', habitType: 'BUILD' }
      }));

      setStreaks(streaksWithHabits);

      // Calculate streak statistics
      const stats = calculateStreakStats(streaksData);
      setStreakStats(stats);

      // Generate milestones
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

  // Calculate comprehensive streak statistics
  const calculateStreakStats = (streaksData: any[]): StreakStats => {
    
    if (streaksData.length === 0) {
      return {
        totalStreaks: 0,
        activeStreaks: 0,
        averageStreak: 0,
        longestEverStreak: 0,
        totalDaysLogged: 0,
      };
    }

    const activeStreaks = streaksData.filter(s => s && s.currentStreak > 0).length;
    const totalCurrent = streaksData.reduce((sum, s) => sum + (s?.currentStreak || 0), 0);
    const longestEver = streaksData.length > 0 ? Math.max(...streaksData.map(s => s?.longestStreak || 0)) : 0;
    const averageStreak = streaksData.length > 0 ? totalCurrent / streaksData.length : 0;
    const totalDays = streaksData.reduce((sum, s) => sum + (s?.currentStreak || 0), 0);



    return {
      totalStreaks: streaksData.length,
      activeStreaks,
      averageStreak: Math.round(averageStreak * 10) / 10,
      longestEverStreak: longestEver,
      totalDaysLogged: totalDays,
    };
  };

  // Generate milestone achievements
  const generateMilestones = (stats: StreakStats): Milestone[] => {
    const milestones: Milestone[] = [
      {
        id: '1',
        title: 'First Streak',
        description: 'Complete your first 3-day streak',
        target: 3,
        current: stats.longestEverStreak,
        achieved: stats.longestEverStreak >= 3,
        icon: '🌱',
      },
      {
        id: '2',
        title: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        target: 7,
        current: stats.longestEverStreak,
        achieved: stats.longestEverStreak >= 7,
        icon: '💪',
      },
      {
        id: '3',
        title: 'Consistency King',
        description: 'Achieve a 30-day streak',
        target: 30,
        current: stats.longestEverStreak,
        achieved: stats.longestEverStreak >= 30,
        icon: '👑',
      },
      {
        id: '4',
        title: 'Habit Master',
        description: 'Maintain 3 active streaks',
        target: 3,
        current: stats.activeStreaks,
        achieved: stats.activeStreaks >= 3,
        icon: '🏆',
      },
      {
        id: '5',
        title: 'Century Club',
        description: 'Log 100 total habits',
        target: 100,
        current: stats.totalDaysLogged,
        achieved: stats.totalDaysLogged >= 100,
        icon: '💯',
      },
      {
        id: '6',
        title: 'Legendary',
        description: 'Achieve a 100-day streak',
        target: 100,
        current: stats.longestEverStreak,
        achieved: stats.longestEverStreak >= 100,
        icon: '🌟',
      },
    ];

    return milestones;
  };

  // Get streak color based on length
  const getStreakColor = (streakLength: number): string => {
    if (streakLength === 0) return '#E2E8F0';
    if (streakLength < 7) return '#F6AD55';
    if (streakLength < 30) return '#48BB78';
    if (streakLength < 100) return '#4299E1';
    return '#9F7AEA';
  };

  // Get today's date string consistently
  const getTodayString = (): string => {
    const today = new Date();
    return today.getFullYear() + '-' + 
      String(today.getMonth() + 1).padStart(2, '0') + '-' + 
      String(today.getDate()).padStart(2, '0');
  };

  // Check if habit was completed today
  const isCompletedToday = (streak: Streak): boolean => {
    const todayString = getTodayString();
    return recentEvents.some(event => 
      event.habitId === streak.habitId && 
      event.eventType === 'COMPLETED' &&
      event.occurredAt.startsWith(todayString)
    );
  };

  // Check if habit was explicitly skipped/failed today
  const isSkippedToday = (streak: Streak): boolean => {
    const todayString = getTodayString();
    return recentEvents.some(event => 
      event.habitId === streak.habitId && 
      (event.eventType === 'SKIPPED' || event.eventType === 'RELAPSED') &&
      event.occurredAt.startsWith(todayString)
    );
  };

  // Get habit status for today
  const getTodayStatus = (streak: Streak): 'completed' | 'skipped' | 'pending' => {
    if (isCompletedToday(streak)) return 'completed';
    if (isSkippedToday(streak)) return 'skipped';
    return 'pending';
  };

  // Get streak status text
  const getStreakStatus = (streak: Streak): string => {
    if (streak.currentStreak === 0) return 'Ready to start';
    
    const todayStatus = getTodayStatus(streak);
    
    if (todayStatus === 'skipped') {
      // Explicitly skipped/failed today - streak is broken
      if (streak.currentStreak === 1) return 'Streak broken';
      return `${streak.currentStreak}-day streak broken`;
    }
    
    if (todayStatus === 'completed') {
      // Completed today - active streak
      if (streak.currentStreak === 1) return 'Day 1 - Great start! 🌟';
      if (streak.currentStreak < 7) return `${streak.currentStreak} days strong 💪`;
      if (streak.currentStreak < 30) return `${streak.currentStreak} days - On fire! 🔥`;
      return `${streak.currentStreak} days - Legendary! ⚡`;
    }
    
    // Pending - no event today yet, but streak is still alive
    if (streak.currentStreak === 1) return '1 day streak (continue today)';
    return `${streak.currentStreak} days (continue today) ⏳`;
  };

  // Generate calendar data for last 7 days using real API data
  const generateCalendarData = (streak: Streak) => {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      // Check if this habit was completed on this specific date
      const dateString = date.getFullYear() + '-' + 
        String(date.getMonth() + 1).padStart(2, '0') + '-' + 
        String(date.getDate()).padStart(2, '0');
      const wasCompleted = recentEvents.some(event => 
        event.habitId === streak.habitId && 
        event.eventType === 'COMPLETED' &&
        event.occurredAt.startsWith(dateString)
      );
      
      // Check if this habit was skipped/failed on this specific date
      const wasSkipped = recentEvents.some(event => 
        event.habitId === streak.habitId && 
        (event.eventType === 'SKIPPED' || event.eventType === 'RELAPSED') &&
        event.occurredAt.startsWith(dateString)
      );
      
      days.push({
        date: date.getDate(),
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        isCompleted: wasCompleted,
        isSkipped: wasSkipped,
        isToday: i === 0,
        isEditable: i > 0 && i <= 6, // Can edit past 6 days, but not today
        fullDate: dateString
      });
    }
    
    return days;
  };

  // Render 7-day calendar view
  const renderCalendarView = (streak: Streak) => {
    const calendarData = generateCalendarData(streak);
    
    return (
      <View style={styles.calendarContainer}>
        <Text style={styles.calendarTitle}>Last 7 days</Text>
        <View style={styles.calendarGrid}>
          {calendarData.map((day, index) => (
            <View key={index} style={styles.calendarDay}>
              <Text style={styles.dayName}>{day.dayName}</Text>
              <TouchableOpacity 
                style={[
                  styles.dayCircle,
                  day.isCompleted && styles.completedDay,
                  day.isSkipped && styles.skippedDay,
                  day.isToday && styles.todayCircle
                ]}
                onPress={() => handleDayTap(day, streak)}
                disabled={!day.isEditable}
                activeOpacity={day.isEditable ? 0.7 : 1}
              >
                <Text style={[
                  styles.dayNumber,
                  day.isCompleted && styles.completedDayText,
                  day.isSkipped && styles.skippedDayText,
                  day.isToday && !day.isCompleted && !day.isSkipped && styles.todayText
                ]}>
                  {day.date}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Handle day tap for editing past habits
  const handleDayTap = useCallback((day: any, streak: Streak) => {
    if (!day.isEditable) return;
    
    setEditingHabit(streak);
    setEditingDate(day.fullDate);
    setEditableEvents([...recentEvents]); // Copy current events for local editing
    setShowEditModal(true);
  }, [recentEvents]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadStreaks();
    setIsRefreshing(false);
  }, [loadStreaks]);

  // Load data when component mounts or user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      loadStreaks();
    }
  }, [isAuthenticated, user, loadStreaks]);

  // Refresh data when screen comes into focus (e.g., navigating back from HomeScreen)
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && user) {
        // Force refresh with a small delay to ensure backend has processed any recent changes
        const timeoutId = setTimeout(() => {
          loadStreaks();
        }, 200);
        
        // Cleanup timeout if screen unfocuses quickly
        return () => clearTimeout(timeoutId);
      }
    }, [isAuthenticated, user])
  );

  // Render stats overview
  const renderStatsOverview = () => (
    <View style={styles.statsContainer}>
      <Text style={styles.sectionTitle}>Your Progress</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{streakStats.activeStreaks}</Text>
          <Text style={styles.statLabel}>Active Streaks</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{streakStats.longestEverStreak}</Text>
          <Text style={styles.statLabel}>Longest Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{streakStats.averageStreak}</Text>
          <Text style={styles.statLabel}>Average</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{streakStats.totalDaysLogged}</Text>
          <Text style={styles.statLabel}>Active Days</Text>
        </View>
      </View>
    </View>
  );

  // Render habit streaks
  const renderHabitStreaks = () => (
    <View style={styles.habitsContainer}>
      <Text style={styles.sectionTitle}>Habit Streaks</Text>
      {streaks.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No habits yet! Add some habits to start building streaks.
          </Text>
        </View>
      ) : (
        streaks.map((streak) => (
          <View key={streak.habitId} style={styles.streakCard}>
            <View style={styles.streakHeader}>
              <View style={styles.habitInfo}>
                <Text style={styles.habitTitle}>{streak.habit.title}</Text>
                <Text style={styles.habitType}>
                  {streak.habit.habitType === 'BUILD' ? '✅ Build' : '🚫 Break'}
                </Text>
              </View>
              <View style={[
                styles.streakBadge,
                { backgroundColor: getStreakColor(streak.currentStreak) }
              ]}>
                <Text style={styles.streakNumber}>
                  {(() => {
                    const todayStatus = getTodayStatus(streak);
                    if (todayStatus === 'completed') return '🔥';
                    if (todayStatus === 'skipped') return '⭕';
                    return '⏳'; // pending
                  })()}{streak.currentStreak}
                </Text>
              </View>
            </View>
            
            <View style={styles.streakProgress}>
              <View style={styles.progressInfo}>
                <Text style={styles.streakStatus}>
                  {getStreakStatus(streak)}
                </Text>
                <Text style={styles.bestStreak}>
                  Best: {streak.longestStreak} days
                </Text>
              </View>
              
              {/* Progress bar */}
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View 
                    style={[
                      styles.progressBarFill,
                      { 
                        width: `${Math.min((streak.currentStreak / Math.max(streak.longestStreak, 7)) * 100, 100)}%`,
                        backgroundColor: getStreakColor(streak.currentStreak)
                      }
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Calendar view */}
            {renderCalendarView(streak)}
          </View>
        ))
      )}
    </View>
  );

  // Render milestones
  const renderMilestones = () => (
    <View style={styles.milestonesContainer}>
      <Text style={styles.sectionTitle}>Achievements</Text>
      <View style={styles.milestonesGrid}>
        {milestones.map((milestone) => (
          <View 
            key={milestone.id} 
            style={[
              styles.milestoneCard,
              milestone.achieved && styles.achievedMilestone
            ]}
          >
            <Text style={styles.milestoneIcon}>{milestone.icon}</Text>
            <Text style={styles.milestoneTitle}>{milestone.title}</Text>
            <Text style={styles.milestoneDescription}>{milestone.description}</Text>
            <View style={styles.milestoneProgress}>
              <Text style={[
                styles.milestoneProgressText,
                milestone.achieved && styles.achievedText
              ]}>
                {milestone.current}/{milestone.target}
              </Text>
              {milestone.achieved && (
                <Text style={styles.achievedBadge}>✓</Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  // Get current event status for the editing date
  const getCurrentEventStatus = () => {
    if (!editingHabit || !editingDate) return null;
    
    const existingEvent = editableEvents.find(event => 
      event.habitId === editingHabit.habitId && 
      event.occurredAt.startsWith(editingDate)
    );
    
    return existingEvent?.eventType || null;
  };

  // Handle edit action (completed, skipped, avoided, relapsed)
  const handleEditAction = useCallback(async (action: 'COMPLETED' | 'SKIPPED' | 'RELAPSED' | null) => {
    if (!editingHabit || !editingDate) return;

    setIsSavingEdit(true);
    
    try {
      const existingEvent = editableEvents.find(event => 
        event.habitId === editingHabit.habitId && 
        event.occurredAt.startsWith(editingDate)
      );

      if (action === null) {
        // Remove event if it exists
        if (existingEvent) {
          const response = await apiClient.deleteHabitEvent(existingEvent.id);
          if (isApiError(response)) {
            throw new Error(handleApiError(response));
          }
        }
      } else {
        if (existingEvent) {
          // Delete existing event first
          const deleteResponse = await apiClient.deleteHabitEvent(existingEvent.id);
          if (isApiError(deleteResponse)) {
            throw new Error(handleApiError(deleteResponse));
          }
        }
        
        // Create new event
        const response = await apiClient.logHabitEvent({
          habitId: editingHabit.habitId,
          eventType: action,
          notes: action === 'COMPLETED' ? 'Completed habit' : 
                 action === 'SKIPPED' ? 'Skipped habit' : 'Relapsed on habit',
          occurredAt: editingDate,
        });
        if (isApiError(response)) {
          throw new Error(handleApiError(response));
        }
      }

      // Close modal and refresh data
      setShowEditModal(false);
      setEditingHabit(null);
      setEditingDate('');
      await loadStreaks();
      
    } catch (error) {
      console.error('Failed to update habit event:', error);
      Alert.alert('Error', 'Failed to update habit log. Please try again.');
    } finally {
      setIsSavingEdit(false);
    }
  }, [editingHabit, editingDate, editableEvents, loadStreaks]);

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.authPrompt}>Please sign in to view your streaks</Text>
      </View>
    );
  }

  if (isLoading && !isRefreshing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#4F8EF7" />
        <Text style={styles.loadingText}>Loading your streaks...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#4F8EF7']}
            tintColor="#4F8EF7"
          />
        }
      >
        {renderStatsOverview()}
        {renderHabitStreaks()}
        {renderMilestones()}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
      visible={showEditModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowEditModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowEditModal(false)}>
            <Text style={styles.modalCancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {editingDate && (() => {
              const dateObj = new Date(editingDate);
              return `Log for ${dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}?`;
            })()}
          </Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.editModalContent}>
          {editingHabit && (
            <>
              <View style={styles.habitInfoSection}>
                <Text style={styles.editHabitTitle}>{editingHabit.habit.title}</Text>
                <Text style={styles.editHabitType}>
                  {editingHabit.habit.habitType === 'BUILD' ? '✅ Build Habit' : '🚫 Break Habit'}
                </Text>
              </View>

              <View style={styles.actionButtonsContainer}>
                {editingHabit.habit.habitType === 'BUILD' ? (
                  <>
                    <TouchableOpacity 
                      style={[
                        styles.actionButton, 
                        styles.completedActionButton,
                        getCurrentEventStatus() === 'COMPLETED' && styles.selectedActionButton
                      ]}
                      onPress={() => handleEditAction('COMPLETED')}
                      disabled={isSavingEdit}
                    >
                      <Text style={[styles.actionButtonText, styles.completedActionText]}>
                        ✓ Completed
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[
                        styles.actionButton, 
                        styles.skippedActionButton,
                        getCurrentEventStatus() === 'SKIPPED' && styles.selectedActionButton
                      ]}
                      onPress={() => handleEditAction('SKIPPED')}
                      disabled={isSavingEdit}
                    >
                      <Text style={[styles.actionButtonText, styles.skippedActionText]}>
                        ✕ Skipped
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity 
                      style={[
                        styles.actionButton, 
                        styles.completedActionButton,
                        getCurrentEventStatus() === 'COMPLETED' && styles.selectedActionButton
                      ]}
                      onPress={() => handleEditAction('COMPLETED')}
                      disabled={isSavingEdit}
                    >
                      <Text style={[styles.actionButtonText, styles.completedActionText]}>
                        ✓ Avoided
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[
                        styles.actionButton, 
                        styles.skippedActionButton,
                        getCurrentEventStatus() === 'RELAPSED' && styles.selectedActionButton
                      ]}
                      onPress={() => handleEditAction('RELAPSED')}
                      disabled={isSavingEdit}
                    >
                      <Text style={[styles.actionButtonText, styles.skippedActionText]}>
                        ✕ Relapsed
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
                
                <TouchableOpacity 
                  style={[
                    styles.actionButton, 
                    styles.clearActionButton,
                    getCurrentEventStatus() === null && styles.selectedActionButton
                  ]}
                  onPress={() => handleEditAction(null)}
                  disabled={isSavingEdit}
                >
                  <Text style={[styles.actionButtonText, styles.clearActionText]}>
                    Clear Log
                  </Text>
                </TouchableOpacity>
              </View>
              
              {isSavingEdit && (
                <View style={styles.savingIndicator}>
                  <ActivityIndicator size="small" color="#4F8EF7" />
                  <Text style={styles.savingText}>Saving...</Text>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  authPrompt: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 16,
  },
  statsContainer: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4F8EF7',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  habitsContainer: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  streakCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  habitInfo: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  habitType: {
    fontSize: 12,
    color: '#64748B',
  },
  streakBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  streakNumber: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  streakProgress: {
    marginBottom: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  streakStatus: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3748',
  },
  bestStreak: {
    fontSize: 12,
    color: '#64748B',
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  milestonesContainer: {
    padding: 16,
  },
  milestonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  milestoneCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  achievedMilestone: {
    backgroundColor: '#F0FFF4',
    borderColor: '#38A169',
    borderWidth: 2,
  },
  milestoneIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  milestoneTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    textAlign: 'center',
    marginBottom: 4,
  },
  milestoneDescription: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 8,
  },
  milestoneProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneProgressText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4F8EF7',
  },
  achievedText: {
    color: '#38A169',
  },
  achievedBadge: {
    marginLeft: 8,
    fontSize: 16,
    color: '#38A169',
  },
  // Calendar view styles
  calendarContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  calendarTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarDay: {
    alignItems: 'center',
    flex: 1,
  },
  dayName: {
    fontSize: 10,
    color: '#94A3B8',
    marginBottom: 4,
    fontWeight: '500',
  },
  dayCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  completedDay: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  skippedDay: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  todayCircle: {
    borderColor: '#4F8EF7',
    borderWidth: 2,
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  completedDayText: {
    color: '#fff',
  },
  skippedDayText: {
    color: '#fff',
  },
  todayText: {
    color: '#4F8EF7',
    fontWeight: '700',
  },
  // Modal styles
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
    textAlign: 'center',
    flex: 1,
  },
  modalCancelButton: {
    fontSize: 16,
    color: '#6B7280',
  },
  editModalContent: {
    flex: 1,
    padding: 20,
  },
  habitInfoSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  editHabitTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  editHabitType: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  actionButtonsContainer: {
    gap: 16,
  },
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  selectedActionButton: {
    backgroundColor: '#F0F9FF',
    borderColor: '#3B82F6',
  },
  completedActionButton: {
    borderColor: '#10B981',
  },
  skippedActionButton: {
    borderColor: '#EF4444',
  },
  clearActionButton: {
    borderColor: '#6B7280',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  completedActionText: {
    color: '#10B981',
  },
  skippedActionText: {
    color: '#EF4444',
  },
  clearActionText: {
    color: '#6B7280',
  },
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  savingText: {
    fontSize: 14,
    color: '#4F8EF7',
    fontWeight: '500',
  },
});