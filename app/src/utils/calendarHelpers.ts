import { getTodayString } from './streakHelpers';

export interface CalendarDay {
  date: number;
  dayName: string;
  isCompleted: boolean;
  isSkipped: boolean;
  isToday: boolean;
  isEditable: boolean;
  fullDate: string;
}

export const generateCalendarData = (streak: any, recentEvents: any[]): CalendarDay[] => {
  const days = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    const dateString = date.getFullYear() + '-' + 
      String(date.getMonth() + 1).padStart(2, '0') + '-' + 
      String(date.getDate()).padStart(2, '0');
    
    const wasCompleted = recentEvents.some(event => 
      event.habitId === streak.habitId && 
      event.eventType === 'COMPLETED' &&
      event.occurredAt.startsWith(dateString)
    );
    
    const wasSkipped = recentEvents.some(event => 
      event.habitId === streak.habitId && 
      (event.eventType === 'SKIPPED' || event.eventType === 'RELAPSED') &&
      event.occurredAt.startsWith(dateString)
    );
    
    days.push({
      date: date.getDate(),
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      isCompleted: wasCompleted,
      isSkipped: wasSkipped,
      isToday: i === 0,
      isEditable: i > 0 && i <= 6,
      fullDate: dateString
    });
  }
  
  return days;
};

export const getDateRange = (daysBack: number = 6) => {
  const today = new Date();
  const pastDate = new Date(today);
  pastDate.setDate(today.getDate() - daysBack);
  
  const startDate = pastDate.getFullYear() + '-' + 
    String(pastDate.getMonth() + 1).padStart(2, '0') + '-' + 
    String(pastDate.getDate()).padStart(2, '0');
  const endDate = today.getFullYear() + '-' + 
    String(today.getMonth() + 1).padStart(2, '0') + '-' + 
    String(today.getDate()).padStart(2, '0');
    
  return { startDate, endDate };
};