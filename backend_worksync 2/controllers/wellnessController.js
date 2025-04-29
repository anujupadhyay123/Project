import WellnessSettings from '../models/WellnessSettings.js';
import Notification from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import AppError from '../utils/appError.js';

// Get user's wellness settings
export const getWellnessSettings = asyncHandler(async (req, res) => {
  // Find settings or create with defaults if don't exist using findOneAndUpdate with upsert
  // This prevents race conditions that can cause duplicate key errors
  const settings = await WellnessSettings.findOneAndUpdate(
    { user: req.user.id },
    { $setOnInsert: { user: req.user.id } },
    { 
      new: true, 
      upsert: true,
      runValidators: false
    }
  );
  
  res.status(200).json({
    status: 'success',
    data: { settings }
  });
});

// Update wellness settings
export const updateWellnessSettings = asyncHandler(async (req, res) => {
  const settings = await WellnessSettings.findOneAndUpdate(
    { user: req.user.id },
    req.body,
    { new: true, runValidators: true, upsert: true }
  );
  
  res.status(200).json({
    status: 'success',
    data: { settings }
  });
});

// Pause all wellness notifications
export const pauseWellnessNotifications = asyncHandler(async (req, res) => {
  // Duration in hours (default: 1 hour)
  const { duration = 1 } = req.body;
  
  // Set pause time
  const pauseUntil = new Date(Date.now() + duration * 60 * 60 * 1000);
  
  const settings = await WellnessSettings.findOneAndUpdate(
    { user: req.user.id },
    { pauseUntil },
    { new: true, runValidators: true, upsert: true }
  );
  
  res.status(200).json({
    status: 'success',
    data: { 
      settings,
      message: `Wellness notifications paused for ${duration} hour(s)`
    }
  });
});

// Resume wellness notifications
export const resumeWellnessNotifications = asyncHandler(async (req, res) => {
  const settings = await WellnessSettings.findOneAndUpdate(
    { user: req.user.id },
    { pauseUntil: null },
    { new: true, runValidators: true }
  );
  
  res.status(200).json({
    status: 'success',
    data: { 
      settings,
      message: 'Wellness notifications resumed'
    }
  });
});

// Check and send wellness notifications if needed
export const checkWellnessNotifications = asyncHandler(async (req, res) => {
  // This endpoint will be called by the frontend at regular intervals
  // Find user's settings or create if they don't exist using findOneAndUpdate with upsert
  // This prevents race conditions that can cause duplicate key errors
  let settings = await WellnessSettings.findOneAndUpdate(
    { user: req.user.id },
    { $setOnInsert: { user: req.user.id } }, // Only set user ID when inserting a new document
    { 
      new: true, 
      upsert: true,
      runValidators: false // Set to false for better performance on the find operation
    }
  );
  
  // Check if notifications are paused
  if (settings.pauseUntil && settings.pauseUntil > new Date()) {
    return res.status(200).json({
      status: 'success',
      data: {
        paused: true,
        pauseUntil: settings.pauseUntil,
        notifications: []
      }
    });
  }
  
  // Check if we're within active hours
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  if (currentTime < settings.activeHours.start || currentTime > settings.activeHours.end) {
    return res.status(200).json({
      status: 'success',
      data: {
        outsideActiveHours: true,
        notifications: []
      }
    });
  }
  
  const notifications = [];
  const updates = {};
  
  // Check water reminder
  if (settings.waterReminder.enabled) {
    const lastNotified = settings.waterReminder.lastNotified;
    const intervalMs = settings.waterReminder.interval * 60 * 1000;
    
    if (!lastNotified || (now - new Date(lastNotified)) > intervalMs) {
      const notification = await Notification.create({
        title: 'Hydration Reminder',
        message: "It's time to drink water! Staying hydrated improves focus and overall health.",
        type: 'info',
        category: 'wellness',
        user: req.user.id
      });
      
      notifications.push(notification);
      updates['waterReminder.lastNotified'] = now;
    }
  }
  
  // Check eye break reminder
  if (settings.eyeBreakReminder.enabled) {
    const lastNotified = settings.eyeBreakReminder.lastNotified;
    const intervalMs = settings.eyeBreakReminder.interval * 60 * 1000;
    
    if (!lastNotified || (now - new Date(lastNotified)) > intervalMs) {
      const notification = await Notification.create({
        title: '20-20-20 Eye Break',
        message: "Look away at something 20 feet away for 20 seconds. This helps reduce eye strain.",
        type: 'info',
        category: 'wellness',
        user: req.user.id
      });
      
      notifications.push(notification);
      updates['eyeBreakReminder.lastNotified'] = now;
    }
  }
  
  // Check posture reminder
  if (settings.postureReminder.enabled) {
    const lastNotified = settings.postureReminder.lastNotified;
    const intervalMs = settings.postureReminder.interval * 60 * 1000;
    
    if (!lastNotified || (now - new Date(lastNotified)) > intervalMs) {
      const notification = await Notification.create({
        title: 'Posture Check',
        message: "Check your posture! Sit up straight, relax your shoulders, and keep your feet flat on the floor.",
        type: 'info',
        category: 'wellness',
        user: req.user.id
      });
      
      notifications.push(notification);
      updates['postureReminder.lastNotified'] = now;
    }
  }
  
  // If we have updates, save them
  if (Object.keys(updates).length > 0) {
    await WellnessSettings.updateOne({ _id: settings._id }, { $set: updates });
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      notifications
    }
  });
});

// Reset all notification timestamps (for testing)
export const resetNotificationTimers = asyncHandler(async (req, res) => {
  const settings = await WellnessSettings.findOneAndUpdate(
    { user: req.user.id },
    { 
      'waterReminder.lastNotified': null,
      'eyeBreakReminder.lastNotified': null,
      'postureReminder.lastNotified': null
    },
    { new: true }
  );
  
  res.status(200).json({
    status: 'success',
    message: 'All notification timers have been reset',
    data: { settings }
  });
});