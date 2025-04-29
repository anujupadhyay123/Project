import Task from '../models/Task.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import AppError from '../utils/appError.js';

export const createTask = asyncHandler(async (req, res) => {
  const task = await Task.create({
    ...req.body,
    user: req.user.id
  });
  
  res.status(201).json({
    status: 'success',
    data: { task }
  });
});

export const getTasks = asyncHandler(async (req, res) => {
  console.log('Getting tasks for user:', req.user.id);
  
  // Handle pagination or get all tasks
  const page = parseInt(req.query.page, 10) || 1;
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 0; // 0 means no limit
  const skip = limit > 0 ? (page - 1) * limit : 0;

  const query = { user: req.user.id };
  
  if (req.query.status) query.status = req.query.status;
  if (req.query.priority) query.priority = req.query.priority;
  if (req.query.search) {
    query.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  try {
    console.log('Query:', JSON.stringify(query));
    const tasksQuery = Task.find(query).sort({ dueDate: 1, priority: -1 });
    
    // Apply pagination only if limit is specified
    if (limit > 0) {
      tasksQuery.skip(skip).limit(limit);
    }
    
    const tasks = await tasksQuery;
    const total = await Task.countDocuments(query);

    console.log(`Found ${tasks.length} tasks out of ${total} total`);
    
    res.status(200).json({
      status: 'success',
      results: tasks.length,
      total,
      page,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 1,
      data: { tasks }
    });
  } catch (error) {
    console.error('Error in getTasks:', {
      error: error.message,
      stack: error.stack,
      query
    });
    throw error;
  }
});

export const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  res.status(200).json({
    status: 'success',
    data: { task }
  });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id
  });

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});