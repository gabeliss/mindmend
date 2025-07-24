import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import API-connected screens
import HomeScreen from './src/HomeScreen';
import StreaksScreen from './src/StreaksScreen';
import CheckInScreen from './src/CheckInScreen';
import JournalScreen from './src/JournalScreen';
import ProfileScreen from './src/ProfileScreen';

// Import onboarding and auth screens
import OnboardingScreen from './src/OnboardingScreen';
import FirstTimeSetupScreen from './src/FirstTimeSetupScreen';
import AuthScreen from './src/AuthScreen';

// Import auth hook
import { useAuth } from './src/services/auth';

// Import modals
import AIWeeklySummaryModal from './src/AIWeeklySummaryModal';
import PushCheckInPromptModal from './src/PushCheckInPromptModal';

const Tab = createBottomTabNavigator();

// App states
type AppState = 'loading' | 'onboarding' | 'auth' | 'firstTimeSetup' | 'main';

// Main App Content (when fully onboarded and authenticated)
function MainAppContent() {
  const [showSummary, setShowSummary] = useState(false);
  const [showCheckInPrompt, setShowCheckInPrompt] = useState(false);

  // Example: Show modals based on conditions
  useEffect(() => {
    // Show weekly summary occasionally
    const shouldShowSummary = Math.random() < 0.1; // 10% chance on app open
    if (shouldShowSummary) {
      const timer = setTimeout(() => setShowSummary(true), 10000); // After 10 seconds
      return () => clearTimeout(timer);
    }

    // Show check-in prompt at specific times
    const hour = new Date().getHours();
    const shouldShowCheckIn = (hour === 8 || hour === 20) && Math.random() < 0.3; // 30% chance at 8am or 8pm
    if (shouldShowCheckIn) {
      const timer = setTimeout(() => setShowCheckInPrompt(true), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';
            if (route.name === 'Home') iconName = 'home-outline';
            else if (route.name === 'Streaks') iconName = 'bar-chart-outline';
            else if (route.name === 'Check-In') iconName = 'create-outline';
            else if (route.name === 'Journal') iconName = 'book-outline';
            else if (route.name === 'Profile') iconName = 'person-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#4F8EF7',
          tabBarInactiveTintColor: 'gray',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#4F8EF7',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
          },
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen}
          options={{
            headerTitle: '🧠 MindMend',
          }}
        />
        <Tab.Screen 
          name="Streaks" 
          component={StreaksScreen}
          options={{
            headerTitle: '🔥 Your Streaks',
          }}
        />
        <Tab.Screen 
          name="Check-In" 
          component={CheckInScreen}
          options={{
            headerTitle: '✍️ Daily Check-In',
          }}
        />
        <Tab.Screen 
          name="Journal" 
          component={JournalScreen}
          options={{
            headerTitle: '📖 Journal',
          }}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{
            headerTitle: '👤 Profile',
          }}
        />
      </Tab.Navigator>
      
      {/* Modals */}
      <AIWeeklySummaryModal 
        visible={showSummary} 
        onClose={() => setShowSummary(false)} 
      />
      <PushCheckInPromptModal 
        visible={showCheckInPrompt} 
        onCheckIn={() => setShowCheckInPrompt(false)} 
      />
    </>
  );
}

// Loading Screen Component
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.logo}>🧠 MindMend</Text>
      <ActivityIndicator size="large" color="#4F8EF7" style={styles.loadingSpinner} />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

// Main App Component with Full Onboarding Flow
export default function App() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [appState, setAppState] = useState<AppState>('loading');
  const [isFirstTime, setIsFirstTime] = useState(false);

  // Check onboarding status on app start
  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  // Handle authentication state changes
  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        if (isFirstTime) {
          setAppState('firstTimeSetup');
        } else {
          setAppState('main');
        }
      } else {
        setAppState('auth');
      }
    }
  }, [isAuthenticated, authLoading, isFirstTime]);

  const checkOnboardingStatus = async () => {
    try {
      const [hasSeenOnboarding, hasCompletedSetup] = await Promise.all([
        AsyncStorage.getItem('hasSeenOnboarding'),
        AsyncStorage.getItem('onboardingComplete'),
      ]);

      if (!hasSeenOnboarding) {
        setAppState('onboarding');
      } else if (!hasCompletedSetup) {
        setIsFirstTime(true);
        // Will transition to firstTimeSetup or auth based on auth state
      } else {
        setIsFirstTime(false);
        // Will transition to main or auth based on auth state
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
      // Default to showing onboarding if we can't determine status
      setAppState('onboarding');
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      setAppState('auth');
    } catch (error) {
      console.error('Failed to save onboarding status:', error);
      setAppState('auth');
    }
  };

  const handleFirstTimeSetupComplete = async () => {
    try {
      await AsyncStorage.setItem('onboardingComplete', 'true');
      setIsFirstTime(false);
      setAppState('main');
    } catch (error) {
      console.error('Failed to save setup completion status:', error);
      setAppState('main');
    }
  };

  const resetOnboarding = async () => {
    try {
      await AsyncStorage.multiRemove(['hasSeenOnboarding', 'onboardingComplete']);
      setAppState('onboarding');
      setIsFirstTime(false);
    } catch (error) {
      console.error('Failed to reset onboarding:', error);
    }
  };

  // Show appropriate screen based on app state
  const renderAppContent = () => {
    switch (appState) {
      case 'loading':
        return <LoadingScreen />;
      
      case 'onboarding':
        return <OnboardingScreen onComplete={handleOnboardingComplete} />;
      
      case 'auth':
        return (
          <Tab.Navigator
            screenOptions={{
              headerShown: false,
              tabBarStyle: { display: 'none' },
            }}
          >
            <Tab.Screen name="Auth" component={AuthScreen} />
          </Tab.Navigator>
        );
      
      case 'firstTimeSetup':
        return (
          <Tab.Navigator
            screenOptions={{
              headerShown: false,
              tabBarStyle: { display: 'none' },
            }}
          >
            <Tab.Screen name="Setup">
              {() => <FirstTimeSetupScreen onComplete={handleFirstTimeSetupComplete} />}
            </Tab.Screen>
          </Tab.Navigator>
        );
      
      case 'main':
        return <MainAppContent />;
      
      default:
        return <LoadingScreen />;
    }
  };

  return (
    <NavigationContainer>
      {renderAppContent()}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  logo: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4F8EF7',
    marginBottom: 20,
  },
  loadingSpinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
});