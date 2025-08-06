import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'expo-modules-core';
import { Colors, Typography, Spacing, BorderRadius } from '../../../lib/design-system';
import { HabitEvent } from '../../../types/habits';

// Type assertion to fix TypeScript compatibility  
const DateTimePickerComponent = DateTimePicker as any;

interface RelapseEditModalProps {
  visible: boolean;
  relapse?: HabitEvent;
  date: Date; // The day this relapse occurred
  onClose: () => void;
  onSave: (updatedRelapse: Partial<HabitEvent>) => void;
  onDelete?: (relapseId: string) => void;
}

export default function RelapseEditModal({
  visible,
  relapse,
  date,
  onClose,
  onSave,
  onDelete,
}: RelapseEditModalProps) {
  const [note, setNote] = useState('');
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (relapse && visible) {
      setNote(relapse.note || '');
      
      // Set the time picker to the relapse time or current time
      if (relapse.timestamp) {
        const relapseTime = new Date(relapse.timestamp);
        // Create a new date with today's date but the relapse time
        const timeForPicker = new Date(date);
        timeForPicker.setHours(relapseTime.getHours());
        timeForPicker.setMinutes(relapseTime.getMinutes());
        setSelectedTime(timeForPicker);
      } else {
        setSelectedTime(new Date());
      }
    } else {
      // Reset for new relapse
      setNote('');
      setSelectedTime(new Date());
    }
  }, [relapse, visible, date]);

  const handleSave = () => {
    // Create timestamp from selected date and time
    const timestamp = new Date(date);
    timestamp.setHours(selectedTime.getHours());
    timestamp.setMinutes(selectedTime.getMinutes());
    timestamp.setSeconds(0);
    timestamp.setMilliseconds(0);

    const updatedRelapse: Partial<HabitEvent> = {
      ...relapse,
      note: note.trim() || undefined,
      timestamp: timestamp.toISOString(),
      updated_at: new Date().toISOString(),
    };

    onSave(updatedRelapse);
    onClose();
  };

  const handleDelete = () => {
    if (!relapse?.id || !onDelete) return;

    Alert.alert(
      'Delete Relapse',
      'Are you sure you want to delete this relapse entry?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(relapse.id);
            onClose();
          },
        },
      ]
    );
  };

  const handleTimeChange = (_: any, selectedDate?: Date) => {
    if (selectedDate) {
      setSelectedTime(selectedDate);
    }
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
  };

  const formatTimeDisplay = (time: Date): string => {
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.overlay} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View style={styles.overlay}>
            <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {relapse ? 'Edit Relapse' : 'Add Relapse'}
            </Text>
          </View>

          <ScrollView 
            style={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.section}>
              <Text style={styles.label}>Time</Text>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.timeButtonText}>
                  {formatTimeDisplay(selectedTime)}
                </Text>
              </TouchableOpacity>
              
              {showTimePicker && (
                <DateTimePickerComponent
                  value={selectedTime}
                  mode="time"
                  is24Hour={false}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleTimeChange}
                />
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Note</Text>
              <TextInput
                style={styles.noteInput}
                value={note}
                onChangeText={setNote}
                placeholder="How are you feeling? What triggered this?"
                placeholderTextColor={Colors.neutral[400]}
                multiline
                numberOfLines={3}
                maxLength={500}
                returnKeyType="default"
              />
            </View>
          </ScrollView>

          <View style={styles.actions}>
            {relapse && onDelete && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            )}
            
            <View style={styles.mainActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.neutral[50],
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    maxHeight: '80%',
  },
  header: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  title: {
    ...Typography.h3,
    textAlign: 'center',
  },
  content: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.neutral[700],
    marginBottom: Spacing.sm,
  },
  timeButton: {
    backgroundColor: Colors.neutral[100],
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  timeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral[700],
  },
  noteInput: {
    backgroundColor: Colors.neutral[100],
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    color: Colors.neutral[700],
    textAlignVertical: 'top',
    minHeight: 80,
  },
  actions: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  deleteButton: {
    backgroundColor: Colors.alert[50],
    borderWidth: 1,
    borderColor: Colors.alert[200],
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignSelf: 'flex-start',
  },
  deleteButtonText: {
    color: Colors.alert[600],
    fontWeight: '600',
    fontSize: 14,
  },
  mainActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.neutral[100],
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.neutral[600],
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});