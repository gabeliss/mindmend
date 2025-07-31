import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Milestone {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  achieved: boolean;
  icon: string;
}

interface MilestonesGridProps {
  milestones: Milestone[];
}

export const MilestonesGrid: React.FC<MilestonesGridProps> = ({ milestones }) => {
  return (
    <View style={styles.milestonesContainer}>
      <Text style={styles.sectionTitle}>Achievements</Text>
      <View style={styles.milestonesGrid}>
        {milestones.map((milestone) => (
          <View 
            key={milestone.id} 
            style={[
              styles.milestoneCard,
              milestone.achieved && styles.achievedMilestone
            ]}
          >
            <Text style={styles.milestoneIcon}>{milestone.icon}</Text>
            <Text style={styles.milestoneTitle}>{milestone.title}</Text>
            <Text style={styles.milestoneDescription}>{milestone.description}</Text>
            <View style={styles.milestoneProgress}>
              <Text style={[
                styles.milestoneProgressText,
                milestone.achieved && styles.achievedText
              ]}>
                {milestone.current}/{milestone.target}
              </Text>
              {milestone.achieved && (
                <Text style={styles.achievedBadge}>✓</Text>
              )}
            </View>
          </View>
        ))}
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
  milestonesContainer: {
    padding: 16,
  },
  milestonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  milestoneCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  achievedMilestone: {
    backgroundColor: '#F0FFF4',
    borderColor: '#38A169',
    borderWidth: 2,
  },
  milestoneIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  milestoneTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    textAlign: 'center',
    marginBottom: 4,
  },
  milestoneDescription: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 8,
  },
  milestoneProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneProgressText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4F8EF7',
  },
  achievedText: {
    color: '#38A169',
  },
  achievedBadge: {
    marginLeft: 8,
    fontSize: 16,
    color: '#38A169',
  },
});