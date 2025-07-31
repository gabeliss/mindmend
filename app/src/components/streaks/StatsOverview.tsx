import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StreakStats {
  totalStreaks: number;
  activeStreaks: number;
  averageStreak: number;
  longestEverStreak: number;
  totalDaysLogged: number;
}

interface StatsOverviewProps {
  streakStats: StreakStats;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ streakStats }) => {
  return (
    <View style={styles.statsContainer}>
      <Text style={styles.sectionTitle}>Your Progress</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{streakStats.activeStreaks}</Text>
          <Text style={styles.statLabel}>Active Streaks</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{streakStats.longestEverStreak}</Text>
          <Text style={styles.statLabel}>Longest Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{streakStats.averageStreak}</Text>
          <Text style={styles.statLabel}>Average</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{streakStats.totalDaysLogged}</Text>
          <Text style={styles.statLabel}>Active Days</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 16,
  },
  statsContainer: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4F8EF7',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
});