import { Router } from 'express';
import { aiInsightController } from '../controllers/aiInsightController';
import { authenticateUser } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply authentication to all AI insight routes
router.use(authenticateUser);

// Apply rate limiting to AI insight routes (these are more resource-intensive)
router.use(rateLimiter);

// Generate insights
router.post('/generate/daily', aiInsightController.generateDailyInsights);
router.post('/generate/weekly', aiInsightController.generateWeeklyInsight);
router.post('/regenerate', aiInsightController.regenerateInsights);

// Retrieve insights
router.get('/', aiInsightController.getUserInsights);
router.get('/today', aiInsightController.getTodaysInsights);
router.get('/weekly/latest', aiInsightController.getLatestWeeklyInsight);
router.get('/:id', aiInsightController.getInsightById);

// Mark insights as shown
router.put('/:id/shown', aiInsightController.markInsightAsShown);

export default router;