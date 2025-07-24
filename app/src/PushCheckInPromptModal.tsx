import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from './lib/design-system';
import { WeeklySummaryManager, useWeeklySummaryTiming } from './lib/weekly-summary-timing';

interface WeeklyStat {
  label: string;
  current: string;
  previous?: string;
  trend: 'up' | 'down' | 'same';
  color: string;
  icon: string;
  action: () => void;
}

interface WeeklyAISummaryProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToHabits?: () => void;
  onNavigateToJournal?: () => void;
  onNavigateToCoach?: () => void;
  onNavigateToStreaks?: () => void;
}

// Strategic Weekly AI Summary with intelligent timing
// Only appears once per week during optimal engagement windows
export default function PushCheckInPromptModal({ 
  visible, 
  onClose, 
  onNavigateToHabits,
  onNavigateToJournal,
  onNavigateToCoach,
  onNavigateToStreaks
}: WeeklyAISummaryProps) {
  const [lastReviewed, setLastReviewed] = useState<Date | null>(null);
  const [motivationalMessage, setMotivationalMessage] = useState('');
  const [aiInsight, setAiInsight] = useState('');
  
  // Use the timing system
  const { timing, showSummary, dismissSummary } = useWeeklySummaryTiming();
  
  // Mock data - in real app, this would come from analytics
  const weeklyStats: WeeklyStat[] = [
    {
      label: 'Workouts',
      current: '5/7',
      previous: '6/7',
      trend: 'down',
      color: Colors.secondary[500],
      icon: '💪',
      action: () => onNavigateToHabits?.()
    },
    {
      label: 'Clean Streak',
      current: '6 days',
      previous: '4 days',
      trend: 'up',
      color: Colors.primary[500],
      icon: '🔥',
      action: () => onNavigateToStreaks?.()
    },
    {
      label: 'Weakest Hour',
      current: '11pm Sun',
      previous: '10pm Sat',
      trend: 'same',
      color: Colors.alert[500],
      icon: '⚠️',
      action: () => onNavigateToJournal?.()
    }
  ];
  
  useEffect(() => {
    if (visible && timing?.shouldShowSummary) {
      // Mark as shown in timing system
      showSummary();
      
      // Generate motivational message based on performance
      const streakImproving = weeklyStats[1].trend === 'up';
      const workoutDown = weeklyStats[0].trend === 'down';
      
      if (streakImproving && workoutDown) {
        setMotivationalMessage("Your streak is growing strong! Let's get those workouts back on track.");
      } else if (streakImproving) {
        setMotivationalMessage("You're building unstoppable momentum. Let's keep it rolling this week.");
      } else {
        setMotivationalMessage("Every week is a fresh start. Let's make this one your strongest yet.");
      }
      
      // Generate AI insight
      setAiInsight("You're most vulnerable to urges after 10pm on weekends. Consider setting a phone lockout or evening ritual to protect your progress.");
      
      // Update last reviewed
      setLastReviewed(new Date());
    }
  }, [visible, timing, showSummary]);
  
  const getTrendIcon = (trend: 'up' | 'down' | 'same') => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'same': return '➡️';
    }
  };
  
  const getTrendColor = (trend: 'up' | 'down' | 'same') => {
    switch (trend) {
      case 'up': return Colors.secondary[600];
      case 'down': return Colors.alert[600];
      case 'same': return Colors.neutral[500];
    }
  };
  
  const handleCoachMe = () => {
    onNavigateToCoach?.();
    onClose();
    // User engaged with action - don't count as dismissal
  };
  
  const handlePlanWeek = () => {
    onNavigateToHabits?.();
    onClose();
    // User engaged with action - don't count as dismissal
  };
  
  const handleJournalReflection = () => {
    onNavigateToJournal?.();
    onClose();
    // User engaged with action - don't count as dismissal
  };
  
  const handleClose = () => {
    // Mark as dismissed if user closes without taking action
    dismissSummary();
    onClose();
  };
  
  // Only show modal if timing system says it should be shown
  const shouldShowModal = visible && timing?.shouldShowSummary;

  return (
    <Modal visible={shouldShowModal} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>🤖 Weekly AI Summary</Text>
              <Text style={styles.headerSubtitle}>{motivationalMessage}</Text>
              {lastReviewed && (
                <Text style={styles.lastReviewed}>
                  Last reviewed: {lastReviewed.toLocaleDateString()}
                </Text>
              )}
              {timing && (
                <Text style={styles.timingInfo}>
                  Week {timing.currentWeekNumber} • {timing.isOptimalTime ? 'Optimal time' : 'Outside optimal window'}
                </Text>
              )}
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Weekly Stats */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>This Week's Performance</Text>
              <View style={styles.statsContainer}>
                {weeklyStats.map((stat, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={[styles.statCard, { borderLeftColor: stat.color }]}
                    onPress={stat.action}
                  >
                    <View style={styles.statHeader}>
                      <Text style={styles.statIcon}>{stat.icon}</Text>
                      <View style={styles.statTrend}>
                        <Text style={styles.trendIcon}>{getTrendIcon(stat.trend)}</Text>
                      </View>
                    </View>
                    <Text style={[styles.statValue, { color: stat.color }]}>{stat.current}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                    {stat.previous && (
                      <Text style={[styles.statComparison, { color: getTrendColor(stat.trend) }]}>
                        vs {stat.previous} last week
                      </Text>
                    )}
                    <View style={styles.tapHint}>
                      <Text style={styles.tapHintText}>Tap for details</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* AI Insight */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>AI Coach Insight</Text>
              <View style={styles.insightCard}>
                <View style={styles.insightHeader}>
                  <Text style={styles.insightIcon}>💡</Text>
                  <Text style={styles.insightTitle}>Pattern Detected</Text>
                </View>
                <Text style={styles.insightText}>{aiInsight}</Text>
              </View>
            </View>
          </ScrollView>
          
          {/* Action CTAs */}
          <View style={styles.footer}>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.primaryAction} onPress={handleCoachMe}>
                <Text style={styles.primaryActionText}>🧠 Coach Me</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryAction} onPress={handlePlanWeek}>
                <Text style={styles.secondaryActionText}>🎯 Plan This Week</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.tertiaryAction} onPress={handleJournalReflection}>
              <Text style={styles.tertiaryActionText}>✍️ Journal Reflection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    overflow: 'hidden',
    ...Shadows.lg
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.xl,
    backgroundColor: Colors.primary[500],
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl
  },
  headerContent: {
    flex: 1
  },
  headerTitle: {
    ...Typography.h3,
    color: '#FFFFFF',
    marginBottom: Spacing.xs
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    color: Colors.primary[100],
    lineHeight: 20,
    marginBottom: Spacing.xs
  },
  lastReviewed: {
    ...Typography.caption,
    color: Colors.primary[200]
  },
  timingInfo: {
    ...Typography.caption,
    color: Colors.primary[200],
    fontStyle: 'italic'
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600'
  },
  
  // Content
  content: {
    flex: 1
  },
  section: {
    padding: Spacing.xl
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.neutral[800],
    marginBottom: Spacing.lg
  },
  
  // Stats
  statsContainer: {
    gap: Spacing.md
  },
  statCard: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderLeftWidth: 4,
    position: 'relative'
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm
  },
  statIcon: {
    fontSize: 24
  },
  statTrend: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.sm,
    padding: Spacing.xs,
    minWidth: 24,
    alignItems: 'center'
  },
  trendIcon: {
    fontSize: 12
  },
  statValue: {
    ...Typography.h2,
    marginBottom: Spacing.xs
  },
  statLabel: {
    ...Typography.button,
    color: Colors.neutral[700],
    marginBottom: Spacing.xs
  },
  statComparison: {
    ...Typography.caption,
    marginBottom: Spacing.sm
  },
  tapHint: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2
  },
  tapHintText: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontSize: 10
  },
  
  // AI Insight
  insightCard: {
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary[500]
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm
  },
  insightIcon: {
    fontSize: 20,
    marginRight: Spacing.sm
  },
  insightTitle: {
    ...Typography.button,
    color: Colors.primary[800]
  },
  insightText: {
    ...Typography.bodySmall,
    color: Colors.primary[700],
    lineHeight: 20,
    fontStyle: 'italic'
  },
  
  // Footer Actions
  footer: {
    padding: Spacing.xl,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200]
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md
  },
  primaryAction: {
    flex: 1,
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center'
  },
  primaryActionText: {
    ...Typography.button,
    color: '#FFFFFF'
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: Colors.secondary[500],
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center'
  },
  secondaryActionText: {
    ...Typography.button,
    color: '#FFFFFF'
  },
  tertiaryAction: {
    backgroundColor: Colors.neutral[100],
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center'
  },
  tertiaryActionText: {
    ...Typography.button,
    color: Colors.neutral[700]
  }
});