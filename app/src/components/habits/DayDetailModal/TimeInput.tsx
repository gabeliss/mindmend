import React from 'react';
import { View, TouchableOpacity, Text, TextInput, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
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
const SliderComponent = Slider as any;

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

interface DurationSteppersProps {
  timeValue: string;
  onTimeChange: (text: string) => void;
}

function DurationSteppers({ timeValue, onTimeChange }: DurationSteppersProps) {
  // Parse current values from timeValue string
  const parseCurrentValues = () => {
    if (!timeValue) return { hours: 0, minutes: 0 };
    
    const hourMatch = timeValue.match(/(\d+)h/);
    const minMatch = timeValue.match(/(\d+)m/);
    
    const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
    const minutes = minMatch ? parseInt(minMatch[1]) : 0;
    
    return { hours, minutes };
  };

  const { hours, minutes } = parseCurrentValues();

  const updateTime = (newHours: number, newMinutes: number) => {
    let formattedTime = '';
    if (newHours > 0 && newMinutes > 0) {
      formattedTime = `${newHours}h ${newMinutes}m`;
    } else if (newHours > 0) {
      formattedTime = `${newHours}h`;
    } else if (newMinutes > 0) {
      formattedTime = `${newMinutes}m`;
    }
    onTimeChange(formattedTime);
  };

  const adjustHours = (delta: number) => {
    const newHours = Math.max(0, Math.min(23, hours + delta));
    updateTime(newHours, minutes);
  };

  const handleMinuteSliderChange = (value: number) => {
    const newMinutes = Math.round(value);
    updateTime(hours, newMinutes);
  };

  return (
    <View style={styles.durationContainer}>
      <View style={styles.stepperGroup}>
        <Text style={styles.stepperLabel}>hrs</Text>
        <View style={styles.stepperControl}>
          <TouchableOpacity 
            style={styles.stepperButton}
            onPress={() => adjustHours(1)}
          >
            <FontAwesomeIcon name="chevron-up" size={14} color={Colors.primary[500]} />
          </TouchableOpacity>
          <Text style={styles.stepperValue}>{hours}</Text>
          <TouchableOpacity 
            style={styles.stepperButton}
            onPress={() => adjustHours(-1)}
          >
            <FontAwesomeIcon name="chevron-down" size={14} color={Colors.primary[500]} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.sliderGroup}>
        <Text style={styles.stepperLabel}>min</Text>
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderValue}>{minutes}</Text>
          <SliderComponent
            style={styles.slider}
            minimumValue={0}
            maximumValue={59}
            value={minutes}
            onValueChange={handleMinuteSliderChange}
            minimumTrackTintColor={Colors.primary[500]}
            maximumTrackTintColor={Colors.neutral[300]}
            thumbStyle={styles.sliderThumb}
            step={1}
          />
        </View>
      </View>
    </View>
  );
}

interface QuantitySteppersProps {
  timeValue: string;
  unit: string;
  onTimeChange: (text: string) => void;
}

function QuantitySteppers({ timeValue, unit, onTimeChange }: QuantitySteppersProps) {
  // Parse current value from timeValue string
  const parseCurrentValue = () => {
    if (!timeValue || timeValue.trim() === '') return 0;
    const numericMatch = timeValue.match(/(\d+(?:\.\d+)?)/);
    return numericMatch ? parseFloat(numericMatch[1]) : 0;
  };

  const currentValue = parseCurrentValue();

  const updateValue = (newValue: number) => {
    const formattedValue = newValue % 1 === 0 ? newValue.toString() : newValue.toFixed(1);
    onTimeChange(formattedValue);
  };

  const adjustValue = (delta: number) => {
    const step = delta > 0 ? 1 : -1;
    const newValue = Math.max(0, currentValue + step);
    updateValue(newValue);
  };

  const handleSliderChange = (value: number) => {
    updateValue(Math.round(value));
  };

  // Determine max value for slider based on goal or reasonable defaults
  const getMaxValue = () => {
    const currentMax = Math.max(currentValue, 50);
    return Math.min(currentMax * 2, 500); // Cap at 500 for performance
  };

  return (
    <View style={styles.quantityContainer}>
      <View style={styles.quantityStepperGroup}>
        <View style={styles.stepperControl}>
          <TouchableOpacity 
            style={styles.stepperButton}
            onPress={() => adjustValue(1)}
          >
            <FontAwesomeIcon name="chevron-up" size={14} color={Colors.primary[500]} />
          </TouchableOpacity>
          <Text style={styles.quantityValue}>{currentValue}</Text>
          <TouchableOpacity 
            style={styles.stepperButton}
            onPress={() => adjustValue(-1)}
          >
            <FontAwesomeIcon name="chevron-down" size={14} color={Colors.primary[500]} />
          </TouchableOpacity>
        </View>
        <Text style={styles.quantityUnit}>{unit}</Text>
      </View>
      
      <View style={styles.quantitySliderGroup}>
        <SliderComponent
          style={styles.slider}
          minimumValue={0}
          maximumValue={getMaxValue()}
          value={currentValue}
          onValueChange={handleSliderChange}
          minimumTrackTintColor={Colors.primary[500]}
          maximumTrackTintColor={Colors.neutral[300]}
          thumbStyle={styles.sliderThumb}
          step={1}
        />
      </View>
    </View>
  );
}

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
        <DurationSteppers
          timeValue={timeValue}
          onTimeChange={onTimeChange}
        />
      ) : habit.type === 'quantity' && habit.unit ? (
        <QuantitySteppers
          timeValue={timeValue}
          unit={habit.unit}
          onTimeChange={onTimeChange}
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