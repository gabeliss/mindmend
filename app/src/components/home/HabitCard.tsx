import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';

interface HabitWithStreak {
  id: string;
  title: string;
  description?: string;
  habitType: 'BUILD' | 'AVOID';
  streak?: number;
  completedToday?: boolean;
  skippedToday?: boolean;
  suggestedTime?: string;
  isOverdue?: boolean;
  todayEventId?: string;
  skipEventId?: string;
}

interface HabitCardProps {
  habit: HabitWithStreak;
  animatedValue: Animated.Value;
  onToggleCompletion: (habitId: string, habitType: 'BUILD' | 'AVOID') => void;
  onSkipHabit: (habitId: string, habitType: 'BUILD' | 'AVOID') => void;
  onUndoSkip: (habitId: string) => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  animatedValue,
  onToggleCompletion,
  onSkipHabit,
  onUndoSkip,
}) => {
  console.log(`HabitCard rendering: ${habit.title}, streak: ${habit.streak}, completedToday: ${habit.completedToday}`);
  
  const isCompleted = habit.completedToday || false;
  const isSkipped = habit.skippedToday || false;
  const isOverdue = habit.isOverdue || false;

  return (
    <Animated.View 
      style={[
        styles.habitCard,
        habit.habitType === 'BUILD' ? styles.buildHabit : styles.breakHabit,
        isOverdue && styles.overdueHabit,
        isCompleted && styles.habitCardCompleted,
        isSkipped && styles.habitCardSkipped,
        { transform: [{ scale: animatedValue }] }
      ]}
    >
      {/* Header with title and streak */}
      <View style={styles.habitHeader}>
        <Text style={[
          styles.habitTitle, 
          isCompleted && styles.habitTitleCompleted,
          isSkipped && styles.habitTitleSkipped
        ]}>
          {habit.title}
        </Text>
        {habit.streak && habit.streak > 0 && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>
              🔥 {habit.streak} day{habit.streak > 1 ? 's' : ''} {habit.habitType === 'AVOID' ? 'clean' : 'streak'}
            </Text>
          </View>
        )}
      </View>

      {/* Description and time */}
      <View style={styles.habitDetails}>
        <Text style={styles.habitDescription}>{habit.description}</Text>
        <Text style={[styles.habitTime, isOverdue && styles.habitTimeOverdue]}>
          {`${habit.suggestedTime}${isOverdue ? ' (Missed)' : ''}`}
        </Text>
      </View>

      {/* Actions at bottom */}
      <View style={styles.habitActions}>
        {habit.habitType === 'BUILD' ? (
          <>
            {isSkipped ? (
              <TouchableOpacity 
                style={styles.skippedStatus}
                onPress={() => onUndoSkip(habit.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.skippedStatusText}>Skipped ✕</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity 
                  style={[styles.completeTag, isCompleted && styles.completeTagCompleted]}
                  onPress={() => onToggleCompletion(habit.id, habit.habitType)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.completeTagText, isCompleted && styles.completeTagTextCompleted]}>
                    {isCompleted ? 'Completed ✓' : 'Complete'}
                  </Text>
                </TouchableOpacity>
                {!isCompleted && (
                  <TouchableOpacity 
                    style={styles.skipButton}
                    onPress={() => onSkipHabit(habit.id, habit.habitType)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.skipButtonText}>Skip</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </>
        ) : (
          <>
            {isSkipped ? (
              <TouchableOpacity 
                style={styles.relapsedStatus}
                onPress={() => onUndoSkip(habit.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.relapsedStatusText}>Relapsed ✕</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity 
                  style={[styles.avoidTag, isCompleted && styles.avoidTagCompleted]}
                  onPress={() => onToggleCompletion(habit.id, habit.habitType)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.avoidTagText, isCompleted && styles.avoidTagTextCompleted]}>
                    {isCompleted ? 'Avoided ✓' : 'Avoid'}
                  </Text>
                </TouchableOpacity>
                {!isCompleted && (
                  <TouchableOpacity 
                    style={styles.relapseButton}
                    onPress={() => onSkipHabit(habit.id, habit.habitType)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.relapseButtonText}>Relapse</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  habitCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  buildHabit: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  breakHabit: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  overdueHabit: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  habitCardCompleted: {
    backgroundColor: '#F0FDF4',
    opacity: 0.9,
  },
  habitCardSkipped: {
    backgroundColor: '#FEF2F2',
    opacity: 0.8,
    borderLeftColor: '#DC2626',
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  habitTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  habitTitleCompleted: {
    color: '#6B7280',
    textDecorationLine: 'line-through',
  },
  habitTitleSkipped: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  streakBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  habitDetails: {
    marginBottom: 16,
  },
  habitDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  habitTime: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  habitTimeOverdue: {
    color: '#EF4444',
    fontWeight: '600',
  },
  habitActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
  },
  completeTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#EBF8FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  completeTagCompleted: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  completeTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369A1',
  },
  completeTagTextCompleted: {
    color: '#059669',
  },
  avoidTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#EBF8FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  avoidTagCompleted: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  avoidTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369A1',
  },
  avoidTagTextCompleted: {
    color: '#059669',
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  skipButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  relapseButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  relapseButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  skippedStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    shadowColor: '#DC2626',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  skippedStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  relapsedStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    shadowColor: '#DC2626',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  relapsedStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
});