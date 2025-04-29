// services/reminderService.js
import api from './api';

export const reminderService = {
  // Get all reminders
  getReminders: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/reminders?${params}`);
    return response.data;
  },

  // Get a single reminder
  getReminderById: async (reminderId) => {
    const response = await api.get(`/reminders/${reminderId}`);
    return response.data;
  },

  // Create a new reminder
  createReminder: async (reminderData) => {
    const response = await api.post('/reminders', reminderData);
    return response.data;
  },

  // Update an existing reminder
  updateReminder: async (reminderId, reminderData) => {
    const response = await api.put(`/reminders/${reminderId}`, reminderData);
    return response.data;
  },

  // Delete a reminder
  deleteReminder: async (reminderId) => {
    const response = await api.delete(`/reminders/${reminderId}`);
    return response.data;
  },

  // Mark reminder as completed
  markAsCompleted: async (reminderId, completed = true) => {
    const response = await api.patch(`/reminders/${reminderId}/complete`, { completed });
    return response.data;
  },

  // Get upcoming reminders
  getUpcomingReminders: async (days = 7) => {
    const response = await api.get(`/reminders/upcoming?days=${days}`);
    return response.data;
  },

  // Get reminder statistics
  getReminderStats: async () => {
    const response = await api.get('/reminders/stats');
    return response.data;
  },

  // Snooze a reminder
  snoozeReminder: async (reminderId, snoozeUntil) => {
    const response = await api.post(`/reminders/${reminderId}/snooze`, { snoozeUntil });
    return response.data;
  },

  // Get reminders by category
  getRemindersByCategory: async (category) => {
    const response = await api.get(`/reminders/category/${category}`);
    return response.data;
  },

  // Update reminder settings
  updateReminderSettings: async (settings) => {
    const response = await api.put('/reminders/settings', settings);
    return response.data;
  },

  // Get reminder settings
  getReminderSettings: async () => {
    const response = await api.get('/reminders/settings');
    return response.data;
  }
};