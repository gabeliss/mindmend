// MindMend Design System
// Calm, focused, supportive design for dopamine detox and habit building

export const Colors = {
  // Primary - Calm Blue (trust, clarity)
  primary: {
    50: '#F0F8FF',
    100: '#E0F2FE', 
    200: '#BAE6FD',
    300: '#7DD3FC',
    400: '#38BDF8',
    500: '#0EA5E9', // Main primary
    600: '#0284C7',
    700: '#0369A1',
    800: '#075985',
    900: '#0C4A6E'
  },
  
  // Secondary - Soft Green (growth, health)
  secondary: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E', // Main secondary
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D'
  },
  
  // Alert/Relapse - Warm Red (noticeable but not harsh)
  alert: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444', // Main alert
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D'
  },
  
  // Neutral - Muted, focused tones
  neutral: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A'
  },
  
  // Success (softer than secondary)
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    500: '#10B981',
    600: '#059669'
  },
  
  // Warning (amber)
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    500: '#F59E0B',
    600: '#D97706'
  }
};

export const Typography = {
  // Headers - Bold and clear
  h1: {
    fontSize: 32,
    fontWeight: '800' as const, // Extra bold for main headers
    lineHeight: 40,
    color: Colors.neutral[800]
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const, // Bold for section headers
    lineHeight: 32,
    color: Colors.neutral[800]
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const, // Semi-bold for subsections
    lineHeight: 28,
    color: Colors.neutral[700]
  },
  
  // Body text
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    color: Colors.neutral[700]
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    color: Colors.neutral[600]
  },
  
  // Interactive elements
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    color: Colors.neutral[500]
  }
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48
};

export const BorderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4
  },
  lg: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8
  }
};

// Coaching Microcopy
export const CoachingCopy = {
  // Check-in responses
  checkIn: {
    positive: "I slipped up",
    negative: "I stayed strong",
    neutral: "I'm working on it"
  },
  
  // Buttons
  buttons: {
    addHabit: "Commit to a Habit",
    submitCheckIn: "Share with Coach",
    saveJournal: "Lock in Progress",
    exportReport: "Get My Report",
    upgradeAccount: "Level Up Journey"
  },
  
  // Section headers with coaching tone
  headers: {
    todaysPlan: "Today's Plan to Stay Clean",
    streakJourney: "Your Streak Journey", 
    dailyReflection: "Daily Reflection",
    progressInsights: "Your Growth Insights",
    habitCommitments: "Your Commitments"
  },
  
  // Motivational phrases
  motivation: {
    streakCelebration: "You're building unstoppable momentum 🔥",
    relapseRecovery: "Every setback is a setup for a comeback 💪",
    progressUpdate: "Small steps, massive transformation ✨",
    weeklyWins: "Look how far you've come this week 🌟"
  }
};