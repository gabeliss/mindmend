import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../../lib/design-system';
import { HabitEvent } from '../../../types/habits';
import { formatTimestampToLocalTime } from '../../../utils/timezoneUtils';

// Type assertion to fix TypeScript compatibility  
const FontAwesomeIcon = FontAwesome as any;

interface RelapseListProps {
  relapses: HabitEvent[];
  onAddRelapse: () => void;
  onEditRelapse: (relapse: HabitEvent) => void;
}

const getRelapseDisplayTime = (relapse: HabitEvent): string => {
  // Use timestamp if available, otherwise fallback to created_at
  const timeToUse = relapse.timestamp || relapse.created_at;
  return formatTimestampToLocalTime(timeToUse);
};

export default function RelapseList({
  relapses,
  onAddRelapse,
  onEditRelapse,
}: RelapseListProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Relapses</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={onAddRelapse}
        >
          <FontAwesomeIcon 
            name="plus" 
            size={14} 
            color={Colors.primary[500]} 
          />
          <Text style={styles.addButtonText}>Add Relapse</Text>
        </TouchableOpacity>
      </View>
      
      {relapses.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No relapses logged for this day</Text>
        </View>
      ) : (
        <View style={styles.relapsesList}>
          {relapses.map((relapse, index) => (
            <TouchableOpacity
              key={relapse.id || index}
              style={styles.relapseItem}
              onPress={() => onEditRelapse(relapse)}
            >
              <View style={styles.relapseHeader}>
                <Text style={styles.relapseTime}>
                  {getRelapseDisplayTime(relapse)}
                </Text>
                <FontAwesomeIcon 
                  name="chevron-right" 
                  size={12} 
                  color={Colors.neutral[400]} 
                />
              </View>
              {relapse.note && (
                <Text style={styles.relapseNote} numberOfLines={2}>
                  {relapse.note}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.neutral[700],
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary[500],
    marginLeft: Spacing.xs,
  },
  emptyState: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.sm,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.neutral[500],
    fontStyle: 'italic',
  },
  relapsesList: {
    gap: Spacing.sm,
  },
  relapseItem: {
    backgroundColor: Colors.alert[50],
    borderLeftWidth: 3,
    borderLeftColor: Colors.alert[400],
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
  },
  relapseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  relapseTime: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral[700],
  },
  relapseNote: {
    fontSize: 13,
    color: Colors.neutral[600],
    lineHeight: 18,
  },
});