import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';

interface Streak {
  habitId: string;
  currentStreak: number;
  longestStreak: number;
  habit: {
    title: string;
    habitType: 'BUILD' | 'AVOID';
  };
}

interface EditHabitModalProps {
  visible: boolean;
  onClose: () => void;
  editingHabit: Streak | null;
  editingDate: string;
  currentEventStatus: string | null;
  onEditAction: (action: 'COMPLETED' | 'SKIPPED' | 'RELAPSED' | null) => void;
  isSavingEdit: boolean;
}

export const EditHabitModal: React.FC<EditHabitModalProps> = ({
  visible,
  onClose,
  editingHabit,
  editingDate,
  currentEventStatus,
  onEditAction,
  isSavingEdit,
}) => {
  const getFormattedDate = () => {
    if (editingDate) {
      // Use the same timezone-aware parsing as the calendar generation
      const dateObj = new Date(editingDate + 'T00:00:00');
      return `Log for ${dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}?`;
    }
    return '';
  };

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
          <Text style={styles.modalTitle}>
            {getFormattedDate()}
          </Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.editModalContent}>
          {editingHabit && (
            <>
              <View style={styles.habitInfoSection}>
                <Text style={styles.editHabitTitle}>{editingHabit.habit.title}</Text>
                <Text style={styles.editHabitType}>
                  {editingHabit.habit.habitType === 'BUILD' ? '✅ Build Habit' : '🚫 Break Habit'}
                </Text>
              </View>

              <View style={styles.actionButtonsContainer}>
                {editingHabit.habit.habitType === 'BUILD' ? (
                  <>
                    <TouchableOpacity 
                      style={[
                        styles.actionButton, 
                        styles.completedActionButton,
                        currentEventStatus === 'COMPLETED' && styles.selectedActionButton
                      ]}
                      onPress={() => onEditAction('COMPLETED')}
                      disabled={isSavingEdit}
                    >
                      <Text style={[styles.actionButtonText, styles.completedActionText]}>
                        ✓ Completed
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[
                        styles.actionButton, 
                        styles.skippedActionButton,
                        currentEventStatus === 'SKIPPED' && styles.selectedActionButton
                      ]}
                      onPress={() => onEditAction('SKIPPED')}
                      disabled={isSavingEdit}
                    >
                      <Text style={[styles.actionButtonText, styles.skippedActionText]}>
                        ✕ Skipped
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity 
                      style={[
                        styles.actionButton, 
                        styles.completedActionButton,
                        currentEventStatus === 'COMPLETED' && styles.selectedActionButton
                      ]}
                      onPress={() => onEditAction('COMPLETED')}
                      disabled={isSavingEdit}
                    >
                      <Text style={[styles.actionButtonText, styles.completedActionText]}>
                        ✓ Avoided
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[
                        styles.actionButton, 
                        styles.skippedActionButton,
                        currentEventStatus === 'RELAPSED' && styles.selectedActionButton
                      ]}
                      onPress={() => onEditAction('RELAPSED')}
                      disabled={isSavingEdit}
                    >
                      <Text style={[styles.actionButtonText, styles.skippedActionText]}>
                        ✕ Relapsed
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
                
                <TouchableOpacity 
                  style={[
                    styles.actionButton, 
                    styles.clearActionButton,
                    currentEventStatus === null && styles.selectedActionButton
                  ]}
                  onPress={() => onEditAction(null)}
                  disabled={isSavingEdit}
                >
                  <Text style={[styles.actionButtonText, styles.clearActionText]}>
                    Clear Log
                  </Text>
                </TouchableOpacity>
              </View>
              
              {isSavingEdit && (
                <View style={styles.savingIndicator}>
                  <ActivityIndicator size="small" color="#4F8EF7" />
                  <Text style={styles.savingText}>Saving...</Text>
                </View>
              )}
            </>
          )}
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
    textAlign: 'center',
    flex: 1,
  },
  modalCancelButton: {
    fontSize: 16,
    color: '#6B7280',
  },
  editModalContent: {
    flex: 1,
    padding: 20,
  },
  habitInfoSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  editHabitTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  editHabitType: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  actionButtonsContainer: {
    gap: 16,
  },
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  selectedActionButton: {
    backgroundColor: '#F0F9FF',
    borderColor: '#3B82F6',
  },
  completedActionButton: {
    borderColor: '#10B981',
  },
  skippedActionButton: {
    borderColor: '#EF4444',
  },
  clearActionButton: {
    borderColor: '#6B7280',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  completedActionText: {
    color: '#10B981',
  },
  skippedActionText: {
    color: '#EF4444',
  },
  clearActionText: {
    color: '#6B7280',
  },
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  savingText: {
    fontSize: 14,
    color: '#4F8EF7',
    fontWeight: '500',
  },
});