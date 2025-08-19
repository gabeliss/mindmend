import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { FontAwesome } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../lib/design-system';

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

interface TimePickerInputProps {
  value: Date; // Current selected time
  onChange: (time: Date) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function TimePickerInput({ 
  value, 
  onChange, 
  disabled = false,
  placeholder = "Select time"
}: TimePickerInputProps) {
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleTimePickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    // On Android, close the picker first
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  const showTimePickerModal = () => {
    if (!disabled) {
      setShowTimePicker(true);
    }
  };

  // For iOS, we hide the picker when it's dismissed
  const handlePickerDismiss = () => {
    if (Platform.OS === 'ios') {
      setShowTimePicker(false);
    }
  };

  return (
    <View style={[styles.container, disabled && styles.containerDisabled]}>
      <TouchableOpacity 
        style={[
          styles.timePickerButton,
          disabled && styles.timePickerButtonDisabled
        ]}
        onPress={showTimePickerModal}
        disabled={disabled}
      >
        <Text style={[
          styles.timePickerButtonText,
          disabled && styles.timePickerButtonTextDisabled
        ]}>
          {value ? formatTimeWithAMPM(value) : placeholder}
        </Text>
        <FontAwesomeIcon 
          name="clock-o" 
          size={16} 
          color={disabled ? Colors.neutral[400] : Colors.primary[500]} 
          style={styles.timePickerIcon}
        />
      </TouchableOpacity>
      
      {showTimePicker && (
        <View style={styles.timePickerContainer}>
          <DateTimePickerComponent
            value={value || new Date()}
            mode="time"
            is24Hour={false}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimePickerChange}
            style={styles.timePicker}
          />
          
          {/* iOS dismiss button */}
          {Platform.OS === 'ios' && (
            <TouchableOpacity 
              style={styles.dismissButton}
              onPress={handlePickerDismiss}
            >
              <Text style={styles.dismissButtonText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
  },
  containerDisabled: {
    opacity: 0.6,
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
  timePickerButtonDisabled: {
    backgroundColor: Colors.neutral[200],
    borderColor: Colors.neutral[300],
  },
  timePickerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral[700],
    textAlign: 'center',
  },
  timePickerButtonTextDisabled: {
    color: Colors.neutral[500],
  },
  timePickerIcon: {
    marginLeft: Spacing.xs,
  },
  timePickerContainer: {
    width: '100%',
    marginTop: Spacing.sm,
    alignItems: 'center',
  },
  timePicker: {
    width: '100%',
  },
  dismissButton: {
    backgroundColor: Colors.primary[600],
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
  dismissButtonText: {
    color: Colors.neutral[50],
    fontWeight: '600',
    fontSize: 16,
  },
});