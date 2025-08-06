import { Habit } from '../types/habits';
import { HabitStatus } from './habitStatusUtils';
import { getGoalTimeForDate } from './habitTimeUtils';
import { formatTime } from './habitUtils';

export const shouldShowTimeInput = (status: HabitStatus, habit?: Habit): boolean => {
  // Don't show time input for time_since habits (like avoidance habits)
  if (habit?.type === 'time_since') {
    return false;
  }
  
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
    const goalTime = habit.goal_time || '2:00';
    const [hours, minutes] = goalTime.split(':').map(Number);
    
    let formattedGoal = '';
    if (hours > 0 && minutes > 0) {
      formattedGoal = `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      formattedGoal = `${hours}h`;
    } else if (minutes > 0) {
      formattedGoal = `${minutes}m`;
    }
    
    return `Goal: under ${formattedGoal}/day`;
  } else if (habit.type === 'count_based') {
    return `Goal: ${habit.goal_count || 10}`;
  } else if (habit.type === 'time_since') {
    if (habit.failure_tolerance) {
      return `Goal: avoid completely (max ${habit.failure_tolerance.max_failures} failures/${habit.failure_tolerance.window})`;
    }
    return 'Goal: avoid completely';
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
    return 'Time';
  } else if (habit.type === 'time_based' && habit.comparison_type === 'duration') {
    return 'Duration';
  } else if (habit.type === 'count_based') {
    return 'Count';
  }
  return '';
};