import mongoose from 'mongoose';

const wellnessSettingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  waterReminder: {
    enabled: {
      type: Boolean,
      default: true
    },
    interval: {
      type: Number,
      default: 120, // 120 minutes (2 hours)
      min: 5,
      max: 240
    },
    lastNotified: {
      type: Date,
      default: null
    }
  },
  eyeBreakReminder: {
    enabled: {
      type: Boolean,
      default: true
    },
    interval: {
      type: Number,
      default: 20, // 20 minutes
      min: 5,
      max: 60
    },
    lastNotified: {
      type: Date,
      default: null
    }
  },
  postureReminder: {
    enabled: {
      type: Boolean,
      default: true
    },
    interval: {
      type: Number,
      default: 45, // 45 minutes
      min: 5,
      max: 120
    },
    lastNotified: {
      type: Date,
      default: null
    }
  },
  activeHours: {
    start: {
      type: String,
      default: '00:00', // 9:00 AM
    },
    end: {
      type: String,
      default: '24:00', 
    }
  },
  pauseUntil: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

export default mongoose.model('WellnessSettings', wellnessSettingsSchema);