import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'A notification title is required'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'A notification message is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error'],
    default: 'info'
  },
  category: {
    type: String,
    enum: ['system', 'task', 'reminder', 'message', 'project', 'wellness'],
    default: 'system'
  },
  read: {
    type: Boolean,
    default: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ user: 1, category: 1 });

export default mongoose.model('Notification', notificationSchema);