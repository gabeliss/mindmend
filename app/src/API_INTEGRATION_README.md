# MindMend Mobile App - API Integration Guide

## Overview

This directory contains the updated React Native mobile app with full backend API integration. The original mock data has been replaced with real API calls to the Express.js backend.

## What's Been Updated

### 🔧 **New API Layer**

#### Core Services
- **`services/api.ts`** - Comprehensive HTTP client with authentication, error handling, and rate limiting
- **`services/auth.ts`** - Authentication service with Firebase Auth simulation and user management

#### Key Features
- **Authentication Flow**: Sign up, sign in, sign out with persistent token storage
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Loading States**: Proper loading indicators for all API operations
- **Offline Handling**: Graceful degradation when network is unavailable
- **Optimistic Updates**: Immediate UI feedback for better user experience

### 📱 **Updated Screens**

#### 1. **HomeScreenWithAPI.tsx**
- **Real Habit Data**: Fetches user's habits from `/api/habits`
- **Live Streak Tracking**: Gets current streaks from `/api/streaks`
- **Habit Completion**: Logs events via `/api/habit-events`
- **AI Insights**: Displays daily insights from `/api/ai/insights`

**Features Added:**
- Pull-to-refresh functionality
- Real-time habit completion tracking
- Optimistic UI updates
- Daily AI insights integration
- Progress tracking with motivational messages

#### 2. **CheckInScreenWithAPI.tsx**
- **Journal Integration**: Saves check-ins to `/api/journal`
- **AI Feedback**: Generates personalized feedback using AI insights
- **Mood Tracking**: Comprehensive mood selection with 1-10 rating
- **Mindset Selection**: User mindset tracking for better insights

**Features Added:**
- Auto-time detection (morning/evening)
- Voice input simulation (ready for real speech-to-text)
- Smart AI feedback generation
- Comprehensive mood and mindset tracking

#### 3. **JournalScreenWithAPI.tsx**
- **Full Journal CRUD**: Create, read, update, delete journal entries
- **Mood Calendar**: 30-day visual mood tracking
- **AI Pattern Analysis**: Shows AI-generated pattern insights
- **Advanced Filtering**: Filter entries by date, mood, content

**Features Added:**
- Three-tab interface (Write, History, Insights)
- 30-day mood calendar visualization
- AI pattern detection and insights
- Comprehensive entry management

#### 4. **StreaksScreenWithAPI.tsx**
- **Live Streak Data**: Real-time streak calculations
- **Achievement System**: Gamified milestone tracking
- **Progress Analytics**: Detailed statistics and progress bars
- **Habit Performance**: Individual habit streak tracking

**Features Added:**
- Comprehensive streak statistics
- Achievement milestone system
- Visual progress indicators
- Habit-specific streak analysis

#### 5. **AuthScreen.tsx**
- **Complete Auth Flow**: Sign up and sign in with validation
- **Demo Credentials**: Quick access for testing
- **User-Friendly Design**: Clean, modern authentication interface
- **Error Handling**: Clear error messages and validation

### 🔌 **API Client Features**

#### Authentication
```typescript
// Set auth token for all requests
await apiClient.setAuthToken(token);

// Create user account
const user = await apiClient.createUser({
  firebaseUid: 'uid',
  email: 'user@email.com',
  displayName: 'User Name'
});

// Get user profile
const profile = await apiClient.getProfile();
```

#### Habits & Events
```typescript
// Get user habits
const habits = await apiClient.getHabits();

// Log habit completion
const event = await apiClient.logHabitEvent({
  habitId: 'habit-id',
  eventType: 'COMPLETED',
  notes: 'Completed via mobile app'
});

// Get habit streaks
const streaks = await apiClient.getStreaks();
```

#### Journal & Insights
```typescript
// Create journal entry
const entry = await apiClient.createJournalEntry({
  content: 'Today was great!',
  moodRating: 8
});

// Get AI insights
const insights = await apiClient.getTodaysInsights();

// Generate weekly summary
const summary = await apiClient.generateWeeklySummary({
  includeComparison: true,
  includePredictions: true
});
```

### 🔄 **State Management Improvements**

#### Error Handling Pattern
```typescript
try {
  setIsLoading(true);
  
  const response = await apiClient.someMethod();
  if (isApiError(response)) {
    throw new Error(handleApiError(response));
  }
  
  // Update UI with success data
  setSomeData(response.data);
  
} catch (error) {
  console.error('Operation failed:', error);
  Alert.alert('Error', 'Operation failed. Please try again.');
} finally {
  setIsLoading(false);
}
```

#### Optimistic Updates
```typescript
// Update UI immediately
setHabits(optimisticUpdate);

// Send to server
const response = await apiClient.updateData();

// Revert on error
if (isApiError(response)) {
  setHabits(previousState);
}
```

