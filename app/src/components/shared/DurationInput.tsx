import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { FontAwesome } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../lib/design-system';

// Type assertion to fix TypeScript compatibility  
const FontAwesomeIcon = FontAwesome as any;
const SliderComponent = Slider as any;

interface DurationInputProps {
  value: string; // Format: "1h 30m" or "30m" or "2h"
  onChange: (value: string) => void;
  maxHours?: number;
  disabled?: boolean;
}

export default function DurationInput({ 
  value, 
  onChange, 
  maxHours = 23,
  disabled = false 
}: DurationInputProps) {
  // Parse current values from value string
  const parseCurrentValues = () => {
    if (!value) return { hours: 0, minutes: 0 };
    
    const hourMatch = value.match(/(\d+)h/);
    const minMatch = value.match(/(\d+)m/);
    
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
    onChange(formattedTime);
  };

  const adjustHours = (delta: number) => {
    const newHours = Math.max(0, Math.min(maxHours, hours + delta));
    updateTime(newHours, minutes);
  };

  const handleMinuteSliderChange = (value: number) => {
    const newMinutes = Math.round(value);
    updateTime(hours, newMinutes);
  };

  return (
    <View style={[styles.container, disabled && styles.containerDisabled]}>
      <View style={styles.stepperGroup}>
        <Text style={styles.stepperLabel}>hrs</Text>
        <View style={[styles.stepperControl, disabled && styles.stepperControlDisabled]}>
          <TouchableOpacity 
            style={styles.stepperButton}
            onPress={() => adjustHours(1)}
            disabled={disabled}
          >
            <FontAwesomeIcon 
              name="chevron-up" 
              size={14} 
              color={disabled ? Colors.neutral[400] : Colors.primary[500]} 
            />
          </TouchableOpacity>
          <Text style={[styles.stepperValue, disabled && styles.stepperValueDisabled]}>
            {hours}
          </Text>
          <TouchableOpacity 
            style={styles.stepperButton}
            onPress={() => adjustHours(-1)}
            disabled={disabled}
          >
            <FontAwesomeIcon 
              name="chevron-down" 
              size={14} 
              color={disabled ? Colors.neutral[400] : Colors.primary[500]} 
            />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.sliderGroup}>
        <Text style={styles.stepperLabel}>min</Text>
        <View style={[styles.sliderContainer, disabled && styles.sliderContainerDisabled]}>
          <Text style={[styles.sliderValue, disabled && styles.sliderValueDisabled]}>
            {minutes}
          </Text>
          <SliderComponent
            style={styles.slider}
            minimumValue={0}
            maximumValue={59}
            value={minutes}
            onValueChange={handleMinuteSliderChange}
            minimumTrackTintColor={disabled ? Colors.neutral[300] : Colors.primary[500]}
            maximumTrackTintColor={Colors.neutral[300]}
            thumbStyle={[
              styles.sliderThumb,
              disabled && styles.sliderThumbDisabled
            ]}
            step={1}
            disabled={disabled}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.lg,
  },
  containerDisabled: {
    opacity: 0.6,
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
  stepperControlDisabled: {
    backgroundColor: Colors.neutral[200],
    borderColor: Colors.neutral[300],
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
  stepperValueDisabled: {
    color: Colors.neutral[500],
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
  sliderContainerDisabled: {
    backgroundColor: Colors.neutral[200],
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral[700],
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  sliderValueDisabled: {
    color: Colors.neutral[500],
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
  sliderThumbDisabled: {
    backgroundColor: Colors.neutral[400],
  },
});