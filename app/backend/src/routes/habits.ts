import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { validateRequiredFields, validateUUID, validatePagination } from '../middleware/validation';
import { HabitController } from '../controllers/habitController';

const router = Router();

// All habit routes require authentication
router.use(authenticateToken);

// Create a new habit
router.post('/',
  validateRequiredFields(['title', 'habitType']),
  asyncHandler(HabitController.createHabit)
);

// Get all habits for the authenticated user
router.get('/',
  asyncHandler(HabitController.getUserHabits)
);

// Get habits summary (for dashboard)
router.get('/summary',
  asyncHandler(HabitController.getHabitsSummary)
);

// Get a specific habit by ID
router.get('/:habitId',
  validateUUID('habitId'),
  asyncHandler(HabitController.getHabitById)
);

// Update a habit
router.put('/:habitId',
  validateUUID('habitId'),
  asyncHandler(HabitController.updateHabit)
);

// Delete (deactivate) a habit
router.delete('/:habitId',
  validateUUID('habitId'),
  asyncHandler(HabitController.deleteHabit)
);

// Reactivate a habit
router.post('/:habitId/reactivate',
  validateUUID('habitId'),
  asyncHandler(HabitController.reactivateHabit)
);

// Get habit statistics
router.get('/:habitId/stats',
  validateUUID('habitId'),
  asyncHandler(HabitController.getHabitStats)
);

// Bulk update habits
router.patch('/bulk',
  validateRequiredFields(['habits']),
  asyncHandler(HabitController.bulkUpdateHabits)
);

export default router;