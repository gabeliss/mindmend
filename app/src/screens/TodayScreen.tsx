import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from 'convex/react';

import { Colors, Typography, Spacing } from '../lib/design-system';
import { DailyPlan, DailyPlanItem } from '../types/habits';
import { mockDailyPlans } from '../data/mockData';
import TodaysPlan from '../components/habits/TodaysPlan';
import { useAuth } from '../hooks/useAuth';

export default function TodayScreen() {
  const { userId, isAuthenticated } = useAuth();
  
  const [dailyPlans, setDailyPlans] = useState<DailyPlan[]>(mockDailyPlans);

  const getTodaysPlan = (): DailyPlan | undefined => {
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return dailyPlans.find(plan => plan.date === todayString);
  };

  const handlePlanItemToggle = (itemId: string) => {
    setDailyPlans(prevPlans => 
      prevPlans.map(plan => ({
        ...plan,
        entries: plan.entries.map(entry => 
          entry.id === itemId 
            ? { ...entry, completed: !entry.completed }
            : entry
        )
      }))
    );
  };


  const handleSmartAddPlanItem = (description: string, time?: string) => {
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    setDailyPlans(prevPlans => {
      const existingPlanIndex = prevPlans.findIndex(plan => plan.date === todayString);
      const newPlanItem: DailyPlanItem = {
        description,
        time,
        completed: false,
        id: `plan_item_${Date.now()}`,
        daily_plan_id: existingPlanIndex >= 0 ? prevPlans[existingPlanIndex].id : `plan_${todayString}`,
        order: existingPlanIndex >= 0 ? prevPlans[existingPlanIndex].entries.length + 1 : 1,
      };

      if (existingPlanIndex >= 0) {
        // Add to existing plan
        const updatedPlans = [...prevPlans];
        updatedPlans[existingPlanIndex] = {
          ...updatedPlans[existingPlanIndex],
          entries: [...updatedPlans[existingPlanIndex].entries, newPlanItem],
        };
        return updatedPlans;
      } else {
        // Create new plan
        const newPlan = {
          id: `plan_${todayString}`,
          user_id: 'user_1',
          date: todayString,
          entries: [newPlanItem],
          created_at: new Date().toISOString(),
        };
        return [...prevPlans, newPlan];
      }
    });
  };


  const handleEditPlanItem = (description: string, time: string | undefined, itemId: string) => {
    setDailyPlans(prevPlans => 
      prevPlans.map(plan => ({
        ...plan,
        entries: plan.entries.map(entry => 
          entry.id === itemId 
            ? { ...entry, description, time }
            : entry
        )
      }))
    );
  };

  const handleDeletePlanItem = (itemId: string) => {
    setDailyPlans(prevPlans => 
      prevPlans.map(plan => ({
        ...plan,
        entries: plan.entries.filter(entry => entry.id !== itemId)
      }))
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Today</Text>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <TodaysPlan 
          dailyPlan={getTodaysPlan()}
          onPlanItemToggle={handlePlanItemToggle}
          onSmartAddPlanItem={handleSmartAddPlanItem}
          onEditPlanItem={handleEditPlanItem}
          onDeletePlanItem={handleDeletePlanItem}
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing['5xl'],
  },
});