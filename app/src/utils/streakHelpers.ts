export interface StreakStats {
  totalStreaks: number;
  activeStreaks: number;
  averageStreak: number;
  longestEverStreak: number;
  totalDaysLogged: number;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  achieved: boolean;
  icon: string;
}

export interface Streak {
  habitId: string;
  currentStreak: number;
  longestStreak: number;
  habit: {
    title: string;
    habitType: 'BUILD' | 'AVOID';
  };
}

export const calculateStreakStats = (streaksData: any[]): StreakStats => {
  if (streaksData.length === 0) {
    return {
      totalStreaks: 0,
      activeStreaks: 0,
      averageStreak: 0,
      longestEverStreak: 0,
      totalDaysLogged: 0,
    };
  }

  const activeStreaks = streaksData.filter(s => s && s.currentStreak > 0).length;
  const totalCurrent = streaksData.reduce((sum, s) => sum + (s?.currentStreak || 0), 0);
  const longestEver = streaksData.length > 0 ? Math.max(...streaksData.map(s => s?.longestStreak || 0)) : 0;
  const averageStreak = streaksData.length > 0 ? totalCurrent / streaksData.length : 0;
  const totalDays = streaksData.reduce((sum, s) => sum + (s?.currentStreak || 0), 0);

  return {
    totalStreaks: streaksData.length,
    activeStreaks,
    averageStreak: Math.round(averageStreak * 10) / 10,
    longestEverStreak: longestEver,
    totalDaysLogged: totalDays,
  };
};

export const generateMilestones = (stats: StreakStats): Milestone[] => {
  const milestones: Milestone[] = [
    {
      id: '1',
      title: 'First Streak',
      description: 'Complete your first 3-day streak',
      target: 3,
      current: stats.longestEverStreak,
      achieved: stats.longestEverStreak >= 3,
      icon: '🌱',
    },
    {
      id: '2',
      title: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      target: 7,
      current: stats.longestEverStreak,
      achieved: stats.longestEverStreak >= 7,
      icon: '💪',
    },
    {
      id: '3',
      title: 'Consistency King',
      description: 'Achieve a 30-day streak',
      target: 30,
      current: stats.longestEverStreak,
      achieved: stats.longestEverStreak >= 30,
      icon: '👑',
    },
    {
      id: '4',
      title: 'Habit Master',
      description: 'Maintain 3 active streaks',
      target: 3,
      current: stats.activeStreaks,
      achieved: stats.activeStreaks >= 3,
      icon: '🏆',
    },
    {
      id: '5',
      title: 'Century Club',
      description: 'Log 100 total habits',
      target: 100,
      current: stats.totalDaysLogged,
      achieved: stats.totalDaysLogged >= 100,
      icon: '💯',
    },
    {
      id: '6',
      title: 'Legendary',
      description: 'Achieve a 100-day streak',
      target: 100,
      current: stats.longestEverStreak,
      achieved: stats.longestEverStreak >= 100,
      icon: '🌟',
    },
  ];

  return milestones;
};

export const getStreakColor = (streakLength: number): string => {
  if (streakLength === 0) return '#E2E8F0';
  if (streakLength < 7) return '#F6AD55';
  if (streakLength < 30) return '#48BB78';
  if (streakLength < 100) return '#4299E1';
  return '#9F7AEA';
};

export const getTodayString = (): string => {
  const today = new Date();
  return today.getFullYear() + '-' + 
    String(today.getMonth() + 1).padStart(2, '0') + '-' + 
    String(today.getDate()).padStart(2, '0');
};

export const isCompletedToday = (streak: Streak, recentEvents: any[]): boolean => {
  const todayString = getTodayString();
  return recentEvents.some(event => 
    event.habitId === streak.habitId && 
    event.eventType === 'COMPLETED' &&
    event.occurredAt.startsWith(todayString)
  );
};

export const isSkippedToday = (streak: Streak, recentEvents: any[]): boolean => {
  const todayString = getTodayString();
  return recentEvents.some(event => 
    event.habitId === streak.habitId && 
    (event.eventType === 'SKIPPED' || event.eventType === 'RELAPSED') &&
    event.occurredAt.startsWith(todayString)
  );
};

export const getTodayStatus = (streak: Streak, recentEvents: any[]): 'completed' | 'skipped' | 'pending' => {
  if (isCompletedToday(streak, recentEvents)) return 'completed';
  if (isSkippedToday(streak, recentEvents)) return 'skipped';
  return 'pending';
};

export const getStreakStatus = (streak: Streak, recentEvents: any[]): string => {
  if (streak.currentStreak === 0) return 'Ready to start';
  
  const todayStatus = getTodayStatus(streak, recentEvents);
  
  if (todayStatus === 'skipped') {
    if (streak.currentStreak === 1) return 'Streak broken';
    return `${streak.currentStreak}-day streak broken`;
  }
  
  if (todayStatus === 'completed') {
    if (streak.currentStreak === 1) return 'Day 1 - Great start! 🌟';
    if (streak.currentStreak < 7) return `${streak.currentStreak} days strong 💪`;
    if (streak.currentStreak < 30) return `${streak.currentStreak} days - On fire! 🔥`;
    return `${streak.currentStreak} days - Legendary! ⚡`;
  }
  
  if (streak.currentStreak === 1) return '1 day streak (continue today)';
  return `${streak.currentStreak} days (continue today) ⏳`;
};