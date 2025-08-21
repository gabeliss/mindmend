import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../lib/design-system';
import { DailyPlan, DailyPlanItem } from '../../types/habits';
import { getDateString } from '../../utils/habitUtils';
import SwipeActions from '../shared/SwipeActions';

interface TodaysPlanProps {
  dailyPlan?: DailyPlan;
  onPlanItemToggle: (itemId: string) => void;
  onAddPlanItem: () => void;
  onEditPlanItem: (item: DailyPlanItem) => void;
  onDeletePlanItem: (itemId: string) => void;
}

export default function TodaysPlan({ dailyPlan, onPlanItemToggle, onAddPlanItem, onEditPlanItem, onDeletePlanItem }: TodaysPlanProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const today = new Date();
  const todayString = getDateString(today);
  
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

  const handleDeleteConfirm = (item: DailyPlanItem) => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${item.description}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDeletePlanItem(item.id),
        },
      ]
    );
  };

  const renderPlanItem = (item: DailyPlanItem) => (
    <SwipeActions
      key={item.id}
      rightActions={[
        {
          text: 'Edit',
          icon: 'pencil',
          color: Colors.neutral[50],
          backgroundColor: Colors.primary[600],
          onPress: () => onEditPlanItem(item),
        },
        {
          text: 'Delete',
          icon: 'trash',
          color: Colors.neutral[50],
          backgroundColor: Colors.alert[500],
          onPress: () => handleDeleteConfirm(item),
        },
      ]}
    >
      <TouchableOpacity
        style={styles.planItem}
        onPress={() => onPlanItemToggle(item.id)}
        activeOpacity={0.7}
      >
        {getStatusIcon(item.completed)}
        <View style={styles.planItemContent}>
          {item.time && (
            <Text style={styles.planItemTime}>{formatTime(item.time)}</Text>
          )}
          <Text style={[
            styles.planItemText,
            item.completed && styles.completedText
          ]}>
            {item.description}
          </Text>
        </View>
      </TouchableOpacity>
    </SwipeActions>
  );

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
          <TouchableOpacity onPress={onAddPlanItem} style={styles.addButton}>
            <Ionicons name="add" size={20} color={Colors.primary[600]} />
          </TouchableOpacity>
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
              <TouchableOpacity onPress={onAddPlanItem} style={styles.emptyStateButton}>
                <Text style={styles.emptyStateButtonText}>Create Today's Plan</Text>
              </TouchableOpacity>
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
              
              {/* Swipe hint for first-time users */}
              {(timedItems.length > 0 || untimedItems.length > 0) && (
                <Text style={styles.swipeHint}>
                  💡 Swipe left on any task to edit or delete
                </Text>
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
  addButton: {
    padding: Spacing.xs,
    backgroundColor: Colors.primary[100],
    borderRadius: BorderRadius.md,
  },
  toggleButton: {
    padding: Spacing.xs,
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
    marginBottom: Spacing.xs,
  },
  emptyStateButton: {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.sm,
  },
  emptyStateButtonText: {
    ...Typography.body,
    color: Colors.neutral[50],
    fontWeight: '600',
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
  planItemContent: {
    flex: 1,
    marginLeft: Spacing.sm,
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