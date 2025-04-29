import { Router } from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import * as notificationController from '../controllers/notificationController.js';

const router = Router();

// Protected routes - require authentication
router.use(protect);

// Get all notifications and create new notification
router.route('/')
  .get(notificationController.getNotifications)
  .post(notificationController.createNotification);

// Mark all notifications as read
router.post('/mark-all-read', notificationController.markAllAsRead);

// Get notification stats
router.get('/stats', notificationController.getNotificationStats);

// Routes for individual notifications
router.route('/:id')
  .patch(notificationController.markAsRead)
  .delete(notificationController.deleteNotification);

export default router;