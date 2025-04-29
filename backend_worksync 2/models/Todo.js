import mongoose from 'mongoose';

const todoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Todo title is required'],
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  category: {
    type: String,
    enum: ['personal', 'work', 'shopping', 'health', 'finance'],
    default: 'personal'
  },
  important: {
    type: Boolean,
    default: false
  },
  completed: {
    type: Boolean,
    default: false
  },
  dueDate: {
    type: Date
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
todoSchema.index({ user: 1, createdAt: -1 });
todoSchema.index({ status: 1 });
todoSchema.index({ category: 1 });
todoSchema.index({ important: 1 });
todoSchema.index({ completed: 1 });

export default mongoose.model('Todo', todoSchema);