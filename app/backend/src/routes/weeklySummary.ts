import { Router } from 'express';
import { weeklySummaryController } from '../controllers/weeklySummaryController';
import { authenticateUser } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply authentication to all weekly summary routes
router.use(authenticateUser);

// Apply rate limiting to weekly summary routes
router.use(rateLimiter);

// Generate weekly summaries
router.post('/generate', weeklySummaryController.generateWeeklySummary);
router.post('/regenerate', weeklySummaryController.regenerateSummary);

// Get weekly summaries
router.get('/', weeklySummaryController.getUserWeeklySummaries);
router.get('/current', weeklySummaryController.getCurrentWeekSummary);
router.get('/last-week', weeklySummaryController.getLastWeekSummary);
router.get('/week', weeklySummaryController.getWeeklySummary);

// Get specific parts of weekly summaries
router.get('/achievements', weeklySummaryController.getSummaryAchievements);
router.get('/insights', weeklySummaryController.getSummaryInsights);
router.get('/recommendations', weeklySummaryController.getSummaryRecommendations);
router.get('/statistics', weeklySummaryController.getSummaryStatistics);

export default router;