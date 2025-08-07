import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../lib/design-system';
import { Habit, HabitEvent } from '../../types/habits';
import { formatTime } from '../../utils/habitUtils';

interface DayCircleProps {
  date: Date;
  event?: HabitEvent;
  habit: Habit;
  onPress: (date: Date) => void;
}

export default function DayCircle({ date, event, habit, onPress }: DayCircleProps) {
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
        return Colors.neutral[400];
      default:
        return Colors.neutral[200];
    }
  };

  const getCircleBorderColor = (): string => {
    if (!event) return Colors.neutral[300];
    
    switch (event.status) {
      case 'completed':
        return Colors.success[600];
      case 'failed':
        return Colors.alert[600];
      case 'skipped':
        return Colors.neutral[500];
      default:
        return Colors.neutral[300];
    }
  };

  const getTextColor = (): string => {
    if (!event || event.status === 'not_marked') return Colors.neutral[600];
    return Colors.neutral[50];
  };

  const getValueBackgroundColor = (): string => {
    if (!event) return Colors.neutral[100];
    
    switch (event.status) {
      case 'completed':
        return Colors.success[100];
      case 'failed':
        return Colors.alert[100];
      case 'skipped':
        return Colors.neutral[200];
      default:
        return Colors.neutral[100];
    }
  };

  const getValueBorderColor = (): string => {
    if (!event) return Colors.neutral[200];
    
    switch (event.status) {
      case 'completed':
        return Colors.success[300];
      case 'failed':
        return Colors.alert[300];
      case 'skipped':
        return Colors.neutral[300];
      default:
        return Colors.neutral[200];
    }
  };

  const getValueTextColor = (): string => {
    if (!event) return Colors.neutral[700];
    
    switch (event.status) {
      case 'completed':
        return Colors.success[700];
      case 'failed':
        return Colors.alert[700];
      case 'skipped':
        return Colors.neutral[600];
      default:
        return Colors.neutral[700];
    }
  };

  const getValueText = (): { main: string; suffix?: string } | null => {
    // For time-based habits, show the actual time if available
    if (habit.type === 'time_based' && event?.value !== undefined) {
      if (habit.comparison_type === 'time_of_day') {
        // Wake-up time: show time with AM suffix (KEEP THE DIFFERENTIATION!)
        const timeStr = formatTime(event.value);
        return { main: timeStr, suffix: 'AM' };
      } else {
        // Duration: show as hours and minutes (KEEP THE h/m FORMAT!)
        const hours = Math.floor(event.value);
        const minutes = Math.round((event.value - hours) * 60);
        if (hours === 0) {
          return { main: `${minutes}m` };
        } else if (minutes === 0) {
          return { main: `${hours}h` };
        } else {
          return { main: `${hours}h ${minutes}m` };
        }
      }
    }
    
    // For count-based habits, show the count
    if (habit.type === 'count_based' && event?.value !== undefined) {
      return { main: `${event.value}` };
    }
    
    return null;
  };

  const valueText = getValueText();

  return (
    <View style={styles.dayContainer}>
      <TouchableOpacity 
        style={[
          styles.container, 
          { 
            backgroundColor: getStatusColor(),
            borderColor: getCircleBorderColor()
          }
        ]}
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
      
      {valueText ? (
        <View style={[
          styles.valueContainer,
          { 
            backgroundColor: getValueBackgroundColor(),
            borderColor: getValueBorderColor()
          }
        ]}>
          <View style={styles.valueTextContainer}>
            <Text style={[
              styles.valueText,
              { color: getValueTextColor() }
            ]}>
              {valueText.main}
            </Text>
            {valueText.suffix && (
              <Text style={[
                styles.suffixText,
                { color: getValueTextColor() }
              ]}>
                {valueText.suffix}
              </Text>
            )}
          </View>
        </View>
      ) : habit.type !== 'time_since' ? (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>—</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  dayContainer: {
    alignItems: 'center',
    flex: 1, // Allow equal distribution of space
  },
  container: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
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
    marginTop: -1,
  },
  valueContainer: {
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginTop: 6,
    borderWidth: 0.5,
    minWidth: 32,
    maxWidth: 55, // Allow more width for "1h 18m" and "6:54 AM"
  },
  valueTextContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  valueText: {
    ...Typography.caption,
    fontSize: 9, // Smaller font to fit better
    fontWeight: '600',
    textAlign: 'center',
  },
  suffixText: {
    ...Typography.caption,
    fontSize: 7, // Very small AM suffix
    fontWeight: '500',
    textAlign: 'center',
    marginLeft: 1,
    opacity: 0.8,
  },
  placeholderContainer: {
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
    minWidth: 42,
    backgroundColor: 'transparent',
  },
  placeholderText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '400',
    textAlign: 'center',
    color: Colors.neutral[400],
  },
  spacer: {
    height: 20, // Match the height of valueContainer + margins
    marginTop: 6,
  },
});