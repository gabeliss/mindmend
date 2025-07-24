import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Onboarding status tracking
export interface OnboardingStatus {
  hasSeenOnboarding: boolean;
  hasCompletedSetup: boolean;
  selectedCoachStyle?: string;
  createdHabitsCount: number;
  setupCompletedAt?: string;
}

// Storage keys
const STORAGE_KEYS = {
  HAS_SEEN_ONBOARDING: 'hasSeenOnboarding',
  ONBOARDING_COMPLETE: 'onboardingComplete',
  COACH_STYLE: 'selectedCoachStyle',
  CREATED_HABITS_COUNT: 'createdHabitsCount',
  SETUP_COMPLETED_AT: 'setupCompletedAt',
};

class OnboardingService {
  // Check if user has seen the initial onboarding screens
  async hasSeenOnboarding(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.HAS_SEEN_ONBOARDING);
      return value === 'true';
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
      return false;
    }
  }

  // Mark that user has seen the onboarding
  async markOnboardingSeen(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HAS_SEEN_ONBOARDING, 'true');
    } catch (error) {
      console.error('Failed to mark onboarding as seen:', error);
    }
  }

  // Check if user has completed the full setup
  async hasCompletedSetup(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
      return value === 'true';
    } catch (error) {
      console.error('Failed to check setup completion:', error);
      return false;
    }
  }

  // Mark setup as complete
  async markSetupComplete(
    coachStyle: string, 
    habitsCreated: number
  ): Promise<void> {
    try {
      const completedAt = new Date().toISOString();
      
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.ONBOARDING_COMPLETE, 'true'],
        [STORAGE_KEYS.COACH_STYLE, coachStyle],
        [STORAGE_KEYS.CREATED_HABITS_COUNT, habitsCreated.toString()],
        [STORAGE_KEYS.SETUP_COMPLETED_AT, completedAt],
      ]);
    } catch (error) {
      console.error('Failed to mark setup as complete:', error);
    }
  }

  // Get complete onboarding status
  async getOnboardingStatus(): Promise<OnboardingStatus> {
    try {
      const values = await AsyncStorage.multiGet([
        STORAGE_KEYS.HAS_SEEN_ONBOARDING,
        STORAGE_KEYS.ONBOARDING_COMPLETE,
        STORAGE_KEYS.COACH_STYLE,
        STORAGE_KEYS.CREATED_HABITS_COUNT,
        STORAGE_KEYS.SETUP_COMPLETED_AT,
      ]);

      const [
        hasSeenOnboarding,
        onboardingComplete,
        coachStyle,
        habitsCount,
        completedAt,
      ] = values.map(([_, value]) => value);

      return {
        hasSeenOnboarding: hasSeenOnboarding === 'true',
        hasCompletedSetup: onboardingComplete === 'true',
        selectedCoachStyle: coachStyle || undefined,
        createdHabitsCount: parseInt(habitsCount || '0', 10),
        setupCompletedAt: completedAt || undefined,
      };
    } catch (error) {
      console.error('Failed to get onboarding status:', error);
      return {
        hasSeenOnboarding: false,
        hasCompletedSetup: false,
        createdHabitsCount: 0,
      };
    }
  }

  // Reset all onboarding data (useful for testing or user reset)
  async resetOnboarding(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.HAS_SEEN_ONBOARDING,
        STORAGE_KEYS.ONBOARDING_COMPLETE,
        STORAGE_KEYS.COACH_STYLE,
        STORAGE_KEYS.CREATED_HABITS_COUNT,
        STORAGE_KEYS.SETUP_COMPLETED_AT,
      ]);
    } catch (error) {
      console.error('Failed to reset onboarding:', error);
    }
  }

  // Check if user should see a specific onboarding step
  async shouldShowFirstTimeSetup(): Promise<boolean> {
    const status = await this.getOnboardingStatus();
    return status.hasSeenOnboarding && !status.hasCompletedSetup;
  }

  // Check if user is completely new
  async isCompletelyNew(): Promise<boolean> {
    const status = await this.getOnboardingStatus();
    return !status.hasSeenOnboarding && !status.hasCompletedSetup;
  }

  // Check if user needs any onboarding
  async needsOnboarding(): Promise<boolean> {
    const status = await this.getOnboardingStatus();
    return !status.hasSeenOnboarding || !status.hasCompletedSetup;
  }

  // Get user's setup completion date
  async getSetupCompletionDate(): Promise<Date | null> {
    try {
      const completedAt = await AsyncStorage.getItem(STORAGE_KEYS.SETUP_COMPLETED_AT);
      return completedAt ? new Date(completedAt) : null;
    } catch (error) {
      console.error('Failed to get setup completion date:', error);
      return null;
    }
  }

  // Check if user completed setup recently (within last 7 days)
  async isRecentlyOnboarded(): Promise<boolean> {
    const completionDate = await this.getSetupCompletionDate();
    if (!completionDate) return false;

    const daysSinceCompletion = (Date.now() - completionDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCompletion <= 7;
  }

  // Get user's preferred coach style
  async getPreferredCoachStyle(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.COACH_STYLE);
    } catch (error) {
      console.error('Failed to get coach style:', error);
      return null;
    }
  }

  // Update preferred coach style
  async updateCoachStyle(coachStyle: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.COACH_STYLE, coachStyle);
    } catch (error) {
      console.error('Failed to update coach style:', error);
    }
  }
}

// Create and export service instance
export const onboardingService = new OnboardingService();

// Export utility functions for easier use in components
export const useOnboardingStatus = () => {
  const [status, setStatus] = React.useState<OnboardingStatus | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const currentStatus = await onboardingService.getOnboardingStatus();
      setStatus(currentStatus);
    } catch (error) {
      console.error('Failed to load onboarding status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markOnboardingSeen = async () => {
    await onboardingService.markOnboardingSeen();
    await loadStatus();
  };

  const markSetupComplete = async (coachStyle: string, habitsCreated: number) => {
    await onboardingService.markSetupComplete(coachStyle, habitsCreated);
    await loadStatus();
  };

  const resetOnboarding = async () => {
    await onboardingService.resetOnboarding();
    await loadStatus();
  };

  return {
    status,
    isLoading,
    markOnboardingSeen,
    markSetupComplete,
    resetOnboarding,
    refresh: loadStatus,
  };
};

