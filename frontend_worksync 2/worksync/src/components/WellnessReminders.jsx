import React, { useState, useEffect } from 'react';
import { useWellnessNotifications } from '../hooks/useWellnessNotifications';
import { useAuth } from '../contexts/AuthContext';
import NotificationManager from './NotificationManager';

const WellnessReminders = () => {
  const { settings, loading, error, paused, pauseUntil, updateSettings, pauseNotifications, resumeNotifications, resetTimers } = useWellnessNotifications();
  const [showSettings, setShowSettings] = useState(false);
  const [formSettings, setFormSettings] = useState({
    waterReminder: { enabled: true, interval: 120 },
    eyeBreakReminder: { enabled: true, interval: 20 },
    postureReminder: { enabled: true, interval: 45 },
    activeHours: { start: '09:00', end: '24:00' }
  });
  const [pauseDuration, setPauseDuration] = useState(1);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (settings) {
      setFormSettings({
        waterReminder: { ...settings.waterReminder },
        eyeBreakReminder: { ...settings.eyeBreakReminder },
        postureReminder: { ...settings.postureReminder },
        activeHours: { ...settings.activeHours }
      });
    }
  }, [settings]);

  // Show welcome toast when component first loads with settings
  useEffect(() => {
    if (settings && !loading) {
      const enabledReminders = [];
      
      if (settings.waterReminder.enabled) {
        enabledReminders.push(`Water (every ${settings.waterReminder.interval} min)`);
      }
      
      if (settings.eyeBreakReminder.enabled) {
        enabledReminders.push(`Eye breaks (every ${settings.eyeBreakReminder.interval} min)`);
      }
      
      if (settings.postureReminder.enabled) {
        enabledReminders.push(`Posture (every ${settings.postureReminder.interval} min)`);
      }

      if (enabledReminders.length > 0 && !paused) {
        NotificationManager.info(
          <div>
            <div className="font-semibold">Wellness Reminders Active</div>
            <div>Currently monitoring: {enabledReminders.join(', ')}</div>
          </div>,
          { 
            autoClose: 5000,
            toastId: 'wellness-active-toast'
          }
        );
      }
    }
  }, [settings, loading, paused]);

  const handleToggleSettings = () => {
    setShowSettings(!showSettings);
  };

  const handleChange = (category, field, value) => {
    setFormSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: field === 'interval' ? Number(value) : value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateSettings(formSettings);
      setShowSettings(false);
      
      // Show success toast with summary of enabled reminders
      const enabledReminders = [];
      
      if (formSettings.waterReminder.enabled) {
        enabledReminders.push(`Water (every ${formSettings.waterReminder.interval} min)`);
      }
      
      if (formSettings.eyeBreakReminder.enabled) {
        enabledReminders.push(`Eye breaks (every ${formSettings.eyeBreakReminder.interval} min)`);
      }
      
      if (formSettings.postureReminder.enabled) {
        enabledReminders.push(`Posture (every ${formSettings.postureReminder.interval} min)`);
      }

      if (enabledReminders.length > 0) {
        NotificationManager.success(
          <div>
            <div className="font-semibold">Wellness Settings Updated</div>
            <div>Active reminders: {enabledReminders.join(', ')}</div>
          </div>,
          { autoClose: 5000 }
        );
      } else {
        NotificationManager.warning(
          <div>
            <div className="font-semibold">All Wellness Reminders Disabled</div>
            <div>You won't receive any wellness reminders</div>
          </div>,
          { autoClose: 5000 }
        );
      }
    } catch (err) {
      console.error('Failed to update settings:', err);
      NotificationManager.error(
        <div>
          <div className="font-semibold">Error Updating Settings</div>
          <div>{err.message || 'Please try again'}</div>
        </div>,
        { autoClose: 5000 }
      );
    }
  };

  const handlePauseNotifications = async () => {
    try {
      await pauseNotifications(pauseDuration);
      
      // Show pause toast
      NotificationManager.info(
        <div>
          <div className="font-semibold">Wellness Reminders Paused</div>
          <div>Reminders will resume in {pauseDuration} hour{pauseDuration > 1 ? 's' : ''}</div>
        </div>,
        { autoClose: 5000 }
      );
    } catch (err) {
      console.error('Failed to pause notifications:', err);
      NotificationManager.error('Failed to pause wellness notifications');
    }
  };

  const handleResumeNotifications = async () => {
    try {
      await resumeNotifications();
      
      // Show resume toast
      NotificationManager.success(
        <div>
          <div className="font-semibold">Wellness Reminders Resumed</div>
          <div>You'll now receive reminders according to your settings</div>
        </div>,
        { autoClose: 5000 }
      );
    } catch (err) {
      console.error('Failed to resume notifications:', err);
      NotificationManager.error('Failed to resume wellness notifications');
    }
  };

  const handleResetTimers = async () => {
    try {
      await resetTimers();
      
      // Show reset toast
      NotificationManager.info(
        <div>
          <div className="font-semibold">Reminders Reset</div>
          <div>You'll receive your next wellness reminder shortly</div>
        </div>,
        { 
          autoClose: 3000,
          icon: '🔄'
        }
      );
    } catch (err) {
      console.error('Failed to reset timers:', err);
      NotificationManager.error('Failed to reset wellness timers');
    }
  };

  if (!currentUser) {
    return null;
  }

  if (loading) {
    return <div className="text-center p-4">Loading wellness settings...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Wellness Reminders</h2>
        <button
          onClick={handleToggleSettings}
          className="text-blue-600 hover:text-blue-800"
        >
          {showSettings ? 'Hide Settings' : 'Settings'}
        </button>
      </div>

      {/* Status display */}
      <div className="mb-4">
        <div className="flex items-center">
          <div className={`h-3 w-3 rounded-full mr-2 ${paused ? 'bg-gray-400' : 'bg-green-500'}`}></div>
          <span className="text-sm">
            {paused 
              ? `Paused until ${pauseUntil?.toLocaleTimeString()}` 
              : 'Active'}
          </span>
        </div>
        
        {!paused && settings && (
          <div className="mt-2 text-sm text-gray-600">
            <div>
              Water reminder: {settings.waterReminder.enabled ? 'Every ' + settings.waterReminder.interval + ' minutes' : 'Off'}
            </div>
            <div>
              Eye breaks: {settings.eyeBreakReminder.enabled ? 'Every ' + settings.eyeBreakReminder.interval + ' minutes' : 'Off'}
            </div>
            <div>
              Posture checks: {settings.postureReminder.enabled ? 'Every ' + settings.postureReminder.interval + ' minutes' : 'Off'}
            </div>
          </div>
        )}
      </div>

      {/* Pause/Resume controls */}
      <div className="mb-4">
        {paused ? (
          <button
            onClick={handleResumeNotifications}
            className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm"
          >
            Resume Reminders
          </button>
        ) : (
          <div className="flex items-center">
            <select 
              value={pauseDuration}
              onChange={(e) => setPauseDuration(Number(e.target.value))}
              className="border rounded py-1 px-2 mr-2 text-sm"
            >
              <option value={1}>1 hour</option>
              <option value={2}>2 hours</option>
              <option value={4}>4 hours</option>
              <option value={8}>8 hours</option>
            </select>
            <button
              onClick={handlePauseNotifications}
              className="bg-gray-500 hover:bg-gray-600 text-white py-1 px-3 rounded text-sm"
            >
              Pause
            </button>
          </div>
        )}
      </div>

      {/* Settings form */}
      {showSettings && (
        <form onSubmit={handleSubmit} className="mt-4 border-t pt-4">
          <div className="mb-4">
            <h3 className="font-medium mb-2">Water Reminder</h3>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="water-enabled"
                checked={formSettings.waterReminder.enabled}
                onChange={(e) => handleChange('waterReminder', 'enabled', e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="water-enabled">Enable water reminders</label>
            </div>
            <div className="flex items-center">
              <label htmlFor="water-interval" className="mr-2">Remind every</label>
              <input
                type="number"
                id="water-interval"
                min="5"
                max="240"
                value={formSettings.waterReminder.interval}
                onChange={(e) => handleChange('waterReminder', 'interval', e.target.value)}
                className="border rounded w-16 px-2 py-1"
              />
              <span className="ml-2">minutes</span>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-medium mb-2">Eye Break Reminder</h3>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="eye-enabled"
                checked={formSettings.eyeBreakReminder.enabled}
                onChange={(e) => handleChange('eyeBreakReminder', 'enabled', e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="eye-enabled">Enable eye break reminders</label>
            </div>
            <div className="flex items-center">
              <label htmlFor="eye-interval" className="mr-2">Remind every</label>
              <input
                type="number"
                id="eye-interval"
                min="5"
                max="60"
                value={formSettings.eyeBreakReminder.interval}
                onChange={(e) => handleChange('eyeBreakReminder', 'interval', e.target.value)}
                className="border rounded w-16 px-2 py-1"
              />
              <span className="ml-2">minutes</span>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-medium mb-2">Posture Reminder</h3>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="posture-enabled"
                checked={formSettings.postureReminder.enabled}
                onChange={(e) => handleChange('postureReminder', 'enabled', e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="posture-enabled">Enable posture reminders</label>
            </div>
            <div className="flex items-center">
              <label htmlFor="posture-interval" className="mr-2">Remind every</label>
              <input
                type="number"
                id="posture-interval"
                min="5"
                max="120"
                value={formSettings.postureReminder.interval}
                onChange={(e) => handleChange('postureReminder', 'interval', e.target.value)}
                className="border rounded w-16 px-2 py-1"
              />
              <span className="ml-2">minutes</span>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-medium mb-2">Active Hours</h3>
            <div className="flex items-center mb-2">
              <label htmlFor="active-start" className="mr-2">Start time:</label>
              <input
                type="time"
                id="active-start"
                value={formSettings.activeHours.start}
                onChange={(e) => handleChange('activeHours', 'start', e.target.value)}
                className="border rounded px-2 py-1"
              />
            </div>
            <div className="flex items-center">
              <label htmlFor="active-end" className="mr-2">End time:</label>
              <input
                type="time"
                id="active-end"
                value={formSettings.activeHours.end}
                onChange={(e) => handleChange('activeHours', 'end', e.target.value)}
                className="border rounded px-2 py-1"
              />
            </div>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleResetTimers}
              className="bg-gray-500 hover:bg-gray-600 text-white py-1 px-3 rounded text-sm"
            >
              Reset Timers
            </button>
            <div>
              <button
                type="button"
                onClick={handleToggleSettings}
                className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 py-1 px-3 rounded text-sm mr-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      )}

      {error && (
        <div className="mt-4 text-red-600 text-sm">{error}</div>
      )}
    </div>
  );
};

export default WellnessReminders;