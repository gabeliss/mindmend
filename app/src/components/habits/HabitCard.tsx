import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../lib/design-system';
import { Habit, HabitEvent } from '../../types/habits';
import DayCircle from './DayCircle';
import HabitStats from './HabitStats';

interface HabitCardProps {
  habit: Habit;
  events: HabitEvent[];
  onDayPress: (date: Date, habit: Habit) => void;
}

export default function HabitCard({ habit, events, onDayPress }: HabitCardProps) {
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
    const dateString = date.toISOString().split('T')[0];
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.habitName}>{habit.name}</Text>
          <View style={styles.typeIndicator}>
            <Text style={styles.typeText}>
              {habit.type === 'time_since' ? 'avoid' : 
               habit.type === 'count_based' ? 'count' :
               habit.type === 'time_based' ? 'time' : 'binary'}
            </Text>
          </View>
        </View>
        
        <HabitStats habit={habit} currentStreak={currentStreak} />
      </View>

      <View style={styles.calendarSection}>
        <Text style={styles.calendarTitle}>Last 7 days</Text>
        <View style={styles.daysContainer}>
          {last7Days.map((date, index) => (
            <DayCircle
              key={index}
              date={date}
              event={getEventForDate(date)}
              onPress={(date) => onDayPress(date, habit)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
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
  typeIndicator: {
    backgroundColor: Colors.primary[100],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  typeText: {
    ...Typography.caption,
    color: Colors.primary[700],
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  calendarSection: {
    marginTop: Spacing.sm,
  },
  calendarTitle: {
    ...Typography.bodySmall,
    color: Colors.neutral[600],
    marginBottom: Spacing.sm,
    fontWeight: '500',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});