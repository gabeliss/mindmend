import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface TodaysProgress {
  completedHabits: number;
  totalHabits: number;
  currentStreak: number;
  motivationalMessage?: string;
}

interface ProgressSectionProps {
  todaysProgress: TodaysProgress;
  user?: { displayName?: string };
  onStartDayCheckIn: () => void;
}

export const ProgressSection: React.FC<ProgressSectionProps> = ({
  todaysProgress,
  user,
  onStartDayCheckIn,
}) => {
  return (
    <View>
      {user?.displayName && (
        <Text style={styles.welcomeText}>Welcome back, {user.displayName}! 👋</Text>
      )}
      
      <View style={styles.progressSection}>
        <Text style={styles.progressText}>
          {todaysProgress.completedHabits} of {todaysProgress.totalHabits} habits completed
        </Text>
        {todaysProgress.motivationalMessage && (
          <Text style={styles.motivation}>{todaysProgress.motivationalMessage}</Text>
        )}
        
        <TouchableOpacity style={styles.startDayButton} onPress={onStartDayCheckIn}>
          <Text style={styles.startDayButtonText}>🌅 Start Day Check-In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4F8EF7',
    marginBottom: 8,
  },
  progressSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressText: {
    fontSize: 16,
    color: '#2D3748',
    textAlign: 'center',
    fontWeight: '600',
  },
  motivation: {
    fontSize: 14,
    color: '#4F8EF7',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  startDayButton: {
    backgroundColor: '#4F8EF7',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#4F8EF7',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  startDayButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});