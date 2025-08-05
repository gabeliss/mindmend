import { Habit } from '../types/habits';
import { formatTime } from './habitUtils';
import { HabitStatus } from './habitStatusUtils';

export const formatTimeValue = (value?: number, habit?: Habit): string => {
  if (!value || !habit) return '';
  
  if (habit.type === 'time_based' && habit.comparison_type === 'time_of_day') {
    return formatTime(value);
  } else if (habit.type === 'time_based' && habit.comparison_type === 'duration') {
    const hours = Math.floor(value);
    const minutes = Math.round((value - hours) * 60);
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  } else if (habit.type === 'count_based') {
    return value.toString();
  }
  
  return '';
};

export const parseTimeValue = (input: string, habit: Habit): number | undefined => {
  if (!input.trim()) return undefined;

  if (habit.type === 'time_based' && habit.comparison_type === 'time_of_day') {
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
  } else if (habit.type === 'time_based' && habit.comparison_type === 'duration') {
    // Parse duration format like "2h 30m" or "90m" or "1.5h"
    const hourMatch = input.match(/(\d+(?:\.\d+)?)h/);
    const minMatch = input.match(/(\d+)m/);
    
    let totalHours = 0;
    if (hourMatch) totalHours += parseFloat(hourMatch[1]);
    if (minMatch) totalHours += parseInt(minMatch[1]) / 60;
    
    return totalHours > 0 ? totalHours : undefined;
  } else if (habit.type === 'count_based') {
    const count = parseInt(input);
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
  if (habit.type === 'time_based' && habit.comparison_type === 'time_of_day') {
    const goalTime = getGoalTimeForDate(date, habit);
    if (goalTime && value <= goalTime) return 'completed';
    return 'failed';
  } else if (habit.type === 'time_based' && habit.comparison_type === 'duration') {
    const goalHours = habit.goal_time ? parseFloat(habit.goal_time.split(':')[0]) + parseFloat(habit.goal_time.split(':')[1]) / 60 : 2;
    if (value <= goalHours) return 'completed';
    return 'failed';
  } else if (habit.type === 'count_based') {
    const goalCount = habit.goal_count || 10;
    if (value >= goalCount) return 'completed';
    return 'failed';
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