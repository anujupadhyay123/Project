// routes/taskRoutes.js
import { Router } from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import * as taskController from '../controllers/taskController.js';

const router = Router();

// Task routes
router.route('/')
  .get(protect, taskController.getTasks)
  .post(protect, taskController.createTask);

router.route('/:id')
  .put(protect, taskController.updateTask)
  .delete(protect, taskController.deleteTask);

export default router;