import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { Colors, Typography, CoachingCopy, Spacing, BorderRadius, Shadows } from './lib/design-system';

interface WeeklyInsight {
  category: 'slip' | 'success' | 'pattern' | 'recommendation';
  title: string;
  description: string;
  icon: string;
}

interface WeeklyReportModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AIWeeklyReportModal({ visible, onClose }: WeeklyReportModalProps) {
  const [emailReportsEnabled, setEmailReportsEnabled] = useState(true);
  
  const weeklyInsights: WeeklyInsight[] = [
    {
      category: 'success',
      title: 'Massive Win This Week',
      description: 'You resisted 8/10 urges - your highest success rate yet! Walking breaks were your secret weapon.',
      icon: '🏆'
    },
    {
      category: 'slip',
      title: 'Learning Moment',
      description: 'Tuesday night slip happened 15 minutes after checking work emails. Your stress trigger is getting predictable.',
      icon: '🎯'
    },
    {
      category: 'pattern',
      title: 'Pattern Discovery',
      description: 'You journal 3x more on successful days. Evening reflection = stronger next-day performance.',
      icon: '🔍'
    },
    {
      category: 'recommendation',
      title: 'Next Week Focus',
      description: 'Double down on walking breaks. Add 2-minute breathing exercise after checking emails.',
      icon: '💡'
    }
  ];

  const weekStats = {
    streakDays: 5,
    urgesResisted: 8,
    totalUrges: 10,
    journalEntries: 4,
    moodTrend: 'improving'
  };

  const getInsightStyle = (category: string) => {
    switch (category) {
      case 'success':
        return { backgroundColor: Colors.secondary[50], borderColor: Colors.secondary[500] };
      case 'slip':
        return { backgroundColor: Colors.alert[50], borderColor: Colors.alert[400] };
      case 'pattern':
        return { backgroundColor: Colors.primary[50], borderColor: Colors.primary[500] };
      case 'recommendation':
        return { backgroundColor: Colors.warning[50], borderColor: Colors.warning[500] };
      default:
        return { backgroundColor: Colors.neutral[50], borderColor: Colors.neutral[300] };
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>🤖 Weekly Coach Report</Text>
            <Text style={styles.headerSubtitle}>Your growth insights & next week's game plan</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Weekly Stats */}
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>This Week's Numbers</Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { borderLeftColor: Colors.secondary[500] }]}>
                <Text style={styles.statNumber}>{weekStats.streakDays}</Text>
                <Text style={styles.statLabel}>Clean Days</Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: Colors.primary[500] }]}>
                <Text style={styles.statNumber}>{weekStats.urgesResisted}/{weekStats.totalUrges}</Text>
                <Text style={styles.statLabel}>Urges Resisted</Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: Colors.warning[500] }]}>
                <Text style={styles.statNumber}>{weekStats.journalEntries}</Text>
                <Text style={styles.statLabel}>Journal Entries</Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: Colors.secondary[500] }]}>
                <Text style={styles.statNumber}>📈</Text>
                <Text style={styles.statLabel}>Mood: {weekStats.moodTrend}</Text>
              </View>
            </View>
          </View>

          {/* AI Insights */}
          <View style={styles.insightsSection}>
            <Text style={styles.sectionTitle}>AI Coach Insights</Text>
            {weeklyInsights.map((insight, index) => (
              <View 
                key={index} 
                style={[styles.insightCard, getInsightStyle(insight.category)]}
              >
                <View style={styles.insightHeader}>
                  <Text style={styles.insightIcon}>{insight.icon}</Text>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                </View>
                <Text style={styles.insightDescription}>{insight.description}</Text>
              </View>
            ))}
          </View>

          {/* Next Week Strategy */}
          <View style={styles.strategySection}>
            <Text style={styles.sectionTitle}>Next Week's Strategy</Text>
            <View style={styles.strategyCard}>
              <Text style={styles.strategyIcon}>🎯</Text>
              <View style={styles.strategyContent}>
                <Text style={styles.strategyTitle}>Your Mission</Text>
                <Text style={styles.strategyDescription}>
                  Focus on evening journaling (your success multiplier) and implement the 2-minute breathing routine after emails. 
                  You're building serious momentum - let's keep it rolling! 💪
                </Text>
              </View>
            </View>
          </View>

          {/* Settings */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Report Settings</Text>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Weekly Email Reports</Text>
                <Text style={styles.settingDescription}>Get this report delivered every Sunday</Text>
              </View>
              <Switch
                value={emailReportsEnabled}
                onValueChange={setEmailReportsEnabled}
                trackColor={{ false: Colors.neutral[300], true: Colors.primary[200] }}
                thumbColor={emailReportsEnabled ? Colors.primary[500] : Colors.neutral[400]}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.shareButton}>
            <Text style={styles.shareButtonText}>📧 Share Report</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeFooterButton} onPress={onClose}>
            <Text style={styles.closeFooterButtonText}>Got it, Coach!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50]
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.xl,
    paddingTop: Spacing['4xl'],
    backgroundColor: Colors.primary[500],
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl
  },
  headerContent: {
    flex: 1
  },
  headerTitle: {
    ...Typography.h2,
    color: '#FFFFFF',
    marginBottom: Spacing.xs
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    color: Colors.primary[100]
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  },
  content: {
    flex: 1,
    padding: Spacing.xl
  },
  
  // Stats Section
  statsSection: {
    marginBottom: Spacing['3xl']
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.lg,
    color: Colors.neutral[800]
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '48%',
    borderLeftWidth: 4,
    ...Shadows.sm
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.neutral[800],
    marginBottom: Spacing.xs
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.neutral[600]
  },
  
  // Insights Section
  insightsSection: {
    marginBottom: Spacing['3xl']
  },
  insightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderLeftWidth: 4
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
    color: Colors.neutral[800]
  },
  insightDescription: {
    ...Typography.bodySmall,
    color: Colors.neutral[700],
    lineHeight: 20
  },
  
  // Strategy Section
  strategySection: {
    marginBottom: Spacing['3xl']
  },
  strategyCard: {
    backgroundColor: Colors.secondary[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.secondary[200],
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  strategyIcon: {
    fontSize: 24,
    marginRight: Spacing.md
  },
  strategyContent: {
    flex: 1
  },
  strategyTitle: {
    ...Typography.button,
    color: Colors.secondary[800],
    marginBottom: Spacing.xs
  },
  strategyDescription: {
    ...Typography.bodySmall,
    color: Colors.secondary[700],
    lineHeight: 20
  },
  
  // Settings Section
  settingsSection: {
    marginBottom: Spacing['3xl']
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md
  },
  settingLabel: {
    ...Typography.button,
    color: Colors.neutral[800],
    marginBottom: Spacing.xs
  },
  settingDescription: {
    ...Typography.caption,
    color: Colors.neutral[600]
  },
  
  // Footer
  footer: {
    flexDirection: 'row',
    padding: Spacing.xl,
    gap: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200]
  },
  shareButton: {
    flex: 1,
    backgroundColor: Colors.neutral[200],
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center'
  },
  shareButtonText: {
    ...Typography.button,
    color: Colors.neutral[700]
  },
  closeFooterButton: {
    flex: 1,
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center'
  },
  closeFooterButtonText: {
    ...Typography.button,
    color: '#FFFFFF'
  }
});