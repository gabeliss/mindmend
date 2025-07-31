import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator 
} from 'react-native';

interface AddHabitModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateHabit: () => void;
  newHabitTitle: string;
  setNewHabitTitle: (title: string) => void;
  newHabitDescription: string;
  setNewHabitDescription: (description: string) => void;
  newHabitType: 'BUILD' | 'AVOID';
  setNewHabitType: (type: 'BUILD' | 'AVOID') => void;
  isCreatingHabit: boolean;
}

export const AddHabitModal: React.FC<AddHabitModalProps> = ({
  visible,
  onClose,
  onCreateHabit,
  newHabitTitle,
  setNewHabitTitle,
  newHabitDescription,
  setNewHabitDescription,
  newHabitType,
  setNewHabitType,
  isCreatingHabit,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add New Habit</Text>
          <TouchableOpacity onPress={onCreateHabit} disabled={isCreatingHabit}>
            <Text style={[styles.modalSaveButton, isCreatingHabit && styles.modalButtonDisabled]}>
              {isCreatingHabit ? 'Creating...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Habit Type</Text>
            <View style={styles.habitTypeContainer}>
              <TouchableOpacity 
                style={[styles.habitTypeButton, newHabitType === 'BUILD' && styles.habitTypeButtonActive]}
                onPress={() => setNewHabitType('BUILD')}
              >
                <Text style={[styles.habitTypeButtonText, newHabitType === 'BUILD' && styles.habitTypeButtonTextActive]}>
                  ✅ Build Good Habit
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.habitTypeButton, newHabitType === 'AVOID' && styles.habitTypeButtonActive]}
                onPress={() => setNewHabitType('AVOID')}
              >
                <Text style={[styles.habitTypeButtonText, newHabitType === 'AVOID' && styles.habitTypeButtonTextActive]}>
                  🚫 Break Bad Habit
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Habit Title *</Text>
            <TextInput
              style={styles.textInput}
              value={newHabitTitle}
              onChangeText={setNewHabitTitle}
              placeholder="e.g., Exercise for 30 minutes"
              placeholderTextColor="#9CA3AF"
              maxLength={100}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textAreaInput]}
              value={newHabitDescription}
              onChangeText={setNewHabitDescription}
              placeholder="Add more details about your habit..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              maxLength={500}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalCancelButton: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalSaveButton: {
    fontSize: 16,
    color: '#4F8EF7',
    fontWeight: '600',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  habitTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  habitTypeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  habitTypeButtonActive: {
    borderColor: '#4F8EF7',
    backgroundColor: '#EBF4FF',
  },
  habitTypeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  habitTypeButtonTextActive: {
    color: '#4F8EF7',
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#fff',
  },
  textAreaInput: {
    height: 80,
    textAlignVertical: 'top',
  },
});