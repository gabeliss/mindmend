import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../lib/design-system';
import { DailyPlan, DailyPlanItem } from '../../types/habits';
import { getDateString } from '../../utils/habitUtils';
import { parseSmartInput } from '../../utils/smartInputParser';

interface TodaysPlanProps {
  dailyPlan?: DailyPlan;
  onPlanItemToggle: (itemId: string) => void;
  onSmartAddPlanItem: (description: string, time?: string) => void;
  onEditPlanItem: (description: string, time?: string, itemId: string) => void;
  onDeletePlanItem: (itemId: string) => void;
  mode: 'today' | 'tomorrow';
  onMoveUnfinishedToTomorrow?: () => void;
  onCopyFromToday?: () => void;
}

export default function TodaysPlan({ dailyPlan, onPlanItemToggle, onSmartAddPlanItem, onEditPlanItem, onDeletePlanItem, mode, onMoveUnfinishedToTomorrow, onCopyFromToday }: TodaysPlanProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const inputRef = useRef<TextInput | null>(null);
  const editRef = useRef<TextInput | null>(null);
  
  const currentDate = mode === 'today' ? new Date() : new Date(Date.now() + 24 * 60 * 60 * 1000);
  const isToday = mode === 'today';
  
  // Time-aware suggestions
  const getTimeAwareSuggestions = () => {
    const hour = new Date().getHours();
    
    if (mode === 'today') {
      if (hour < 12) {
        return ["9am workout", "morning meditation", "healthy breakfast"];
      } else if (hour < 17) {
        return ["lunch break", "afternoon walk", "2:30pm meeting"];
      } else {
        return ["evening reading", "call family", "prep for tomorrow"];
      }
    } else {
      // Tomorrow suggestions
      if (hour >= 18) {
        return ["9am workout tomorrow", "morning priorities", "tomorrow's meetings"];
      } else {
        return ["tomorrow's workout", "morning routine", "important calls"];
      }
    }
  };
  
  const suggestions = getTimeAwareSuggestions();
  
  // Get plan items sorted by order, then separate by time vs no-time
  const sortedItems = dailyPlan?.entries.sort((a, b) => a.order - b.order) || [];
  const timedItems = sortedItems.filter(item => item.time).sort((a, b) => {
    // Sort timed items by time (24-hour format: "08:00", "09:00", etc.)
    if (!a.time || !b.time) return 0;
    return a.time.localeCompare(b.time);
  });
  const untimedItems = sortedItems.filter(item => !item.time);
  
  const completedCount = sortedItems.filter(item => item.completed).length;
  const totalCount = sortedItems.length;
  const unfinishedCount = totalCount - completedCount;

  const getStatusIcon = (completed: boolean) => {
    return completed 
      ? <Ionicons name="checkmark-circle" size={20} color={Colors.success[600]} />
      : <Ionicons name="ellipse-outline" size={20} color={Colors.neutral[400]} />;
  };

  const formatTime = (time: string): string => {
    if (!time || typeof time !== 'string') {
      return '';
    }
    // Convert 24-hour time to 12-hour format
    const [hours, minutes] = time.split(':');
    if (!hours || !minutes) {
      return time; // Return as-is if format is unexpected
    }
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleSmartInputSubmit = () => {
    if (!inputValue.trim()) return;
    
    const parsed = parseSmartInput(inputValue);
    if (parsed.description) {
      onSmartAddPlanItem(parsed.description, parsed.time);
      setInputValue('');
      // Keep focus on input for rapid entry
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleInputKeyPress = (event: any) => {
    if (event.nativeEvent.key === 'Enter') {
      event.preventDefault();
      handleSmartInputSubmit();
    }
  };

  const handleItemEdit = (item: DailyPlanItem) => {
    const currentText = item.time ? `${formatTime(item.time)} ${item.description}` : item.description;
    setEditingItemId(item.id);
    setEditingValue(currentText);
    setTimeout(() => {
      editRef.current?.focus();
    }, 100);
  };

  const handleEditSubmit = (itemId: string) => {
    if (!editingValue.trim()) {
      handleEditCancel();
      return;
    }
    
    const parsed = parseSmartInput(editingValue);
    onEditPlanItem(parsed.description, parsed.time, itemId);
    setEditingItemId(null);
    setEditingValue('');
  };

  const handleEditCancel = () => {
    setEditingItemId(null);
    setEditingValue('');
  };

  const handleEditKeyPress = (event: any, itemId: string) => {
    if (event.nativeEvent.key === 'Enter') {
      event.preventDefault();
      handleEditSubmit(itemId);
    } else if (event.nativeEvent.key === 'Escape') {
      event.preventDefault();
      handleEditCancel();
    }
  };


  const renderPlanItem = (item: DailyPlanItem) => {
    const isEditing = editingItemId === item.id;
    
    return (
      <View key={item.id} style={styles.planItem}>
        {isToday ? (
          <TouchableOpacity onPress={() => onPlanItemToggle(item.id)}>
            {getStatusIcon(item.completed)}
          </TouchableOpacity>
        ) : (
          <View style={styles.planIndicator}>
            <Ionicons name="ellipse-outline" size={20} color={Colors.neutral[300]} />
          </View>
        )}
        <View style={styles.planItemContent}>
          {isEditing ? (
            <TextInput
              ref={editRef}
              style={[styles.planItemEditInput, item.completed && styles.completedText]}
              value={editingValue}
              onChangeText={setEditingValue}
              onSubmitEditing={() => handleEditSubmit(item.id)}
              onBlur={() => handleEditSubmit(item.id)}
              onKeyPress={(event) => handleEditKeyPress(event, item.id)}
              returnKeyType="done"
              blurOnSubmit={true}
              multiline={false}
              placeholder="Edit task..."
            />
          ) : (
            <TouchableOpacity 
              style={styles.planItemTextContainer}
              onPress={() => handleItemEdit(item)}
              activeOpacity={0.7}
            >
              {item.time && (
                <Text style={styles.planItemTime}>{formatTime(item.time)}</Text>
              )}
              <Text style={[
                styles.planItemText,
                item.completed && styles.completedText
              ]}>
                {item.description}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          onPress={() => onDeletePlanItem(item.id)}
          style={styles.deleteButton}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={16} color={Colors.alert[500]} />
        </TouchableOpacity>
      </View>
    );
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>
            {mode === 'today' ? "Today's Plan" : "Tomorrow's Plan"}
          </Text>
          <Text style={styles.date}>{formatDate(currentDate)}</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} style={styles.toggleButton}>
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={Colors.neutral[600]} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {isExpanded && (
        <>
          <View style={styles.smartInputSection}>
            <TextInput
              ref={inputRef}
              style={styles.smartInput}
              placeholder={`Add task...`}
              value={inputValue}
              onChangeText={setInputValue}
              onSubmitEditing={handleSmartInputSubmit}
              onKeyPress={handleInputKeyPress}
              returnKeyType="done"
              blurOnSubmit={false}
              multiline={false}
            />
            {inputValue.trim() && (
              <TouchableOpacity onPress={handleSmartInputSubmit} style={styles.addInputButton}>
                <Ionicons name="add" size={20} color={Colors.primary[600]} />
              </TouchableOpacity>
            )}
          </View>

          {isToday && (
            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${totalCount ? (completedCount / totalCount) * 100 : 0}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {completedCount} of {totalCount} {totalCount === 1 ? 'task' : 'tasks'} completed
              </Text>
            </View>
          )}

          {/* Move Unfinished Tasks to Tomorrow Button */}
          {isToday && unfinishedCount > 0 && onMoveUnfinishedToTomorrow && (
            <TouchableOpacity 
              style={styles.moveTasksButton}
              onPress={onMoveUnfinishedToTomorrow}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-forward-circle-outline" size={20} color={Colors.primary[600]} />
              <Text style={styles.moveTasksButtonText}>
                Move {unfinishedCount} unfinished {unfinishedCount === 1 ? 'task' : 'tasks'} to tomorrow
              </Text>
            </TouchableOpacity>
          )}

          {/* Copy from Today Button for Tomorrow */}
          {!isToday && onCopyFromToday && (
            <TouchableOpacity 
              style={styles.copyFromTodayButton}
              onPress={onCopyFromToday}
              activeOpacity={0.7}
            >
              <Ionicons name="copy-outline" size={20} color={Colors.secondary[600]} />
              <Text style={styles.copyFromTodayButtonText}>
                Copy from today's plan
              </Text>
            </TouchableOpacity>
          )}

          {totalCount === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <Ionicons 
                  name={mode === 'today' ? "calendar-outline" : "moon-outline"} 
                  size={48} 
                  color={Colors.neutral[300]} 
                />
              </View>
              <Text style={styles.emptyStateText}>
                {mode === 'today' ? 'No plan set for today' : 'No plan set for tomorrow'}
              </Text>
              <View style={styles.hintContainer}>
                <Text style={styles.hintText}>💡 Try typing above:</Text>
                {suggestions.map((suggestion, index) => (
                  <Text key={index} style={styles.hintExample}>"{suggestion}"</Text>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.plansList}>
              {/* Timed items first */}
              {timedItems.length > 0 && (
                <View style={styles.timedSection}>
                  {timedItems.map(renderPlanItem)}
                </View>
              )}
              
              {/* Untimed items */}
              {untimedItems.length > 0 && (
                <View style={styles.untimedSection}>
                  {timedItems.length > 0 && (
                    <View style={styles.sectionDivider}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>Also Today</Text>
                      <View style={styles.dividerLine} />
                    </View>
                  )}
                  {untimedItems.map(renderPlanItem)}
                </View>
              )}
              
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.md,
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    ...Typography.h2,
    color: Colors.neutral[800],
    marginBottom: 2,
  },
  date: {
    ...Typography.bodySmall,
    color: Colors.neutral[600],
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  toggleButton: {
    padding: Spacing.xs,
  },
  smartInputSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    backgroundColor: Colors.neutral[100],
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  smartInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.neutral[800],
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    height: 40
  },
  addInputButton: {
    padding: Spacing.xs,
    backgroundColor: Colors.primary[100],
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.xs,
  },
  progressSection: {
    marginBottom: Spacing.lg,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.neutral[200],
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.sm,
  },
  progressText: {
    ...Typography.bodySmall,
    color: Colors.neutral[600],
    textAlign: 'center',
  },
  moveTasksButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[50],
    borderWidth: 1,
    borderColor: Colors.primary[200],
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  moveTasksButtonText: {
    ...Typography.bodySmall,
    color: Colors.primary[600],
    fontWeight: '500',
    marginLeft: Spacing.xs,
  },
  copyFromTodayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary[50],
    borderWidth: 1,
    borderColor: Colors.secondary[200],
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  copyFromTodayButtonText: {
    ...Typography.bodySmall,
    color: Colors.secondary[600],
    fontWeight: '500',
    marginLeft: Spacing.xs,
  },
  emptyStateIcon: {
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyStateText: {
    ...Typography.h3,
    color: Colors.neutral[600],
    marginBottom: Spacing.lg,
  },
  hintContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  hintText: {
    ...Typography.bodySmall,
    color: Colors.neutral[500],
    marginBottom: Spacing.xs,
    fontWeight: '600',
  },
  hintExample: {
    ...Typography.bodySmall,
    color: Colors.primary[600],
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  plansList: {
    gap: Spacing.sm,
  },
  timedSection: {
    gap: Spacing.xs,
  },
  untimedSection: {
    gap: Spacing.xs,
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.neutral[300],
  },
  dividerText: {
    ...Typography.caption,
    color: Colors.neutral[500],
    marginHorizontal: Spacing.sm,
    backgroundColor: Colors.neutral[50],
    paddingHorizontal: Spacing.xs,
  },
  planItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.neutral[50],
  },
  planIndicator: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planItemTextContainer: {
    flex: 1,
  },
  planItemEditInput: {
    ...Typography.body,
    color: Colors.neutral[800],
    backgroundColor: Colors.neutral[50],
    borderWidth: 1,
    borderColor: Colors.primary[300],
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.xs,
    paddingBottom: Spacing.sm,
    height: 40
  },
  planItemContent: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  deleteButton: {
    padding: Spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planItemTime: {
    ...Typography.caption,
    color: Colors.primary[600],
    fontWeight: '600',
    marginBottom: 2,
  },
  planItemText: {
    ...Typography.body,
    color: Colors.neutral[800],
    lineHeight: 20,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: Colors.neutral[500],
  }
});