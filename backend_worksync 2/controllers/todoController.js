import Todo from '../models/Todo.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import AppError from '../utils/appError.js';
import mongoose from 'mongoose';

export const getTodos = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const query = { user: req.user.id };
  
  // Add filters
  if (req.query.status) query.status = req.query.status;
  if (req.query.category) query.category = req.query.category;
  if (req.query.search) {
    query.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const todos = await Todo.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Todo.countDocuments(query);

  res.status(200).json({
    status: 'success',
    results: todos.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: { todos }
  });
});

export const getTodoStats = asyncHandler(async (req, res) => {
  const [completedCount, totalCount] = await Promise.all([
    Todo.countDocuments({ user: req.user.id, completed: true }),
    Todo.countDocuments({ user: req.user.id })
  ]);

  const pendingCount = totalCount - completedCount;

  res.status(200).json({
    status: 'success',
    data: {
      total: totalCount,
      completed: completedCount,
      pending: pendingCount
    }
  });
});

export const getTodo = asyncHandler(async (req, res) => {
  // Validate ID before querying
  if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new AppError('Invalid todo ID', 400);
  }

  const todo = await Todo.findOne({ 
    _id: req.params.id, 
    user: req.user.id 
  });

  if (!todo) {
    throw new AppError('Todo not found', 404);
  }

  res.status(200).json({
    status: 'success',
    data: { todo }
  });
});

export const updateTodo = asyncHandler(async (req, res) => {
  // Validate ID before updating
  if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new AppError('Invalid todo ID', 400);
  }

  const todo = await Todo.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!todo) {
    throw new AppError('Todo not found', 404);
  }

  res.status(200).json({
    status: 'success',
    data: { todo }
  });
});

export const createTodo = asyncHandler(async (req, res) => {
  const todo = await Todo.create({
    ...req.body,
    user: req.user.id
  });

  res.status(201).json({
    status: 'success',
    data: { todo }
  });
});

export const deleteTodo = asyncHandler(async (req, res) => {
  // Validate ID before deleting
  if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new AppError('Invalid todo ID', 400);
  }

  const todo = await Todo.findOneAndDelete({ 
    _id: req.params.id, 
    user: req.user.id 
  });

  if (!todo) {
    throw new AppError('Todo not found', 404);
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

export const toggleTodoStatus = asyncHandler(async (req, res) => {
  // Validate ID before toggling status
  if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new AppError('Invalid todo ID', 400);
  }

  const todo = await Todo.findOne({ 
    _id: req.params.id, 
    user: req.user.id 
  });

  if (!todo) {
    throw new AppError('Todo not found', 404);
  }

  todo.completed = !todo.completed;
  await todo.save();

  res.status(200).json({
    status: 'success',
    data: { todo }
  });
});