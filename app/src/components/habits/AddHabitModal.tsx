import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, Spacing, BorderRadius } from '../../lib/design-system';
import { Habit } from '../../types/habits';
import DurationInput from '../shared/DurationInput';
import QuantityInput from '../shared/QuantityInput';
import TimePickerInput from '../shared/TimePickerInput';
import { getSmartMaxValue } from '../../utils/habitInputUtils';

interface AddHabitModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (habit: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'archived'>) => void;
}

type HabitType = "simple" | "quantity" | "duration" | "schedule" | "avoidance";
type FrequencyType = "daily" | "weekly" | "specific_days";

interface HabitTypeOption {
  type: HabitType;
  title: string;
  description: string;
  icon: string;
  examples: string[];
  color: {
    light: string;
    medium: string;
    dark: string;
  };
}

const HABIT_TYPES: HabitTypeOption[] = [
  {
    type: "simple",
    title: "Simple Habit",
    description: "Track completion of basic habits",
    icon: "checkmark-circle",
    examples: ["Meditate", "Read before bed", "Make my bed", "Take vitamins"],
    color: {
      light: '#f0f9ff', // sky-50
      medium: '#e0f2fe', // sky-100
      dark: '#0284c7', // sky-600
    }
  },
  {
    type: "quantity",
    title: "Track Amounts",
    description: "Count specific quantities or amounts",
    icon: "stats-chart",
    examples: ["Read 20 pages", "Drink 8 glasses of water", "Do 50 pushups"],
    color: {
      light: '#f0fdf4', // green-50
      medium: '#dcfce7', // green-100
      dark: '#16a34a', // green-600
    }
  },
  {
    type: "duration",
    title: "Track Time",
    description: "Monitor time spent on activities",
    icon: "time",
    examples: ["Exercise for 30 minutes", "Practice piano for 1 hour", "Meditate for 10 minutes"],
    color: {
      light: '#fefce8', // yellow-50
      medium: '#fef3c7', // yellow-100
      dark: '#ca8a04', // yellow-600
    }
  },
  {
    type: "schedule",
    title: "Time-Based Goals",
    description: "Complete tasks by or after specific times",
    icon: "alarm",
    examples: ["Wake up by 7 AM", "Sleep by 10 PM", "Eat lunch after 12 PM"],
    color: {
      light: '#fdf2f8', // pink-50
      medium: '#fce7f3', // pink-100
      dark: '#dc2626', // red-600
    }
  },
  {
    type: "avoidance",
    title: "Break Bad Habits",
    description: "Avoid unwanted behaviors",
    icon: "close-circle",
    examples: ["No social media", "Avoid junk food", "Stop smoking", "No phone in bed"],
    color: {
      light: '#f3f4f6', // gray-100
      medium: '#e5e7eb', // gray-200
      dark: '#4b5563', // gray-600
    }
  }
];

const DAYS_OF_WEEK = [
  { key: 'Monday', label: 'Mon' },
  { key: 'Tuesday', label: 'Tue' },
  { key: 'Wednesday', label: 'Wed' },
  { key: 'Thursday', label: 'Thu' },
  { key: 'Friday', label: 'Fri' },
  { key: 'Saturday', label: 'Sat' },
  { key: 'Sunday', label: 'Sun' },
];

