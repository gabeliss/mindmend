import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../lib/design-system';
import { Habit, HabitEvent } from '../../types/habits';
import DayCircle from './DayCircle';
import HabitStats from './HabitStats';

interface HabitCardProps {
  habit: Habit;
  events: HabitEvent[];
  onDayPress: (date: Date, habit: Habit) => void;
  onHabitPress?: (habit: Habit) => void;
  onLongPress?: () => void;
}

export default function HabitCard({ habit, events, onDayPress, onHabitPress, onLongPress }: HabitCardProps) {
  const getLast7Days = (): Date[] => {
    const days: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  };

  const getEventForDate = (date: Date): HabitEvent | undefined => {
    // Use local timezone date string to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    return events.find(event => event.date === dateString);
  };

  const getCurrentStreak = (): number => {
    const sortedEvents = events
      .filter(e => e.status === 'completed')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    if (sortedEvents.length === 0) return 0;
    
    let streak = 0;
    let currentDate = new Date();
    
    for (let i = 0; i < 30; i++) {
      const dateString = currentDate.toISOString().split('T')[0];
      const event = events.find(e => e.date === dateString);
      
      if (event && event.status === 'completed') {
        streak++;
      } else if (event && event.status === 'failed') {
        break;
      }
      
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    return streak;
  };

  const last7Days = getLast7Days();
  const currentStreak = getCurrentStreak();
  
  // Find which day is today for positioning the indicator
  const todayIndex = last7Days.findIndex(date => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onHabitPress?.(habit)}
      onLongPress={onLongPress}
      delayLongPress={200}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.habitName}>{habit.name}</Text>
        </View>
        
        <HabitStats habit={habit} currentStreak={currentStreak} />
      </View>

      <View style={styles.calendarSection}>
        <View style={styles.calendarHeader}>
          <Text style={styles.calendarTitle}>Last 7 days</Text>
          {todayIndex !== -1 && (
            <View style={[
              styles.todayIndicator, 
              { 
                left: `${(todayIndex / 7) * 100 + (1 / 14) * 100}%`,
                transform: [{ translateX: -18 }] // Half the width to center
              }
            ]}>
              <Text style={styles.todayText}>Today</Text>
            </View>
          )}
        </View>
        <View style={styles.daysContainer}>
          {last7Days.map((date, index) => (
            <DayCircle
              key={index}
              date={date}
              event={getEventForDate(date)}
              habit={habit}
              onPress={(date) => onDayPress(date, habit)}
            />
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  header: {
    marginBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  habitName: {
    ...Typography.h3,
    flex: 1,
    marginRight: Spacing.sm,
  },
  calendarSection: {
    marginTop: Spacing.sm,
  },
  calendarHeader: {
    position: 'relative',
    marginBottom: Spacing.sm,
  },
  calendarTitle: {
    ...Typography.bodySmall,
    color: Colors.neutral[600],
    fontWeight: '500',
  },
  todayIndicator: {
    position: 'absolute',
    top: 0,
    backgroundColor: Colors.primary[100],
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 0.5,
    borderColor: Colors.primary[300],
    alignItems: 'center',
    minWidth: 36,
  },
  todayText: {
    ...Typography.caption,
    fontSize: 8,
    fontWeight: '600',
    color: Colors.primary[700],
    textAlign: 'center',
  },
  daysContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});