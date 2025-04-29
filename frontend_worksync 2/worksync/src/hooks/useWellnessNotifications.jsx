import { useState, useEffect, useCallback, useRef } from 'react';
import { wellnessService } from '../services/wellnessService';
import { useAuth } from '../contexts/AuthContext';

const CHECK_INTERVAL = 60000; // Check every minute

export const useWellnessNotifications = () => {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paused, setPaused] = useState(false);
  const [pauseUntil, setPauseUntil] = useState(null);
  const [lastNotificationCheck, setLastNotificationCheck] = useState(null);
  const timerRef = useRef(null);
  const notificationCallbackRef = useRef(null);

  // Fetch initial settings
  const fetchSettings = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const response = await wellnessService.getSettings();
      console.log('Fetched wellness settings:', response.data);
      setSettings(response.data.settings);
      
      // Check if notifications are paused
      if (response.data.settings.pauseUntil) {
        const pauseDate = new Date(response.data.settings.pauseUntil);
        if (pauseDate > new Date()) {
          setPaused(true);
          setPauseUntil(pauseDate);
        } else {
          setPaused(false);
          setPauseUntil(null);
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('Failed to fetch wellness settings:', err);
      setError('Failed to load wellness settings');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Update settings
  const updateSettings = useCallback(async (newSettings) => {
    try {
      setLoading(true);
      const response = await wellnessService.updateSettings(newSettings);
      console.log('Updated wellness settings:', response.data);
      setSettings(response.data.settings);
      setError(null);
      return response.data.settings;
    } catch (err) {
      console.error('Failed to update wellness settings:', err);
      setError('Failed to update wellness settings');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Pause notifications
  const pauseNotifications = useCallback(async (duration = 1) => {
    try {
      const response = await wellnessService.pauseNotifications(duration);
      console.log('Paused notifications:', response.data);
      setPaused(true);
      setPauseUntil(new Date(response.data.settings.pauseUntil));
      setSettings(response.data.settings);
      return response.data.message;
    } catch (err) {
      console.error('Failed to pause notifications:', err);
      setError('Failed to pause notifications');
      throw err;
    }
  }, []);

  // Resume notifications
  const resumeNotifications = useCallback(async () => {
    try {
      const response = await wellnessService.resumeNotifications();
      console.log('Resumed notifications:', response.data);
      setPaused(false);
      setPauseUntil(null);
      setSettings(response.data.settings);
      return response.data.message;
    } catch (err) {
      console.error('Failed to resume notifications:', err);
      setError('Failed to resume notifications');
      throw err;
    }
  }, []);

  // Check for notifications
  const checkNotifications = useCallback(async () => {
    if (!currentUser) return [];
    if (paused) {
      console.log('Notifications are paused until', pauseUntil);
      return [];
    }
    
    // Less aggressive throttling - 5 seconds instead of 30
    const now = new Date();
    if (lastNotificationCheck && now - lastNotificationCheck < 5000) {
      console.log('Skipping notification check (throttled)');
      return [];
    }
    
    try {
      console.log('Checking for wellness notifications at', new Date().toLocaleTimeString());
      setLastNotificationCheck(now);
      const response = await wellnessService.checkNotifications();
      
      // Check if notifications are now paused
      if (response.data.paused && response.data.pauseUntil) {
        setPaused(true);
        setPauseUntil(new Date(response.data.pauseUntil));
      }
      
      console.log('Notification check result:', response.data.notifications);
      return response.data.notifications || [];
    } catch (err) {
      console.error('Failed to check notifications:', err);
      return [];
    }
  }, [currentUser, paused, pauseUntil, lastNotificationCheck]);

  // Reset timers (for testing)
  const resetTimers = useCallback(async () => {
    try {
      const response = await wellnessService.resetTimers();
      console.log('Reset wellness timers:', response.data);
      setSettings(response.data.settings);
      
      // After resetting timers, run an immediate check to see if any notifications should fire
      setTimeout(() => {
        checkNotifications();
      }, 1000);
      
      return response.data.message;
    } catch (err) {
      console.error('Failed to reset timers:', err);
      setError('Failed to reset notification timers');
      throw err;
    }
  }, [checkNotifications]);

  // Set up a callback that external components can use to be notified when there are notifications
  const registerNotificationCallback = useCallback((callback) => {
    notificationCallbackRef.current = callback;
  }, []);

  // Periodically check for notifications
  useEffect(() => {
    if (!currentUser) return;

    // Clear any existing interval
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Initial fetch
    fetchSettings();
    
    // Set up interval to check for notifications
    timerRef.current = setInterval(async () => {
      // If paused, check if pause period has ended
      if (paused && pauseUntil && new Date() > pauseUntil) {
        console.log('Pause period ended, resuming notifications');
        setPaused(false);
        setPauseUntil(null);
        
        // After unpausing, fetch settings to sync with server
        fetchSettings();
      }
      
      // Always check for new notifications at the interval
      // The backend will determine if it's actually time for a notification
      if (!paused) {
        const notifications = await checkNotifications();
        
        // If we found notifications and there's a callback registered, call it
        if (notifications.length > 0 && notificationCallbackRef.current) {
          notificationCallbackRef.current(notifications);
        }
      }
    }, CHECK_INTERVAL);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentUser, fetchSettings, paused, pauseUntil, checkNotifications]);

  return {
    settings,
    loading,
    error,
    paused,
    pauseUntil,
    fetchSettings,
    updateSettings,
    pauseNotifications,
    resumeNotifications,
    checkNotifications,
    resetTimers,
    registerNotificationCallback
  };
};