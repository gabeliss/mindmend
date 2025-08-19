import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../../lib/design-system';
import { Habit } from '../../types/habits';
import { getHabitGoalText } from '../../utils/habitGoalUtils';

const formatTimeToAMPM = (timeString?: string): string => {
  if (!timeString) return '';
  
  const [hours, minutes] = timeString.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  
  if (minutes === 0) {
    return `${displayHours} ${ampm}`;
  }
  
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

interface HabitStatsProps {
  habit: Habit;
  currentStreak: number;
}

export default function HabitStats({ habit, currentStreak }: HabitStatsProps) {
  const getGoalText = (): string => {
    return getHabitGoalText(habit, { includeFrequency: true });
  };

  const getFrequencyText = (): string => {
    if (habit.frequency.type === 'daily') return 'Daily';
    if (habit.frequency.type === 'weekly') return `${habit.frequency.goal_per_week}x/week`;
    if (habit.frequency.type === 'specific_days') {
      return habit.frequency.days_of_week?.join(', ') || 'Specific days';
    }
    return '';
  };

  return (
    <View style={styles.container}>
      <View style={styles.statRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{currentStreak}</Text>
          <Text style={styles.statLabel}>day streak</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.goalSection}>
          <Text style={styles.goalText}>{getGoalText()}</Text>
          <Text style={styles.frequencyText}>{getFrequencyText()}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.xs,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  statValue: {
    ...Typography.h2,
    fontSize: 20,
    color: Colors.primary[600],
    lineHeight: 24,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.neutral[600],
    marginTop: -2,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.neutral[300],
    marginRight: Spacing.md,
  },
  goalSection: {
    flex: 1,
  },
  goalText: {
    ...Typography.bodySmall,
    color: Colors.neutral[700],
    fontWeight: '500',
  },
  frequencyText: {
    ...Typography.caption,
    color: Colors.neutral[500],
    marginTop: 2,
  },
});