import { Habit } from '../types/habits';
import { HabitStatus } from './habitStatusUtils';
import { getHabitGoalText } from './habitGoalUtils';

export const shouldShowTimeInput = (status: HabitStatus, habit?: Habit): boolean => {
  // Don't show time input for avoidance and simple habits
  if (habit?.type === 'avoidance' || habit?.type === 'simple') {
    return false;
  }
  
  // Show time input for all statuses except 'not_logged'
  return status !== 'not_logged';
};

export const getGoalDescription = (habit: Habit, date: Date): string => {
  return getHabitGoalText(habit, { includeFrequency: true, date });
};

export const getTimeInputPlaceholder = (habit: Habit): string => {
  if (habit.type === 'schedule') {
    return 'e.g. 7:30 AM';
  } else if (habit.type === 'duration') {
    return habit.unit === 'minutes' ? 'e.g. 30m' : 'e.g. 2h 30m';
  } else if (habit.type === 'quantity') {
    return `e.g. ${habit.goal_value || 10}`;
  }
  return '';
};

export const getTimeInputLabel = (habit: Habit, _goalDescription: string): string => {
  if (habit.type === 'schedule') {
    return 'Time';
  } else if (habit.type === 'duration') {
    return 'Duration';
  } else if (habit.type === 'quantity') {
    return 'Count';
  }
  return '';
};