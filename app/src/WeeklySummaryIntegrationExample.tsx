import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import PushCheckInPromptModal from './PushCheckInPromptModal';
import { useWeeklySummaryTiming } from './lib/weekly-summary-timing';

/**
 * Example of how to integrate the Weekly AI Summary Modal
 * into the main app with proper timing logic
 */
export default function WeeklySummaryIntegrationExample() {
  const [modalVisible, setModalVisible] = useState(false);
  const { timing } = useWeeklySummaryTiming();

  // Check timing when app becomes active or at app launch
  useEffect(() => {
    const checkSummaryTiming = () => {
      // Only show if timing system says we should
      if (timing?.shouldShowSummary && timing.isOptimalTime) {
        setModalVisible(true);
      }
    };

    // Check on mount
    checkSummaryTiming();

    // Optional: Set up interval to check periodically
    const interval = setInterval(checkSummaryTiming, 60 * 1000); // Check every minute
    
    return () => clearInterval(interval);
  }, [timing]);

  const handleNavigateToHabits = () => {
    // Navigate to habits screen
    console.log('Navigating to habits screen');
  };

  const handleNavigateToJournal = () => {
    // Navigate to journal screen
    console.log('Navigating to journal screen');
  };

  const handleNavigateToCoach = () => {
    // Navigate to coach screen
    console.log('Navigating to coach screen');
  };

  const handleNavigateToStreaks = () => {
    // Navigate to streaks screen
    console.log('Navigating to streaks screen');
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Your main app content here */}
      
      <PushCheckInPromptModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onNavigateToHabits={handleNavigateToHabits}
        onNavigateToJournal={handleNavigateToJournal}
        onNavigateToCoach={handleNavigateToCoach}
        onNavigateToStreaks={handleNavigateToStreaks}
      />
    </View>
  );
}

/*
Usage Notes:
1. The modal automatically handles timing logic internally
2. It only shows when timing?.shouldShowSummary is true
3. Users can engage with 3 action-oriented CTAs instead of just closing
4. Proper dismissal tracking prevents modal fatigue
5. Optimal timing windows: Sunday evening (6pm+) or Monday morning (before 12pm)
6. Manual access can be provided via Coach tab using WeeklySummaryManager.getManualSummaryData()
*/