import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView, SafeAreaViewProps } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { useQuery, useMutation } from 'convex/react';

import { Colors, Typography, Spacing, BorderRadius } from '../lib/design-system';
import { Habit, HabitEvent } from '../types/habits';
import { api } from '../services/convex';
import HabitCard from '../components/habits/HabitCard';
import DayDetailModal from '../components/habits/DayDetailModal';
import HabitDetailScreen from './HabitDetailScreen';
import AddHabitModal from '../components/habits/AddHabitModal';
import { getHabitEventsForHabit } from '../utils/habitUtils';
import { useAuth } from '../hooks/useAuth';

export default function HabitsScreen() {
  // Auth hook
  const { userId, isAuthenticated } = useAuth();
  
  // Query habits from Convex (authenticated automatically via Clerk)
  const habitsQuery = useQuery(api.habits.getHabits, { include_archived: false });
  const [habits, setHabits] = useState<Habit[]>([]);
  
  // Query habit events from Convex
  const eventsQuery = useQuery(
    api.habitEvents.getHabitEvents, 
    userId ? { user_id: userId } : 'skip'
  );
  
  // Convex mutations for habits
  const createHabit = useMutation(api.habits.createHabit);
  const updateHabit = useMutation(api.habits.updateHabit);
  const updateHabitsOrder = useMutation(api.habits.updateHabitsOrder);
  const deleteHabit = useMutation(api.habits.deleteHabit);
  
  // Convex mutations for habit events
  const createHabitEvent = useMutation(api.habitEvents.createHabitEvent);
  const updateHabitEvent = useMutation(api.habitEvents.updateHabitEvent);
  const deleteHabitEvent = useMutation(api.habitEvents.deleteHabitEvent);
  
  // Update local habits when query changes
  React.useEffect(() => {
    if (habitsQuery) {
      // Backend now returns habits sorted by order, no need to sort again
      setHabits(habitsQuery);
    }
  }, [habitsQuery]);
  
  // Local state for habit events (synced with Convex)
  const [events, setEvents] = useState<HabitEvent[]>([]);
  
  // Update local events when query changes
  React.useEffect(() => {
    if (eventsQuery) {
      setEvents(eventsQuery);
    }
  }, [eventsQuery]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [habitDetailVisible, setHabitDetailVisible] = useState(false);
  const [detailHabit, setDetailHabit] = useState<Habit | null>(null);
  const [addHabitModalVisible, setAddHabitModalVisible] = useState(false);

  const handleDayPress = (date: Date, habit: Habit) => {
    setSelectedDate(date);
    setSelectedHabit(habit);
    setModalVisible(true);
  };

  const handleModalSave = async (updatedEvent: Partial<HabitEvent>) => {
    if (!userId || !isAuthenticated) {
      console.error('User not authenticated');
      return;
    }

    console.log('Saving habit event:', updatedEvent);

    try {
      if (updatedEvent.id && !updatedEvent.id.startsWith('event_') && !updatedEvent.id.startsWith('avoided_') && !updatedEvent.id.startsWith('skipped_') && !updatedEvent.id.startsWith('relapse_')) {
        // Update existing event (has a real Convex ID)
        const updateData: any = {
          id: updatedEvent.id as any, // Convex ID
          user_id: userId,
        };
        
        if (updatedEvent.status !== undefined) updateData.status = updatedEvent.status;
        if (updatedEvent.value !== undefined) updateData.value = updatedEvent.value;
        if (updatedEvent.note !== undefined) updateData.note = updatedEvent.note;
        if (updatedEvent.timestamp !== undefined) updateData.timestamp = updatedEvent.timestamp;

        console.log('Updating event with:', updateData);
        await updateHabitEvent(updateData);
      } else {
        // Create new event
        if (!updatedEvent.habit_id || !updatedEvent.date || !updatedEvent.status) {
          console.error('Missing required fields for creating habit event:', updatedEvent);
          return;
        }

        const createData: any = {
          habit_id: updatedEvent.habit_id as any, // Convex ID
          user_id: userId,
          date: updatedEvent.date,
          status: updatedEvent.status,
        };

        if (updatedEvent.value !== undefined) createData.value = updatedEvent.value;
        if (updatedEvent.note !== undefined) createData.note = updatedEvent.note;
        if (updatedEvent.timestamp !== undefined) createData.timestamp = updatedEvent.timestamp;

        console.log('Creating event with:', createData);
        await createHabitEvent(createData);
      }

      // Update local state for immediate UI feedback
      setEvents(prevEvents => {
        const existingEventIndex = prevEvents.findIndex(
          e => e.id === updatedEvent.id
        );

        if (existingEventIndex >= 0) {
          // Update existing event
          const newEvents = [...prevEvents];
          newEvents[existingEventIndex] = { ...newEvents[existingEventIndex], ...updatedEvent };
          return newEvents;
        } else {
          // Create new event
          const newEvent: HabitEvent = {
            id: updatedEvent.id || `event_${Date.now()}`,
            habit_id: updatedEvent.habit_id!,
            user_id: updatedEvent.user_id!,
            date: updatedEvent.date!,
            status: updatedEvent.status!,
            value: updatedEvent.value,
            note: updatedEvent.note,
            timestamp: updatedEvent.timestamp,
            created_at: updatedEvent.created_at!,
            updated_at: updatedEvent.updated_at!,
          };
          return [...prevEvents, newEvent];
        }
      });
    } catch (error) {
      console.error('Failed to save habit event:', error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!userId || !isAuthenticated) {
      console.error('User not authenticated');
      return;
    }

    try {
      if (!eventId.startsWith('event_') && !eventId.startsWith('avoided_') && !eventId.startsWith('skipped_') && !eventId.startsWith('relapse_')) {
        // Delete from Convex if it's a real Convex ID
        await deleteHabitEvent({
          id: eventId as any, // Convex ID
          user_id: userId,
        });
      }

      // Update local state
      setEvents(prevEvents => prevEvents.filter(e => e.id !== eventId));
    } catch (error) {
      console.error('Failed to delete habit event:', error);
    }
  };

  const getSelectedEvent = (): HabitEvent | undefined => {
    if (!selectedHabit || !selectedDate) return undefined;
    
    // Use local timezone date string to avoid timezone issues
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    return events.find(e => e.habit_id === selectedHabit.id && e.date === dateString);
  };

  const handleAddHabit = () => {
    setAddHabitModalVisible(true);
  };

  const handleSaveNewHabit = async (newHabit: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'archived'>) => {
    if (!userId || !isAuthenticated) {
      console.error('User not authenticated');
      return;
    }

    try {
      await createHabit({
        ...newHabit,
      });

      // Local state will update via the habits query
    } catch (error) {
      console.error('Failed to create habit:', error);
    }
  };

  const handleHabitPress = (habit: Habit) => {
    setDetailHabit(habit);
    setHabitDetailVisible(true);
  };

  const handleSaveHabit = async (updatedHabit: Partial<Habit>) => {
    if (!userId || !isAuthenticated || !updatedHabit.id) {
      console.error('User not authenticated or missing habit ID');
      return;
    }

    try {
      // Only pass defined fields that the mutation expects
      const updateData: any = {
        id: updatedHabit.id as any, // Convex ID
        user_id: userId,
      };

      // Add optional fields if they're defined
      if (updatedHabit.name !== undefined) updateData.name = updatedHabit.name;
      if (updatedHabit.type !== undefined) updateData.type = updatedHabit.type;
      if (updatedHabit.frequency !== undefined) updateData.frequency = updatedHabit.frequency;
      if (updatedHabit.goal_value !== undefined) updateData.goal_value = updatedHabit.goal_value;
      if (updatedHabit.goal_direction !== undefined) updateData.goal_direction = updatedHabit.goal_direction;
      if (updatedHabit.unit !== undefined) updateData.unit = updatedHabit.unit;
      if (updatedHabit.goal_time !== undefined) updateData.goal_time = updatedHabit.goal_time;
      if (updatedHabit.goal_times_by_day !== undefined) updateData.goal_times_by_day = updatedHabit.goal_times_by_day;
      if (updatedHabit.failure_tolerance !== undefined) updateData.failure_tolerance = updatedHabit.failure_tolerance;
      if (updatedHabit.archived !== undefined) updateData.archived = updatedHabit.archived;

      await updateHabit(updateData);

      // Local state will update via the habits query
    } catch (error) {
      console.error('Failed to update habit:', error);
    }
  };

  const handleArchiveHabit = async (habitId: string) => {
    if (!userId || !isAuthenticated) {
      console.error('User not authenticated');
      return;
    }

    try {
      await updateHabit({
        id: habitId as any, // Convex ID
        user_id: userId,
        archived: true,
      });

      // Local state will update via the habits query
    } catch (error) {
      console.error('Failed to archive habit:', error);
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (!userId || !isAuthenticated) {
      console.error('User not authenticated');
      return;
    }

    try {
      await deleteHabit({
        id: habitId as any, // Convex ID
        user_id: userId,
      });

      // Local state will update via the habits query
      // Events will be cleaned up by the database schema or backend logic
    } catch (error) {
      console.error('Failed to delete habit:', error);
    }
  };

  const handleResetHabit = async (habitId: string) => {
    if (!userId || !isAuthenticated) {
      console.error('User not authenticated');
      return;
    }

    try {
      // Get all events for this habit and delete them
      const habitEvents = events.filter(e => e.habit_id === habitId);
      
      for (const event of habitEvents) {
        if (!event.id.startsWith('event_') && !event.id.startsWith('avoided_') && !event.id.startsWith('skipped_') && !event.id.startsWith('relapse_')) {
          // Delete from Convex if it's a real Convex ID
          await deleteHabitEvent({
            id: event.id as any, // Convex ID
            user_id: userId,
          });
        }
      }

      // Local state will update via the events query
    } catch (error) {
      console.error('Failed to reset habit:', error);
    }
  };


  const renderHabitItem = ({ item: habit, drag, isActive }: RenderItemParams<Habit>) => (
    <View
      style={[
        styles.habitItemContainer,
        isActive && styles.activeHabitItem,
      ]}
    >
      <HabitCard
        habit={habit}
        events={getHabitEventsForHabit(habit.id, events)}
        onDayPress={handleDayPress}
        onHabitPress={handleHabitPress}
        onLongPress={drag}
      />
    </View>
  );

  const handleDragEnd = async ({ data }: { data: Habit[] }) => {
    // Update local state immediately for smooth UX
    setHabits(data);
    
    // Prepare the order updates for the backend
    const habitOrders = data.map((habit, index) => ({
      id: habit.id as any, // Convex ID type
      order: index + 1, // Start order from 1
    }));

    try {
      // Persist the new order to the backend
      await updateHabitsOrder({ habitOrders });
      console.log('Successfully updated habit order in backend');
    } catch (error) {
      console.error('Failed to update habit order:', error);
      // Optionally revert local state if backend update fails
      // You could re-fetch habits here to restore the original order
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Habits</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddHabit}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={24} color={Colors.primary[600]} />
        </TouchableOpacity>
      </View>

      <View style={styles.scrollContainer}>
        <View style={styles.scrollContent}>
          <View style={styles.habitsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Commitments</Text>
              <Text style={styles.sectionSubtitle}>
                {habitsQuery === undefined ? 'Loading...' : `${habits.length} active habit${habits.length !== 1 ? 's' : ''}`}
              </Text>
            </View>
          </View>
          
          {habitsQuery === undefined ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading your habits...</Text>
            </View>
          ) : habits.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No habits yet!</Text>
              <Text style={styles.emptySubtext}>Tap the + button above to create your first habit</Text>
            </View>
          ) : (
            <DraggableFlatList
              data={habits}
              keyExtractor={(item) => item.id}
              renderItem={renderHabitItem}
              onDragEnd={handleDragEnd}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.flatListContent}
            />
          )}
        </View>
      </View>

      {selectedHabit && (
        <DayDetailModal
          visible={modalVisible}
          date={selectedDate}
          habit={selectedHabit}
          event={getSelectedEvent()}
          allEvents={events}
          onClose={() => setModalVisible(false)}
          onSave={handleModalSave}
          onDeleteEvent={handleDeleteEvent}
        />
      )}

      {detailHabit && (
        <HabitDetailScreen
          visible={habitDetailVisible}
          habit={detailHabit}
          events={getHabitEventsForHabit(detailHabit.id, events)}
          onClose={() => setHabitDetailVisible(false)}
          onSave={handleSaveHabit}
          onSaveEvent={handleModalSave}
          onDeleteEvent={handleDeleteEvent}
          onArchive={handleArchiveHabit}
          onDelete={handleDeleteHabit}
          onReset={handleResetHabit}
        />
      )}

      <AddHabitModal
        visible={addHabitModalVisible}
        onClose={() => setAddHabitModalVisible(false)}
        onSave={handleSaveNewHabit}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[100],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.neutral[50],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  title: {
    ...Typography.h1,
    color: Colors.neutral[800],
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing['5xl'],
  },
  habitsSection: {
    marginTop: 0,
  },
  sectionHeader: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h2,
    color: Colors.neutral[800],
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    ...Typography.bodySmall,
    color: Colors.neutral[600],
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.neutral[500],
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...Typography.h3,
    color: Colors.neutral[600],
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    ...Typography.body,
    color: Colors.neutral[500],
    textAlign: 'center',
  },
  habitItemContainer: {
    marginBottom: Spacing.md,
  },
  activeHabitItem: {
    opacity: 0.8,
    transform: [{ scale: 1.02 }],
    shadowColor: Colors.neutral[900],
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  flatListContent: {
    paddingBottom: 100, // Extra padding to ensure last item clears the tab bar
  },
});