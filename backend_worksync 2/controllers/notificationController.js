import Notification from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import AppError from '../utils/appError.js';

// Get all notifications for a user
export const getNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const query = { user: req.user.id };
  
  // Filter by read status if provided
  if (req.query.read !== undefined) {
    query.read = req.query.read === 'true';
  }
  
  // Filter by category if provided
  if (req.query.category) {
    query.category = req.query.category;
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Notification.countDocuments(query);

  res.status(200).json({
    status: 'success',
    results: notifications.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: { notifications }
  });
});

// Create a new notification
export const createNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.create({
    ...req.body,
    user: req.user.id
  });

  res.status(201).json({
    status: 'success',
    data: { notification }
  });
});

// Mark a notification as read
export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { read: true },
    { new: true, runValidators: true }
  );

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  res.status(200).json({
    status: 'success',
    data: { notification }
  });
});

// Mark all notifications as read
export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user.id, read: false },
    { read: true }
  );

  res.status(200).json({
    status: 'success',
    message: 'All notifications marked as read'
  });
});

// Delete a notification
export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id
  });

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Get notification stats for a user
export const getNotificationStats = asyncHandler(async (req, res) => {
  const stats = await Notification.aggregate([
    { $match: { user: req.user._id } },
    {
      $group: {
        _id: '$read',
        count: { $sum: 1 },
      }
    }
  ]);

  // Format stats
  const formattedStats = {
    total: 0,
    unread: 0,
    read: 0
  };

  stats.forEach(stat => {
    if (stat._id === false) formattedStats.unread = stat.count;
    if (stat._id === true) formattedStats.read = stat.count;
  });

  formattedStats.total = formattedStats.read + formattedStats.unread;

  res.status(200).json({
    status: 'success',
    data: formattedStats
  });
});