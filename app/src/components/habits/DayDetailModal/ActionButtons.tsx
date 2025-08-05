import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../../lib/design-system';

interface ActionButtonsProps {
  onCancel: () => void;
  onSave: () => void;
}

export default function ActionButtons({ onCancel, onSave }: ActionButtonsProps) {
  return (
    <View style={styles.actionButtons}>
      <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onSave} style={styles.saveButton}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
  },
  cancelButtonText: {
    ...Typography.bodySmall,
    fontWeight: '500',
    color: Colors.neutral[700],
  },
  saveButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
  },
  saveButtonText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.neutral[50],
  },
});