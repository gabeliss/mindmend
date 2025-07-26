import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, User } from './api';

// Firebase Auth types (simplified for React Native)
export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
}

export interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Auth Error types
export interface AuthError {
  code: string;
  message: string;
}

class AuthService {
  private currentUser: User | null = null;
  private firebaseUser: FirebaseUser | null = null;
  private authStateListeners: ((authState: AuthState) => void)[] = [];

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth(): Promise<void> {
    const authId = `auth_init_${Date.now()}`;
    console.log(`[AUTH] ${authId} - Starting auth initialization`);
    
    try {
      // Load stored user data
      console.log(`[AUTH] ${authId} - Loading stored auth data from AsyncStorage`);
      const storedUser = await AsyncStorage.getItem('currentUser');
      const storedFirebaseUser = await AsyncStorage.getItem('firebaseUser');
      const authToken = await AsyncStorage.getItem('authToken');

      console.log(`[AUTH] ${authId} - Storage check results:`, {
        hasStoredUser: !!storedUser,
        hasStoredFirebaseUser: !!storedFirebaseUser,
        hasAuthToken: !!authToken,
        authTokenLength: authToken?.length
      });

      if (storedUser && storedFirebaseUser && authToken) {
        console.log(`[AUTH] ${authId} - Found stored auth data, parsing and setting up`);
        this.currentUser = JSON.parse(storedUser);
        this.firebaseUser = JSON.parse(storedFirebaseUser);
        
        console.log(`[AUTH] ${authId} - Parsed user data:`, {
          userId: this.currentUser?.id,
          userEmail: this.currentUser?.email,
          firebaseUid: this.firebaseUser?.uid
        });
        
        await apiClient.setAuthToken(authToken);
        console.log(`[AUTH] ${authId} - Auth token set in API client`);
        
        // Verify token is still valid by fetching profile
        console.log(`[AUTH] ${authId} - Verifying token validity with profile fetch`);
        const profileResponse = await apiClient.getProfile();
        
        if (!profileResponse.success) {
          console.error(`[AUTH] ${authId} - Token verification failed:`, profileResponse.error);
          console.log(`[AUTH] ${authId} - Clearing invalid auth state`);
          await this.clearAuthState();
        } else if (profileResponse.data) {
          console.log(`[AUTH] ${authId} - Token valid, updating user data`);
          this.currentUser = profileResponse.data;
          await AsyncStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        }
      } else {
        console.log(`[AUTH] ${authId} - No complete auth data found in storage`);
      }

      console.log(`[AUTH] ${authId} - Auth initialization complete, notifying listeners`);
      this.notifyAuthStateChange();
    } catch (error) {
      console.error(`[AUTH] ${authId} - Failed to initialize auth:`, error);
      console.log(`[AUTH] ${authId} - Clearing auth state due to initialization error`);
      await this.clearAuthState();
    }
  }

  private async clearAuthState(): Promise<void> {
    this.currentUser = null;
    this.firebaseUser = null;
    await apiClient.clearAuthToken();
    await AsyncStorage.multiRemove(['currentUser', 'firebaseUser', 'authToken']);
    this.notifyAuthStateChange();
  }

  private notifyAuthStateChange(): void {
    const authState: AuthState = {
      user: this.currentUser,
      firebaseUser: this.firebaseUser,
      isLoading: false,
      isAuthenticated: this.currentUser !== null,
    };

    this.authStateListeners.forEach(listener => listener(authState));
  }