## 🚀 **Getting Started**

### 1. **Backend Setup**
Ensure your backend is running:
```bash
cd backend
npm run dev
```

### 2. **Update API Configuration**
In `src/services/api.ts`, update the API base URL:
```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api'  // Your local backend
  : 'https://your-backend-api.com/api'; // Your deployed backend
```

### 3. **Install Dependencies**
```bash
npm install
```

### 4. **Run the Mobile App**
```bash
npm start
# Then press 'i' for iOS or 'a' for Android
```

### 5. **Test the Integration**
1. **Sign Up**: Create a new account using the AuthScreen
2. **Add Habits**: Use the backend API or the mobile app to add habits
3. **Log Activities**: Complete habits, write journal entries, check daily insights
4. **View Progress**: Check streaks, view mood calendar, see AI insights

## 📱 **Testing Guide**

### Authentication Flow
1. Open the app (should show AuthScreen)
2. Click "Use Demo Credentials" for quick testing
3. Sign up with demo@mindmend.app / demo123
4. Verify successful authentication and navigation to main app

### Habit Tracking
1. Go to Home tab
2. If no habits exist, they'll show as empty state
3. Create habits via backend or API
4. Complete habits and verify streak updates
5. Check streak data in Streaks tab

### Journal & Check-ins
1. Go to Check-In tab
2. Fill out morning or evening check-in
3. Submit and verify AI feedback
4. Go to Journal tab → History to see saved entries
5. Check Journal → Insights for AI pattern analysis

### Error Handling
1. Turn off WiFi/data
2. Try to perform actions - should show appropriate error messages
3. Turn network back on and use pull-to-refresh

## 🔧 **Configuration Options**

### Environment Variables
Create a `.env` file in the root directory:
```bash
# API Configuration
API_BASE_URL=http://localhost:3000/api
API_TIMEOUT=10000

# Firebase Configuration (when using real Firebase)
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
```

### API Client Settings
In `src/services/api.ts`:
```typescript
// Adjust timeout, retry logic, etc.
const API_CONFIG = {
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
};
```

## 🐛 **Troubleshooting**

### Common Issues

#### 1. **"Network Error" or "Failed to fetch"**
- **Cause**: Backend not running or wrong API URL
- **Solution**: Check backend is running on correct port, update API_BASE_URL

#### 2. **"Authentication Failed"**
- **Cause**: Invalid token or expired session
- **Solution**: Sign out and sign back in, check backend auth middleware

#### 3. **"Empty screens after login"**
- **Cause**: No data in backend database
- **Solution**: Add test data via backend API or run database seeds

#### 4. **"Loading forever"**
- **Cause**: API calls hanging or timing out
- **Solution**: Check network connection, backend logs, API responses

### Debug Mode
Enable debug logging in `src/services/api.ts`:
```typescript
const DEBUG_API = true; // Set to true for detailed logging

if (DEBUG_API) {
  console.log('API Request:', url, options);
  console.log('API Response:', responseData);
}
```

## 🔮 **Next Steps**

### Production Readiness
1. **Real Firebase Auth**: Replace mock auth with actual Firebase SDK
2. **Push Notifications**: Integrate Expo Notifications
3. **Offline Support**: Add AsyncStorage caching
4. **Error Tracking**: Integrate Sentry or similar
5. **Analytics**: Add user behavior tracking

### Feature Enhancements
1. **Real-time Updates**: WebSocket connections for live data
2. **Image Support**: Photo uploads for journal entries
3. **Social Features**: Community habits and challenges
4. **Export Features**: Data export and backup options

## 📚 **File Structure**

```
src/
├── services/
│   ├── api.ts              # HTTP client & API methods
│   └── auth.ts             # Authentication service
├── screens/
│   ├── HomeScreenWithAPI.tsx      # Main habit tracking
│   ├── CheckInScreenWithAPI.tsx   # Daily check-ins
│   ├── JournalScreenWithAPI.tsx   # Journal & insights
│   ├── StreaksScreenWithAPI.tsx   # Streak tracking
│   └── AuthScreen.tsx             # Authentication
├── AppWithAPI.tsx          # Main app with auth flow
└── API_INTEGRATION_README.md      # This file
```

## 🤝 **Contributing**

When adding new API integrations:

1. **Add to API Client**: Extend `services/api.ts` with new methods
2. **Handle Errors**: Use consistent error handling patterns
3. **Add Loading States**: Show appropriate loading indicators
4. **Test Offline**: Ensure graceful degradation
5. **Update Types**: Add TypeScript interfaces for new data structures

---

**🎉 The mobile app is now fully integrated with the backend API! Users can create accounts, track habits, write journal entries, and receive AI-powered insights all through real API calls.**