import { Router } from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import * as todoController from '../controllers/todoController.js';

const router = Router();

// Protected routes
router.use(protect);

router.route('/')
  .get(todoController.getTodos)
  .post(todoController.createTodo);

router.get('/stats', todoController.getTodoStats);

router.route('/:id')
  .put(todoController.updateTodo);

export default router;