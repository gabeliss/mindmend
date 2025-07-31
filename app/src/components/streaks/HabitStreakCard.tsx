import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CalendarView } from './CalendarView';

interface Streak {
  habitId: string;
  currentStreak: number;
  longestStreak: number;
  habit: {
    title: string;
    habitType: 'BUILD' | 'AVOID';
  };
}

interface CalendarDay {
  date: number;
  dayName: string;
  isCompleted: boolean;
  isSkipped: boolean;
  isToday: boolean;
  isEditable: boolean;
  fullDate: string;
}

interface HabitStreakCardProps {
  streak: Streak;
  calendarData: CalendarDay[];
  streakColor: string;
  streakStatus: string;
  todayStatusIcon: string;
  onDayTap: (day: CalendarDay, streak: Streak) => void;
}

export const HabitStreakCard: React.FC<HabitStreakCardProps> = ({
  streak,
  calendarData,
  streakColor,
  streakStatus,
  todayStatusIcon,
  onDayTap,
}) => {
  const handleDayTap = (day: CalendarDay) => {
    onDayTap(day, streak);
  };

  return (
    <View style={styles.streakCard}>
      <View style={styles.streakHeader}>
        <View style={styles.habitInfo}>
          <Text style={styles.habitTitle}>{streak.habit.title}</Text>
          <Text style={styles.habitType}>
            {streak.habit.habitType === 'BUILD' ? '✅ Build' : '🚫 Break'}
          </Text>
        </View>
        <View style={[
          styles.streakBadge,
          { backgroundColor: streakColor }
        ]}>
          <Text style={styles.streakNumber}>
            {todayStatusIcon}{streak.currentStreak}
          </Text>
        </View>
      </View>
      
      <View style={styles.streakProgress}>
        <View style={styles.progressInfo}>
          <Text style={styles.streakStatus}>
            {streakStatus}
          </Text>
          <Text style={styles.bestStreak}>
            Best: {streak.longestStreak} days
          </Text>
        </View>
        
        {/* Progress bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBarFill,
                { 
                  width: `${Math.min((streak.currentStreak / Math.max(streak.longestStreak, 7)) * 100, 100)}%`,
                  backgroundColor: streakColor
                }
              ]}
            />
          </View>
        </View>
      </View>

      {/* Calendar view */}
      <CalendarView calendarData={calendarData} onDayTap={handleDayTap} />
    </View>
  );
};

const styles = StyleSheet.create({
  streakCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  habitInfo: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  habitType: {
    fontSize: 12,
    color: '#64748B',
  },
  streakBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  streakNumber: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  streakProgress: {
    marginBottom: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  streakStatus: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3748',
  },
  bestStreak: {
    fontSize: 12,
    color: '#64748B',
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});