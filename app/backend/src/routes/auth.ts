import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, logout } from '../middleware/auth';
import FirebaseConfig from '../config/firebase';
import prisma from '../config/database';
import ResponseHandler from '../utils/response';
import { validateRequiredFields } from '../middleware/validation';
import Logger from '../utils/logger';

const router = Router();

// Verify token endpoint
router.post('/verify', asyncHandler(async (req: Request, res: Response) => {
  const { idToken } = req.body;
  
  if (!idToken) {
    return ResponseHandler.error(res, 'ID token is required', 400);
  }
  
  try {
    const decodedToken = await FirebaseConfig.verifyIdToken(idToken);
    
    // Check if user exists in database
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid },
      select: {
        id: true,
        email: true,
        displayName: true,
        timezone: true,
        coachStyle: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    return ResponseHandler.success(res, {
      valid: true,
      user,
      firebase: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        name: decodedToken.name
      }
    }, 'Token verified successfully');
    
  } catch (error) {
    Logger.warn('Token verification failed', { error });
    return ResponseHandler.error(res, 'Invalid token', 401);
  }
}));

// Register/Login endpoint (handled automatically by auth middleware)
router.post('/register', 
  validateRequiredFields(['idToken']),
  asyncHandler(async (req: Request, res: Response) => {
    const { idToken, timezone, coachStyle } = req.body;
    
    try {
      const decodedToken = await FirebaseConfig.verifyIdToken(idToken);
      
      // Check if user already exists
      let user = await prisma.user.findUnique({
        where: { firebaseUid: decodedToken.uid }
      });
      
      if (user) {
        return ResponseHandler.success(res, {
          user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            timezone: user.timezone,
            coachStyle: user.coachStyle,
            createdAt: user.createdAt
          },
          isNewUser: false
        }, 'User already exists');
      }
      
      // Get additional user info from Firebase
      const firebaseUser = await FirebaseConfig.getUser(decodedToken.uid);
      
      // Create new user
      user = await prisma.user.create({
        data: {
          firebaseUid: decodedToken.uid,
          email: decodedToken.email || firebaseUser.email!,
          displayName: decodedToken.name || firebaseUser.displayName || undefined,
          timezone: timezone || 'UTC',
          coachStyle: coachStyle || 'SUPPORTIVE'
        }
      });
      
      Logger.info('New user registered', {
        userId: user.id,
        email: user.email,
        firebaseUid: user.firebaseUid
      });
      
      return ResponseHandler.created(res, {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          timezone: user.timezone,
          coachStyle: user.coachStyle,
          createdAt: user.createdAt
        },
        isNewUser: true
      }, 'User registered successfully');
      
    } catch (error) {
      Logger.error('Registration failed', { error });
      return ResponseHandler.error(res, 'Registration failed', 400);
    }
  })
);

// Get current user profile
router.get('/me', 
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        timezone: true,
        coachStyle: true,
        createdAt: true,
        updatedAt: true,
        // Include some basic stats
        _count: {
          select: {
            habits: { where: { isActive: true } },
            journalEntries: true,
            habitEvents: true
          }
        }
      }
    });
    
    if (!user) {
      return ResponseHandler.error(res, 'User not found', 404);
    }
    
    return ResponseHandler.success(res, {
      ...user,
      stats: {
        activeHabits: user._count.habits,
        totalJournalEntries: user._count.journalEntries,
        totalHabitEvents: user._count.habitEvents
      }
    }, 'User profile retrieved');
  })
);

// Refresh user data from Firebase
router.post('/refresh',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      // Get latest info from Firebase
      const firebaseUser = await FirebaseConfig.getUser(req.user!.firebaseUid);
      
      // Update user in database if needed
      const updatedUser = await prisma.user.update({
        where: { id: req.user!.id },
        data: {
          email: firebaseUser.email || undefined,
          displayName: firebaseUser.displayName || undefined,
          updatedAt: new Date()
        },
        select: {
          id: true,
          email: true,
          displayName: true,
          timezone: true,
          coachStyle: true,
          updatedAt: true
        }
      });
      
      return ResponseHandler.success(res, updatedUser, 'User data refreshed');
    } catch (error) {
      Logger.error('Failed to refresh user data', { 
        userId: req.user!.id, 
        error 
      });
      return ResponseHandler.error(res, 'Failed to refresh user data', 500);
    }
  })
);

// Logout endpoint
router.post('/logout', authenticateToken, logout);

// Delete account endpoint
router.delete('/account',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { confirmation } = req.body;
    
    if (confirmation !== 'DELETE') {
      return ResponseHandler.error(res, 'Please confirm account deletion by sending "DELETE" in confirmation field', 400);
    }
    
    try {
      // Delete user from database (cascade will handle related records)
      await prisma.user.delete({
        where: { id: req.user!.id }
      });
      
      Logger.info('User account deleted', {
        userId: req.user!.id,
        email: req.user!.email
      });
      
      return ResponseHandler.success(res, 
        { deleted: true }, 
        'Account deleted successfully'
      );
    } catch (error) {
      Logger.error('Failed to delete account', {
        userId: req.user!.id,
        error
      });
      return ResponseHandler.error(res, 'Failed to delete account', 500);
    }
  })
);

export default router;