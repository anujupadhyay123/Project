import { Router } from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import * as wellnessController from '../controllers/wellnessController.js';

const router = Router();

// All routes require authentication
router.use(protect);

// Get and update wellness settings
router.route('/settings')
  .get(wellnessController.getWellnessSettings)
  .patch(wellnessController.updateWellnessSettings);

// Pause and resume notifications
router.post('/pause', wellnessController.pauseWellnessNotifications);
router.post('/resume', wellnessController.resumeWellnessNotifications);

// Check for new notifications (called by frontend periodically)
router.get('/check-notifications', wellnessController.checkWellnessNotifications);

// Reset notification timers (for testing purposes)
router.post('/reset-timers', wellnessController.resetNotificationTimers);

export default router;