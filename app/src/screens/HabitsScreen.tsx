import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';

import { Colors, Typography, Spacing, BorderRadius } from '../lib/design-system';
import { Habit, HabitEvent, DailyPlan, DailyPlanItem } from '../types/habits';
import { mockDailyPlans } from '../data/mockData';
import { api } from '../services/convex';
import HabitCard from '../components/habits/HabitCard';
import TodaysPlan from '../components/habits/TodaysPlan';
import DayDetailModal from '../components/habits/DayDetailModal';
import HabitDetailScreen from './HabitDetailScreen';
import AddHabitModal from '../components/habits/AddHabitModal';
import AddPlanItemModal from '../components/habits/AddPlanItemModal';
import { getHabitEventsForHabit } from '../utils/habitUtils';

export default function HabitsScreen() {
  // Query habits from Convex (authenticated automatically via Clerk)
  const habitsQuery = useQuery(api.habits.getHabits, { include_archived: false });
  const [habits, setHabits] = useState<Habit[]>([]);
  
  // Update local habits when query changes
  React.useEffect(() => {
    if (habitsQuery) {
      setHabits(habitsQuery.sort((a: Habit, b: Habit) => (a.order || 0) - (b.order || 0)));
    }
  }, [habitsQuery]);
  
  // TODO: Connect habit events to Convex later
  const [events, setEvents] = useState<HabitEvent[]>([]);
  const [dailyPlans, setDailyPlans] = useState<DailyPlan[]>(mockDailyPlans);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [habitDetailVisible, setHabitDetailVisible] = useState(false);
  const [detailHabit, setDetailHabit] = useState<Habit | null>(null);
  const [addHabitModalVisible, setAddHabitModalVisible] = useState(false);
  const [addPlanItemModalVisible, setAddPlanItemModalVisible] = useState(false);
  const [editingPlanItem, setEditingPlanItem] = useState<DailyPlanItem | null>(null);

  const handleDayPress = (date: Date, habit: Habit) => {
    setSelectedDate(date);
    setSelectedHabit(habit);
    setModalVisible(true);
  };

  const handleModalSave = (updatedEvent: Partial<HabitEvent>) => {
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
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(prevEvents => prevEvents.filter(e => e.id !== eventId));
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

  const handleSaveNewHabit = (newHabit: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'archived'>) => {
    const habit: Habit = {
      ...newHabit,
      id: `habit_${Date.now()}`,
      user_id: 'user_1', // TODO: Get from auth context
      created_at: new Date().toISOString(),
      archived: false,
    };
    setHabits(prevHabits => [...prevHabits, habit]);
  };

  const handleHabitPress = (habit: Habit) => {
    setDetailHabit(habit);
    setHabitDetailVisible(true);
  };

  const handleSaveHabit = (updatedHabit: Partial<Habit>) => {
    setHabits(prevHabits => 
      prevHabits.map(h => 
        h.id === updatedHabit.id ? { ...h, ...updatedHabit } : h
      )
    );
  };

  const handleArchiveHabit = (habitId: string) => {
    setHabits(prevHabits => 
      prevHabits.map(h => 
        h.id === habitId ? { ...h, archived: true } : h
      )
    );
  };

  const handleDeleteHabit = (habitId: string) => {
    setHabits(prevHabits => prevHabits.filter(h => h.id !== habitId));
    // Also remove all events for this habit
    setEvents(prevEvents => prevEvents.filter(e => e.habit_id !== habitId));
  };

  const handleResetHabit = (habitId: string) => {
    // Remove all events for this habit to reset progress
    setEvents(prevEvents => prevEvents.filter(e => e.habit_id !== habitId));
  };

  const getTodaysPlan = (): DailyPlan | undefined => {
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return dailyPlans.find(plan => plan.date === todayString);
  };

  const handlePlanItemToggle = (itemId: string) => {
    setDailyPlans(prevPlans => 
      prevPlans.map(plan => ({
        ...plan,
        entries: plan.entries.map(entry => 
          entry.id === itemId 
            ? { ...entry, completed: !entry.completed }
            : entry
        )
      }))
    );
  };

  const handleAddPlanItem = () => {
    setAddPlanItemModalVisible(true);
  };

  const handleSavePlanItem = (newItem: Omit<DailyPlanItem, 'id' | 'daily_plan_id'>) => {
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    if (editingPlanItem) {
      // Edit existing item
      setDailyPlans(prevPlans => 
        prevPlans.map(plan => ({
          ...plan,
          entries: plan.entries.map(entry => 
            entry.id === editingPlanItem.id 
              ? { ...entry, ...newItem }
              : entry
          )
        }))
      );
      setEditingPlanItem(null);
    } else {
      // Add new item
      setDailyPlans(prevPlans => {
        const existingPlanIndex = prevPlans.findIndex(plan => plan.date === todayString);
        const newPlanItem: DailyPlanItem = {
          ...newItem,
          id: `plan_item_${Date.now()}`,
          daily_plan_id: existingPlanIndex >= 0 ? prevPlans[existingPlanIndex].id : `plan_${todayString}`,
          order: existingPlanIndex >= 0 ? prevPlans[existingPlanIndex].entries.length + 1 : 1,
        };

        if (existingPlanIndex >= 0) {
          // Add to existing plan
          const updatedPlans = [...prevPlans];
          updatedPlans[existingPlanIndex] = {
            ...updatedPlans[existingPlanIndex],
            entries: [...updatedPlans[existingPlanIndex].entries, newPlanItem],
          };
          return updatedPlans;
        } else {
          // Create new plan
          const newPlan = {
            id: `plan_${todayString}`,
            user_id: 'user_1',
            date: todayString,
            entries: [newPlanItem],
            created_at: new Date().toISOString(),
          };
          return [...prevPlans, newPlan];
        }
      });
    }
  };

  const handleEditPlanItem = (item: DailyPlanItem) => {
    setEditingPlanItem(item);
    setAddPlanItemModalVisible(true);
  };

  const handleDeletePlanItem = (itemId: string) => {
    setDailyPlans(prevPlans => 
      prevPlans.map(plan => ({
        ...plan,
        entries: plan.entries.filter(entry => entry.id !== itemId)
      }))
    );
  };

  const renderHabitItem = ({ item: habit }: { item: Habit }) => (
    <HabitCard
      habit={habit}
      events={getHabitEventsForHabit(habit.id, events)}
      onDayPress={handleDayPress}
      onHabitPress={handleHabitPress}
    />
  );

  return (
    <SafeAreaView style={styles.container as any}>
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

      <FlatList
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={() => (
          <>
            <TodaysPlan 
              dailyPlan={getTodaysPlan()}
              onPlanItemToggle={handlePlanItemToggle}
              onAddPlanItem={handleAddPlanItem}
              onEditPlanItem={handleEditPlanItem}
              onDeletePlanItem={handleDeletePlanItem}
            />
            
            <View style={styles.habitsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Your Commitments</Text>
                <Text style={styles.sectionSubtitle}>
                  {habitsQuery === undefined ? 'Loading...' : `${habits.length} active habit${habits.length !== 1 ? 's' : ''}`}
                </Text>
              </View>
            </View>
          </>
        )}
        data={habits}
        keyExtractor={(item) => item.id}
        renderItem={renderHabitItem}
        ListEmptyComponent={() => 
          habitsQuery === undefined ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading your habits...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No habits yet!</Text>
              <Text style={styles.emptySubtext}>Tap the + button above to create your first habit</Text>
            </View>
          )
        }
      />

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

      <AddPlanItemModal
        visible={addPlanItemModalVisible}
        item={editingPlanItem || undefined}
        onClose={() => {
          setAddPlanItemModalVisible(false);
          setEditingPlanItem(null);
        }}
        onSave={handleSavePlanItem}
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
    marginTop: Spacing.lg,
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
});