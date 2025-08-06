import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Alert,
} from 'react-native';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Habit, HabitEvent } from '../../../types/habits';
import { 
  HabitStatus, 
  mapEventStatusToHabitStatus, 
  mapHabitStatusToEventStatus 
} from '../../../utils/habitStatusUtils';
import { 
  formatTimeValue, 
  parseTimeValue, 
  suggestStatusFromTime, 
  convertDateToTimeDecimal, 
  convertTimeDecimalToDate 
} from '../../../utils/habitTimeUtils';
import { getGoalDescription } from '../../../utils/habitValidationUtils';
import StatusButtons from './StatusButtons';
import TimeInput from './TimeInput';
import NoteInput from './NoteInput';
import ActionButtons from './ActionButtons';
import { dayDetailModalStyles } from './styles';

interface DayDetailModalProps {
  visible: boolean;
  date: Date;
  habit: Habit;
  event?: HabitEvent;
  onClose: () => void;
  onSave: (updatedEvent: Partial<HabitEvent>) => void;
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
      setTimeValue(formatTimeValue(event.value, habit));
      setNote(event.note || '');
      
      // Set selectedTime for DateTimePicker
      if (event.value && habit.type === 'time_based' && habit.comparison_type === 'time_of_day') {
        setSelectedTime(convertTimeDecimalToDate(event.value));
      }
    } else {
      setStatus('not_logged');
      setTimeValue('');
      setNote('');
      
      // Reset selectedTime to current time
      setSelectedTime(new Date());
    }
  }, [event, visible, habit]);

  const handleTimeChange = (text: string) => {
    setTimeValue(text);
    
    const parsedValue = parseTimeValue(text, habit);
    if (parsedValue !== undefined) {
      const suggestedStatus = suggestStatusFromTime(parsedValue, habit, date);
      setStatus(suggestedStatus);
    }
  };

  const handleTimePickerChange = (_: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      setSelectedTime(selectedDate);
      
      // Convert to hours (decimal format) for storage
      const timeInHours = convertDateToTimeDecimal(selectedDate);
      
      // Update timeValue for display and parsing
      setTimeValue(formatTimeValue(timeInHours, habit));
      
      // Suggest status based on time
      const suggestedStatus = suggestStatusFromTime(timeInHours, habit, date);
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
      parsedValue = convertDateToTimeDecimal(selectedTime);
    } else {
      // Use parsed text input for other goal types
      parsedValue = parseTimeValue(timeValue, habit);
    }
    
    if (status !== 'skipped' && status !== 'not_logged' && parsedValue === undefined) {
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

  const handleNoteChange = (text: string) => {
    setNote(text);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={dayDetailModalStyles.overlay}>
        <View style={dayDetailModalStyles.container}>
          <View style={dayDetailModalStyles.popupContent}>
            <View style={dayDetailModalStyles.popupHeader}>
              <Text style={dayDetailModalStyles.habitName}>
                {habit.name}
              </Text>
              <Text style={dayDetailModalStyles.popupTitle}>
                {date.toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </Text>
            </View>

            <View style={dayDetailModalStyles.goalSection}>
              <Text style={dayDetailModalStyles.goalText}>
                {getGoalDescription(habit, date)}
              </Text>
            </View>

            <StatusButtons 
              status={status}
              onStatusChange={handleStatusChange}
            />

            <TimeInput
              habit={habit}
              date={date}
              status={status}
              timeValue={timeValue}
              selectedTime={selectedTime}
              showTimePicker={showTimePicker}
              onTimeChange={handleTimeChange}
              onTimePickerChange={handleTimePickerChange}
              onShowTimePicker={showTimePickerModal}
            />

            <NoteInput
              note={note}
              onNoteChange={handleNoteChange}
            />

            <ActionButtons
              onCancel={handleClose}
              onSave={handleSave}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}