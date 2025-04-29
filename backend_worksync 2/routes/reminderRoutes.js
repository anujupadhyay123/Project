// routes/reminderRoutes.js
import express from 'express';
import { createReminder, getReminders, deleteReminder } from '../controllers/reminderController.js';
import { protect } from '../middlewares/authMiddleware.js';
const router = express.Router();

router.post('/', protect, createReminder);
router.get('/', protect, getReminders);
router.delete('/:id', protect, deleteReminder);

export default router;