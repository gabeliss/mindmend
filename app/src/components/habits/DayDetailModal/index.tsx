import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Alert,
} from 'react-native';
import { Platform } from 'expo-modules-core';
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
import RelapseList from './RelapseList';
import RelapseEditModal from './RelapseEditModal';
import { dayDetailModalStyles } from './styles';

interface DayDetailModalProps {
  visible: boolean;
  date: Date;
  habit: Habit;
  event?: HabitEvent;
  allEvents?: HabitEvent[]; // All events to filter relapses from
  onClose: () => void;
  onSave: (updatedEvent: Partial<HabitEvent>) => void;
  onDeleteEvent?: (eventId: string) => void;
}

export default function DayDetailModal({
  visible,
  date,
  habit,
  event,
  allEvents = [],
  onClose,
  onSave,
  onDeleteEvent,
}: DayDetailModalProps) {
  const [status, setStatus] = useState<HabitStatus>('not_logged');
  const [timeValue, setTimeValue] = useState('');
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [note, setNote] = useState('');
  const [relapseEditModalVisible, setRelapseEditModalVisible] = useState(false);
  const [editingRelapse, setEditingRelapse] = useState<HabitEvent | undefined>();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const scrollViewRef = React.useRef<ScrollView>(null);

  // Get all relapses for this day (for avoidance habits)
  const getDayRelapses = (): HabitEvent[] => {
    if (habit.type !== 'avoidance') return [];
    
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    return allEvents.filter(evt => 
      evt.habit_id === habit.id && 
      evt.date === dateString && 
      evt.status === 'failed'
    ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  };

  useEffect(() => {
    if (event) {
      setStatus(mapEventStatusToHabitStatus(event.status));
      setTimeValue(formatTimeValue(event.value, habit));
      setNote(event.note || '');
      
      // Set selectedTime for DateTimePicker
      if (event.value && habit.type === 'schedule') {
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

  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
      // Scroll to bottom when keyboard appears
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

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
    
    // Only clear time value for 'not_logged', allow user to set value for 'skipped'
    if (newStatus === 'not_logged') {
      setTimeValue('');
    }
  };

  const handleSave = () => {
    // For avoidance habits with avoided status and existing relapses, show confirmation
    if (habit.type === 'avoidance' && status === 'completed') {
      const dayRelapses = getDayRelapses();
      if (dayRelapses.length > 0) {
        Alert.alert(
          'Remove Relapses?',
          `Marking this day as 'Avoided' will remove the ${dayRelapses.length} existing relapse${dayRelapses.length === 1 ? '' : 's'}. Are you sure?`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Confirm',
              style: 'destructive',
              onPress: () => {
                // Delete all relapses for this day
                dayRelapses.forEach(relapse => {
                  if (onDeleteEvent) {
                    onDeleteEvent(relapse.id);
                  }
                });
                
                // Create avoided event
                const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                const avoidedEvent: Partial<HabitEvent> = {
                  id: `avoided_${Date.now()}`,
                  habit_id: habit.id,
                  user_id: habit.user_id,
                  date: dateString,
                  status: 'completed',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                };
                onSave(avoidedEvent);
                onClose();
              },
            },
          ]
        );
        return;
      } else {
        // No relapses, just save the avoided status
        const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const avoidedEvent: Partial<HabitEvent> = {
          id: event?.id || `avoided_${Date.now()}`,
          habit_id: habit.id,
          user_id: habit.user_id,
          date: dateString,
          status: 'completed',
          created_at: event?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        onSave(avoidedEvent);
        onClose();
        return;
      }
    }
    
    // For avoidance habits with other statuses (skipped, not_logged), save the status
    if (habit.type === 'avoidance') {
      if (status === 'skipped' || status === 'not_logged') {
        const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        if (status === 'not_logged') {
          // For not_logged, delete the existing event if it exists (but keep relapses)
          if (event?.id && onDeleteEvent) {
            onDeleteEvent(event.id);
          }
        } else {
          // For skipped, create or update the event
          const statusEvent: Partial<HabitEvent> = {
            id: event?.id || `skipped_${Date.now()}`,
            habit_id: habit.id,
            user_id: habit.user_id,
            date: dateString,
            status: 'skipped',
            created_at: event?.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          onSave(statusEvent);
        }
      }
      onClose();
      return;
    }

    // Handle 'not_logged' status by deleting the existing event
    if (status === 'not_logged') {
      if (event?.id && onDeleteEvent) {
        onDeleteEvent(event.id);
      }
      onClose();
      return;
    }

    let parsedValue: number | undefined;
    
    if (status === 'skipped') {
      // For 'skipped', use parsed value if user entered one, otherwise null
      if (habit.type === 'schedule') {
        parsedValue = timeValue ? convertDateToTimeDecimal(selectedTime) : undefined;
      } else {
        parsedValue = parseTimeValue(timeValue, habit);
      }
    } else {
      // For other statuses (completed, failed), require value
      if (habit.type === 'schedule') {
        parsedValue = convertDateToTimeDecimal(selectedTime);
      } else {
        parsedValue = parseTimeValue(timeValue, habit);
      }
      
      // Only require values for quantity, duration, and schedule habits
      if (parsedValue === undefined) {
        if (habit.type === 'quantity' || habit.type === 'duration' || habit.type === 'schedule') {
          Alert.alert('Missing Value', 'Please enter a time or value for this day.');
          return;
        }
      }
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

  const handleAddRelapse = () => {
    setEditingRelapse(undefined); // Clear any existing relapse being edited
    setRelapseEditModalVisible(true);
  };

  const handleEditRelapse = (relapse: HabitEvent) => {
    setEditingRelapse(relapse);
    setRelapseEditModalVisible(true);
  };

  const handleSaveRelapse = (updatedRelapse: Partial<HabitEvent>) => {
    if (!updatedRelapse.id) {
      // Creating new relapse
      const now = new Date();
      const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      const newRelapse: Partial<HabitEvent> = {
        id: `relapse_${Date.now()}`,
        habit_id: habit.id,
        user_id: habit.user_id,
        date: dateString,
        status: 'failed',
        created_at: now.toISOString(),
        ...updatedRelapse,
      };
      onSave(newRelapse);
    } else {
      // Updating existing relapse
      onSave(updatedRelapse);
    }
  };

  const handleDeleteRelapse = (relapseId: string) => {
    if (onDeleteEvent) {
      onDeleteEvent(relapseId);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={dayDetailModalStyles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 20}
      >
        <View style={dayDetailModalStyles.container}>
          <ScrollView 
            ref={scrollViewRef}
            style={dayDetailModalStyles.popupContent}
            contentContainerStyle={keyboardVisible ? dayDetailModalStyles.scrollContentContainerWithKeyboard : undefined}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[
              dayDetailModalStyles.popupHeader,
              keyboardVisible && dayDetailModalStyles.popupHeaderWithKeyboard
            ]}>
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
              habit={habit}
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

            {habit.type === 'avoidance' && status === 'completed' && (
              <View style={dayDetailModalStyles.encouragingMessageContainer}>
                <Text style={dayDetailModalStyles.encouragingMessage}>
                  🎉 Great job staying on track today! Keep up the excellent work.
                </Text>
              </View>
            )}

            {habit.type === 'avoidance' && status !== 'completed' && (
              <RelapseList
                relapses={getDayRelapses()}
                onAddRelapse={handleAddRelapse}
                onEditRelapse={handleEditRelapse}
              />
            )}

            {habit.type !== 'avoidance' && (
              <NoteInput
                note={note}
                onNoteChange={handleNoteChange}
              />
            )}

            <ActionButtons
              onCancel={handleClose}
              onSave={handleSave}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <RelapseEditModal
        visible={relapseEditModalVisible}
        relapse={editingRelapse}
        date={date}
        onClose={() => setRelapseEditModalVisible(false)}
        onSave={handleSaveRelapse}
        onDelete={handleDeleteRelapse}
      />
    </Modal>
  );
}