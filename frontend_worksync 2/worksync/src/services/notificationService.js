// services/notificationService.js
import api from './api';

export const notificationService = {
  // Get all notifications with optional filters
  getNotifications: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/notifications?${params}`);
    return response.data;
  },

  // Get notification stats
  getNotificationStats: async () => {
    const response = await api.get('/notifications/stats');
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const response = await api.patch(`/notifications/${notificationId}`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await api.post('/notifications/mark-all-read');
    return response.data;
  },

  // Delete a notification
  deleteNotification: async (notificationId) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },
  
  // Create a new notification (admin or system use)
  createNotification: async (notificationData) => {
    const response = await api.post('/notifications', notificationData);
    return response.data;
  }
};