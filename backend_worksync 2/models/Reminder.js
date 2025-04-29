// models/Reminder.js
import mongoose from 'mongoose';

const ReminderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  interval: { type: Number, required: true },
  lastSent: { type: Date, default: Date.now },
});

export default mongoose.model('Reminder', ReminderSchema);