import { useState, useEffect, useCallback } from 'react';
import { reminderService } from '../services/reminderService';

export function useReminder() {
  const [reminders, setReminders] = useState([]);
  const [settings, setSettings] = useState({
    defaultReminderTime: '09:00',
    defaultCategory: 'work',
    enableEmailReminders: true,
    reminderFrequency: ['1day', '1hour', '30min']
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch reminders with optional filters
  const fetchReminders = useCallback(async (filters = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await reminderService.getReminders(filters);
      setReminders(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch reminders');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch reminder settings
  const fetchSettings = useCallback(async () => {
    try {
      const data = await reminderService.getReminderSettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to fetch reminder settings:', err);
    }
  }, []);

  // Create new reminder
  const createReminder = async (reminderData) => {
    try {
      setError(null);
      const newReminder = await reminderService.createReminder(reminderData);
      setReminders(prev => [...prev, newReminder]);
      return newReminder;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create reminder');
      throw err;
    }
  };

  // Update existing reminder
  const updateReminder = async (reminderId, reminderData) => {
    try {
      setError(null);
      const updatedReminder = await reminderService.updateReminder(reminderId, reminderData);
      setReminders(prev => prev.map(reminder => 
        reminder.id === reminderId ? updatedReminder : reminder
      ));
      return updatedReminder;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update reminder');
      throw err;
    }
  };

  // Delete reminder
  const deleteReminder = async (reminderId) => {
    try {
      setError(null);
      await reminderService.deleteReminder(reminderId);
      setReminders(prev => prev.filter(reminder => reminder.id !== reminderId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete reminder');
      throw err;
    }
  };

  // Mark reminder as completed
  const markAsCompleted = async (reminderId, completed = true) => {
    try {
      setError(null);
      const updatedReminder = await reminderService.markAsCompleted(reminderId, completed);
      setReminders(prev => prev.map(reminder => 
        reminder.id === reminderId ? updatedReminder : reminder
      ));
      return updatedReminder;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update reminder status');
      throw err;
    }
  };

  // Snooze reminder
  const snoozeReminder = async (reminderId, snoozeUntil) => {
    try {
      setError(null);
      const updatedReminder = await reminderService.snoozeReminder(reminderId, snoozeUntil);
      setReminders(prev => prev.map(reminder => 
        reminder.id === reminderId ? updatedReminder : reminder
      ));
      return updatedReminder;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to snooze reminder');
      throw err;
    }
  };

  // Update reminder settings
  const updateSettings = async (newSettings) => {
    try {
      setError(null);
      const updatedSettings = await reminderService.updateReminderSettings(newSettings);
      setSettings(updatedSettings);
      return updatedSettings;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update settings');
      throw err;
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchReminders();
    fetchSettings();
  }, [fetchReminders, fetchSettings]);

  return {
    reminders,
    settings,
    isLoading,
    error,
    fetchReminders,
    createReminder,
    updateReminder,
    deleteReminder,
    markAsCompleted,
    snoozeReminder,
    updateSettings
  };
}