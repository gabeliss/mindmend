import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../../lib/design-system';
import { Habit } from '../../types/habits';

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
    switch (habit.type) {
      case 'simple':
        return 'Goal: complete daily';
      case 'schedule':
        // Check if there are different weekend goals
        if (habit.goal_times_by_day && (habit.goal_times_by_day.Sat || habit.goal_times_by_day.Sun)) {
          const weekdayGoal = formatTimeToAMPM(habit.goal_time);
          const weekendGoal = formatTimeToAMPM(habit.goal_times_by_day.Sat || habit.goal_times_by_day.Sun);
          const direction = habit.goal_direction === 'by' ? 'by' : 'after';
          return `Goal: ${direction} ${weekdayGoal} on weekdays, ${weekendGoal} on weekends`;
        }
        const direction = habit.goal_direction === 'by' ? 'by' : 'after';
        return `Goal: ${direction} ${formatTimeToAMPM(habit.goal_time)}`;
      case 'duration':
        const goalValue = habit.goal_value || 2;
        const unit = habit.unit || 'hours';
        const directionText = habit.goal_direction === 'at_least' ? 'at least' : 'under';
        
        let goalText: string;
        if (unit === 'hours') {
          const wholeHours = Math.floor(goalValue);
          const minutes = Math.round((goalValue - wholeHours) * 60);
          
          if (minutes === 0) {
            goalText = `${wholeHours} hr${wholeHours !== 1 ? 's' : ''}`;
          } else if (minutes === 30) {
            goalText = `${wholeHours}.5 hrs`;
          } else {
            goalText = `${wholeHours}h ${minutes}m`;
          }
        } else if (unit === 'minutes') {
          goalText = `${goalValue} min`;
        } else {
          goalText = `${goalValue} ${unit}`;
        }
        
        return `Goal: ${directionText} ${goalText}/day`;
      case 'quantity':
        const quantityGoal = habit.goal_value || 10;
        const quantityUnit = habit.unit || '';
        const quantityDirection = habit.goal_direction === 'at_least' ? 'at least' : 'exactly';
        return `Goal: ${quantityDirection} ${quantityGoal}${quantityUnit ? ' ' + quantityUnit : ''}`;
      case 'avoidance':
        if (habit.failure_tolerance) {
          return `Goal: avoid completely (max ${habit.failure_tolerance.max_failures} failures/${habit.failure_tolerance.window})`;
        }
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