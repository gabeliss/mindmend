import { Router } from 'express';
import { HabitEventController } from '../controllers/habitEventController';
import { validateUUID } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/habit-events - Get all events with filtering
router.get('/', authenticateToken, HabitEventController.getAllUserEvents);

// POST /api/habit-events/bulk - Bulk log events (for batch operations)
router.post('/bulk', HabitEventController.bulkLogEvents);

// POST /api/habit-events/:habitId - Log a new habit event (completion, skip, or relapse)
router.post('/:habitId', validateUUID('habitId'), HabitEventController.logEvent);

// GET /api/habit-events/today - Get today's events for dashboard
router.get('/today', HabitEventController.getTodayEvents);

// GET /api/habit-events/calendar - Get completion calendar for date range
router.get('/calendar', HabitEventController.getCompletionCalendar);

// GET /api/habit-events/stats - Get event statistics (all habits or specific habit)
router.get('/stats', HabitEventController.getEventStatistics);

// GET /api/habit-events/all - Get all events for a user with filtering and pagination
router.get('/all', HabitEventController.getAllUserEvents);

// GET /api/habit-events/:habitId/events - Get habit events with filtering and pagination
router.get('/:habitId/events', validateUUID('habitId'), HabitEventController.getHabitEvents);

// GET /api/habit-events/event/:eventId - Get a specific habit event by ID
router.get('/event/:eventId', validateUUID('eventId'), HabitEventController.getEventById);

// PUT /api/habit-events/event/:eventId - Update a habit event
router.put('/event/:eventId', validateUUID('eventId'), HabitEventController.updateEvent);

// DELETE /api/habit-events/event/:eventId - Delete a habit event
router.delete('/event/:eventId', validateUUID('eventId'), HabitEventController.deleteEvent);

export default router;