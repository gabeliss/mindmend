import { Colors } from '../lib/design-system';

export type HabitStatus = 'completed' | 'failed' | 'skipped' | 'not_logged';

export const mapEventStatusToHabitStatus = (eventStatus: string): HabitStatus => {
  switch (eventStatus) {
    case 'completed':
      return 'completed';
    case 'failed':
      return 'failed';
    case 'skipped':
      return 'skipped';
    default:
      return 'not_logged';
  }
};

export const mapHabitStatusToEventStatus = (habitStatus: HabitStatus): string => {
  switch (habitStatus) {
    case 'completed':
      return 'completed';
    case 'failed':
      return 'failed';
    case 'skipped':
      return 'skipped';
    default:
      return 'not_marked';
  }
};

export const getStatusColor = (statusType: HabitStatus): string => {
  switch (statusType) {
    case 'completed':
      return Colors.success[500];
    case 'failed':
      return Colors.alert[500];
    case 'skipped':
      return Colors.neutral[500];
    case 'not_logged':
      return Colors.neutral[400];
    default:
      return Colors.neutral[300];
  }
};

export const getStatusBackgroundColor = (statusType: HabitStatus, isSelected: boolean): string => {
  if (isSelected) {
    return getStatusColor(statusType);
  }
  
  switch (statusType) {
    case 'completed':
      return Colors.success[100];
    case 'failed':
      return Colors.alert[100];
    case 'skipped':
      return Colors.neutral[200];
    case 'not_logged':
      return Colors.neutral[100];
    default:
      return Colors.neutral[100];
  }
};

export const getStatusBorderColor = (statusType: HabitStatus, isSelected: boolean): string => {
  if (isSelected) {
    return getStatusColor(statusType);
  }
  
  switch (statusType) {
    case 'completed':
      return Colors.success[300];
    case 'failed':
      return Colors.alert[300];
    case 'skipped':
      return Colors.neutral[300];
    case 'not_logged':
      return Colors.neutral[300];
    default:
      return Colors.neutral[300];
  }
};

export const getStatusLabel = (statusType: HabitStatus, habitType?: string): string => {
  switch (statusType) {
    case 'completed':
      return habitType === 'time_since' ? 'Avoided' : 'Completed';
    case 'failed':
      return 'Failed';
    case 'skipped':
      return 'Skipped';
    case 'not_logged':
      return 'Not logged';
    default:
      return 'Unknown';
  }
};