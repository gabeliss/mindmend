import express from 'express';
import { InsightsController } from '../controllers/insightsController';
import { authenticateUser } from '../middleware/auth';

const router = express.Router();

// Get daily summary for home screen
router.get('/daily-summary', authenticateUser, InsightsController.getDailySummary);

// Get today's context for check-in screen
router.get('/todays-context', authenticateUser, InsightsController.getTodaysContext);

// Get contextual check-in questions
router.get('/contextual-questions', authenticateUser, InsightsController.getContextualCheckInQuestions);

// Submit check-in data
router.post('/submit-checkin', authenticateUser, InsightsController.submitCheckIn);

// Record feedback on AI insights
router.post('/feedback', authenticateUser, InsightsController.recordInsightFeedback);

export default router;