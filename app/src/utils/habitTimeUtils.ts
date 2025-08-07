import { Habit } from '../types/habits';
import { formatTime } from './habitUtils';
import { HabitStatus } from './habitStatusUtils';

export const formatTimeValue = (value?: number, habit?: Habit): string => {
  if (!value || !habit) return '';
  
  if (habit.type === 'schedule') {
    return formatTime(value);
  } else if (habit.type === 'duration') {
    if (habit.unit === 'minutes') {
      // Value is stored directly in minutes
      const totalMinutes = Math.round(value);
      if (totalMinutes >= 60) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        if (minutes === 0) return `${hours}h`;
        return `${hours}h ${minutes}m`;
      }
      return `${totalMinutes}m`;
    } else {
      const hours = Math.floor(value);
      const minutes = Math.round((value - hours) * 60);
      if (hours === 0) return `${minutes}m`;
      if (minutes === 0) return `${hours}h`;
      return `${hours}h ${minutes}m`;
    }
  } else if (habit.type === 'quantity') {
    return `${value}${habit.unit ? ' ' + habit.unit : ''}`;
  }
  
  return '';
};

export const parseTimeValue = (input: string, habit: Habit): number | undefined => {
  if (!input.trim()) return undefined;

  if (habit.type === 'schedule') {
    // Parse time format like "7:30" or "7:30 AM"
    const timeMatch = input.match(/(\d{1,2}):?(\d{0,2})\s*(am|pm)?/i);
    if (timeMatch) {
      let [, hours, minutes = '0', period] = timeMatch;
      let h = parseInt(hours);
      const m = parseInt(minutes);
      
      if (period?.toLowerCase() === 'pm' && h !== 12) h += 12;
      if (period?.toLowerCase() === 'am' && h === 12) h = 0;
      
      return h + m / 60;
    }
  } else if (habit.type === 'duration') {
    // Parse duration format like "2h 30m" or "90m" or "1.5h"
    const hourMatch = input.match(/(\d+(?:\.\d+)?)h/);
    const minMatch = input.match(/(\d+)m/);
    
    let totalHours = 0;
    if (hourMatch) totalHours += parseFloat(hourMatch[1]);
    if (minMatch) totalHours += parseInt(minMatch[1]) / 60;
    
    return totalHours > 0 ? totalHours : undefined;
  } else if (habit.type === 'quantity') {
    const count = parseFloat(input.replace(/[^0-9.]/g, ''));
    return isNaN(count) ? undefined : count;
  }

  return undefined;
};

export const getGoalTimeForDate = (date: Date, habit: Habit): number | undefined => {
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
  const goalTimeString = habit.goal_times_by_day?.[dayOfWeek] || habit.goal_time;
  
  if (!goalTimeString) return undefined;
  
  const [hours, minutes] = goalTimeString.split(':').map(Number);
  return hours + minutes / 60;
};

export const suggestStatusFromTime = (value: number, habit: Habit, date: Date): HabitStatus => {
  if (habit.type === 'schedule') {
    const goalTime = getGoalTimeForDate(date, habit);
    if (!goalTime) return 'not_logged';
    
    if (habit.goal_direction === 'by') {
      return value <= goalTime ? 'completed' : 'failed';
    } else if (habit.goal_direction === 'after') {
      return value >= goalTime ? 'completed' : 'failed';
    }
  } else if (habit.type === 'duration') {
    const goalValue = habit.goal_value || 2;
    
    if (habit.goal_direction === 'at_least') {
      return value >= goalValue ? 'completed' : 'failed';
    } else if (habit.goal_direction === 'no_more_than') {
      return value <= goalValue ? 'completed' : 'failed';
    }
  } else if (habit.type === 'quantity') {
    const goalValue = habit.goal_value || 10;
    
    if (habit.goal_direction === 'at_least') {
      return value >= goalValue ? 'completed' : 'failed';
    } else {
      return value === goalValue ? 'completed' : 'failed';
    }
  }
  
  return 'not_logged';
};

export const convertDateToTimeDecimal = (date: Date): number => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return hours + minutes / 60;
};

export const convertTimeDecimalToDate = (timeDecimal: number): Date => {
  const hours = Math.floor(timeDecimal);
  const minutes = Math.round((timeDecimal - hours) * 60);
  const timeDate = new Date();
  timeDate.setHours(hours, minutes, 0, 0);
  return timeDate;
};