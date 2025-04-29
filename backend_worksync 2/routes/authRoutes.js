import express from 'express';
import { 
  registerUser, 
  loginUser, 
  logoutUser, 
  getProfile,
  updateProfile,
  changePassword,
  getUserActivity,
  getTaskStats,
  refreshToken
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/refresh-token', refreshToken);

// Protected routes
router.use(protect); // Apply protection to all routes below
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.patch('/change-password', changePassword);
router.get('/activity', getUserActivity);
router.get('/task-stats', getTaskStats);

export default router;
