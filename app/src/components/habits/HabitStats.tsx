import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../../lib/design-system';
import { Habit } from '../../types/habits';

interface HabitStatsProps {
  habit: Habit;
  currentStreak: number;
}

export default function HabitStats({ habit, currentStreak }: HabitStatsProps) {
  const getGoalText = (): string => {
    switch (habit.type) {
      case 'time_based':
        if (habit.comparison_type === 'time_of_day') {
          return `Goal: by ${habit.goal_time}`;
        } else {
          return `Goal: under ${habit.goal_time}`;
        }
      case 'count_based':
        return `Goal: ${habit.goal_count} pages`;
      case 'time_since':
        return 'Goal: avoid completely';
      default:
        return habit.frequency.type === 'daily' ? 'Daily goal' : 
               `${habit.frequency.goal_per_week}x per week`;
    }
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