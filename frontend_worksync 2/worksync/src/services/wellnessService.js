import api from './api';

export const wellnessService = {
  // Get wellness settings
  getSettings: async () => {
    const response = await api.get('/wellness/settings');
    return response.data;
  },
  
  // Update wellness settings
  updateSettings: async (settings) => {
    const response = await api.patch('/wellness/settings', settings);
    return response.data;
  },
  
  // Pause wellness notifications
  pauseNotifications: async (duration = 1) => {
    const response = await api.post('/wellness/pause', { duration });
    return response.data;
  },
  
  // Resume wellness notifications
  resumeNotifications: async () => {
    const response = await api.post('/wellness/resume');
    return response.data;
  },
  
  // Check for new wellness notifications
  checkNotifications: async () => {
    const response = await api.get('/wellness/check-notifications');
    return response.data;
  },
  
  // Reset notification timers (for testing)
  resetTimers: async () => {
    const response = await api.post('/wellness/reset-timers');
    return response.data;
  }
};