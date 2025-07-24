/**
 * MindMend API Integration Test Script
 * 
 * This script tests the backend API endpoints to ensure the mobile app
 * integration will work correctly.
 * 
 * Run with: node test-integration.js
 */

const API_BASE_URL = 'http://localhost:3000/api';

// Test data
const TEST_USER = {
  firebaseUid: `test_${Date.now()}`,
  email: `test${Date.now()}@mindmend.app`,
  displayName: 'Test User',
  coachStyle: 'SUPPORTIVE'
};

let authToken = '';
let userId = '';
let habitId = '';
let journalEntryId = '';

// HTTP helper function
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`API Error: ${data.message || data.error || 'Unknown error'}`);
  }

  return data;
}

// Test functions
async function testHealthCheck() {
  console.log('🏥 Testing health check...');
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    const data = await response.json();
    console.log('✅ Health check passed:', data.message);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function testUserCreation() {
  console.log('👤 Testing user creation...');
  try {
    // Mock auth token for testing
    authToken = `mock_token_${Date.now()}`;
    
    const userData = await apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(TEST_USER)
    });

    userId = userData.data?.id || userData.id;
    console.log('✅ User created successfully:', { userId, email: TEST_USER.email });
    return true;
  } catch (error) {
    console.error('❌ User creation failed:', error.message);
    return false;
  }
}

async function testHabitCreation() {
  console.log('🎯 Testing habit creation...');
  try {
    const habitData = await apiRequest('/habits', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Daily Exercise',
        description: 'Work out for 30 minutes',
        habitType: 'BUILD'
      })
    });

    habitId = habitData.data?.id || habitData.id;
    console.log('✅ Habit created successfully:', { habitId, title: 'Test Daily Exercise' });
    return true;
  } catch (error) {
    console.error('❌ Habit creation failed:', error.message);
    return false;
  }
}

async function testHabitEventLogging() {
  console.log('📝 Testing habit event logging...');
  try {
    const eventData = await apiRequest('/habit-events', {
      method: 'POST',
      body: JSON.stringify({
        habitId: habitId,
        eventType: 'COMPLETED',
        notes: 'Completed via integration test'
      })
    });

    console.log('✅ Habit event logged successfully:', { eventId: eventData.data?.id || eventData.id });
    return true;
  } catch (error) {
    console.error('❌ Habit event logging failed:', error.message);
    return false;
  }
}

async function testStreakRetrieval() {
  console.log('🔥 Testing streak retrieval...');
  try {
    const streaksData = await apiRequest('/streaks');
    const streaks = streaksData.data || streaksData;
    
    console.log('✅ Streaks retrieved successfully:', { 
      count: streaks.length,
      hasTestHabit: streaks.some(s => s.habitId === habitId)
    });
    return true;
  } catch (error) {
    console.error('❌ Streak retrieval failed:', error.message);
    return false;
  }
}

async function testJournalEntry() {
  console.log('📖 Testing journal entry creation...');
  try {
    const entryData = await apiRequest('/journal', {
      method: 'POST',
      body: JSON.stringify({
        content: 'This is a test journal entry from the integration test. Today was a great day for testing!',
        moodRating: 8
      })
    });

    journalEntryId = entryData.data?.id || entryData.id;
    console.log('✅ Journal entry created successfully:', { 
      entryId: journalEntryId,
      moodRating: 8
    });
    return true;
  } catch (error) {
    console.error('❌ Journal entry creation failed:', error.message);
    return false;
  }
}

async function testAIInsights() {
  console.log('🧠 Testing AI insights generation...');
  try {
    // Try to generate daily insights
    const insightsData = await apiRequest('/ai/insights/generate/daily', {
      method: 'POST'
    });

    const insights = insightsData.data || insightsData;
    console.log('✅ AI insights generated successfully:', { 
      count: insights.length,
      types: insights.map(i => i.insightType)
    });
    return true;
  } catch (error) {
    console.error('❌ AI insights generation failed:', error.message);
    console.log('ℹ️  This might fail if OpenAI is not configured - that\'s okay for testing');
    return false;
  }
}

async function testWeeklySummary() {
  console.log('📊 Testing weekly summary generation...');
  try {
    const summaryData = await apiRequest('/weekly-summary/generate', {
      method: 'POST',
      body: JSON.stringify({
        includeComparison: false,
        includePredictions: false
      })
    });

    const summary = summaryData.data || summaryData;
    console.log('✅ Weekly summary generated successfully:', { 
      summaryId: summary.id,
      hasStatistics: !!summary.statistics,
      achievementsCount: summary.achievements?.length || 0
    });
    return true;
  } catch (error) {
    console.error('❌ Weekly summary generation failed:', error.message);
    console.log('ℹ️  This might fail if OpenAI is not configured - that\'s okay for testing');
    return false;
  }
}

async function testAnalytics() {
  console.log('📈 Testing analytics endpoints...');
  try {
    const dailyStats = await apiRequest('/analytics/daily');
    const weeklyStats = await apiRequest('/analytics/weekly');

    console.log('✅ Analytics retrieved successfully:', { 
      dailyStats: !!dailyStats.data,
      weeklyStats: !!weeklyStats.data
    });
    return true;
  } catch (error) {
    console.error('❌ Analytics retrieval failed:', error.message);
    return false;
  }
}

// Main test runner
async function runIntegrationTests() {
  console.log('🚀 Starting MindMend API Integration Tests\n');
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'User Creation', fn: testUserCreation },
    { name: 'Habit Creation', fn: testHabitCreation },
    { name: 'Habit Event Logging', fn: testHabitEventLogging },
    { name: 'Streak Retrieval', fn: testStreakRetrieval },
    { name: 'Journal Entry', fn: testJournalEntry },
    { name: 'Analytics', fn: testAnalytics },
    { name: 'AI Insights', fn: testAIInsights },
    { name: 'Weekly Summary', fn: testWeeklySummary },
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) passedTests++;
    } catch (error) {
      console.error(`❌ ${test.name} crashed:`, error.message);
    }
    console.log(''); // Add spacing between tests
  }

  console.log('📋 Test Results Summary:');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! The mobile app integration should work perfectly.');
  } else if (passedTests >= totalTests - 2) {
    console.log('🎯 Most tests passed! The core integration should work well.');
    console.log('   (AI features may fail without OpenAI configuration)');
  } else {
    console.log('⚠️  Some core tests failed. Check your backend configuration.');
  }

  console.log('\n📱 Ready to test the mobile app with:');
  console.log('   - Email:', TEST_USER.email);
  console.log('   - Password: demo123');
  console.log('   - Or use the "Use Demo Credentials" button');
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled promise rejection:', reason);
  process.exit(1);
});

// Run the tests
if (require.main === module) {
  runIntegrationTests().catch(error => {
    console.error('❌ Test runner crashed:', error);
    process.exit(1);
  });
}

module.exports = { runIntegrationTests };