export default function AddHabitModal({ visible, onClose, onSave }: AddHabitModalProps) {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<HabitType | null>(null);
  const [habitName, setHabitName] = useState('');
  const [goalValue, setGoalValue] = useState('');
  const [unit, setUnit] = useState('');
  const [goalDirection, setGoalDirection] = useState<'at_least' | 'no_more_than' | 'by' | 'after'>('at_least');
  const [goalTime, setGoalTime] = useState('');
  const [goalTimeDate, setGoalTimeDate] = useState(new Date());
  const [frequencyType, setFrequencyType] = useState<FrequencyType>('daily');
  const [weeklyGoal, setWeeklyGoal] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [maxFailures, setMaxFailures] = useState('');
  const [failureWindow, setFailureWindow] = useState<'weekly' | 'monthly'>('weekly');


  const resetForm = () => {
    setStep(1);
    setSelectedType(null);
    setHabitName('');
    setGoalValue('');
    setUnit('');
    setGoalDirection('at_least');
    setGoalTime('');
    setGoalTimeDate(new Date());
    setFrequencyType('daily');
    setWeeklyGoal('');
    setSelectedDays([]);
    setMaxFailures('');
    setFailureWindow('weekly');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleNext = () => {
    if (step === 1 && !selectedType) {
      Alert.alert('Please select a habit type');
      return;
    }
    if (step === 2 && !habitName.trim()) {
      Alert.alert('Please enter a habit name');
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSave = () => {
    if (!selectedType || !habitName.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Validate based on habit type
    if (selectedType === 'duration' && !goalValue.trim()) {
      Alert.alert('Error', 'Please set a goal duration');
      return;
    }

    if (selectedType === 'quantity' && (!goalValue || parseFloat(goalValue) <= 0)) {
      Alert.alert('Error', 'Please set a goal amount');
      return;
    }

    if (selectedType === 'quantity' && !unit.trim()) {
      Alert.alert('Error', 'Please enter a unit (e.g., pages, glasses)');
      return;
    }

    if (selectedType === 'schedule' && !goalTime.trim()) {
      Alert.alert('Error', 'Please select a target time');
      return;
    }

    if (frequencyType === 'weekly' && (!weeklyGoal || parseInt(weeklyGoal) <= 0)) {
      Alert.alert('Error', 'Please enter a valid weekly goal');
      return;
    }

    if (frequencyType === 'specific_days' && selectedDays.length === 0) {
      Alert.alert('Error', 'Please select at least one day');
      return;
    }

    if (selectedType === 'avoidance' && (!maxFailures || parseInt(maxFailures) < 0)) {
      Alert.alert('Error', 'Please enter a valid failure tolerance');
      return;
    }

    // Build habit object
    const frequency: any = { type: frequencyType };
    if (frequencyType === 'weekly') {
      frequency.goal_per_week = parseInt(weeklyGoal);
    } else if (frequencyType === 'specific_days') {
      frequency.days_of_week = selectedDays;
    }

    const newHabit: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'archived'> = {
      name: habitName.trim(),
      type: selectedType,
      frequency,
    };

    // Add type-specific fields
    if (selectedType === 'duration') {
      // Convert duration string "1h 30m" to decimal hours
      const parseDurationToHours = (durationStr: string): number => {
        const hourMatch = durationStr.match(/(\d+)h/);
        const minMatch = durationStr.match(/(\d+)m/);
        const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
        const minutes = minMatch ? parseInt(minMatch[1]) : 0;
        return hours + (minutes / 60); // Store as decimal hours
      };
      
      newHabit.goal_value = parseDurationToHours(goalValue);
      newHabit.goal_direction = goalDirection;
      newHabit.unit = 'hours'; // Always use hours for consistency
    }

    if (selectedType === 'quantity') {
      newHabit.goal_value = parseFloat(goalValue);
      newHabit.goal_direction = goalDirection;
      newHabit.unit = unit.trim();
    }

    if (selectedType === 'schedule') {
      newHabit.goal_time = goalTime.trim();
      newHabit.goal_direction = goalDirection;
    }

    if (selectedType === 'avoidance') {
      newHabit.failure_tolerance = {
        window: failureWindow,
        max_failures: parseInt(maxFailures),
      };
    }

    onSave(newHabit);
    handleClose();
  };

  const renderHabitTypeSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What type of habit is this?</Text>
      <Text style={styles.stepDescription}>Choose the type that best fits your goal</Text>
      
      <ScrollView style={styles.typeList} showsVerticalScrollIndicator={false}>
        {HABIT_TYPES.map((habitType) => (
          <TouchableOpacity
            key={habitType.type}
            style={[
              styles.typeOption,
              { backgroundColor: selectedType === habitType.type ? habitType.color.medium : habitType.color.light },
              selectedType === habitType.type && { 
                borderColor: habitType.color.dark,
                borderWidth: 2
              }
            ]}
            onPress={() => setSelectedType(habitType.type)}
          >
            <View style={styles.typeHeader}>
              <Ionicons
                name={habitType.icon as any}
                size={24}
                color={selectedType === habitType.type ? habitType.color.dark : Colors.neutral[600]}
              />
              <View style={styles.typeInfo}>
                <Text style={[
                  styles.typeTitle,
                  selectedType === habitType.type && { color: habitType.color.dark }
                ]}>
                  {habitType.title}
                </Text>
                <Text style={styles.typeDescription}>{habitType.description}</Text>
              </View>
            </View>
            <View style={styles.typeExamples}>
              <Text style={styles.examplesLabel}>Examples:</Text>
              {habitType.examples.map((example, index) => (
                <Text key={index} style={styles.exampleText}>• {example}</Text>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderHabitDetails = () => {
    const selectedTypeInfo = HABIT_TYPES.find(t => t.type === selectedType);
    
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Set up your {selectedTypeInfo?.title}</Text>
        
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Habit Name *</Text>
          <TextInput
            style={styles.textInput}
            value={habitName}
            onChangeText={setHabitName}
            placeholder="e.g., Morning meditation, Read before bed"
            maxLength={50}
          />
        </View>

        {/* Duration specific fields */}
        {selectedType === 'duration' && (
          <>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Goal Duration *</Text>
              <DurationInput
                value={goalValue}
                onChange={setGoalValue}
                maxHours={12}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Goal Type</Text>
              <View style={styles.optionRow}>
                <TouchableOpacity
                  style={[styles.option, goalDirection === 'at_least' && styles.optionSelected]}
                  onPress={() => setGoalDirection('at_least')}
                >
                  <Text style={[styles.optionText, goalDirection === 'at_least' && styles.optionTextSelected]}>
                    At least
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.option, goalDirection === 'no_more_than' && styles.optionSelected]}
                  onPress={() => setGoalDirection('no_more_than')}
                >
                  <Text style={[styles.optionText, goalDirection === 'no_more_than' && styles.optionTextSelected]}>
                    No more than
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* Quantity specific fields */}
        {selectedType === 'quantity' && (
          <>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>
                Unit (e.g., pages, glasses, reps) *
              </Text>
              <TextInput
                style={styles.textInput}
                value={unit}
                onChangeText={setUnit}
                placeholder="pages"
                maxLength={20}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Goal Amount *</Text>
              <QuantityInput
                value={goalValue}
                unit={unit || 'units'}
                onChange={setGoalValue}
                maxValue={getSmartMaxValue(unit)}
                allowDecimals={false}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Goal Type</Text>
              <View style={styles.optionRow}>
                <TouchableOpacity
                  style={[styles.option, goalDirection === 'at_least' && styles.optionSelected]}
                  onPress={() => setGoalDirection('at_least')}
                >
                  <Text style={[styles.optionText, goalDirection === 'at_least' && styles.optionTextSelected]}>
                    At least
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.option, goalDirection === 'no_more_than' && styles.optionSelected]}
                  onPress={() => setGoalDirection('no_more_than')}
                >
                  <Text style={[styles.optionText, goalDirection === 'no_more_than' && styles.optionTextSelected]}>
                    No more than
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* Schedule specific fields */}
        {selectedType === 'schedule' && (
          <>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Target Time *</Text>
              <TimePickerInput
                value={goalTimeDate}
                onChange={(time) => {
                  setGoalTimeDate(time);
                  // Convert to time string format for validation
                  const hours = time.getHours();
                  const minutes = time.getMinutes();
                  const timeString = `${hours}:${minutes.toString().padStart(2, '0')}`;
                  setGoalTime(timeString);
                }}
                placeholder="Select target time"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Goal Type</Text>
              <View style={styles.optionRow}>
                <TouchableOpacity
                  style={[styles.option, goalDirection === 'by' && styles.optionSelected]}
                  onPress={() => setGoalDirection('by')}
                >
                  <Text style={[styles.optionText, goalDirection === 'by' && styles.optionTextSelected]}>
                    By (before)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.option, goalDirection === 'after' && styles.optionSelected]}
                  onPress={() => setGoalDirection('after')}
                >
                  <Text style={[styles.optionText, goalDirection === 'after' && styles.optionTextSelected]}>
                    After
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* Avoidance specific fields */}
        {selectedType === 'avoidance' && (
          <>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Failure Tolerance</Text>
              <Text style={styles.fieldHelp}>How many slips are acceptable?</Text>
              <View style={styles.row}>
                <TextInput
                  style={[styles.textInput, styles.smallInput]}
                  value={maxFailures}
                  onChangeText={setMaxFailures}
                  placeholder="0"
                  keyboardType="numeric"
                />
                <Text style={styles.rowText}>failures per</Text>
                <View style={styles.optionRow}>
                  <TouchableOpacity
                    style={[styles.option, failureWindow === 'weekly' && styles.optionSelected]}
                    onPress={() => setFailureWindow('weekly')}
                  >
                    <Text style={[styles.optionText, failureWindow === 'weekly' && styles.optionTextSelected]}>
                      week
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.option, failureWindow === 'monthly' && styles.optionSelected]}
                    onPress={() => setFailureWindow('monthly')}
                  >
                    <Text style={[styles.optionText, failureWindow === 'monthly' && styles.optionTextSelected]}>
                      month
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </>
        )}
      </View>
    );
  };

  const renderFrequencySelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>How often?</Text>
      <Text style={styles.stepDescription}>Set your habit frequency</Text>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Frequency Type</Text>
        <View style={styles.optionColumn}>
          <TouchableOpacity
            style={[styles.frequencyOption, frequencyType === 'daily' && styles.optionSelected]}
            onPress={() => setFrequencyType('daily')}
          >
            <Text style={[styles.optionText, frequencyType === 'daily' && styles.optionTextSelected]}>
              Every day
            </Text>
            <Text style={styles.frequencyDescription}>Build a consistent daily habit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.frequencyOption, frequencyType === 'weekly' && styles.optionSelected]}
            onPress={() => setFrequencyType('weekly')}
          >
            <Text style={[styles.optionText, frequencyType === 'weekly' && styles.optionTextSelected]}>
              X times per week
            </Text>
            <Text style={styles.frequencyDescription}>Flexible weekly target</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.frequencyOption, frequencyType === 'specific_days' && styles.optionSelected]}
            onPress={() => setFrequencyType('specific_days')}
          >
            <Text style={[styles.optionText, frequencyType === 'specific_days' && styles.optionTextSelected]}>
              Specific days
            </Text>
            <Text style={styles.frequencyDescription}>Choose which days of the week</Text>
          </TouchableOpacity>
        </View>
      </View>

      {frequencyType === 'weekly' && (
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Weekly Goal *</Text>
          <TextInput
            style={styles.textInput}
            value={weeklyGoal}
            onChangeText={setWeeklyGoal}
            placeholder="e.g., 3, 5"
            keyboardType="numeric"
          />
        </View>
      )}

      {frequencyType === 'specific_days' && (
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Select Days *</Text>
          <View style={styles.daysGrid}>
            {DAYS_OF_WEEK.map((day) => (
              <TouchableOpacity
                key={day.key}
                style={[
                  styles.dayOption,
                  selectedDays.includes(day.key) && styles.optionSelected
                ]}
                onPress={() => {
                  if (selectedDays.includes(day.key)) {
                    setSelectedDays(selectedDays.filter(d => d !== day.key));
                  } else {
                    setSelectedDays([...selectedDays, day.key]);
                  }
                }}
              >
                <Text style={[
                  styles.dayText,
                  selectedDays.includes(day.key) && styles.optionTextSelected
                ]}>
                  {day.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  const totalSteps = 3;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color={Colors.neutral[600]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add New Habit</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(step / totalSteps) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>Step {step} of {totalSteps}</Text>
        </View>

        <View style={styles.keyboardAvoidingContainer}>
          <ScrollView 
            style={styles.content} 
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {step === 1 && renderHabitTypeSelection()}
            {step === 2 && renderHabitDetails()}
            {step === 3 && renderFrequencySelection()}
          </ScrollView>

          <SafeAreaViewContext edges={['bottom']}>
            <View style={styles.footer}>
              {step > 1 && (
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              )}
              
              {step < totalSteps ? (
                <TouchableOpacity 
                  style={[styles.nextButton, (!selectedType && step === 1) && styles.nextButtonDisabled]} 
                  onPress={handleNext}
                  disabled={!selectedType && step === 1}
                >
                  <Text style={styles.nextButtonText}>Next</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>Create Habit</Text>
                </TouchableOpacity>
              )}
            </View>
          </SafeAreaViewContext>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.neutral[50],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  closeButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.neutral[800],
  },
  headerSpacer: {
    width: 32,
  },
  progressContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.neutral[200],
    borderRadius: 2,
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary[600],
    borderRadius: 2,
  },
  progressText: {
    ...Typography.caption,
    color: Colors.neutral[600],
    textAlign: 'center',
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: Spacing.xl,
  },
  stepContainer: {
    padding: Spacing.lg,
  },
  stepTitle: {
    ...Typography.h2,
    color: Colors.neutral[800],
    marginBottom: Spacing.xs,
  },
  stepDescription: {
    ...Typography.body,
    color: Colors.neutral[600],
    marginBottom: Spacing.lg,
  },
  typeList: {
    flex: 1,
  },
  typeOption: {
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  typeInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  typeTitle: {
    ...Typography.h3,
    color: Colors.neutral[800],
    marginBottom: Spacing.xs,
  },
  typeDescription: {
    ...Typography.body,
    color: Colors.neutral[600],
  },
  typeExamples: {
    marginTop: Spacing.sm,
  },
  examplesLabel: {
    ...Typography.bodySmall,
    color: Colors.neutral[700],
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  exampleText: {
    ...Typography.bodySmall,
    color: Colors.neutral[600],
    marginBottom: 2,
  },
  field: {
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    ...Typography.body,
    color: Colors.neutral[700],
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  fieldHelp: {
    ...Typography.caption,
    color: Colors.neutral[600],
    marginBottom: Spacing.xs,
  },
  textInput: {
    fontSize: 16,
    backgroundColor: Colors.neutral[100],
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.neutral[800],
    minHeight: 44,
  },
  smallInput: {
    width: 80,
    marginRight: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  rowText: {
    ...Typography.body,
    color: Colors.neutral[700],
    marginHorizontal: Spacing.md,
  },
  optionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  optionColumn: {
    gap: Spacing.md,
  },
  option: {
    backgroundColor: Colors.neutral[100],
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  optionSelected: {
    backgroundColor: Colors.primary[600],
    borderColor: Colors.primary[600],
  },
  optionText: {
    ...Typography.body,
    color: Colors.neutral[700],
    textAlign: 'center',
  },
  optionTextSelected: {
    color: Colors.neutral[50],
    fontWeight: '600',
  },
  frequencyOption: {
    backgroundColor: Colors.neutral[100],
    borderWidth: 2,
    borderColor: Colors.neutral[200],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  frequencyDescription: {
    ...Typography.caption,
    color: Colors.neutral[600],
    marginTop: Spacing.xs,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  dayOption: {
    backgroundColor: Colors.neutral[100],
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minWidth: 50,
  },
  dayText: {
    ...Typography.body,
    color: Colors.neutral[700],
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Colors.neutral[50],
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
  },
  backButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButtonText: {
    ...Typography.body,
    color: Colors.neutral[600],
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: Colors.primary[600],
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    flex: 1,
    marginLeft: Spacing.md,
  },
  nextButtonDisabled: {
    backgroundColor: Colors.neutral[300],
  },
  nextButtonText: {
    ...Typography.body,
    color: Colors.neutral[50],
    fontWeight: '600',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: Colors.primary[600],
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    flex: 1,
    marginLeft: Spacing.md,
  },
  saveButtonText: {
    ...Typography.body,
    color: Colors.neutral[50],
    fontWeight: '600',
    textAlign: 'center',
  },
});