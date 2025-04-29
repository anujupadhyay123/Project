// hooks/useNotificationService.jsx
import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';

export function useNotificationService() {
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({ total: 0, unread: 0, read: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async (filters = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await notificationService.getNotifications(filters);
      setNotifications(response.data.notifications || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch notification statistics
  const fetchStats = useCallback(async () => {
    try {
      const response = await notificationService.getNotificationStats();
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch notification stats:', err);
    }
  }, []);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
      
      // Update stats
      setStats(prev => ({
        ...prev,
        unread: Math.max(0, prev.unread - 1),
        read: prev.read + 1
      }));
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark notification as read');
      throw err;
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      
      // Update stats
      setStats(prev => ({
        ...prev,
        read: prev.total,
        unread: 0
      }));
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark all notifications as read');
      throw err;
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      
      // Find the notification to check if it was read
      const notification = notifications.find(notif => notif._id === notificationId);
      
      // Update local state
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        total: prev.total - 1,
        read: notification?.read ? prev.read - 1 : prev.read,
        unread: notification?.read ? prev.unread : prev.unread - 1
      }));
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete notification');
      throw err;
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, [fetchNotifications, fetchStats]);

  return {
    notifications,
    stats,
    isLoading,
    error,
    fetchNotifications,
    fetchStats,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
}