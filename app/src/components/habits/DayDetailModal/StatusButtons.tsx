import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../../lib/design-system';
import { 
  HabitStatus, 
  getStatusBackgroundColor, 
  getStatusBorderColor, 
  getStatusLabel 
} from '../../../utils/habitStatusUtils';

// Type assertion to fix TypeScript compatibility
const FontAwesomeIcon = FontAwesome as any;

interface StatusButtonGridProps {
  status: HabitStatus;
  onStatusChange: (status: HabitStatus) => void;
}

export default function StatusButtons({ status, onStatusChange }: StatusButtonGridProps) {
  const statusOptions: HabitStatus[] = ['completed', 'failed', 'skipped', 'not_logged'];

  return (
    <View style={styles.statusSection}>
      <Text style={styles.sectionLabel}>Status</Text>
      <View style={styles.statusButtons}>
        {statusOptions.slice(0, 2).map((statusOption) => (
          <TouchableOpacity
            key={statusOption}
            style={[
              styles.statusButton,
              {
                backgroundColor: getStatusBackgroundColor(statusOption, status === statusOption),
                borderColor: getStatusBorderColor(statusOption, status === statusOption),
                borderWidth: status === statusOption ? 2 : 1,
              }
            ]}
            onPress={() => onStatusChange(statusOption)}
          >
            <View style={styles.statusButtonContent}>
              {status === statusOption && (
                <FontAwesomeIcon 
                  name="check-circle" 
                  size={14} 
                  color={Colors.neutral[50]} 
                  style={styles.statusIcon}
                />
              )}
              <Text style={[
                styles.statusButtonText,
                {
                  color: status === statusOption 
                    ? Colors.neutral[50] 
                    : Colors.neutral[700]
                }
              ]}>
                {getStatusLabel(statusOption)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.statusButtons}>
        {statusOptions.slice(2).map((statusOption) => (
          <TouchableOpacity
            key={statusOption}
            style={[
              styles.statusButton,
              {
                backgroundColor: getStatusBackgroundColor(statusOption, status === statusOption),
                borderColor: getStatusBorderColor(statusOption, status === statusOption),
                borderWidth: status === statusOption ? 2 : 1,
              }
            ]}
            onPress={() => onStatusChange(statusOption)}
          >
            <View style={styles.statusButtonContent}>
              {status === statusOption && (
                <FontAwesomeIcon 
                  name="check-circle" 
                  size={14} 
                  color={Colors.neutral[50]} 
                  style={styles.statusIcon}
                />
              )}
              <Text style={[
                styles.statusButtonText,
                {
                  color: status === statusOption 
                    ? Colors.neutral[50] 
                    : Colors.neutral[700]
                }
              ]}>
                {getStatusLabel(statusOption)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statusSection: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.neutral[700],
    marginBottom: Spacing.sm,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  statusButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusButtonText: {
    ...Typography.caption,
    fontWeight: '600',
    fontSize: 11,
  },
  statusIcon: {
    marginRight: 4,
  },
});