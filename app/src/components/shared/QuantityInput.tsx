import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { FontAwesome } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../lib/design-system';
import { getSmartMaxValue } from '../../utils/habitInputUtils';

// Type assertion to fix TypeScript compatibility  
const FontAwesomeIcon = FontAwesome as any;
const SliderComponent = Slider as any;

interface QuantityInputProps {
  value: string; // Numeric string value (e.g., "10", "5.5")
  unit: string; // Unit text (e.g., "pages", "glasses", "reps")
  onChange: (value: string) => void;
  maxValue?: number;
  step?: number;
  allowDecimals?: boolean;
  disabled?: boolean;
}

export default function QuantityInput({ 
  value, 
  unit, 
  onChange, 
  maxValue,
  step = 1,
  allowDecimals = false,
  disabled = false 
}: QuantityInputProps) {
  // Parse current value from value string
  const parseCurrentValue = () => {
    if (!value || value.trim() === '') return 0;
    const numericMatch = value.match(/(\d+(?:\.\d+)?)/);
    return numericMatch ? parseFloat(numericMatch[1]) : 0;
  };

  const currentValue = parseCurrentValue();

  const updateValue = (newValue: number) => {
    const formattedValue = allowDecimals && newValue % 1 !== 0 
      ? newValue.toFixed(1) 
      : newValue.toString();
    onChange(formattedValue);
  };

  const adjustValue = (delta: number) => {
    const stepSize = delta > 0 ? step : -step;
    const newValue = Math.max(0, currentValue + stepSize);
    updateValue(newValue);
  };

  const handleSliderChange = (value: number) => {
    const adjustedValue = allowDecimals ? value : Math.round(value);
    updateValue(adjustedValue);
  };

  // Determine max value for slider based on goal or reasonable defaults
  const getMaxValue = () => {
    if (maxValue) return maxValue;
    // Use smart max value based on unit type, or fall back to current value * 2
    const smartMax = getSmartMaxValue(unit);
    const currentMax = Math.max(currentValue, 50);
    return Math.max(smartMax, currentMax * 2);
  };

  const displayValue = allowDecimals && currentValue % 1 !== 0 
    ? currentValue.toFixed(1) 
    : currentValue.toString();

  return (
    <View style={[styles.container, disabled && styles.containerDisabled]}>
      <View style={styles.stepperGroup}>
        <View style={[styles.stepperControl, disabled && styles.stepperControlDisabled]}>
          <TouchableOpacity 
            style={styles.stepperButton}
            onPress={() => adjustValue(1)}
            disabled={disabled}
          >
            <FontAwesomeIcon 
              name="chevron-up" 
              size={14} 
              color={disabled ? Colors.neutral[400] : Colors.primary[500]} 
            />
          </TouchableOpacity>
          <Text style={[styles.stepperValue, disabled && styles.stepperValueDisabled]}>
            {displayValue}
          </Text>
          <TouchableOpacity 
            style={styles.stepperButton}
            onPress={() => adjustValue(-1)}
            disabled={disabled}
          >
            <FontAwesomeIcon 
              name="chevron-down" 
              size={14} 
              color={disabled ? Colors.neutral[400] : Colors.primary[500]} 
            />
          </TouchableOpacity>
        </View>
        <Text style={[styles.unitText, disabled && styles.unitTextDisabled]}>
          {unit}
        </Text>
      </View>
      
      <View style={styles.sliderGroup}>
        <SliderComponent
          style={styles.slider}
          minimumValue={0}
          maximumValue={getMaxValue()}
          value={currentValue}
          onValueChange={handleSliderChange}
          minimumTrackTintColor={disabled ? Colors.neutral[300] : Colors.primary[500]}
          maximumTrackTintColor={Colors.neutral[300]}
          thumbStyle={[
            styles.sliderThumb,
            disabled && styles.sliderThumbDisabled
          ]}
          step={allowDecimals ? 0.1 : 1}
          disabled={disabled}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  containerDisabled: {
    opacity: 0.6,
  },
  stepperGroup: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
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
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral[700],
    textAlign: 'center',
    minWidth: 40,
    paddingVertical: Spacing.xs,
  },
  stepperValueDisabled: {
    color: Colors.neutral[500],
  },
  unitText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.neutral[600],
    minWidth: 50,
  },
  unitTextDisabled: {
    color: Colors.neutral[500],
  },
  sliderGroup: {
    flex: 1,
    marginLeft: Spacing.sm,
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