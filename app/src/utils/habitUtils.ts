import { Habit, HabitEvent } from '../types/habits';

export const getHabitEventsForHabit = (habitId: string, events: HabitEvent[]): HabitEvent[] => {
  return events.filter(event => event.habit_id === habitId);
};

export const getDateString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const formatTime = (timeValue: number): string => {
  const hours = Math.floor(timeValue);
  const minutes = Math.round((timeValue - hours) * 60);
  
  if (minutes === 0) {
    return `${hours}:00`;
  }
  
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
};

export const parseTimeString = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours + (minutes || 0) / 60;
};

export const isHabitScheduledForDate = (habit: Habit, date: Date): boolean => {
  if (habit.frequency.type === 'daily') {
    return true;
  }
  
  if (habit.frequency.type === 'specific_days') {
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
    return habit.frequency.days_of_week?.includes(dayOfWeek) || false;
  }
  
  return true; // weekly habits are always "scheduled"
};

export const getHabitStatusForDate = (habit: Habit, date: Date, events: HabitEvent[]): 'completed' | 'failed' | 'not_marked' => {
  const dateString = getDateString(date);
  const event = events.find(e => e.habit_id === habit.id && e.date === dateString);
  
  if (!event) {
    return 'not_marked';
  }
  
  return event.status === 'completed' ? 'completed' : 'failed';
};

export const calculateStreakDays = (habit: Habit, events: HabitEvent[]): number => {
  const habitEvents = events
    .filter(e => e.habit_id === habit.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  if (habitEvents.length === 0) return 0;
  
  let streak = 0;
  let currentDate = new Date();
  
  // Check each day going backwards
  for (let i = 0; i < 365; i++) { // max 365 days to prevent infinite loop
    const dateString = getDateString(currentDate);
    const event = habitEvents.find(e => e.date === dateString);
    
    if (event) {
      if (event.status === 'completed') {
        streak++;
      } else if (event.status === 'failed') {
        break; // streak broken
      }
    } else if (isHabitScheduledForDate(habit, currentDate)) {
      // If it's a scheduled day but no event exists, streak is broken
      // Exception: if it's today, we don't break the streak yet
      const today = getDateString(new Date());
      if (dateString !== today) {
        break;
      }
    }
    
    currentDate.setDate(currentDate.getDate() - 1);
  }
  
  return streak;
};

export const getDaysUntilNextScheduled = (habit: Habit): number => {
  if (habit.frequency.type === 'daily') {
    return 0; // today
  }
  
  if (habit.frequency.type === 'specific_days' && habit.frequency.days_of_week) {
    const today = new Date();
    const todayDay = today.toLocaleDateString('en-US', { weekday: 'short' });
    
    // If today is a scheduled day, return 0
    if (habit.frequency.days_of_week.includes(todayDay)) {
      return 0;
    }
    
    // Find the next scheduled day
    for (let i = 1; i <= 7; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + i);
      const nextDay = nextDate.toLocaleDateString('en-US', { weekday: 'short' });
      
      if (habit.frequency.days_of_week.includes(nextDay)) {
        return i;
      }
    }
  }
  
  return 0;
};