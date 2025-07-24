import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from './lib/design-system';

interface RiskFactor {
  factor: string;
  impact: 'high' | 'medium' | 'low';
  description: string;
  suggestion: string;
}

interface RelapsePredictionModalProps {
  visible: boolean;
  onClose: () => void;
  riskLevel: 'low' | 'medium' | 'high';
}

export default function RelapsePredictionModal({ visible, onClose, riskLevel }: RelapsePredictionModalProps) {
  const [actionTaken, setActionTaken] = useState(false);

  const riskFactors: RiskFactor[] = [
    {
      factor: 'Time Pattern',
      impact: 'high',
      description: 'It\'s 9:47 PM - historically your highest risk hour',
      suggestion: 'Start your evening wind-down routine now'
    },
    {
      factor: 'Mood Trend',
      impact: 'medium', 
      description: 'Stress levels elevated for 2 days straight',
      suggestion: 'Try the 4-7-8 breathing technique'
    },
    {
      factor: 'Environment',
      impact: 'medium',
      description: 'You\'re alone and haven\'t journaled today',
      suggestion: 'Quick 2-minute reflection or call a friend'
    },
    {
      factor: 'Trigger Proximity',
      impact: 'low',
      description: 'Phone usage up 30% from yesterday',
      suggestion: 'Put phone in another room for 30 minutes'
    }
  ];

  const getRiskColor = () => {
    switch (riskLevel) {
      case 'high': return Colors.alert[500];
      case 'medium': return Colors.warning[500];
      case 'low': return Colors.secondary[500];
    }
  };

  const getRiskBackground = () => {
    switch (riskLevel) {
      case 'high': return Colors.alert[50];
      case 'medium': return Colors.warning[50];
      case 'low': return Colors.secondary[50];
    }
  };

  const getRiskMessage = () => {
    switch (riskLevel) {
      case 'high': 
        return {
          title: '🚨 High Risk Alert',
          message: 'AI detected strong relapse signals. Take action now to protect your streak.',
          confidence: '87% confidence'
        };
      case 'medium':
        return {
          title: '⚠️ Elevated Risk',
          message: 'Patterns suggest increased vulnerability. A few quick actions can keep you safe.',
          confidence: '72% confidence'
        };
      case 'low':
        return {
          title: '💚 Low Risk Window',
          message: 'You\'re in a good place, but staying aware keeps you strong.',
          confidence: '45% confidence'
        };
    }
  };

  const quickActions = [
    { action: '🚶 Take a 5-minute walk', duration: '5 min' },
    { action: '🧘 Breathing exercise', duration: '2 min' },
    { action: '📝 Quick journal entry', duration: '3 min' },
    { action: '📞 Call someone supportive', duration: '10 min' },
    { action: '🚿 Cold splash or shower', duration: '2 min' },
    { action: '🎵 Listen to motivating music', duration: '5 min' }
  ];

  const riskInfo = getRiskMessage();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: getRiskBackground() }]}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>{riskInfo.title}</Text>
              <Text style={styles.headerSubtitle}>{riskInfo.message}</Text>
              <Text style={[styles.confidence, { color: getRiskColor() }]}>
                {riskInfo.confidence}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Risk Factors */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What AI Detected</Text>
              {riskFactors.map((factor, index) => (
                <View key={index} style={styles.factorCard}>
                  <View style={styles.factorHeader}>
                    <Text style={styles.factorName}>{factor.factor}</Text>
                    <View style={[
                      styles.impactBadge,
                      { backgroundColor: factor.impact === 'high' ? Colors.alert[100] : 
                                        factor.impact === 'medium' ? Colors.warning[100] : Colors.secondary[100] }
                    ]}>
                      <Text style={[
                        styles.impactText,
                        { color: factor.impact === 'high' ? Colors.alert[500] : 
                                 factor.impact === 'medium' ? Colors.warning[500] : Colors.secondary[500] }
                      ]}>
                        {factor.impact}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.factorDescription}>{factor.description}</Text>
                  <Text style={styles.factorSuggestion}>💡 {factor.suggestion}</Text>
                </View>
              ))}
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions (Pick One)</Text>
              <View style={styles.actionsGrid}>
                {quickActions.map((action, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.actionCard}
                    onPress={() => setActionTaken(true)}
                  >
                    <Text style={styles.actionText}>{action.action}</Text>
                    <Text style={styles.actionDuration}>{action.duration}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Success Message */}
            {actionTaken && (
              <View style={styles.successMessage}>
                <Text style={styles.successIcon}>🎉</Text>
                <Text style={styles.successText}>
                  Great choice! You just proved you're stronger than the urge. 
                  Your future self is thanking you right now.
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: getRiskColor() }]}
              onPress={() => setActionTaken(true)}
            >
              <Text style={styles.actionButtonText}>I'll Take Action</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dismissButton} onPress={onClose}>
              <Text style={styles.dismissButtonText}>Dismiss Alert</Text>
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
  container: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.xl,
    backgroundColor: '#FFFFFF'
  },
  headerContent: {
    flex: 1
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.neutral[800],
    marginBottom: Spacing.xs
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    color: Colors.neutral[600],
    lineHeight: 20,
    marginBottom: Spacing.sm
  },
  confidence: {
    ...Typography.caption,
    fontWeight: '600'
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeButtonText: {
    color: Colors.neutral[600],
    fontSize: 14,
    fontWeight: '600'
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  
  // Sections
  section: {
    padding: Spacing.xl
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.neutral[800],
    marginBottom: Spacing.lg
  },
  
  // Risk Factors
  factorCard: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary[500]
  },
  factorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm
  },
  factorName: {
    ...Typography.button,
    color: Colors.neutral[800]
  },
  impactBadge: {
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2
  },
  impactText: {
    ...Typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  factorDescription: {
    ...Typography.bodySmall,
    color: Colors.neutral[700],
    marginBottom: Spacing.sm,
    lineHeight: 18
  },
  factorSuggestion: {
    ...Typography.bodySmall,
    color: Colors.primary[700],
    fontStyle: 'italic',
    lineHeight: 18
  },
  
  // Quick Actions
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm
  },
  actionCard: {
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    width: '48%',
    borderWidth: 1,
    borderColor: Colors.primary[200],
    alignItems: 'center'
  },
  actionText: {
    ...Typography.bodySmall,
    color: Colors.primary[800],
    textAlign: 'center',
    marginBottom: Spacing.xs,
    fontWeight: '500'
  },
  actionDuration: {
    ...Typography.caption,
    color: Colors.primary[600]
  },
  
  // Success Message
  successMessage: {
    backgroundColor: Colors.secondary[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    margin: Spacing.xl,
    borderWidth: 2,
    borderColor: Colors.secondary[200],
    alignItems: 'center'
  },
  successIcon: {
    fontSize: 32,
    marginBottom: Spacing.md
  },
  successText: {
    ...Typography.body,
    color: Colors.secondary[800],
    textAlign: 'center',
    lineHeight: 24
  },
  
  // Footer
  footer: {
    padding: Spacing.xl,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
    gap: Spacing.md
  },
  actionButton: {
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center'
  },
  actionButtonText: {
    ...Typography.button,
    color: '#FFFFFF'
  },
  dismissButton: {
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.neutral[100]
  },
  dismissButtonText: {
    ...Typography.button,
    color: Colors.neutral[600]
  }
});