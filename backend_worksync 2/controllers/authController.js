// controllers/authController.js
import User from '../models/User.js';
import Task from '../models/Task.js';
import Todo from '../models/Todo.js';
import Notification from '../models/Notification.js';
import AppError from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import jwt from 'jsonwebtoken';

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  
  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email already registered', 400);
  }
  
  // Create user
  const user = await User.create({ name, email, password });
  
  // Generate token
  const token = user.generateAuthToken();
  
  // Remove password from output
  user.password = undefined;
  
  res.status(201).json({
    status: 'success',
    token,
    data: { user }
  });
});

export const loginUser = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    // Check if email and password exist
    if (!email || !password) {
      throw new AppError('Please provide email and password', 400);
    }

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');
    console.log('User found:', user ? 'Yes' : 'No');

    if (!user || !(await user.comparePassword(password))) {
      throw new AppError('Invalid email or password', 401);
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    // Generate token
    const token = user.generateAuthToken();
    console.log('Token generated successfully');
    console.log('Token:', token);

    // Remove password from output
    user.password = undefined;

    res.status(200).json({
      status: 'success',
      token,
      data: { user }
    });
  } catch (error) {
    console.error('Login error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    throw error;
  }
});

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    status: 'success',
    data: { user }
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  // Disallow password updates through this route
  if (req.body.password) {
    throw new AppError('This route is not for password updates. Please use /change-password', 400);
  }

  // Filter allowed fields
  const allowedFields = ['name', 'email', 'details', 'skills'];
  const filteredBody = {};
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      filteredBody[key] = req.body[key];
    }
  });

  const user = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: { user }
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user.id).select('+password');

  // Verify current password
  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError('Current password is incorrect', 401);
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Generate new token
  const token = user.generateAuthToken();

  res.status(200).json({
    status: 'success',
    token,
    message: 'Password updated successfully'
  });
});

export const logoutUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
});

export const getUserActivity = asyncHandler(async (req, res) => {
  // Fetch tasks and combine them with their completion status
  const tasks = await Task.find({ user: req.user.id })
    .sort({ updatedAt: -1 })
    .limit(10)
    .select('title completed updatedAt');
  
  // Transform tasks into activity format
  const activities = tasks.map(task => ({
    id: task._id,
    action: task.completed ? 'Completed task' : 'Updated task',
    item: task.title,
    timestamp: task.updatedAt,
    completed: task.completed
  }));

  res.status(200).json({
    status: 'success',
    data: activities
  });
});

export const getTaskStats = asyncHandler(async (req, res) => {
  try {
    // Fetch task counts
    const [completedTasks, pendingTasks] = await Promise.all([
      Task.countDocuments({ 
        user: req.user.id,
        completed: true 
      }),
      Task.countDocuments({ 
        user: req.user.id,
        completed: false 
      })
    ]);

    // Fetch todo counts
    const [completedTodos, pendingTodos] = await Promise.all([
      Todo.countDocuments({ 
        user: req.user.id,
        completed: true 
      }),
      Todo.countDocuments({ 
        user: req.user.id,
        completed: false 
      })
    ]);

    // Fetch notification counts (real data from database)
    const unreadNotifications = await Notification.countDocuments({
      user: req.user.id,
      read: false
    });

    res.status(200).json({
      status: 'success',
      data: {
        completedTasks,
        pendingTasks,
        completedTodos,
        pendingTodos,
        unreadNotifications
      }
    });
  } catch (error) {
    console.error('Error fetching task stats:', error);
    throw new AppError('Failed to fetch task statistics', 500);
  }
});

export const refreshToken = asyncHandler(async (req, res) => {
  // Check for token in multiple places
  let token = req.body.token || 
              req.cookies?.refreshToken || 
              (req.headers.authorization && req.headers.authorization.startsWith('Bearer') 
                ? req.headers.authorization.split(' ')[1] 
                : null);
  
  if (!token) {
    throw new AppError('No refresh token provided', 400);
  }

  try {
    // Verify the existing token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user
    const user = await User.findById(decoded.id);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Generate new token
    const newToken = user.generateAuthToken();
    
    res.status(200).json({
      status: 'success',
      token: newToken
    });
  } catch (error) {
    throw new AppError('Invalid or expired token', 401);
  }
});