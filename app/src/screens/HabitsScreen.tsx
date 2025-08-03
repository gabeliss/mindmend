import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, Spacing, BorderRadius } from '../lib/design-system';
import { Habit, HabitEvent } from '../types/habits';
import { mockHabits, mockHabitEvents } from '../data/mockData';
import HabitCard from '../components/habits/HabitCard';
import TodaysPlan from '../components/habits/TodaysPlan';
import { getHabitEventsForHabit } from '../utils/habitUtils';

export default function HabitsScreen() {
  const [habits] = useState<Habit[]>(mockHabits);
  const [events] = useState<HabitEvent[]>(mockHabitEvents);
  const [showTodaysPlan, setShowTodaysPlan] = useState(true);

  const handleDayPress = (date: Date, habit: Habit) => {
    console.log('Day pressed:', date, 'for habit:', habit.name);
    // TODO: Open habit event modal/screen
  };

  const handleAddHabit = () => {
    console.log('Add habit pressed');
    // TODO: Open add habit modal/screen
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
            />
          ))}
        </View>
      </ScrollView>
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