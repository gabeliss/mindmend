import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, Spacing, BorderRadius } from '../lib/design-system';
import { Habit, HabitEvent } from '../types/habits';
import { mockHabits, mockHabitEvents } from '../data/mockData';
import HabitCard from '../components/habits/HabitCard';
import TodaysPlan from '../components/habits/TodaysPlan';
import DayDetailModal from '../components/habits/DayDetailModal';
import HabitDetailScreen from './HabitDetailScreen';
import { getHabitEventsForHabit } from '../utils/habitUtils';

export default function HabitsScreen() {
  const [habits, setHabits] = useState<Habit[]>(mockHabits);
  const [events, setEvents] = useState<HabitEvent[]>(mockHabitEvents);
  const [showTodaysPlan, setShowTodaysPlan] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [habitDetailVisible, setHabitDetailVisible] = useState(false);
  const [detailHabit, setDetailHabit] = useState<Habit | null>(null);

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
    console.log('Add habit pressed');
    // TODO: Open add habit modal/screen
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

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {showTodaysPlan && (
          <TodaysPlan 
            habits={habits}
            events={events}
            onToggle={() => setShowTodaysPlan(!showTodaysPlan)}
          />
        )}

        <View style={styles.habitsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Commitments</Text>
            <Text style={styles.sectionSubtitle}>
              {habits.length} active habit{habits.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              events={getHabitEventsForHabit(habit.id, events)}
              onDayPress={handleDayPress}
              onHabitPress={handleHabitPress}
            />
          ))}
        </View>
      </ScrollView>

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
});