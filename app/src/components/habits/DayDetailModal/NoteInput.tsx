import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../../lib/design-system';

interface NoteInputSectionProps {
  note: string;
  onNoteChange: (text: string) => void;
}

export default function NoteInput({ note, onNoteChange }: NoteInputSectionProps) {
  return (
    <View style={styles.noteSection}>
      <Text style={styles.sectionLabel}>Note</Text>
      <TextInput
        style={styles.noteInput}
        value={note}
        onChangeText={onNoteChange}
        placeholder="Optional note..."
        placeholderTextColor={Colors.neutral[400]}
        multiline
        numberOfLines={2}
        textAlignVertical="top"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  noteSection: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.neutral[700],
    marginBottom: Spacing.sm,
  },
  noteInput: {
    ...Typography.bodySmall,
    backgroundColor: Colors.neutral[100],
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    minHeight: 60,
    fontSize: 13,
  },
});