import { Habit } from '../types/habits';
import { getGoalTimeForDate } from './habitTimeUtils';
import { formatTime } from './habitUtils';

/**
 * Formats duration goals in the most readable way
 */
export const formatDurationGoal = (goalValue: number): string => {
  if (goalValue < 1) {
    // Less than 1 hour - show as minutes
    const totalMinutes = Math.round(goalValue * 60);
    return `${totalMinutes} min`;
  } else if (goalValue % 1 === 0) {
    // Whole hours - show as "2 hrs"
    return `${goalValue} ${goalValue === 1 ? 'hr' : 'hrs'}`;
  } else {
    // Mixed hours and minutes - show as "1h 30m"
    const hours = Math.floor(goalValue);
    const minutes = Math.round((goalValue - hours) * 60);
    if (minutes === 0) {
      return `${hours} ${hours === 1 ? 'hr' : 'hrs'}`;
    } else {
      return `${hours}h ${minutes}m`;
    }
  }
};

/**
 * Formats time goals in 12-hour format
 */
export const formatTimeGoal = (timeString?: string): string => {
  if (!timeString) return '';
  
  const [hours, minutes] = timeString.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  
  if (minutes === 0) {
    return `${displayHours} ${ampm}`;
  }
  
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

/**
 * Central function to get habit goal description
 * Used across HabitStats, HabitDetailScreen, and DayDetailModal
 */
export const getHabitGoalText = (habit: Habit, options: {
  includeFrequency?: boolean;
  includePrefix?: boolean;
  date?: Date;
} = {}): string => {
  const { includeFrequency = false, includePrefix = true, date } = options;
  const prefix = includePrefix ? 'Goal: ' : '';

  let goalText = '';

  switch (habit.type) {
    case 'simple':
      goalText = 'complete daily';
      break;

    case 'schedule':
      // Check if there are different weekend goals
      if (habit.goal_times_by_day && (habit.goal_times_by_day.Sat || habit.goal_times_by_day.Sun)) {
        const weekdayGoal = formatTimeGoal(habit.goal_time);
        const weekendGoal = formatTimeGoal(habit.goal_times_by_day.Sat || habit.goal_times_by_day.Sun);
        const direction = habit.goal_direction === 'by' ? 'by' : 'after';
        goalText = `${direction} ${weekdayGoal} on weekdays, ${weekendGoal} on weekends`;
      } else if (date) {
        // Use date-specific goal time if available
        const goalTime = getGoalTimeForDate(date, habit);
        if (goalTime) {
          const timeStr = formatTime(goalTime);
          const period = goalTime < 12 ? 'am' : 'pm';
          const direction = habit.goal_direction === 'by' ? 'by' : 'after';
          goalText = `${direction} ${timeStr.replace(/AM|PM/i, '')} ${period}`;
        } else {
          goalText = 'schedule target';
        }
      } else {
        const direction = habit.goal_direction === 'by' ? 'by' : 'after';
        goalText = `${direction} ${formatTimeGoal(habit.goal_time)}`;
      }
      break;

    case 'duration':
      const goalValue = habit.goal_value || 2;
      const directionText = habit.goal_direction === 'at_least' ? 'at least' : 'under';
      const formattedDuration = formatDurationGoal(goalValue);
      goalText = `${directionText} ${formattedDuration}${includeFrequency ? '/day' : ' daily'}`;
      break;

    case 'quantity':
      const quantityGoal = habit.goal_value || 10;
      const quantityUnit = habit.unit || '';
      const quantityDirection = habit.goal_direction === 'at_least' ? 'at least' : 'exactly';
      goalText = `${quantityDirection} ${quantityGoal}${quantityUnit ? ' ' + quantityUnit : ''}`;
      break;

    case 'avoidance':
      if (habit.failure_tolerance) {
        goalText = `avoid completely (max ${habit.failure_tolerance.max_failures} failures/${habit.failure_tolerance.window})`;
      } else {
        goalText = 'avoid completely';
      }
      break;

    default:
      goalText = habit.frequency.type === 'daily' ? 'Daily goal' : 
                 `${habit.frequency.goal_per_week}x per week`;
  }

  return `${prefix}${goalText}`;
};