import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import prisma from '../config/database';
import ResponseHandler from '../utils/response';
import { 
  validateRequestBody, 
  validateCoachStyle, 
  validateEmail,
  sanitizeString 
} from '../middleware/validation';
import Logger from '../utils/logger';

const router = Router();

// Get user profile
router.get('/profile',
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
        updatedAt: true
      }
    });
    
    if (!user) {
      return ResponseHandler.error(res, 'User not found', 404);
    }
    
    return ResponseHandler.success(res, user, 'Profile retrieved successfully');
  })
);

// Update user profile
router.put('/profile',
  authenticateToken,
  validateRequestBody({
    coachStyle: (style) => !style || validateCoachStyle(style),
    email: (email) => !email || validateEmail(email)
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { displayName, timezone, coachStyle } = req.body;
    
    // Prepare update data
    const updateData: any = {};
    
    if (displayName !== undefined) {
      updateData.displayName = displayName ? sanitizeString(displayName) : null;
      
      // Validate display name length
      if (updateData.displayName && updateData.displayName.length > 100) {
        return ResponseHandler.error(res, 'Display name cannot exceed 100 characters', 400);
      }
    }
    
    if (timezone !== undefined) {
      // Basic timezone validation
      if (typeof timezone !== 'string' || timezone.length > 50) {
        return ResponseHandler.error(res, 'Invalid timezone format', 400);
      }
      updateData.timezone = timezone;
    }
    
    if (coachStyle !== undefined) {
      updateData.coachStyle = coachStyle;
    }
    
    // Only update if there's data to update
    if (Object.keys(updateData).length === 0) {
      return ResponseHandler.error(res, 'No valid fields to update', 400);
    }
    
    try {
      const updatedUser = await prisma.user.update({
        where: { id: req.user!.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          displayName: true,
          timezone: true,
          coachStyle: true,
          updatedAt: true
        }
      });
      
      Logger.info('User profile updated', {
        userId: req.user!.id,
        updatedFields: Object.keys(updateData)
      });
      
      return ResponseHandler.success(res, updatedUser, 'Profile updated successfully');
    } catch (error) {
      Logger.error('Failed to update user profile', {
        userId: req.user!.id,
        error
      });
      return ResponseHandler.error(res, 'Failed to update profile', 500);
    }
  })
);

// Get user statistics
router.get('/stats',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    
    try {
      // Get basic counts
      const [
        totalHabits,
        activeHabits,
        totalJournalEntries,
        totalHabitEvents,
        completedEvents,
        recentStats
      ] = await Promise.all([
        prisma.habit.count({ where: { userId } }),
        prisma.habit.count({ where: { userId, isActive: true } }),
        prisma.journalEntry.count({ where: { userId } }),
        prisma.habitEvent.count({ where: { userId } }),
        prisma.habitEvent.count({ 
          where: { userId, eventType: 'COMPLETED' } 
        }),
        prisma.dailyStats.findMany({
          where: { userId },
          orderBy: { date: 'desc' },
          take: 30 // Last 30 days
        })
      ]);
      
      // Calculate completion rate
      const completionRate = totalHabitEvents > 0 
        ? Math.round((completedEvents / totalHabitEvents) * 100) 
        : 0;
      
      // Calculate recent averages from daily stats
      const recentAvgMood = recentStats.length > 0
        ? recentStats
            .filter(stat => stat.avgMood !== null)
            .reduce((sum, stat) => sum + (stat.avgMood || 0), 0) / 
          recentStats.filter(stat => stat.avgMood !== null).length
        : null;
      
      const stats = {
        habits: {
          total: totalHabits,
          active: activeHabits,
          inactive: totalHabits - activeHabits
        },
        activity: {
          totalEvents: totalHabitEvents,
          completedEvents,
          completionRate: `${completionRate}%`,
          journalEntries: totalJournalEntries
        },
        trends: {
          last30Days: recentStats.length,
          avgMoodLast30Days: recentAvgMood ? Math.round(recentAvgMood * 10) / 10 : null,
          totalHabitsCompletedLast30Days: recentStats.reduce((sum, stat) => sum + stat.habitsCompleted, 0)
        }
      };
      
      return ResponseHandler.success(res, stats, 'User statistics retrieved');
    } catch (error) {
      Logger.error('Failed to get user statistics', {
        userId,
        error
      });
      return ResponseHandler.error(res, 'Failed to retrieve statistics', 500);
    }
  })
);

// Get user preferences (coach style, notifications, etc.)
router.get('/preferences',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        coachStyle: true,
        timezone: true
      }
    });
    
    if (!user) {
      return ResponseHandler.error(res, 'User not found', 404);
    }
    
    // For MVP, we'll return basic preferences
    // This can be extended with notification preferences, theme, etc.
    const preferences = {
      coaching: {
        style: user.coachStyle,
        description: getCoachStyleDescription(user.coachStyle)
      },
      general: {
        timezone: user.timezone
      },
      notifications: {
        // Placeholder for future notification preferences
        dailyReminders: true,
        weeklyReports: true,
        achievementAlerts: true
      }
    };
    
    return ResponseHandler.success(res, preferences, 'User preferences retrieved');
  })
);

// Update user preferences
router.put('/preferences',
  authenticateToken,
  validateRequestBody({
    coachStyle: (style) => !style || validateCoachStyle(style)
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { coachStyle, timezone } = req.body;
    
    const updateData: any = {};
    
    if (coachStyle) {
      updateData.coachStyle = coachStyle;
    }
    
    if (timezone) {
      if (typeof timezone !== 'string' || timezone.length > 50) {
        return ResponseHandler.error(res, 'Invalid timezone format', 400);
      }
      updateData.timezone = timezone;
    }
    
    if (Object.keys(updateData).length === 0) {
      return ResponseHandler.error(res, 'No valid preferences to update', 400);
    }
    
    try {
      const updatedUser = await prisma.user.update({
        where: { id: req.user!.id },
        data: updateData,
        select: {
          coachStyle: true,
          timezone: true
        }
      });
      
      Logger.info('User preferences updated', {
        userId: req.user!.id,
        updatedFields: Object.keys(updateData)
      });
      
      const preferences = {
        coaching: {
          style: updatedUser.coachStyle,
          description: getCoachStyleDescription(updatedUser.coachStyle)
        },
        general: {
          timezone: updatedUser.timezone
        }
      };
      
      return ResponseHandler.success(res, preferences, 'Preferences updated successfully');
    } catch (error) {
      Logger.error('Failed to update user preferences', {
        userId: req.user!.id,
        error
      });
      return ResponseHandler.error(res, 'Failed to update preferences', 500);
    }
  })
);

// Helper function to get coach style description
function getCoachStyleDescription(style: string): string {
  switch (style) {
    case 'SUPPORTIVE':
      return 'Encouraging and empathetic coaching with emotional support';
    case 'DIRECT':
      return 'Straightforward and actionable coaching focused on practical solutions';
    case 'MOTIVATIONAL':
      return 'Energetic and inspiring coaching focused on goal achievement';
    default:
      return 'Personalized coaching style';
  }
}

export default router;