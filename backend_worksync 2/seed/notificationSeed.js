// seed/notificationSeed.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import connectDB from '../config/db.js';

// Load environment variables
dotenv.config();

// Sample notifications data
const createSampleNotifications = async (userId) => {
  const notifications = [
    {
      title: 'System Update',
      message: 'WorkSync will be updated to version 2.1 tonight at 2 AM.',
      type: 'info',
      category: 'system',
      read: false,
      user: userId
    },
    {
      title: 'Task Completed',
      message: 'You completed the "Q3 Marketing Strategy" task.',
      type: 'success',
      category: 'task',
      read: false,
      user: userId
    },
    {
      title: 'Task Due Soon',
      message: '"Website Redesign" task is due tomorrow at 5 PM.',
      type: 'warning',
      category: 'reminder',
      read: true,
      user: userId
    },
    {
      title: 'New Message',
      message: 'Sarah Brown sent you a message regarding the design project.',
      type: 'info',
      category: 'message',
      read: true,
      user: userId
    },
    {
      title: 'Project Milestone',
      message: 'Q3 goals have been achieved! Team performance exceeded expectations.',
      type: 'success',
      category: 'project',
      read: true,
      user: userId
    },
    {
      title: 'Meeting Reminder',
      message: 'Team standup meeting in 30 minutes. Please prepare your updates.',
      type: 'warning',
      category: 'reminder',
      read: false,
      user: userId
    },
    {
      title: 'System Notification',
      message: 'Server maintenance scheduled for tomorrow night. Expect brief downtime.',
      type: 'info',
      category: 'system',
      read: false,
      user: userId
    },
    {
      title: 'Task Updated',
      message: 'Changes have been made to the "Client Presentation" task.',
      type: 'info',
      category: 'task',
      read: false,
      user: userId
    },
    {
      title: 'Weekly Report',
      message: 'Your weekly activity report is ready to view.',
      type: 'success',
      category: 'system',
      read: true,
      user: userId
    }
  ];

  try {
    // Clear existing notifications for this user
    await Notification.deleteMany({ user: userId });
    
    // Insert new notifications
    await Notification.insertMany(notifications);
    
    console.log(`Created ${notifications.length} sample notifications for user ${userId}`);
  } catch (error) {
    console.error('Error creating notifications:', error);
  }
};

// Main execution function
const seedNotifications = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to MongoDB');
    
    // Find a user to associate notifications with (use the first one found)
    const user = await User.findOne();
    
    if (!user) {
      console.log('No users found. Please create a user first.');
      process.exit(1);
    }
    
    // Create notifications for the user
    await createSampleNotifications(user._id);
    
    console.log('Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Execute the seed function
seedNotifications();