import React from 'react';
import { View, TouchableOpacity, Text, TextInput, StyleSheet } from 'react-native';
import { Platform } from 'expo-modules-core';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { FontAwesome } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../../lib/design-system';
import { Habit } from '../../../types/habits';
import { formatTime } from '../../../utils/habitUtils';
import { shouldShowTimeInput, getTimeInputLabel, getTimeInputPlaceholder, getGoalDescription } from '../../../utils/habitValidationUtils';
import { HabitStatus } from '../../../utils/habitStatusUtils';

// Type assertion to fix TypeScript compatibility  
const DateTimePickerComponent = DateTimePicker as any;
const FontAwesomeIcon = FontAwesome as any;

interface TimeInputSectionProps {
  habit: Habit;
  date: Date;
  status: HabitStatus;
  timeValue: string;
  selectedTime: Date;
  showTimePicker: boolean;
  onTimeChange: (text: string) => void;
  onTimePickerChange: (event: DateTimePickerEvent, selectedDate?: Date) => void;
  onShowTimePicker: () => void;
}

export default function TimeInput({
  habit,
  date,
  status,
  timeValue,
  selectedTime,
  showTimePicker,
  onTimeChange,
  onTimePickerChange,
  onShowTimePicker,
}: TimeInputSectionProps) {
  if (!shouldShowTimeInput(status)) {
    return null;
  }

  const goalDescription = getGoalDescription(habit, date);
  const inputLabel = getTimeInputLabel(habit, goalDescription);
  const placeholder = getTimeInputPlaceholder(habit);

  return (
    <View style={styles.timeSection}>
      <Text style={styles.sectionLabel}>{inputLabel}</Text>
      
      {habit.type === 'time_based' && habit.comparison_type === 'time_of_day' ? (
        <View style={styles.timePickerContainer}>
          <TouchableOpacity 
            style={styles.timePickerButton}
            onPress={onShowTimePicker}
          >
            <Text style={styles.timePickerButtonText}>
              {formatTime(selectedTime.getHours() + selectedTime.getMinutes() / 60)}
            </Text>
            <FontAwesomeIcon 
              name="clock-o" 
              size={16} 
              color={Colors.primary[500]} 
              style={styles.timePickerIcon}
            />
          </TouchableOpacity>
          
          {showTimePicker && (
            <DateTimePickerComponent
              value={selectedTime}
              mode="time"
              is24Hour={false}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onTimePickerChange}
              style={styles.timePicker}
            />
          )}
        </View>
      ) : (
        <TextInput
          style={styles.timeInput}
          value={timeValue}
          onChangeText={onTimeChange}
          placeholder={placeholder}
          placeholderTextColor={Colors.neutral[400]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  timeSection: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.neutral[700],
    marginBottom: Spacing.sm,
  },
  timeInput: {
    backgroundColor: Colors.neutral[100],
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: BorderRadius.sm,
    paddingVertical: 0,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
    alignSelf: 'flex-start',
    minWidth: 80,
    maxWidth: 120,
    height: 40,
    textAlignVertical: 'center',
  },
  timePickerContainer: {
    alignItems: 'flex-start',
  },
  timePickerButton: {
    backgroundColor: Colors.neutral[100],
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    height: 40,
  },
  timePickerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral[700],
    textAlign: 'center',
  },
  timePickerIcon: {
    marginLeft: Spacing.xs,
  },
  timePicker: {
    width: '100%',
    marginTop: Spacing.sm,
  },
});