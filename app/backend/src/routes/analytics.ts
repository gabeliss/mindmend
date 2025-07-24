import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { validateUUID } from '../middleware/validation';

const router = Router();

// GET /api/analytics/dashboard - Get comprehensive analytics dashboard
router.get('/dashboard', AnalyticsController.getAnalyticsDashboard);

// GET /api/analytics/overview - Get user analytics overview
router.get('/overview', AnalyticsController.getUserAnalytics);

// GET /api/analytics/heatmap - Get activity heatmap data
router.get('/heatmap', AnalyticsController.getActivityHeatmap);

// GET /api/analytics/trends - Get completion rate trends
router.get('/trends', AnalyticsController.getCompletionTrends);

// GET /api/analytics/habits/:habitId - Get analytics for a specific habit
router.get('/habits/:habitId', validateUUID('habitId'), AnalyticsController.getHabitAnalytics);

export default router;