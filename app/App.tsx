import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SignedIn, SignedOut } from '@clerk/clerk-expo';

import HabitsScreen from './src/screens/HabitsScreen';
import JournalScreen from './src/screens/JournalScreen';
import ChatScreen from './src/screens/ChatScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { AuthProvider } from './src/components/auth';

import { Colors } from './src/lib/design-system';

const Tab = createBottomTabNavigator();

function AuthenticatedApp() {
  const insets = useSafeAreaInsets();
  
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Habits') {
              iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
            } else if (route.name === 'Journal') {
              iconName = focused ? 'book' : 'book-outline';
            } else if (route.name === 'Chat') {
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
            } else if (route.name === 'Community') {
              iconName = focused ? 'people' : 'people-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            } else {
              iconName = 'help-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: Colors.primary[500],
          tabBarInactiveTintColor: Colors.neutral[400],
          tabBarStyle: {
            backgroundColor: Colors.neutral[50],
            borderTopColor: Colors.neutral[200],
            borderTopWidth: 1,
            paddingTop: 8,
            paddingBottom: Math.max(8, insets.bottom),
            height: 80 + Math.max(0, insets.bottom - 8),
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            marginTop: 4,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen name="Habits" component={HabitsScreen} />
        <Tab.Screen name="Journal" component={JournalScreen} />
        <Tab.Screen name="Chat" component={ChatScreen} />
        <Tab.Screen name="Community" component={CommunityScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

function UnauthenticatedApp() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <ProfileScreen />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <SignedIn>
            <AuthenticatedApp />
          </SignedIn>
          <SignedOut>
            <UnauthenticatedApp />
          </SignedOut>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </AuthProvider>
  );
}