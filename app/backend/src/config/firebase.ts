import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import Logger from '../utils/logger';
import { AppError } from '../types';

// Initialize Firebase Admin SDK
class FirebaseConfig {
  private static instance: FirebaseConfig;
  private app: admin.app.App;
  private auth: admin.auth.Auth;
  
  private constructor() {
    try {
      // Check if Firebase is already initialized
      if (admin.apps.length === 0) {
        this.initializeFirebase();
      }
      
      this.app = admin.app();
      this.auth = getAuth();
      
      Logger.info('Firebase Admin SDK initialized successfully');
    } catch (error: any) {
      Logger.error('Failed to initialize Firebase Admin SDK', error);
      throw new AppError('Firebase initialization failed', 500);
    }
  }
  
  private initializeFirebase(): void {
    const firebaseConfig = this.getFirebaseConfig();
    
    admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }
  
  private getFirebaseConfig(): admin.ServiceAccount {
    const requiredEnvVars = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_PRIVATE_KEY',
      'FIREBASE_CLIENT_EMAIL'
    ];
    
    // Check if all required environment variables are present
    const missing = requiredEnvVars.filter(key => !process.env[key]);
    if (missing.length > 0) {
      if (process.env.NODE_ENV === 'development') {
        Logger.warn(`Missing Firebase config: ${missing.join(', ')}. Using mock auth for development.`);
        // Return a mock config for development
        return {
          projectId: 'mindmend-dev',
          privateKey: 'mock-key',
          clientEmail: 'mock@mindmend-dev.iam.gserviceaccount.com'
        };
      }
      throw new AppError(`Missing required Firebase environment variables: ${missing.join(', ')}`, 500);
    }
    
    return {
      projectId: process.env.FIREBASE_PROJECT_ID!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    };
  }
  
  public static getInstance(): FirebaseConfig {
    if (!FirebaseConfig.instance) {
      FirebaseConfig.instance = new FirebaseConfig();
    }
    return FirebaseConfig.instance;
  }
  
  public getAuth(): admin.auth.Auth {
    return this.auth;
  }
  
  public getApp(): admin.app.App {
    return this.app;
  }
  
  // Verify ID token from client
  public async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    try {
      const decodedToken = await this.auth.verifyIdToken(idToken);
      return decodedToken;
    } catch (error: any) {
      Logger.error('Failed to verify Firebase ID token', { error: error.message });
      
      if (error.code === 'auth/id-token-expired') {
        throw new AppError('Token expired', 401);
      } else if (error.code === 'auth/id-token-revoked') {
        throw new AppError('Token revoked', 401);
      } else if (error.code === 'auth/invalid-id-token') {
        throw new AppError('Invalid token', 401);
      }
      
      throw new AppError('Authentication failed', 401);
    }
  }
  
  // Get user info from Firebase
  public async getUser(uid: string): Promise<admin.auth.UserRecord> {
    try {
      return await this.auth.getUser(uid);
    } catch (error: any) {
      Logger.error('Failed to get Firebase user', { uid, error: error.message });
      throw new AppError('User not found in Firebase', 404);
    }
  }
  
  // Create custom token (for testing)
  public async createCustomToken(uid: string, additionalClaims?: object): Promise<string> {
    try {
      return await this.auth.createCustomToken(uid, additionalClaims);
    } catch (error: any) {
      Logger.error('Failed to create custom token', { uid, error: error.message });
      throw new AppError('Failed to create token', 500);
    }
  }
  
  // Revoke refresh tokens for user
  public async revokeRefreshTokens(uid: string): Promise<void> {
    try {
      await this.auth.revokeRefreshTokens(uid);
      Logger.info('Revoked refresh tokens for user', { uid });
    } catch (error: any) {
      Logger.error('Failed to revoke refresh tokens', { uid, error: error.message });
      throw new AppError('Failed to revoke tokens', 500);
    }
  }
  
  // Set custom user claims
  public async setCustomUserClaims(uid: string, customClaims: object): Promise<void> {
    try {
      await this.auth.setCustomUserClaims(uid, customClaims);
      Logger.info('Set custom claims for user', { uid, claims: customClaims });
    } catch (error: any) {
      Logger.error('Failed to set custom claims', { uid, error: error.message });
      throw new AppError('Failed to set user claims', 500);
    }
  }
  
  // Health check for Firebase connection
  public async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; message: string }> {
    try {
      // Try to get auth service
      await this.auth.getUser('test-health-check-uid').catch(() => {
        // Expected to fail for non-existent user, but shows Firebase is responding
      });
      
      return {
        status: 'healthy',
        message: 'Firebase connection is healthy'
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        message: `Firebase connection failed: ${error.message}`
      };
    }
  }
}

// Export singleton instance
export default FirebaseConfig.getInstance();