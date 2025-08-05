import { Habit } from '../types/habits';
import { HabitStatus } from './habitStatusUtils';
import { getGoalTimeForDate } from './habitTimeUtils';
import { formatTime } from './habitUtils';

export const shouldShowTimeInput = (status: HabitStatus): boolean => {
  return status !== 'skipped' && status !== 'not_logged';
};

export const getGoalDescription = (habit: Habit, date: Date): string => {
  if (habit.type === 'time_based' && habit.comparison_type === 'time_of_day') {
    const goalTime = getGoalTimeForDate(date, habit);
    if (goalTime) {
      const timeStr = formatTime(goalTime);
      const period = goalTime < 12 ? 'am' : 'pm';
      return `Goal: by ${timeStr.replace(/AM|PM/i, '')} ${period}`;
    }
    return 'Goal: early wake up';
  } else if (habit.type === 'time_based' && habit.comparison_type === 'duration') {
    return `Goal: under ${habit.goal_time || '2:00'}/day`;
  } else if (habit.type === 'count_based') {
    return `Goal: ${habit.goal_count || 10}`;
  }
  return '';
};

export const getTimeInputPlaceholder = (habit: Habit): string => {
  if (habit.type === 'time_based' && habit.comparison_type === 'time_of_day') {
    return 'e.g. 7:30 AM';
  } else if (habit.type === 'time_based' && habit.comparison_type === 'duration') {
    return 'e.g. 2h 30m';
  } else if (habit.type === 'count_based') {
    return 'e.g. 12';
  }
  return '';
};

export const getTimeInputLabel = (habit: Habit, goalDescription: string): string => {
  if (habit.type === 'time_based' && habit.comparison_type === 'time_of_day') {
    return `Time (${goalDescription})`;
  } else if (habit.type === 'time_based' && habit.comparison_type === 'duration') {
    return `Duration (${goalDescription})`;
  } else if (habit.type === 'count_based') {
    return `Count (${goalDescription})`;
  }
  return '';
};