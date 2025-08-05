import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { Platform } from 'expo-modules-core';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';

// Type assertion to fix TypeScript compatibility
const DateTimePickerComponent = DateTimePicker as any;
import { FontAwesome } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../lib/design-system';
import { Habit, HabitEvent } from '../../types/habits';
import { formatTime } from '../../utils/habitUtils';

// Type assertion to fix TypeScript compatibility
const FontAwesomeIcon = FontAwesome as any;

export type HabitStatus = 'completed' | 'failed' | 'skipped' | 'not_logged';

interface DayDetailModalProps {
  visible: boolean;
  date: Date;
  habit: Habit;
  event?: HabitEvent;
  onClose: () => void;
  onSave: (updatedEvent: Partial<HabitEvent>) => void;
  position?: { x: number; y: number };
}

export default function DayDetailModal({
  visible,
  date,
  habit,
  event,
  onClose,
  onSave,
}: DayDetailModalProps) {
  const [status, setStatus] = useState<HabitStatus>('not_logged');
  const [timeValue, setTimeValue] = useState('');
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (event) {
      setStatus(mapEventStatusToHabitStatus(event.status));
      setTimeValue(formatTimeValue(event.value));
      setNote(event.note || '');
      
      // Set selectedTime for DateTimePicker
      if (event.value && habit.type === 'time_based' && habit.comparison_type === 'time_of_day') {
        const hours = Math.floor(event.value);
        const minutes = Math.round((event.value - hours) * 60);
        const timeDate = new Date();
        timeDate.setHours(hours, minutes, 0, 0);
        setSelectedTime(timeDate);
      }
    } else {
      setStatus('not_logged');
      setTimeValue('');
      setNote('');
      
      // Reset selectedTime to current time
      setSelectedTime(new Date());
    }
  }, [event, visible, habit]);

  const mapEventStatusToHabitStatus = (eventStatus: string): HabitStatus => {
    switch (eventStatus) {
      case 'completed':
        return 'completed';
      case 'failed':
        return 'failed';
      case 'skipped':
        return 'skipped';
      default:
        return 'not_logged';
    }
  };

  const mapHabitStatusToEventStatus = (habitStatus: HabitStatus): string => {
    switch (habitStatus) {
      case 'completed':
        return 'completed';
      case 'failed':
        return 'failed';
      case 'skipped':
        return 'skipped';
      default:
        return 'not_marked';
    }
  };

  const formatTimeValue = (value?: number): string => {
    if (!value) return '';
    
    if (habit.type === 'time_based' && habit.comparison_type === 'time_of_day') {
      return formatTime(value);
    } else if (habit.type === 'time_based' && habit.comparison_type === 'duration') {
      const hours = Math.floor(value);
      const minutes = Math.round((value - hours) * 60);
      if (hours === 0) return `${minutes}m`;
      if (minutes === 0) return `${hours}h`;
      return `${hours}h ${minutes}m`;
    } else if (habit.type === 'count_based') {
      return value.toString();
    }
    
    return '';
  };

  const parseTimeValue = (input: string): number | undefined => {
    if (!input.trim()) return undefined;

    if (habit.type === 'time_based' && habit.comparison_type === 'time_of_day') {
      // Parse time format like "7:30" or "7:30 AM"
      const timeMatch = input.match(/(\d{1,2}):?(\d{0,2})\s*(am|pm)?/i);
      if (timeMatch) {
        let [, hours, minutes = '0', period] = timeMatch;
        let h = parseInt(hours);
        const m = parseInt(minutes);
        
        if (period?.toLowerCase() === 'pm' && h !== 12) h += 12;
        if (period?.toLowerCase() === 'am' && h === 12) h = 0;
        
        return h + m / 60;
      }
    } else if (habit.type === 'time_based' && habit.comparison_type === 'duration') {
      // Parse duration format like "2h 30m" or "90m" or "1.5h"
      const hourMatch = input.match(/(\d+(?:\.\d+)?)h/);
      const minMatch = input.match(/(\d+)m/);
      
      let totalHours = 0;
      if (hourMatch) totalHours += parseFloat(hourMatch[1]);
      if (minMatch) totalHours += parseInt(minMatch[1]) / 60;
      
      return totalHours > 0 ? totalHours : undefined;
    } else if (habit.type === 'count_based') {
      const count = parseInt(input);
      return isNaN(count) ? undefined : count;
    }

    return undefined;
  };

  const suggestStatusFromTime = (value: number): HabitStatus => {
    if (habit.type === 'time_based' && habit.comparison_type === 'time_of_day') {
      const goalTime = getGoalTimeForDate();
      if (goalTime && value <= goalTime) return 'completed';
      return 'failed';
    } else if (habit.type === 'time_based' && habit.comparison_type === 'duration') {
      const goalHours = habit.goal_time ? parseFloat(habit.goal_time.split(':')[0]) + parseFloat(habit.goal_time.split(':')[1]) / 60 : 2;
      if (value <= goalHours) return 'completed';
      return 'failed';
    } else if (habit.type === 'count_based') {
      const goalCount = habit.goal_count || 10;
      if (value >= goalCount) return 'completed';
      return 'failed';
    }
    
    return 'not_logged';
  };

  const getGoalTimeForDate = (): number | undefined => {
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
    const goalTimeString = habit.goal_times_by_day?.[dayOfWeek] || habit.goal_time;
    
    if (!goalTimeString) return undefined;
    
    const [hours, minutes] = goalTimeString.split(':').map(Number);
    return hours + minutes / 60;
  };

  const getStatusColor = (statusType: HabitStatus): string => {
    switch (statusType) {
      case 'completed':
        return Colors.success[500];
      case 'failed':
        return Colors.alert[500];
      case 'skipped':
        return Colors.neutral[500];
      case 'not_logged':
        return Colors.neutral[400];
      default:
        return Colors.neutral[300];
    }
  };

  const getStatusBackgroundColor = (statusType: HabitStatus, isSelected: boolean): string => {
    if (isSelected) {
      return getStatusColor(statusType);
    }
    
    switch (statusType) {
      case 'completed':
        return Colors.success[100];
      case 'failed':
        return Colors.alert[100];
      case 'skipped':
        return Colors.neutral[200];
      case 'not_logged':
        return Colors.neutral[100];
      default:
        return Colors.neutral[100];
    }
  };

  const getStatusBorderColor = (statusType: HabitStatus, isSelected: boolean): string => {
    if (isSelected) {
      return getStatusColor(statusType);
    }
    
    switch (statusType) {
      case 'completed':
        return Colors.success[300];
      case 'failed':
        return Colors.alert[300];
      case 'skipped':
        return Colors.neutral[300];
      case 'not_logged':
        return Colors.neutral[300];
      default:
        return Colors.neutral[300];
    }
  };

  const getStatusLabel = (statusType: HabitStatus): string => {
    switch (statusType) {
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'skipped':
        return 'Skipped';
      case 'not_logged':
        return 'Not logged';
      default:
        return 'Unknown';
    }
  };

  const getGoalDescription = (): string => {
    if (habit.type === 'time_based' && habit.comparison_type === 'time_of_day') {
      const goalTime = getGoalTimeForDate();
      if (goalTime) {
        const timeStr = formatTime(goalTime);
        const period = goalTime < 12 ? 'am' : 'pm';
        return `Goal: by ${timeStr.replace(/AM|PM/i, '')} ${period}`;
      }
      return 'Goal: early wake up';
    } else if (habit.type === 'time_based' && habit.comparison_type === 'duration') {
      return `Goal: under ${habit.goal_time || '2:00'}/day`;
    } else if (habit.type === 'count_based') {
      return `Goal: ${habit.goal_count || 10}`;
    }
    return '';
  };

  const getTimeInputPlaceholder = (): string => {
    if (habit.type === 'time_based' && habit.comparison_type === 'time_of_day') {
      return 'e.g. 7:30 AM';
    } else if (habit.type === 'time_based' && habit.comparison_type === 'duration') {
      return 'e.g. 2h 30m';
    } else if (habit.type === 'count_based') {
      return 'e.g. 12';
    }
    return '';
  };

  const shouldShowTimeInput = (): boolean => {
    return status !== 'skipped' && status !== 'not_logged';
  };

  const handleTimeChange = (text: string) => {
    setTimeValue(text);
    
    const parsedValue = parseTimeValue(text);
    if (parsedValue !== undefined) {
      const suggestedStatus = suggestStatusFromTime(parsedValue);
      setStatus(suggestedStatus);
    }
  };

  const handleTimePickerChange = (_: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    
    if (selectedDate) {
      setSelectedTime(selectedDate);
      
      // Convert to hours (decimal format) for storage
      const hours = selectedDate.getHours();
      const minutes = selectedDate.getMinutes();
      const timeInHours = hours + minutes / 60;
      
      // Update timeValue for display and parsing
      setTimeValue(formatTime(timeInHours));
      
      // Suggest status based on time
      const suggestedStatus = suggestStatusFromTime(timeInHours);
      setStatus(suggestedStatus);
    }
  };

  const showTimePickerModal = () => {
    setShowTimePicker(true);
  };

  const handleStatusChange = (newStatus: HabitStatus) => {
    setStatus(newStatus);
    
    if (newStatus === 'skipped' || newStatus === 'not_logged') {
      setTimeValue('');
    }
  };

  const handleSave = () => {
    let parsedValue: number | undefined;
    
    if (habit.type === 'time_based' && habit.comparison_type === 'time_of_day') {
      // Use selectedTime for time_of_day goals
      const hours = selectedTime.getHours();
      const minutes = selectedTime.getMinutes();
      parsedValue = hours + minutes / 60;
    } else {
      // Use parsed text input for other goal types
      parsedValue = parseTimeValue(timeValue);
    }
    
    if (shouldShowTimeInput() && parsedValue === undefined && status !== 'skipped') {
      Alert.alert('Missing Value', 'Please enter a time or value for this day.');
      return;
    }

    // Use local timezone date string to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    const updatedEvent: Partial<HabitEvent> = {
      id: event?.id,
      habit_id: habit.id,
      user_id: habit.user_id,
      date: dateString,
      status: mapHabitStatusToEventStatus(status) as any,
      value: parsedValue,
      note: note.trim() || undefined,
      created_at: event?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onSave(updatedEvent);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  const statusOptions: HabitStatus[] = ['completed', 'failed', 'skipped', 'not_logged'];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
        <View style={styles.popupContent}>
          <View style={styles.popupHeader}>
            <Text style={styles.popupTitle}>
              {date.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
            </Text>
          </View>

          <View style={styles.statusSection}>
            <Text style={styles.sectionLabel}>Status</Text>
            <View style={styles.statusButtons}>
              {statusOptions.slice(0, 2).map((statusOption) => (
                <TouchableOpacity
                  key={statusOption}
                  style={[
                    styles.statusButton,
                    {
                      backgroundColor: getStatusBackgroundColor(statusOption, status === statusOption),
                      borderColor: getStatusBorderColor(statusOption, status === statusOption),
                      borderWidth: status === statusOption ? 2 : 1,
                    }
                  ]}
                  onPress={() => handleStatusChange(statusOption)}
                >
                  <View style={styles.statusButtonContent}>
                    {status === statusOption && (
                      <FontAwesomeIcon 
                        name="check-circle" 
                        size={14} 
                        color={Colors.neutral[50]} 
                        style={styles.statusIcon}
                      />
                    )}
                    <Text style={[
                      styles.statusButtonText,
                      {
                        color: status === statusOption 
                          ? Colors.neutral[50] 
                          : Colors.neutral[700]
                      }
                    ]}>
                      {getStatusLabel(statusOption)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.statusButtons}>
              {statusOptions.slice(2).map((statusOption) => (
                <TouchableOpacity
                  key={statusOption}
                  style={[
                    styles.statusButton,
                    {
                      backgroundColor: getStatusBackgroundColor(statusOption, status === statusOption),
                      borderColor: getStatusBorderColor(statusOption, status === statusOption),
                      borderWidth: status === statusOption ? 2 : 1,
                    }
                  ]}
                  onPress={() => handleStatusChange(statusOption)}
                >
                  <View style={styles.statusButtonContent}>
                    {status === statusOption && (
                      <FontAwesomeIcon 
                        name="check-circle" 
                        size={14} 
                        color={Colors.neutral[50]} 
                        style={styles.statusIcon}
                      />
                    )}
                    <Text style={[
                      styles.statusButtonText,
                      {
                        color: status === statusOption 
                          ? Colors.neutral[50] 
                          : Colors.neutral[700]
                      }
                    ]}>
                      {getStatusLabel(statusOption)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {shouldShowTimeInput() && (
            <View style={styles.timeSection}>
              <Text style={styles.sectionLabel}>
                {habit.type === 'time_based' && habit.comparison_type === 'time_of_day' 
                  ? `Time (${getGoalDescription()})` 
                  : habit.type === 'time_based' && habit.comparison_type === 'duration'
                  ? `Duration (${getGoalDescription()})`
                  : `Count (${getGoalDescription()})`}
              </Text>
              
              {habit.type === 'time_based' && habit.comparison_type === 'time_of_day' ? (
                <View style={styles.timePickerContainer}>
                  <TouchableOpacity 
                    style={styles.timePickerButton}
                    onPress={showTimePickerModal}
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
                      onChange={handleTimePickerChange}
                      style={styles.timePicker}
                    />
                  )}
                </View>
              ) : (
                <TextInput
                  style={styles.timeInput}
                  value={timeValue}
                  onChangeText={handleTimeChange}
                  placeholder={getTimeInputPlaceholder()}
                  placeholderTextColor={Colors.neutral[400]}
                />
              )}
            </View>
          )}

          <View style={styles.noteSection}>
            <Text style={styles.sectionLabel}>Note</Text>
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={(text: string) => {
                setNote(text);
              }}
              placeholder="Optional note..."
              placeholderTextColor={Colors.neutral[400]}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  container: {
    width: 320,
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    ...Shadows.lg,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  popupContent: {
    padding: Spacing.lg,
  },
  popupHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  popupTitle: {
    ...Typography.h3,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral[800],
  },
  statusSection: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.neutral[700],
    marginBottom: Spacing.sm,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  statusButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusButtonText: {
    ...Typography.caption,
    fontWeight: '600',
    fontSize: 11,
  },
  statusIcon: {
    marginRight: 4,
  },
  timeSection: {
    marginBottom: Spacing.lg,
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
  noteSection: {
    marginBottom: Spacing.lg,
  },
  noteInput: {
    ...Typography.bodySmall,
    backgroundColor: Colors.neutral[100],
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    minHeight: 60,
    fontSize: 13,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
  },
  cancelButtonText: {
    ...Typography.bodySmall,
    fontWeight: '500',
    color: Colors.neutral[700],
  },
  saveButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
  },
  saveButtonText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.neutral[50],
  },
});