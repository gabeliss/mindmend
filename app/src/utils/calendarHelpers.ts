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


export const generateCalendarDataFromHistory = (historyData: Array<{
  date: string;
  hasEvent: boolean;
  eventType?: string;
  contributes: boolean;
}>): CalendarDay[] => {
  const today = new Date();
  
  return historyData.map((historyItem, index) => {
    const date = new Date(historyItem.date + 'T00:00:00');
    const isToday = index === historyData.length - 1; // Last item is today
    
    return {
      date: date.getDate(),
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      isCompleted: historyItem.hasEvent && historyItem.eventType === 'COMPLETED',
      isSkipped: historyItem.hasEvent && (historyItem.eventType === 'SKIPPED' || historyItem.eventType === 'RELAPSED'),
      isToday,
      isEditable: !isToday, // All days except today are editable
      fullDate: historyItem.date
    };
  });
};