  // Auth state subscription
  onAuthStateChanged(callback: (authState: AuthState) => void): () => void {
    this.authStateListeners.push(callback);
    
    // Immediately call with current state
    callback({
      user: this.currentUser,
      firebaseUser: this.firebaseUser,
      isLoading: false,
      isAuthenticated: this.currentUser !== null,
    });

    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  // Mock Firebase auth for development - replace with actual Firebase implementation
  async signUpWithEmailAndPassword(
    email: string, 
    password: string, 
    displayName: string
  ): Promise<{ user: User; error?: AuthError }> {
    const signupId = `signup_${Date.now()}`;
    console.log(`[AUTH] ${signupId} - Starting signup process for email: ${email}`);
    
    try {
      // In a real implementation, this would use Firebase Auth
      // For now, we'll simulate Firebase user creation and get a mock token
      console.log(`[AUTH] ${signupId} - Creating mock Firebase user`);
      const mockFirebaseUser: FirebaseUser = {
        uid: `firebase_${Date.now()}_${Math.random()}`,
        email,
        displayName,
        emailVerified: true,
      };

      console.log(`[AUTH] ${signupId} - Mock Firebase user created:`, {
        uid: mockFirebaseUser.uid,
        email: mockFirebaseUser.email,
        displayName: mockFirebaseUser.displayName
      });

      // Mock auth token (in real implementation, this comes from Firebase)
      const mockAuthToken = 'mock-token';
      console.log(`[AUTH] ${signupId} - Generated mock auth token`);

      // Create user in our backend
      console.log(`[AUTH] ${signupId} - Creating user in backend API`);
      const userData = {
        firebaseUid: mockFirebaseUser.uid,
        email,
        displayName,
        coachStyle: 'SUPPORTIVE' as const,
      };
      console.log(`[AUTH] ${signupId} - User data for backend:`, userData);
      
      const userResponse = await apiClient.createUser(userData);

      if (!userResponse.success || !userResponse.data) {
        console.error(`[AUTH] ${signupId} - Backend user creation failed:`, userResponse.error);
        return {
          user: null as any,
          error: {
            code: 'create-user-failed',
            message: userResponse.error || 'Failed to create user account',
          },
        };
      }

      console.log(`[AUTH] ${signupId} - User created successfully in backend:`, {
        userId: userResponse.data.id,
        userEmail: userResponse.data.email
      });

      // Store auth state
      console.log(`[AUTH] ${signupId} - Storing auth state`);
      await this.setAuthState(userResponse.data, mockFirebaseUser, mockAuthToken);

      console.log(`[AUTH] ${signupId} - Signup process completed successfully`);
      return { user: userResponse.data };
    } catch (error) {
      console.error(`[AUTH] ${signupId} - Signup process failed with error:`, error);
      return {
        user: null as any,
        error: {
          code: 'signup-error',
          message: error instanceof Error ? error.message : 'Sign up failed',
        },
      };
    }
  }

  async signInWithEmailAndPassword(
    email: string, 
    password: string
  ): Promise<{ user: User; error?: AuthError }> {
    const signinId = `signin_${Date.now()}`;
    console.log(`[AUTH] ${signinId} - Starting signin process for email: ${email}`);
    
    try {
      // In a real implementation, this would use Firebase Auth
      // For now, we'll simulate sign in
      console.log(`[AUTH] ${signinId} - Creating mock Firebase user for signin`);
      const mockFirebaseUser: FirebaseUser = {
        uid: `firebase_${email.replace('@', '_').replace('.', '_')}`,
        email,
        displayName: email.split('@')[0],
        emailVerified: true,
      };

      console.log(`[AUTH] ${signinId} - Mock Firebase user for signin:`, {
        uid: mockFirebaseUser.uid,
        email: mockFirebaseUser.email,
        displayName: mockFirebaseUser.displayName
      });

      // Mock auth token (in real implementation, this comes from Firebase)
      const mockAuthToken = 'mock-token';
      console.log(`[AUTH] ${signinId} - Generated mock auth token for signin`);

      // Set the auth token first
      console.log(`[AUTH] ${signinId} - Setting auth token in API client`);
      await apiClient.setAuthToken(mockAuthToken);

      // Try to get user profile from backend
      console.log(`[AUTH] ${signinId} - Fetching user profile from backend`);
      const profileResponse = await apiClient.getProfile();
      
      if (!profileResponse.success) {
        console.log(`[AUTH] ${signinId} - User doesn't exist in backend, creating new user`);
        console.log(`[AUTH] ${signinId} - Profile fetch error:`, profileResponse.error);
        
        // User doesn't exist in backend, create them
        const userData = {
          firebaseUid: mockFirebaseUser.uid,
          email,
          displayName: mockFirebaseUser.displayName || email.split('@')[0],
          coachStyle: 'SUPPORTIVE' as const,
        };
        console.log(`[AUTH] ${signinId} - Creating user in backend with data:`, userData);
        
        const createResponse = await apiClient.createUser(userData);

        if (!createResponse.success || !createResponse.data) {
          console.error(`[AUTH] ${signinId} - Failed to create user in backend:`, createResponse.error);
          return {
            user: null as any,
            error: {
              code: 'signin-failed',
              message: createResponse.error || 'Failed to create user account',
            },
          };
        }

        console.log(`[AUTH] ${signinId} - User created in backend, storing auth state`);
        await this.setAuthState(createResponse.data, mockFirebaseUser, mockAuthToken);
        console.log(`[AUTH] ${signinId} - Signin completed (new user created)`);
        return { user: createResponse.data };
      }

      console.log(`[AUTH] ${signinId} - User exists in backend, storing auth state`);
      console.log(`[AUTH] ${signinId} - Profile data:`, {
        userId: profileResponse.data?.id,
        userEmail: profileResponse.data?.email
      });
      
      // User exists, store auth state
      await this.setAuthState(profileResponse.data!, mockFirebaseUser, mockAuthToken);
      console.log(`[AUTH] ${signinId} - Signin completed (existing user)`);
      return { user: profileResponse.data! };

    } catch (error) {
      console.error(`[AUTH] ${signinId} - Signin process failed with error:`, error);
      return {
        user: null as any,
        error: {
          code: 'signin-error',
          message: error instanceof Error ? error.message : 'Sign in failed',
        },
      };
    }
  }

  async signOut(): Promise<void> {
    try {
      // In a real implementation, this would call Firebase Auth signOut
      await this.clearAuthState();
    } catch (error) {
      console.error('Sign out error:', error);
      // Still clear local state even if there's an error
      await this.clearAuthState();
    }
  }

  private async setAuthState(user: User, firebaseUser: FirebaseUser, authToken: string): Promise<void> {
    this.currentUser = user;
    this.firebaseUser = firebaseUser;
    
    await apiClient.setAuthToken(authToken);
    await AsyncStorage.setItem('currentUser', JSON.stringify(user));
    await AsyncStorage.setItem('firebaseUser', JSON.stringify(firebaseUser));
    await AsyncStorage.setItem('authToken', authToken);
    
    this.notifyAuthStateChange();
  }

  // Getters
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getFirebaseUser(): FirebaseUser | null {
    return this.firebaseUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  // Update user profile
  async updateProfile(updates: Partial<User>): Promise<{ user?: User; error?: AuthError }> {
    try {
      if (!this.currentUser) {
        return {
          error: {
            code: 'not-authenticated',
            message: 'User not authenticated',
          },
        };
      }

      const updateResponse = await apiClient.updateProfile(updates);
      
      if (!updateResponse.success || !updateResponse.data) {
        return {
          error: {
            code: 'update-failed',
            message: updateResponse.error || 'Failed to update profile',
          },
        };
      }

      // Update stored user data
      this.currentUser = updateResponse.data;
      await AsyncStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      this.notifyAuthStateChange();

      return { user: updateResponse.data };
    } catch (error) {
      return {
        error: {
          code: 'update-error',
          message: error instanceof Error ? error.message : 'Update failed',
        },
      };
    }
  }

  // Get current auth token for manual API calls
  async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }
}

// Create and export auth service instance
export const authService = new AuthService();

// Export helper hooks for React components
export const useAuth = () => {
  const [authState, setAuthState] = React.useState<AuthState>({
    user: null,
    firebaseUser: null,
    isLoading: true,
    isAuthenticated: false,
  });

  React.useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(setAuthState);
    return unsubscribe;
  }, []);

  return {
    ...authState,
    signUp: authService.signUpWithEmailAndPassword.bind(authService),
    signIn: authService.signInWithEmailAndPassword.bind(authService),
    signOut: authService.signOut.bind(authService),
    updateProfile: authService.updateProfile.bind(authService),
  };
};

// Note: This is a simplified auth implementation for development
// In production, you should use the actual Firebase Auth SDK:
// - npm install @react-native-firebase/app @react-native-firebase/auth
// - Follow Firebase setup for iOS/Android
// - Replace mock implementations with real Firebase calls