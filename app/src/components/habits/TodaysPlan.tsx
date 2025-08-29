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
}

export default function TodaysPlan({ dailyPlan, onPlanItemToggle, onSmartAddPlanItem, onEditPlanItem, onDeletePlanItem }: TodaysPlanProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const inputRef = useRef<TextInput | null>(null);
  const editRef = useRef<TextInput | null>(null);
  const today = new Date();
  
  // Get plan items sorted by order, then separate by time vs no-time
  const sortedItems = dailyPlan?.entries.sort((a, b) => a.order - b.order) || [];
  const timedItems = sortedItems.filter(item => item.time);
  const untimedItems = sortedItems.filter(item => !item.time);
  
  const completedCount = sortedItems.filter(item => item.completed).length;
  const totalCount = sortedItems.length;

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
        <TouchableOpacity onPress={() => onPlanItemToggle(item.id)}>
          {getStatusIcon(item.completed)}
        </TouchableOpacity>
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
          <Text style={styles.title}>Today's Plan</Text>
          <Text style={styles.date}>{formatDate(today)}</Text>
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

          {totalCount === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No plan set for today
              </Text>
              <View style={styles.hintContainer}>
                <Text style={styles.hintText}>💡 Try typing above:</Text>
                <Text style={styles.hintExample}>"9am workout"</Text>
                <Text style={styles.hintExample}>"call mom"</Text>
                <Text style={styles.hintExample}>"2:30pm team meeting"</Text>
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
  },
  swipeHint: {
    ...Typography.caption,
    color: Colors.neutral[500],
    textAlign: 'center',
    marginTop: Spacing.lg,
    fontStyle: 'italic',
  },
});