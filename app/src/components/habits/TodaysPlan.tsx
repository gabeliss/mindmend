import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../lib/design-system';
import { Habit, HabitEvent } from '../../types/habits';
import { getDateString, isHabitScheduledForDate } from '../../utils/habitUtils';

interface TodaysPlanProps {
  habits: Habit[];
  events: HabitEvent[];
  onToggle: () => void;
}

export default function TodaysPlan({ habits, events, onToggle }: TodaysPlanProps) {
  const today = new Date();
  const todayString = getDateString(today);
  
  const getTodaysHabits = () => {
    return habits.filter(habit => isHabitScheduledForDate(habit, today));
  };

  const getHabitStatusForToday = (habit: Habit): 'completed' | 'pending' | 'failed' => {
    const event = events.find(e => e.habit_id === habit.id && e.date === todayString);
    if (!event) return 'pending';
    return event.status === 'completed' ? 'completed' : 'failed';
  };

  const todaysHabits = getTodaysHabits();
  const completedCount = todaysHabits.filter(h => getHabitStatusForToday(h) === 'completed').length;

  const getStatusIcon = (status: 'completed' | 'pending' | 'failed') => {
    switch (status) {
      case 'completed':
        return <Ionicons name="checkmark-circle" size={20} color={Colors.success[600]} />;
      case 'failed':
        return <Ionicons name="close-circle" size={20} color={Colors.alert[500]} />;
      default:
        return <Ionicons name="ellipse-outline" size={20} color={Colors.neutral[400]} />;
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Today's Plan</Text>
          <Text style={styles.date}>{formatDate(today)}</Text>
        </View>
        <TouchableOpacity onPress={onToggle} style={styles.toggleButton}>
          <Ionicons name="chevron-up" size={20} color={Colors.neutral[600]} />
        </TouchableOpacity>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${todaysHabits.length ? (completedCount / todaysHabits.length) * 100 : 0}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {completedCount} of {todaysHabits.length} habits completed
        </Text>
      </View>

      <View style={styles.habitsList}>
        {todaysHabits.map((habit) => {
          const status = getHabitStatusForToday(habit);
          return (
            <View key={habit.id} style={styles.habitItem}>
              {getStatusIcon(status)}
              <Text style={[
                styles.habitText,
                status === 'completed' && styles.completedText
              ]}>
                {habit.name}
              </Text>
            </View>
          );
        })}
        
        {todaysHabits.length === 0 && (
          <Text style={styles.noHabitsText}>
            No habits scheduled for today. Time to relax! 🌟
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.md,
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    ...Typography.h2,
    color: Colors.neutral[800],
    marginBottom: 2,
  },
  date: {
    ...Typography.bodySmall,
    color: Colors.neutral[600],
  },
  toggleButton: {
    padding: Spacing.xs,
  },
  progressSection: {
    marginBottom: Spacing.lg,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.neutral[200],
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.sm,
  },
  progressText: {
    ...Typography.bodySmall,
    color: Colors.neutral[600],
    textAlign: 'center',
  },
  habitsList: {
    gap: Spacing.sm,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  habitText: {
    ...Typography.body,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: Colors.neutral[500],
  },
  noHabitsText: {
    ...Typography.body,
    color: Colors.neutral[500],
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: Spacing.md,
  },
});