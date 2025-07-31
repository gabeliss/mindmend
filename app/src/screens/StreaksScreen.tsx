import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  RefreshControl
} from 'react-native';
// @ts-ignore
import { ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../services/auth';
import { useStreaks } from '../hooks';
import { 
  getStreakColor, 
  getTodayStatus, 
  getStreakStatus, 
  generateCalendarData 
} from '../utils';
import { StatsOverview, HabitStreakCard, MilestonesGrid, EditHabitModal } from '../components/streaks';

export default function StreaksScreen() {
  const { user, isAuthenticated } = useAuth();
  const {
    streaks,
    streakStats,
    milestones,
    recentEvents,
    isLoading,
    loadStreaks,
    handleEditAction,
  } = useStreaks(isAuthenticated, user);
  
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Edit past habit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<any>(null);
  const [editingDate, setEditingDate] = useState<string>('');
  const [editableEvents, setEditableEvents] = useState<any[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Handle day tap for editing past habits
  const handleDayTap = useCallback((day: any, streak: any) => {
    if (!day.isEditable) return;
    
    setEditingHabit(streak);
    setEditingDate(day.fullDate);
    setEditableEvents([...recentEvents]);
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

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && user) {
        console.log('StreaksScreen focused, refreshing data...');
        const timeoutId = setTimeout(() => {
          loadStreaks();
        }, 200);
        
        return () => clearTimeout(timeoutId);
      }
    }, [isAuthenticated, user, loadStreaks])
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
        streaks.map((streak) => {
          const todayStatus = getTodayStatus(streak, recentEvents);
          const todayStatusIcon = todayStatus === 'completed' ? '🔥' : todayStatus === 'skipped' ? '⭕' : '⏳';
          
          return (
            <HabitStreakCard
              key={streak.habitId}
              streak={streak}
              calendarData={generateCalendarData(streak, recentEvents)}
              streakColor={getStreakColor(streak.currentStreak)}
              streakStatus={getStreakStatus(streak, recentEvents)}
              todayStatusIcon={todayStatusIcon}
              onDayTap={handleDayTap}
            />
          );
        })
      )}
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

  // Handle edit action wrapper
  const handleEditActionWrapper = useCallback(async (action: 'COMPLETED' | 'SKIPPED' | 'RELAPSED' | null) => {
    if (!editingHabit || !editingDate) return;

    setIsSavingEdit(true);
    const success = await handleEditAction(editingHabit.habitId, editingDate, action, editableEvents);
    
    if (success) {
      setShowEditModal(false);
      setEditingHabit(null);
      setEditingDate('');
    }
    
    setIsSavingEdit(false);
  }, [editingHabit, editingDate, editableEvents, handleEditAction]);

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
        <StatsOverview streakStats={streakStats} />
        {renderHabitStreaks()}
        <MilestonesGrid milestones={milestones} />
      </ScrollView>

      {/* Edit Modal */}
      <EditHabitModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        editingHabit={editingHabit}
        editingDate={editingDate}
        currentEventStatus={getCurrentEventStatus()}
        onEditAction={handleEditActionWrapper}
        isSavingEdit={isSavingEdit}
      />
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
});