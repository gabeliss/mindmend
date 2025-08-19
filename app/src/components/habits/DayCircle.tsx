import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../lib/design-system';
import { Habit, HabitEvent } from '../../types/habits';

interface DayCircleProps {
  date: Date;
  event?: HabitEvent;
  habit: Habit;
  onPress: (date: Date) => void;
  size?: 'default' | 'small';
  isToday?: boolean;
  hideWeekday?: boolean;
  disabled?: boolean;
}

const getAbbreviatedUnit = (unit: string): string => {
  const abbreviations: { [key: string]: string } = {
    'pages': 'pgs',
    'minutes': 'min',
    'hours': 'hrs',
    'steps': 'st',
    'glasses': 'gl',
    'cups': 'cp',
    'times': 'x',
    'reps': 'reps',
    'sets': 'sets',
    'miles': 'mi',
    'kilometers': 'km',
    'pounds': 'lbs',
    'kilograms': 'kg',
  };
  
  return abbreviations[unit.toLowerCase()] || (unit.length > 4 ? unit.slice(0, 3) : unit);
};

export default function DayCircle({ date, event, habit, onPress, size = 'default', isToday = false, hideWeekday = false, disabled = false }: DayCircleProps) {
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
  const dayOfMonth = date.getDate();
  
  const getStatusColor = (): string => {
    if (disabled) return Colors.neutral[100];
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
    // Today gets a distinct blue border regardless of status
    if (isToday && !disabled) return Colors.primary[600];
    
    if (disabled) return Colors.neutral[200];
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

  const getBorderWidth = (): number => {
    // Today gets a much thicker border
    if (isToday) return size === 'small' ? 3 : 4;
    return size === 'small' ? 1.2 : 1.5;
  };

  const getTextColor = (): string => {
    if (disabled) return Colors.neutral[400];
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
    if (!event?.value) return null;
    
    // For schedule habits, show the actual time
    if (habit.type === 'schedule') {
      const hours = Math.floor(event.value);
      const minutes = Math.round((event.value - hours) * 60);
      
      // Convert to 12-hour format
      const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const timeStr = minutes === 0 ? `${hour12}:00` : `${hour12}:${minutes.toString().padStart(2, '0')}`;
      
      return { main: timeStr, suffix: ampm };
    }
    
    // For duration habits, show as hours and minutes (always decimal hours)
    if (habit.type === 'duration') {
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
    
    // For quantity habits, show the count with abbreviated unit if available
    if (habit.type === 'quantity') {
      const unit = habit.unit ? ` ${getAbbreviatedUnit(habit.unit)}` : '';
      return { main: `${event.value}${unit}` };
    }
    
    return null;
  };

  const valueText = getValueText();
  const isSmall = size === 'small';

  return (
    <View style={styles.dayContainer}>
      {isToday && (
        <View style={[
          styles.todayIndicator,
          isSmall && styles.todayIndicatorSmall
        ]} />
      )}
      <TouchableOpacity 
        style={[
          styles.container,
          isSmall && styles.containerSmall,
          disabled && styles.containerDisabled,
          { 
            backgroundColor: getStatusColor(),
            borderColor: getCircleBorderColor(),
            borderWidth: getBorderWidth()
          }
        ]}
        onPress={disabled ? undefined : () => onPress(date)}
        activeOpacity={disabled ? 1 : 0.7}
        disabled={disabled}
      >
        {!hideWeekday && (
          <Text style={[
            styles.dayOfWeek, 
            isSmall && styles.dayOfWeekSmall,
            { color: getTextColor() }
          ]}>
            {dayOfWeek}
          </Text>
        )}
        <Text style={[
          styles.dayOfMonth, 
          isSmall && styles.dayOfMonthSmall,
          hideWeekday && styles.dayOfMonthCentered,
          { color: getTextColor() }
        ]}>
          {dayOfMonth}
        </Text>
      </TouchableOpacity>
      
      {!disabled && valueText ? (
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
      ) : habit.type !== 'avoidance' && habit.type !== 'simple' ? (
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
  containerSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.2,
  },
  todayIndicator: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary[100],
    borderWidth: 2,
    borderColor: Colors.primary[600],
    top: -4,
    left: '50%',
    marginLeft: -26,
    zIndex: -1,
  },
  todayIndicatorSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    top: -4,
    marginLeft: -22,
  },
  containerDisabled: {
    opacity: 0.5,
  },
  dayOfWeek: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  dayOfWeekSmall: {
    fontSize: 8,
  },
  dayOfMonth: {
    ...Typography.caption,
    fontSize: 14,
    fontWeight: '600',
    marginTop: -1,
  },
  dayOfMonthSmall: {
    fontSize: 12,
  },
  dayOfMonthCentered: {
    fontSize: 16,
    marginTop: 0,
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