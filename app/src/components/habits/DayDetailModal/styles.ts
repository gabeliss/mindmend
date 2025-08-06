import { StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../../lib/design-system';

export const dayDetailModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  container: {
    width: 320,
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    ...Shadows.lg,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  popupContent: {
    padding: Spacing.lg,
  },
  popupHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  habitName: {
    ...Typography.h2,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.neutral[900],
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  popupTitle: {
    ...Typography.h3,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral[800],
  },
  goalSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  goalText: {
    ...Typography.bodySmall,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral[600],
    textAlign: 'center',
  },
});