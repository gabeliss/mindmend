import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, Spacing, BorderRadius } from '../lib/design-system';
import { Habit, HabitEvent } from '../types/habits';
import DayDetailModal from '../components/habits/DayDetailModal';
import DayCircle from '../components/habits/DayCircle';
import { getHabitGoalText } from '../utils/habitGoalUtils';

interface HabitDetailScreenProps {
  visible: boolean;
  habit: Habit;
  events: HabitEvent[];
  onClose: () => void;
  onSave: (updatedHabit: Partial<Habit>) => void;
  onSaveEvent: (updatedEvent: Partial<HabitEvent>) => void;
  onDeleteEvent: (eventId: string) => void;
  onArchive?: (habitId: string) => void;
  onDelete?: (habitId: string) => void;
  onReset?: (habitId: string) => void;
}

interface MonthData {
  year: number;
  month: number;
  days: Date[];
}

export default function HabitDetailScreen({
  visible,
  habit,
  events,
  onClose,
  onSave,
  onSaveEvent,
  onDeleteEvent,
  onArchive,
  onDelete,
  onReset,
}: HabitDetailScreenProps) {
  const [editedHabit, setEditedHabit] = useState<Partial<Habit>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dayModalVisible, setDayModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [habitNote, setHabitNote] = useState('');

  useEffect(() => {
    if (habit) {
      setEditedHabit({ ...habit });
      setHabitNote(''); // TODO: Get from habit model when we add notes field
    }
  }, [habit]);

  const getDaysInMonth = (date: Date): MonthData => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return { year, month, days };
  };

  const getEventForDate = (date: Date): HabitEvent | undefined => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    return events.find(event => event.date === dateString);
  };

  const handleDayPress = (date: Date) => {
    setSelectedDate(date);
    setDayModalVisible(true);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const handleFieldChange = (field: keyof Habit, value: any) => {
    setEditedHabit(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedFieldChange = (parentField: keyof Habit, childField: string, value: any) => {
    setEditedHabit(prev => ({
      ...prev,
      [parentField]: {
        ...(prev[parentField] as any),
        [childField]: value,
      },
    }));
  };

  const getGoalDirectionOptions = (habitType: string): Array<{value: string, label: string}> => {
    if (habitType === 'quantity' || habitType === 'duration') {
      return [
        { value: 'at_least', label: 'At least' },
        { value: 'no_more_than', label: 'No more than' },
      ];
    } else if (habitType === 'schedule') {
      return [
        { value: 'by', label: 'By' },
        { value: 'after', label: 'After' },
      ];
    }
    return [];
  };

  const getGoalSummary = (): string => {
    if (!habit) return '';
    
    return getHabitGoalText(habit, { 
      includeFrequency: false, 
      includePrefix: false 
    });
  };

  const calculateStreak = (): { current: number; longest: number } => {
    const sortedEvents = events
      .filter(e => e.status === 'completed')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    if (sortedEvents.length === 0) return { current: 0, longest: 0 };
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let currentDate = new Date();
    
    // Calculate current streak
    for (let i = 0; i < 30; i++) {
      const dateString = currentDate.toISOString().split('T')[0];
      const event = events.find(e => e.date === dateString);
      
      if (event && event.status === 'completed') {
        currentStreak++;
      } else if (event && event.status === 'failed') {
        break;
      }
      
      currentDate.setDate(currentDate.getDate() - 1);
    }

    // Calculate longest streak
    const allEvents = events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    for (const event of allEvents) {
      if (event.status === 'completed') {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else if (event.status === 'failed') {
        tempStreak = 0;
      }
    }
    
    return { current: currentStreak, longest: longestStreak };
  };

  const calculateStats = () => {
    const last30Days = events.filter(e => {
      const eventDate = new Date(e.date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return eventDate >= thirtyDaysAgo;
    });

    const completedEvents = last30Days.filter(e => e.status === 'completed');
    const successRate = last30Days.length > 0 ? Math.round((completedEvents.length / last30Days.length) * 100) : 0;

    const avgValue = completedEvents.length > 0 
      ? completedEvents.reduce((sum, e) => sum + (e.value || 0), 0) / completedEvents.length 
      : 0;

    return { successRate, avgValue, totalEvents: last30Days.length };
  };

  const handleSave = () => {
    if (!editedHabit.name?.trim()) {
      Alert.alert('Error', 'Please enter a habit name.');
      return;
    }

    // Validate required fields based on habit type
    if (editedHabit.type === 'quantity' || editedHabit.type === 'duration' || editedHabit.type === 'schedule') {
      if (!editedHabit.goal_value || editedHabit.goal_value <= 0) {
        Alert.alert('Error', 'Please enter a valid goal value.');
        return;
      }
    }

    if (editedHabit.type === 'schedule' && !editedHabit.goal_time) {
      Alert.alert('Error', 'Please enter a goal time for schedule habits.');
      return;
    }

    onSave(editedHabit);
    setIsEditMode(false);
  };

  const handleCancel = () => {
    setEditedHabit({ ...habit });
    setIsEditMode(false);
  };

  const handleArchive = () => {
    Alert.alert(
      'Archive Habit',
      'Are you sure you want to archive this habit? You can restore it later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: () => {
            onArchive?.(habit.id);
            onClose();
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Habit',
      'Are you sure you want to permanently delete this habit? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete?.(habit.id);
            onClose();
          },
        },
      ]
    );
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Progress',
      'Are you sure you want to reset all progress for this habit? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            onReset?.(habit.id);
          },
        },
      ]
    );
  };

  const renderOverviewSection = () => {
    const streaks = calculateStreak();
    
    return (
      <View style={styles.overviewSection}>
        <View style={styles.overviewHeader}>
          <View style={styles.habitTitleContainer}>
            <Text style={styles.habitTitle}>{habit.name}</Text>
            <Text style={styles.goalSummary}>{getGoalSummary()}</Text>
          </View>
          
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="ellipsis-horizontal" size={20} color={Colors.neutral[600]} />
          </TouchableOpacity>
        </View>

        <View style={styles.streakContainer}>
          <View style={styles.streakItem}>
            <Text style={styles.streakNumber}>{streaks.current}</Text>
            <Text style={styles.streakLabel}>Current Streak</Text>
          </View>
          <View style={styles.streakDivider} />
          <View style={styles.streakItem}>
            <Text style={styles.streakNumber}>{streaks.longest}</Text>
            <Text style={styles.streakLabel}>Longest Streak</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderMonthlyCalendar = () => {
    const monthData = getDaysInMonth(currentMonth);
    const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
      <View style={styles.calendarSection}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity
            style={styles.monthNavButton}
            onPress={() => navigateMonth('prev')}
          >
            <Ionicons name="chevron-back" size={20} color={Colors.primary[600]} />
          </TouchableOpacity>
          
          <Text style={styles.monthTitle}>{monthName}</Text>
          
          <TouchableOpacity
            style={styles.monthNavButton}
            onPress={() => navigateMonth('next')}
          >
            <Ionicons name="chevron-forward" size={20} color={Colors.primary[600]} />
          </TouchableOpacity>
        </View>

        <View style={styles.daysHeader}>
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <View key={day} style={styles.dayHeaderCell}>
              <Text style={styles.dayHeaderText}>{day}</Text>
            </View>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {/* Empty cells for padding */}
          {Array.from({ length: monthData.days[0].getDay() }).map((_, index) => (
            <View key={`empty-${index}`} style={styles.dayCell} />
          ))}

          {/* Days using DayCircle component */}
          {monthData.days.map((date) => {
            const today = new Date();
            const isToday = date.toDateString() === today.toDateString();
            const isFuture = date > today;
            
            return (
              <View key={date.toISOString()} style={styles.dayCell}>
                <DayCircle
                  date={date}
                  event={getEventForDate(date)}
                  habit={habit}
                  onPress={handleDayPress}
                  size="small"
                  isToday={isToday}
                  hideWeekday={true}
                  disabled={isFuture}
                />
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderStatsSection = () => {
    const stats = calculateStats();
    
    return (
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Stats & Insights</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.successRate}%</Text>
            <Text style={styles.statLabel}>Success Rate (30d)</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalEvents}</Text>
            <Text style={styles.statLabel}>Total Entries</Text>
          </View>
          
          {(habit.type === 'quantity' || habit.type === 'duration') && stats.avgValue > 0 && (
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{Math.round(stats.avgValue)}</Text>
              <Text style={styles.statLabel}>Avg {habit.unit || 'Value'}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderEditableField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder?: string,
    keyboardType?: 'default' | 'numeric'
  ) => (
    <View style={styles.editField}>
      <Text style={styles.editFieldLabel}>{label}</Text>
      {isEditMode ? (
        <TextInput
          style={styles.editFieldInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType={keyboardType}
        />
      ) : (
        <Text style={styles.editFieldValue}>{value || placeholder}</Text>
      )}
    </View>
  );

  const renderEditSection = () => {
    if (!editedHabit) return null;

    return (
      <View style={styles.editSection}>
        <View style={styles.editHeader}>
          <Text style={styles.sectionTitle}>Habit Settings</Text>
          {!isEditMode ? (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditMode(true)}
            >
              <Ionicons name="pencil" size={16} color={Colors.primary[600]} />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {renderEditableField(
          'Habit Name',
          editedHabit.name || '',
          (text) => handleFieldChange('name', text),
          'Enter habit name'
        )}

        {/* Type is read-only */}
        <View style={styles.editField}>
          <Text style={styles.editFieldLabel}>Type</Text>
          <Text style={styles.editFieldValue}>
            {editedHabit.type ? editedHabit.type.charAt(0).toUpperCase() + editedHabit.type.slice(1) : ''}
          </Text>
        </View>

        {/* Goal value for non-simple habits */}
        {editedHabit.type !== 'simple' && editedHabit.type !== 'avoidance' && renderEditableField(
          editedHabit.type === 'schedule' ? 'Goal Time (minutes)' : 'Goal Value',
          editedHabit.goal_value?.toString() || '',
          (text) => handleFieldChange('goal_value', parseFloat(text) || 0),
          editedHabit.type === 'schedule' ? '30' : '10',
          'numeric'
        )}

        {/* Unit for quantity/duration */}
        {(editedHabit.type === 'quantity' || editedHabit.type === 'duration') && renderEditableField(
          'Unit',
          editedHabit.unit || '',
          (text) => handleFieldChange('unit', text),
          editedHabit.type === 'duration' ? 'minutes' : 'pages, glasses, etc.'
        )}

        {/* Goal direction picker */}
        {editedHabit.type !== 'simple' && editedHabit.type !== 'avoidance' && (
          <View style={styles.editField}>
            <Text style={styles.editFieldLabel}>Goal Direction</Text>
            <View style={styles.pickerContainer}>
              {getGoalDirectionOptions(editedHabit.type).map(({ value, label }) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.pickerOption,
                    editedHabit.goal_direction === value && styles.pickerOptionSelected,
                    !isEditMode && styles.pickerOptionDisabled,
                  ]}
                  onPress={() => isEditMode && handleFieldChange('goal_direction', value)}
                  disabled={!isEditMode}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    editedHabit.goal_direction === value && styles.pickerOptionTextSelected,
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderNotesSection = () => (
    <View style={styles.notesSection}>
      <Text style={styles.sectionTitle}>Notes & Reflection</Text>
      <TextInput
        style={styles.notesInput}
        value={habitNote}
        onChangeText={setHabitNote}
        placeholder="Add notes about your habit, motivation, or insights..."
        multiline
        numberOfLines={3}
      />
    </View>
  );

  const renderActionsSection = () => (
    <View style={styles.actionsSection}>
      <TouchableOpacity style={styles.actionButton} onPress={handleReset}>
        <Ionicons name="refresh" size={16} color={Colors.warning[600]} />
        <Text style={[styles.actionButtonText, { color: Colors.warning[600] }]}>Reset Progress</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.actionButton} onPress={handleArchive}>
        <Ionicons name="archive" size={16} color={Colors.neutral[600]} />
        <Text style={styles.actionButtonText}>Archive Habit</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
        <Ionicons name="trash" size={16} color={Colors.alert[600]} />
        <Text style={[styles.actionButtonText, { color: Colors.alert[600] }]}>Delete Habit</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={50} // adjust depending on your header height
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.neutral[600]} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Habit Details</Text>
            <View style={styles.headerSpacer} />
          </View>
          
          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {renderOverviewSection()}
            {renderMonthlyCalendar()}
            {renderStatsSection()}
            {renderEditSection()}
            {renderNotesSection()}
            {renderActionsSection()}
          </ScrollView>

          <DayDetailModal
            visible={dayModalVisible}
            date={selectedDate}
            habit={habit}
            event={getEventForDate(selectedDate)}
            allEvents={events}
            onClose={() => setDayModalVisible(false)}
            onSave={onSaveEvent}
            onDeleteEvent={onDeleteEvent}
          />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[100],
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
    width: 32, // Balance the close button
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['5xl'],
  },
  
  // Overview Section
  overviewSection: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  habitTitleContainer: {
    flex: 1,
  },
  habitTitle: {
    ...Typography.h2,
    color: Colors.neutral[800],
    marginBottom: Spacing.xs,
  },
  goalSummary: {
    ...Typography.body,
    color: Colors.neutral[600],
  },
  menuButton: {
    padding: Spacing.xs,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  streakItem: {
    alignItems: 'center',
  },
  streakNumber: {
    ...Typography.h1,
    color: Colors.primary[600],
    marginBottom: Spacing.xs,
  },
  streakLabel: {
    ...Typography.caption,
    color: Colors.neutral[600],
    textAlign: 'center',
  },
  streakDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.neutral[300],
  },

  // Calendar Section
  calendarSection: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  monthNavButton: {
    padding: Spacing.sm,
    backgroundColor: Colors.primary[100],
    borderRadius: BorderRadius.md,
  },
  monthTitle: {
    ...Typography.h3,
    color: Colors.neutral[800],
  },
  daysHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  dayHeaderCell: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  dayHeaderText: {
    ...Typography.bodySmall,
    color: Colors.neutral[600],
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },

  // Stats Section
  statsSection: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.neutral[800],
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    ...Typography.h2,
    color: Colors.primary[600],
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.neutral[600],
    textAlign: 'center',
  },

  // Edit Section
  editSection: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.primary[100],
    borderRadius: BorderRadius.md,
  },
  editButtonText: {
    ...Typography.body,
    color: Colors.primary[600],
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  editActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  cancelButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.neutral[200],
    borderRadius: BorderRadius.md,
  },
  cancelButtonText: {
    ...Typography.body,
    color: Colors.neutral[700],
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.primary[600],
    borderRadius: BorderRadius.md,
  },
  saveButtonText: {
    ...Typography.body,
    color: Colors.neutral[50],
    fontWeight: '600',
  },
  editField: {
    marginBottom: Spacing.md,
  },
  editFieldLabel: {
    ...Typography.body,
    color: Colors.neutral[700],
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  editFieldInput: {
    fontSize: 16,
    fontWeight: '400',
    backgroundColor: Colors.neutral[50],
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 0,
    height: 44,
    color: Colors.neutral[800],
    textAlignVertical: 'center',
    includeFontPadding: false,
    lineHeight: undefined,
  },
  editFieldValue: {
    ...Typography.body,
    color: Colors.neutral[600],
    paddingVertical: Spacing.sm,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  pickerOption: {
    backgroundColor: Colors.neutral[100],
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  pickerOptionSelected: {
    backgroundColor: Colors.primary[600],
    borderColor: Colors.primary[600],
  },
  pickerOptionDisabled: {
    opacity: 0.7,
  },
  pickerOptionText: {
    ...Typography.body,
    color: Colors.neutral[700],
  },
  pickerOptionTextSelected: {
    color: Colors.neutral[50],
    fontWeight: '600',
  },

  // Notes Section
  notesSection: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  notesInput: {
    ...Typography.body,
    backgroundColor: Colors.neutral[100],
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    color: Colors.neutral[800],
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Actions Section
  actionsSection: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.neutral[100],
  },
  actionButtonText: {
    ...Typography.body,
    color: Colors.neutral[700],
    fontWeight: '500',
    marginLeft: Spacing.sm,
  },
});