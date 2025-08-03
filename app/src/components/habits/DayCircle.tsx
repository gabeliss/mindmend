import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../lib/design-system';
import { HabitEvent } from '../../types/habits';

interface DayCircleProps {
  date: Date;
  event?: HabitEvent;
  onPress: (date: Date) => void;
}

export default function DayCircle({ date, event, onPress }: DayCircleProps) {
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
  const dayOfMonth = date.getDate();
  
  const getStatusColor = (): string => {
    if (!event) return Colors.neutral[200];
    
    switch (event.status) {
      case 'completed':
        return Colors.success[500];
      case 'failed':
        return Colors.alert[500];
      case 'skipped':
        return Colors.warning[500];
      default:
        return Colors.neutral[200];
    }
  };

  const getTextColor = (): string => {
    if (!event || event.status === 'not_marked') return Colors.neutral[600];
    return Colors.neutral[50];
  };

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: getStatusColor() }]}
      onPress={() => onPress(date)}
      activeOpacity={0.7}
    >
      <Text style={[styles.dayOfWeek, { color: getTextColor() }]}>
        {dayOfWeek}
      </Text>
      <Text style={[styles.dayOfMonth, { color: getTextColor() }]}>
        {dayOfMonth}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayOfWeek: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  dayOfMonth: {
    ...Typography.caption,
    fontSize: 14,
    fontWeight: '600',
    marginTop: -2,
  },
});