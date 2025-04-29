// controllers/reminderController.js
import Reminder from '../models/Reminder.js';

export const createReminder = async (req, res) => {
  try {
    const reminder = new Reminder({ ...req.body, userId: req.user.id });
    await reminder.save();
    res.status(201).json({ 
      success: true, 
      data: { reminder },
      message: 'Reminder created successfully' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getReminders = async (req, res) => {
  try {
    const { upcoming, category } = req.query;
    const query = { userId: req.user.id };
    
    // Add filters if provided
    if (category) {
      query.category = category;
    }
    
    // For upcoming reminders (next 5 days)
    if (upcoming === 'true') {
      const now = new Date();
      const fiveDaysLater = new Date(now);
      fiveDaysLater.setDate(now.getDate() + 5);
      
      query.dueDate = {
        $gte: now,
        $lte: fiveDaysLater
      };
    }
    
    const reminders = await Reminder.find(query).sort({ dueDate: 1 });
    
    res.json({
      success: true,
      data: reminders
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteReminder = async (req, res) => {
  try {
    await Reminder.findByIdAndDelete(req.params.id);
    res.json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
