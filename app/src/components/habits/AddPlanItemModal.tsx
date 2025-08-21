import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../lib/design-system';
import { DailyPlanItem } from '../../types/habits';
import TimePickerInput from '../shared/TimePickerInput';

interface AddPlanItemModalProps {
  visible: boolean;
  item?: DailyPlanItem; // For editing existing items
  onClose: () => void;
  onSave: (item: Omit<DailyPlanItem, 'id' | 'daily_plan_id'>) => void;
}

export default function AddPlanItemModal({ 
  visible, 
  item, 
  onClose, 
  onSave 
}: AddPlanItemModalProps) {
  const [description, setDescription] = useState('');
  const [hasTime, setHasTime] = useState(false);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);

  useEffect(() => {
    if (item) {
      setDescription(item.description);
      setHasTime(!!item.time);
      if (item.time) {
        // Convert string time back to Date object
        const [hours, minutes] = item.time.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        setSelectedTime(date);
      } else {
        setSelectedTime(null);
      }
    } else {
      setDescription('');
      setHasTime(false);
      setSelectedTime(null);
    }
  }, [item, visible]);

  const handleSave = () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description for your plan item.');
      return;
    }

    if (hasTime && !selectedTime) {
      Alert.alert('Error', 'Please select a time or turn off the time option.');
      return;
    }

    // Convert Date to 24-hour time string
    const timeString = hasTime && selectedTime 
      ? `${selectedTime.getHours().toString().padStart(2, '0')}:${selectedTime.getMinutes().toString().padStart(2, '0')}`
      : undefined;

    onSave({
      description: description.trim(),
      time: timeString,
      completed: item?.completed || false, // Preserve completion status when editing
      order: item?.order || 0, // Will be set properly by parent
    });

    onClose();
  };

  const handleClose = () => {
    // Don't reset state immediately to avoid flickering
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.neutral[600]} />
          </TouchableOpacity>
          <Text style={styles.title}>
            {item ? 'Edit Plan Item' : 'Add to Plan'}
          </Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.label}>What do you want to do?</Text>
            <TextInput
              style={styles.textInput}
              value={description}
              onChangeText={setDescription}
              placeholder="e.g., Morning workout, Call mom, Read 10 pages..."
              placeholderTextColor={Colors.neutral[400]}
              multiline
              maxLength={200}
              autoFocus={!item}
            />
            <Text style={styles.characterCount}>
              {description.length}/200
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.timeSection}>
              <View style={styles.timeSectionHeader}>
                <Text style={styles.label}>Schedule for specific time</Text>
                <Switch
                  value={hasTime}
                  onValueChange={setHasTime}
                  trackColor={{ false: Colors.neutral[300], true: Colors.primary[200] }}
                  thumbColor={hasTime ? Colors.primary[600] : Colors.neutral[400]}
                />
              </View>
              <Text style={styles.subtitle}>
                {hasTime 
                  ? 'This will appear in your timeline' 
                  : 'This will appear in your general tasks'
                }
              </Text>
            </View>

            {hasTime && (
              <View style={styles.timeInputSection}>
                <TimePickerInput
                  value={selectedTime || new Date()}
                  onChange={setSelectedTime}
                  placeholder="Select time"
                />
              </View>
            )}
          </View>

          <View style={styles.tips}>
            <Text style={styles.tipsTitle}>💡 Tips</Text>
            <Text style={styles.tip}>• Be specific: "20-min walk" vs "exercise"</Text>
            <Text style={styles.tip}>• Use action words: "Write", "Call", "Read"</Text>
            <Text style={styles.tip}>• Add times for structure, skip for flexibility</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
    backgroundColor: Colors.neutral[50],
  },
  closeButton: {
    padding: Spacing.xs,
    marginLeft: -Spacing.xs,
  },
  title: {
    ...Typography.h2,
    color: Colors.neutral[800],
  },
  saveButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.primary[600],
    borderRadius: BorderRadius.lg,
  },
  saveButtonText: {
    ...Typography.body,
    color: Colors.neutral[50],
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl, // Extra bottom padding for keyboard
  },
  section: {
    marginBottom: Spacing.xl,
  },
  label: {
    ...Typography.h3,
    color: Colors.neutral[800],
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.neutral[600],
    marginTop: Spacing.xs,
  },
  textInput: {
    ...Typography.body,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    backgroundColor: Colors.neutral[50],
    color: Colors.neutral[800],
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    ...Typography.caption,
    color: Colors.neutral[500],
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  timeSection: {
    marginBottom: Spacing.md,
  },
  timeSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeInputSection: {
    marginTop: Spacing.md,
  },
  tips: {
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.xl,
  },
  tipsTitle: {
    ...Typography.h3,
    color: Colors.primary[800],
    marginBottom: Spacing.sm,
  },
  tip: {
    ...Typography.bodySmall,
    color: Colors.primary[700],
    marginBottom: Spacing.xs,
    lineHeight: 18,
  },
});