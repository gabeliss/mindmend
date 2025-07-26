import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration - Choose the right URL for your testing environment
const getApiBaseUrl = () => {
  if (!__DEV__) {
    return 'https://your-backend-api.com/api'; // Production
  }
  
  // Development URLs - uncomment the one that works for your setup:
  
  // For iOS Simulator:
  // return 'http://localhost:3000/api';
  
  // For Android Emulator:
  // return 'http://10.0.2.2:3000/api';
  
  // For Physical Device (using your computer's IP):
  return 'http://192.168.0.35:3000/api';
};

const API_BASE_URL = getApiBaseUrl();

// Types for API responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  id: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  coachStyle: 'SUPPORTIVE' | 'DIRECT' | 'MOTIVATIONAL' | 'GENTLE';
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  id: string;
  userId: string;
  title: string;
  description?: string;
  habitType: 'BUILD' | 'AVOID';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HabitEvent {
  id: string;
  userId: string;
  habitId: string;
  eventType: 'COMPLETED' | 'SKIPPED' | 'RELAPSED';
  notes?: string;
  occurredAt: string;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  content: string;
  moodRating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Streak {
  habitId: string;
  currentStreak: number;
  longestStreak: number;
  lastEventDate?: string;
  isActive: boolean;
  habit: Habit;
}

export interface AIInsight {
  id: string;
  userId: string;
  insightType: 'DAILY_TIP' | 'PATTERN_DETECTION' | 'WEEKLY_SUMMARY';
  content: string;
  metadata?: any;
  isShown: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface WeeklySummary {
  id: string;
  userId: string;
  weekStart: string;
  weekEnd: string;
  aiSummary: string;
  statistics: any;
  achievements: any[];
  insights: any[];
  recommendations: any[];
  moodAnalysis: any;
  habitAnalysis: any;
  comparison?: any;
  predictions?: any;
  createdAt: string;
}

// HTTP Client class with authentication and error handling
class ApiClient {
  private baseURL: string;
  private authToken: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.loadAuthToken();
  }

  private async loadAuthToken(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      this.authToken = token;
    } catch (error) {
      console.error('Failed to load auth token:', error);
    }
  }

  async setAuthToken(token: string): Promise<void> {
    this.authToken = token;
    try {
      await AsyncStorage.setItem('authToken', token);
    } catch (error) {
      console.error('Failed to save auth token:', error);
    }
  }

  async clearAuthToken(): Promise<void> {
    this.authToken = null;
    try {
      await AsyncStorage.removeItem('authToken');
    } catch (error) {
      console.error('Failed to clear auth token:', error);
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const startTime = Date.now();
    
    try {
      const url = `${this.baseURL}${endpoint}`;
      const headers: { [key: string]: string } = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };

      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      // Log request details
      console.log(`[API] ${requestId} - Starting ${options.method || 'GET'} request to ${endpoint}`);
      console.log(`[API] ${requestId} - Full URL: ${url}`);
      console.log(`[API] ${requestId} - Headers:`, {
        ...headers,
        Authorization: this.authToken ? `Bearer ${this.authToken.substring(0, 10)}...` : 'None'
      });
      
      if (options.body) {
        try {
          const bodyData = JSON.parse(options.body as string);
          console.log(`[API] ${requestId} - Request body:`, {
            ...bodyData,
            password: bodyData.password ? '***REDACTED***' : undefined
          });
        } catch {
          console.log(`[API] ${requestId} - Request body: [Non-JSON data]`);
        }
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      const duration = Date.now() - startTime;
      console.log(`[API] ${requestId} - Response received in ${duration}ms`);
      console.log(`[API] ${requestId} - Status: ${response.status} ${response.statusText}`);
      console.log(`[API] ${requestId} - Response headers:`, Object.fromEntries(response.headers.entries()));

      let responseData;
      try {
        responseData = await response.json();
        console.log(`[API] ${requestId} - Response data:`, responseData);
      } catch (parseError) {
        console.error(`[API] ${requestId} - Failed to parse response as JSON:`, parseError);
        console.log(`[API] ${requestId} - Raw response text:`, await response.text());
        return {
          success: false,
          error: 'Invalid response format from server',
        };
      }

      if (!response.ok) {
        const errorMessage = responseData.message || responseData.error || 'Request failed';
        console.error(`[API] ${requestId} - Request failed with status ${response.status}:`, errorMessage);
        console.error(`[API] ${requestId} - Full error response:`, responseData);
        
        return {
          success: false,
          error: errorMessage,
        };
      }

      console.log(`[API] ${requestId} - Request successful`);
      return {
        success: true,
        data: responseData.data || responseData,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[API] ${requestId} - Request failed after ${duration}ms:`, error);
      
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        console.error(`[API] ${requestId} - Network error - check if backend is running at ${this.baseURL}`);
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Authentication methods
  async createUser(userData: {
    firebaseUid: string;
    email: string;
    displayName: string;
    coachStyle?: string;
  }): Promise<ApiResponse<User>> {
    return this.makeRequest<User>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return this.makeRequest<User>('/users/profile');
  }

  async updateProfile(updates: Partial<User>): Promise<ApiResponse<User>> {
    return this.makeRequest<User>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Habit methods
  async getHabits(): Promise<ApiResponse<{habits: Habit[], meta: any}>> {
    return this.makeRequest<{habits: Habit[], meta: any}>('/habits');
  }

  async createHabit(habitData: {
    title: string;
    description?: string;
    habitType: 'BUILD' | 'AVOID';
  }): Promise<ApiResponse<Habit>> {
    return this.makeRequest<Habit>('/habits', {
      method: 'POST',
      body: JSON.stringify(habitData),
    });
  }

  async updateHabit(habitId: string, updates: Partial<Habit>): Promise<ApiResponse<Habit>> {
    return this.makeRequest<Habit>(`/habits/${habitId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteHabit(habitId: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(`/habits/${habitId}`, {
      method: 'DELETE',
    });
  }

  // Habit Event methods
  async logHabitEvent(eventData: {
    habitId: string;
    eventType: 'COMPLETED' | 'SKIPPED' | 'RELAPSED';
    notes?: string;
    occurredAt?: string;
  }): Promise<ApiResponse<HabitEvent>> {
    const { habitId, ...requestBody } = eventData;
    return this.makeRequest<HabitEvent>(`/habit-events/${habitId}`, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  }

  async getHabitEvents(params?: {
    habitId?: string;
    startDate?: string;
    endDate?: string;
    eventType?: string;
  }): Promise<ApiResponse<{events: HabitEvent[], pagination: any}>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
    }
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/habit-events?${queryString}` : '/habit-events';
    
    return this.makeRequest<{events: HabitEvent[], pagination: any}>(endpoint);
  }

  async deleteHabitEvent(eventId: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(`/habit-events/event/${eventId}`, {
      method: 'DELETE',
    });
  }

  async getTodayEvents(): Promise<ApiResponse<{events: HabitEvent[], summary: any}>> {
    return this.makeRequest<{events: HabitEvent[], summary: any}>('/habit-events/today');
  }

  // Streak methods
  async getStreaks(): Promise<ApiResponse<{habitStreaks: any[]}>> {
    return this.makeRequest<{habitStreaks: any[]}>('/streaks');
  }

  async getHabitStreak(habitId: string): Promise<ApiResponse<Streak>> {
    return this.makeRequest<Streak>(`/streaks/${habitId}`);
  }

  // Journal methods
  async getJournalEntries(params?: {
    startDate?: string;
    endDate?: string;
    moodRating?: number;
    limit?: number;
  }): Promise<ApiResponse<JournalEntry[]>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/journal?${queryString}` : '/journal';
    
    return this.makeRequest<JournalEntry[]>(endpoint);
  }

  async createJournalEntry(entryData: {
    content: string;
    moodRating?: number;
  }): Promise<ApiResponse<JournalEntry>> {
    return this.makeRequest<JournalEntry>('/journal', {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
  }

  async updateJournalEntry(entryId: string, updates: {
    content?: string;
    moodRating?: number;
  }): Promise<ApiResponse<JournalEntry>> {
    return this.makeRequest<JournalEntry>(`/journal/${entryId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteJournalEntry(entryId: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(`/journal/${entryId}`, {
      method: 'DELETE',
    });
  }

  // AI Insights methods
  async generateDailyInsights(): Promise<ApiResponse<AIInsight[]>> {
    return this.makeRequest<AIInsight[]>('/ai/insights/generate/daily', {
      method: 'POST',
    });
  }

  async getTodaysInsights(): Promise<ApiResponse<AIInsight[]>> {
    return this.makeRequest<AIInsight[]>('/ai/insights/today');
  }

  async getInsights(params?: {
    type?: string;
    limit?: number;
    shown?: boolean;
  }): Promise<ApiResponse<AIInsight[]>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/ai/insights?${queryString}` : '/ai/insights';
    
    return this.makeRequest<AIInsight[]>(endpoint);
  }

  async markInsightAsShown(insightId: string): Promise<ApiResponse<AIInsight>> {
    return this.makeRequest<AIInsight>(`/ai/insights/${insightId}/shown`, {
      method: 'PUT',
    });
  }

  // Weekly Summary methods
  async generateWeeklySummary(options?: {
    weekOffset?: number;
    includeComparison?: boolean;
    includePredictions?: boolean;
  }): Promise<ApiResponse<WeeklySummary>> {
    return this.makeRequest<WeeklySummary>('/weekly-summary/generate', {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
  }

  async getCurrentWeekSummary(): Promise<ApiResponse<WeeklySummary>> {
    return this.makeRequest<WeeklySummary>('/weekly-summary/current');
  }

  async getLastWeekSummary(): Promise<ApiResponse<WeeklySummary>> {
    return this.makeRequest<WeeklySummary>('/weekly-summary/last-week');
  }

  async getWeeklySummaries(limit?: number): Promise<ApiResponse<WeeklySummary[]>> {
    const endpoint = limit ? `/weekly-summary?limit=${limit}` : '/weekly-summary';
    return this.makeRequest<WeeklySummary[]>(endpoint);
  }

  // Analytics methods
  async getDailyStats(date?: string): Promise<ApiResponse<any>> {
    const endpoint = date ? `/analytics/daily/${date}` : '/analytics/daily';
    return this.makeRequest<any>(endpoint);
  }

  async getWeeklyStats(weekOffset?: number): Promise<ApiResponse<any>> {
    const endpoint = weekOffset ? `/analytics/weekly?weekOffset=${weekOffset}` : '/analytics/weekly';
    return this.makeRequest<any>(endpoint);
  }

  async getMonthlyStats(monthOffset?: number): Promise<ApiResponse<any>> {
    const endpoint = monthOffset ? `/analytics/monthly?monthOffset=${monthOffset}` : '/analytics/monthly';
    return this.makeRequest<any>(endpoint);
  }
}

// Create and export API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export utility functions
export const isApiError = (response: ApiResponse<any>): response is ApiResponse<never> => {
  return !response.success;
};

export const handleApiError = (response: ApiResponse<any>): string => {
  return response.error || 'An unexpected error occurred';
};