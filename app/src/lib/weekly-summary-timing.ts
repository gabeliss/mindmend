// Weekly AI Summary Modal Timing Logic
// Ensures the modal appears only when it provides maximum value

import React, { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_SUMMARY_KEY = 'lastWeeklySummaryShown';
const SUMMARY_DISMISSED_KEY = 'weeklySummaryDismissedThisWeek';

interface WeeklySummaryTiming {
  shouldShowSummary: boolean;
  daysSinceLastShown: number;
  currentWeekNumber: number;
  isOptimalTime: boolean;
}

export class WeeklySummaryManager {
  
  /**
   * Determines if the Weekly AI Summary should be shown
   * Only shows once per week during optimal times
   */
  static async shouldShowWeeklySummary(): Promise<WeeklySummaryTiming> {
    const now = new Date();
    const currentWeekNumber = getWeekNumber(now);
    
    // Check when it was last shown
    const lastShownDate = await AsyncStorage.getItem(LAST_SUMMARY_KEY);
    const lastShownWeek = lastShownDate ? getWeekNumber(new Date(lastShownDate)) : 0;
    
    // Check if user dismissed it this week
    const dismissedThisWeek = await AsyncStorage.getItem(SUMMARY_DISMISSED_KEY);
    const dismissedWeekNumber = dismissedThisWeek ? parseInt(dismissedThisWeek) : 0;
    
    const daysSinceLastShown = lastShownDate 
      ? Math.floor((now.getTime() - new Date(lastShownDate).getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    
    const isOptimalTime = isOptimalSummaryTime(now);
    const hasNewWeekStarted = currentWeekNumber > lastShownWeek;
    const notDismissedThisWeek = dismissedWeekNumber !== currentWeekNumber;
    
    const shouldShow = hasNewWeekStarted && 
                      notDismissedThisWeek && 
                      daysSinceLastShown >= 6 && 
                      isOptimalTime;
    
    return {
      shouldShowSummary: shouldShow,
      daysSinceLastShown,
      currentWeekNumber,
      isOptimalTime
    };
  }
  
  /**
   * Marks the summary as shown for this week
   */
  static async markSummaryShown(): Promise<void> {
    const now = new Date();
    await AsyncStorage.setItem(LAST_SUMMARY_KEY, now.toISOString());
    
    // Clear dismissal flag since they viewed it
    await AsyncStorage.removeItem(SUMMARY_DISMISSED_KEY);
  }
  
  /**
   * Marks the summary as dismissed for this week
   * Prevents it from showing again until next week
   */
  static async markSummaryDismissed(): Promise<void> {
    const currentWeekNumber = getWeekNumber(new Date());
    await AsyncStorage.setItem(SUMMARY_DISMISSED_KEY, currentWeekNumber.toString());
  }
  
  /**
   * Allows manual access to the summary (from Coach tab)
   * Bypasses timing restrictions
   */
  static async getManualSummaryData() {
    // Return summary data regardless of timing
    // This is for when users manually access it via Coach tab
    return {
      available: true,
      reason: 'manual_access'
    };
  }
  
  /**
   * Reset timing for testing purposes
   */
  static async resetTiming(): Promise<void> {
    await AsyncStorage.removeItem(LAST_SUMMARY_KEY);
    await AsyncStorage.removeItem(SUMMARY_DISMISSED_KEY);
  }
}

/**
 * Determines if current time is optimal for showing summary
 * Sunday evening (after 6pm) OR Monday morning (before 12pm)
 */
function isOptimalSummaryTime(date: Date): boolean {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday
  const hour = date.getHours();
  
  // Sunday evening after 6pm
  if (dayOfWeek === 0 && hour >= 18) {
    return true;
  }
  
  // Monday morning before 12pm
  if (dayOfWeek === 1 && hour < 12) {
    return true;
  }
  
  return false;
}

/**
 * Gets the week number of the year for a given date
 */
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

/**
 * Hook for components to easily check summary timing
 */
export function useWeeklySummaryTiming() {
  const [timing, setTiming] = useState<WeeklySummaryTiming | null>(null);
  
  useEffect(() => {
    WeeklySummaryManager.shouldShowWeeklySummary().then(setTiming);
  }, []);
  
  const showSummary = useCallback(() => {
    WeeklySummaryManager.markSummaryShown();
  }, []);
  
  const dismissSummary = useCallback(() => {
    WeeklySummaryManager.markSummaryDismissed();
  }, []);
  
  return {
    timing,
    showSummary,
    dismissSummary,
    refreshTiming: () => WeeklySummaryManager.shouldShowWeeklySummary().then(setTiming)
  };
}

// For debugging/testing
export const WeeklySummaryDebug = {
  async getCurrentStatus() {
    const timing = await WeeklySummaryManager.shouldShowWeeklySummary();
    const now = new Date();
    
    return {
      currentTime: now.toISOString(),
      dayOfWeek: now.getDay(),
      hour: now.getHours(),
      isOptimalTime: isOptimalSummaryTime(now),
      weekNumber: getWeekNumber(now),
      ...timing
    };
  },
  
  async forceShow() {
    await WeeklySummaryManager.resetTiming();
    return "Summary timing reset - it will show at next optimal time";
  },
  
  async simulateOptimalTime() {
    // Simulate that it's Sunday evening
    const lastSunday = new Date();
    lastSunday.setDate(lastSunday.getDate() - lastSunday.getDay()); // Go to Sunday
    lastSunday.setHours(19, 0, 0, 0); // 7 PM
    
    await AsyncStorage.setItem(LAST_SUMMARY_KEY, 
      new Date(lastSunday.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString() // 8 days ago
    );
    
    return "Simulated optimal timing - summary should show now";
  }
};