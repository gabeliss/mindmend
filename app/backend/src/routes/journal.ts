import { Router } from 'express';
import { journalController } from '../controllers/journalController';
import { authenticateUser } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply authentication to all journal routes
router.use(authenticateUser);

// Apply rate limiting to journal routes
router.use(rateLimiter);

// Journal entry CRUD operations
router.post('/', journalController.createEntry);
router.get('/', journalController.getEntries);
router.get('/mood-trend', journalController.getMoodTrend);
router.get('/date/:date', journalController.getEntriesByDate);
router.get('/:id', journalController.getEntryById);
router.put('/:id', journalController.updateEntry);
router.delete('/:id', journalController.deleteEntry);

export default router;