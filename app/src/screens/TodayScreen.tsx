import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation } from 'convex/react';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../lib/design-system';
import { DailyPlan } from '../types/habits';
import TodaysPlan from '../components/habits/TodaysPlan';
import { useAuth } from '../hooks/useAuth';
import { api } from '../../convex/_generated/api';

type TabType = 'today' | 'tomorrow';

export default function TodayScreen() {
  const { userId, isAuthenticated } = useAuth();
  
  const [activeTab, setActiveTab] = useState<TabType>('today');

  const getDateString = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const todayString = getDateString(new Date());
  const tomorrowString = getDateString(new Date(Date.now() + 24 * 60 * 60 * 1000));

  // Query daily plans for today and tomorrow
  const dailyPlans = useQuery(
    api.dailyPlans.getDailyPlans,
    isAuthenticated && userId ? {
      userId: userId,
      startDate: todayString, // Only fetch today and tomorrow
      endDate: tomorrowString,
    } : "skip"
  );

  // Mutations
  const addPlanItem = useMutation(api.dailyPlans.addPlanItem);
  const updatePlanItem = useMutation(api.dailyPlans.updatePlanItem);
  const deletePlanItem = useMutation(api.dailyPlans.deletePlanItem);
  const togglePlanItem = useMutation(api.dailyPlans.togglePlanItem);
  const moveIncompleteTasks = useMutation(api.dailyPlans.moveIncompleteTasks);

  const getTodaysPlan = (): DailyPlan | undefined => {
    return dailyPlans?.find(plan => plan.date === todayString);
  };

  const getTomorrowsPlan = (): DailyPlan | undefined => {
    return dailyPlans?.find(plan => plan.date === tomorrowString);
  };

  const getCurrentPlan = (): DailyPlan | undefined => {
    return activeTab === 'today' ? getTodaysPlan() : getTomorrowsPlan();
  };

  const getCurrentDateString = (): string => {
    const date = activeTab === 'today' ? new Date() : new Date(Date.now() + 24 * 60 * 60 * 1000);
    return getDateString(date);
  };


  const handlePlanItemToggle = async (itemId: string) => {
    try {
      await togglePlanItem({ itemId: itemId as any }); // Type assertion for now
    } catch (error) {
      console.error('Error toggling plan item:', error);
    }
  };


  const handleSmartAddPlanItem = async (description: string, time?: string) => {
    if (!userId || !isAuthenticated) return;
    
    const targetDateString = getCurrentDateString();
    
    try {
      await addPlanItem({
        userId,
        date: targetDateString,
        description,
        time,
      });
    } catch (error) {
      console.error('Error adding plan item:', error);
    }
  };


  const handleEditPlanItem = async (description: string, time: string | undefined, itemId: string) => {
    try {
      await updatePlanItem({
        itemId: itemId as any,
        description,
        time,
      });
    } catch (error) {
      console.error('Error editing plan item:', error);
    }
  };

  const handleDeletePlanItem = async (itemId: string) => {
    try {
      await deletePlanItem({ itemId: itemId as any });
    } catch (error) {
      console.error('Error deleting plan item:', error);
    }
  };

  const handleMoveUnfinishedToTomorrow = async () => {
    if (!userId || !isAuthenticated) return;
    
    try {
      await moveIncompleteTasks({
        userId,
        fromDate: todayString,
        toDate: tomorrowString,
      });
    } catch (error) {
      console.error('Error moving unfinished tasks:', error);
    }
  };


  // Show loading state while data is loading
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Please sign in to view your plans</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (dailyPlans === undefined) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your plans...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Today</Text>
        <TouchableOpacity 
          style={styles.quickAddButton}
          onPress={() => {
            // Focus on the input in the current plan
            // This will be handled by exposing the input ref from TodaysPlan component
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={24} color={Colors.primary[600]} />
        </TouchableOpacity>
      </View>

      {/* Tab Interface */}
      <View style={styles.tabContainer}>
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'today' && styles.activeTab]}
            onPress={() => setActiveTab('today')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="calendar" 
              size={16} 
              color={activeTab === 'today' ? Colors.primary[600] : Colors.neutral[600]} 
              style={styles.tabIcon}
            />
            <Text style={[styles.tabText, activeTab === 'today' && styles.activeTabText]}>
              Today
            </Text>
            {getTodaysPlan()?.entries.length ? (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{getTodaysPlan()?.entries.length}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'tomorrow' && styles.activeTab]}
            onPress={() => setActiveTab('tomorrow')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="moon" 
              size={16} 
              color={activeTab === 'tomorrow' ? Colors.primary[600] : Colors.neutral[600]} 
              style={styles.tabIcon}
            />
            <Text style={[styles.tabText, activeTab === 'tomorrow' && styles.activeTabText]}>
              Tomorrow
            </Text>
            {getTomorrowsPlan()?.entries.length ? (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{getTomorrowsPlan()?.entries.length}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <TodaysPlan 
          dailyPlan={getCurrentPlan()}
          onPlanItemToggle={handlePlanItemToggle}
          onSmartAddPlanItem={handleSmartAddPlanItem}
          onEditPlanItem={handleEditPlanItem}
          onDeletePlanItem={handleDeletePlanItem}
          mode={activeTab}
          onMoveUnfinishedToTomorrow={activeTab === 'today' ? handleMoveUnfinishedToTomorrow : undefined}
        />
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[100],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.neutral[50],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  title: {
    ...Typography.h1,
    color: Colors.neutral[800],
  },
  quickAddButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing['5xl'],
  },
  tabContainer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral[200],
    borderRadius: BorderRadius.md,
    padding: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    position: 'relative',
  },
  activeTab: {
    backgroundColor: Colors.neutral[50],
    ...Shadows.sm,
  },
  tabIcon: {
    marginRight: Spacing.xs,
  },
  tabBadge: {
    backgroundColor: Colors.primary[500],
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.xs,
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    ...Typography.caption,
    color: Colors.neutral[50],
    fontSize: 12,
    fontWeight: '600',
  },
  tabText: {
    ...Typography.body,
    color: Colors.neutral[600],
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.primary[600],
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.neutral[600],
    textAlign: 'center',
  },
});