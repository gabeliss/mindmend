import { Habit } from '../types/habits';
import { HabitStatus } from './habitStatusUtils';
import { getGoalTimeForDate } from './habitTimeUtils';
import { formatTime } from './habitUtils';

export const shouldShowTimeInput = (status: HabitStatus, habit?: Habit): boolean => {
  // Don't show time input for avoidance and simple habits
  if (habit?.type === 'avoidance' || habit?.type === 'simple') {
    return false;
  }
  
  return status !== 'skipped' && status !== 'not_logged';
};

export const getGoalDescription = (habit: Habit, date: Date): string => {
  if (habit.type === 'simple') {
    return 'Goal: complete daily';
  } else if (habit.type === 'schedule') {
    const goalTime = getGoalTimeForDate(date, habit);
    if (goalTime) {
      const timeStr = formatTime(goalTime);
      const period = goalTime < 12 ? 'am' : 'pm';
      const direction = habit.goal_direction === 'by' ? 'by' : 'after';
      return `Goal: ${direction} ${timeStr.replace(/AM|PM/i, '')} ${period}`;
    }
    return 'Goal: schedule target';
  } else if (habit.type === 'duration') {
    const goalValue = habit.goal_value || 2;
    const unit = habit.unit || 'hours';
    const direction = habit.goal_direction === 'at_least' ? 'at least' : 'under';
    
    let formattedGoal = '';
    if (unit === 'hours' || unit === 'minutes') {
      if (unit === 'hours' && goalValue >= 1) {
        const hours = Math.floor(goalValue);
        const minutes = Math.round((goalValue - hours) * 60);
        if (hours > 0 && minutes > 0) {
          formattedGoal = `${hours}h ${minutes}m`;
        } else if (hours > 0) {
          formattedGoal = `${hours}h`;
        } else {
          formattedGoal = `${minutes}m`;
        }
      } else {
        formattedGoal = `${goalValue}${unit.charAt(0)}`;
      }
    } else {
      formattedGoal = `${goalValue} ${unit}`;
    }
    
    return `Goal: ${direction} ${formattedGoal}/day`;
  } else if (habit.type === 'quantity') {
    const goalValue = habit.goal_value || 10;
    const unit = habit.unit || '';
    const direction = habit.goal_direction === 'at_least' ? 'at least' : 'exactly';
    return `Goal: ${direction} ${goalValue}${unit ? ' ' + unit : ''}`;
  } else if (habit.type === 'avoidance') {
    if (habit.failure_tolerance) {
      return `Goal: avoid completely (max ${habit.failure_tolerance.max_failures} failures/${habit.failure_tolerance.window})`;
    }
    return 'Goal: avoid completely';
  }
  return '';
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

export const getTimeInputLabel = (habit: Habit, goalDescription: string): string => {
  if (habit.type === 'schedule') {
    return 'Time';
  } else if (habit.type === 'duration') {
    return 'Duration';
  } else if (habit.type === 'quantity') {
    return 'Count';
  }
  return '';
};