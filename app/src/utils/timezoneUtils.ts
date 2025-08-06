/**
 * Timezone utility functions for handling event timestamps
 */

/**
 * Formats a UTC timestamp to local time display format
 * @param utcTimestamp - ISO string in UTC (e.g., "2025-08-04T14:30:00Z")
 * @returns Formatted local time string (e.g., "2:30 PM")
 */
export const formatTimestampToLocalTime = (utcTimestamp: string): string => {
  const date = new Date(utcTimestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

/**
 * Formats a UTC timestamp to a full local date and time
 * @param utcTimestamp - ISO string in UTC
 * @returns Formatted local date and time string (e.g., "Aug 4, 2:30 PM")
 */
export const formatTimestampToLocalDateTime = (utcTimestamp: string): string => {
  const date = new Date(utcTimestamp);
  const timeStr = formatTimestampToLocalTime(utcTimestamp);
  const dateStr = date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
  
  return `${dateStr}, ${timeStr}`;
};

/**
 * Creates a UTC timestamp from a local date and time
 * @param date - The date (YYYY-MM-DD)
 * @param hours - Hours (0-23)
 * @param minutes - Minutes (0-59)
 * @returns ISO string in UTC
 */
export const createTimestampFromLocalTime = (
  date: string, 
  hours: number, 
  minutes: number
): string => {
  // Create date in user's local timezone
  const localDate = new Date(`${date}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`);
  return localDate.toISOString();
};

/**
 * Gets the current local time as a UTC timestamp
 * @returns ISO string in UTC for current time
 */
export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * Extracts local time components from a UTC timestamp
 * @param utcTimestamp - ISO string in UTC
 * @returns Object with hours and minutes in local time
 */
export const getLocalTimeComponents = (utcTimestamp: string): { hours: number; minutes: number } => {
  const date = new Date(utcTimestamp);
  return {
    hours: date.getHours(),
    minutes: date.getMinutes()
  };
};