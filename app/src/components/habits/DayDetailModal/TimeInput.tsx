import React from 'react';
import { View, TouchableOpacity, Text, TextInput, StyleSheet } from 'react-native';
import { Platform } from 'expo-modules-core';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { FontAwesome } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../../lib/design-system';
import { Habit } from '../../../types/habits';
import { shouldShowTimeInput, getTimeInputLabel, getTimeInputPlaceholder, getGoalDescription } from '../../../utils/habitValidationUtils';
import { HabitStatus } from '../../../utils/habitStatusUtils';
import { getSmartMaxValue } from '../../../utils/habitInputUtils';
import QuantityInput from '../../shared/QuantityInput';
import DurationInput from '../../shared/DurationInput';

// Type assertion to fix TypeScript compatibility  
const DateTimePickerComponent = DateTimePicker as any;
const FontAwesomeIcon = FontAwesome as any;

const formatTimeWithAMPM = (date: Date): string => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'pm' : 'am';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  
  if (minutes === 0) {
    return `${displayHours}:00 ${period}`;
  }
  
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

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
  if (!shouldShowTimeInput(status, habit)) {
    return null;
  }

  const goalDescription = getGoalDescription(habit, date);
  const inputLabel = getTimeInputLabel(habit, goalDescription);
  const placeholder = getTimeInputPlaceholder(habit);

  return (
    <View style={styles.timeSection}>
      <Text style={styles.sectionLabel}>{inputLabel}</Text>
      
      {habit.type === 'schedule' ? (
        <View style={styles.timePickerContainer}>
          <TouchableOpacity 
            style={styles.timePickerButton}
            onPress={onShowTimePicker}
          >
            <Text style={styles.timePickerButtonText}>
              {formatTimeWithAMPM(selectedTime)}
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
      ) : habit.type === 'duration' ? (
        <DurationInput
          value={timeValue}
          onChange={onTimeChange}
          maxHours={12}
        />
      ) : habit.type === 'quantity' && habit.unit ? (
        <QuantityInput
          value={timeValue}
          unit={habit.unit}
          onChange={onTimeChange}
          maxValue={getSmartMaxValue(habit.unit)}
          allowDecimals={false}
        />
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
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.lg,
  },
  stepperGroup: {
    alignItems: 'center',
  },
  stepperLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.neutral[600],
    marginBottom: Spacing.xs,
  },
  stepperControl: {
    backgroundColor: Colors.neutral[100],
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    minWidth: 60,
  },
  stepperButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral[700],
    textAlign: 'center',
    minWidth: 30,
    paddingVertical: Spacing.xs,
  },
  sliderGroup: {
    flex: 1,
    alignItems: 'center',
  },
  sliderContainer: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: Colors.neutral[100],
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral[700],
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    backgroundColor: Colors.primary[500],
    width: 20,
    height: 20,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  quantityStepperGroup: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral[700],
    textAlign: 'center',
    minWidth: 40,
    paddingVertical: Spacing.xs,
  },
  quantityUnit: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.neutral[600],
    minWidth: 50,
  },
  quantitySliderGroup: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
});