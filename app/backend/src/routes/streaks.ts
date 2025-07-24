import { Router } from 'express';
import { StreakController } from '../controllers/streakController';
import { validateUUID } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/streaks - Get all streaks for user (summary)
router.get('/', authenticateToken, StreakController.getUserStreakSummary);

// GET /api/streaks/dashboard - Get comprehensive streak dashboard data
router.get('/dashboard', StreakController.getStreakDashboard);

// GET /api/streaks/summary - Get streak summary for all user habits
router.get('/summary', StreakController.getUserStreakSummary);

// GET /api/streaks/leaderboard - Get streak leaderboard (top performing habits)
router.get('/leaderboard', StreakController.getStreakLeaderboard);

// GET /api/streaks/insights - Get streak insights and achievements
router.get('/insights', StreakController.getStreakInsights);

// GET /api/streaks/:habitId - Get streak data for a specific habit
router.get('/:habitId', validateUUID('habitId'), StreakController.getHabitStreak);

// GET /api/streaks/:habitId/history - Get streak history for a habit (calendar view)
router.get('/:habitId/history', validateUUID('habitId'), StreakController.getHabitStreakHistory);

export default router;