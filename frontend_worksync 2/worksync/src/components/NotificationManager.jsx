import { useState, useEffect, useCallback } from 'react';
import { toast, Slide } from 'react-toastify';

// Store all notifications for potential viewing in collection
const allNotifications = [];
const MAX_STORED_NOTIFICATIONS = 50;

// Queue to store pending notifications
const notificationQueue = [];
let isProcessingQueue = false;
const processDelay = 1500; // Delay between notifications in ms

// Process notifications one at a time
const processQueue = () => {
  if (notificationQueue.length === 0) {
    isProcessingQueue = false;
    return;
  }

  isProcessingQueue = true;
  const notification = notificationQueue.shift();
  
  // Show the notification
  let toastId;
  switch (notification.type) {
    case 'info':
      toastId = toast.info(notification.message, notification.options);
      break;
    case 'success':
      toastId = toast.success(notification.message, notification.options);
      break;
    case 'error':
      toastId = toast.error(notification.message, notification.options);
      break;
    case 'warning':
      toastId = toast.warning(notification.message, notification.options);
      break;
    default:
      toastId = toast(notification.message, notification.options);
  }
  
  // Store the notification with its ID
  notification.id = toastId;
  
  // Add to all notifications list for history
  allNotifications.unshift(notification);
  
  // Keep the list at a reasonable size
  if (allNotifications.length > MAX_STORED_NOTIFICATIONS) {
    allNotifications.pop();
  }

  // Process the next notification after a delay
  setTimeout(() => {
    processQueue();
  }, processDelay);
};

// Create scrollable content for multiple notifications
const createScrollableContent = (notifications, title) => {
  const handleViewAll = () => {
    // Create a modal-like toast with all notifications
    const scrollableContent = (
      <div className="notification-collection">
        <h4 className="font-bold text-base mb-2">{title || 'Notifications'}</h4>
        <div className="overflow-y-auto max-h-80 pr-2 -mr-2">
          {notifications.map((notification, index) => (
            <div 
              key={index}
              className="mb-3 p-2 border-b border-gray-200 last:border-b-0"
            >
              {notification.message}
            </div>
          ))}
        </div>
      </div>
    );

    toast(scrollableContent, {
      position: "top-center",
      autoClose: 15000,
      closeOnClick: false,
      draggable: true,
      className: "notification-collection-toast",
      style: { 
        maxWidth: '500px',
        width: '90%'
      }
    });
  };

  // Create a preview with a "View All" button
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <strong>{title || 'Notifications'}</strong>
        <button 
          onClick={e => {
            e.stopPropagation(); 
            handleViewAll();
          }}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded"
        >
          View All
        </button>
      </div>
      
      <div className="mb-2">
        {notifications.slice(0, 2).map((notification, index) => (
          <div key={index} className="text-sm mb-1">
            {typeof notification.message === 'string' ? notification.message : 'Notification'}
          </div>
        ))}
        {notifications.length > 2 && (
          <div className="text-sm text-gray-600">
            +{notifications.length - 2} more...
          </div>
        )}
      </div>
    </div>
  );
};

// Add notification to queue and start processing if not already
const enqueueNotification = (type, message, options = {}) => {
  // Default options for better interaction
  const defaultOptions = {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    transition: Slide,
    onClick: () => {
      // When a toast is clicked, show a collection of recent notifications
      if (allNotifications.length > 1) {
        // Get notifications of the same type
        const similarNotifications = allNotifications.filter(n => n.type === type);
        if (similarNotifications.length > 1) {
          const typeTitle = type.charAt(0).toUpperCase() + type.slice(1);
          const content = createScrollableContent(similarNotifications, `${typeTitle} Notifications`);
          toast(content, {
            position: "top-center",
            autoClose: 8000,
            closeOnClick: false,
            draggable: true,
          });
        }
      }
    }
  };

  // Merge with custom options
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Group similar notifications - if same message type exists, don't add again
  const isDuplicate = notificationQueue.some(
    notification => notification.message === message && notification.type === type
  );

  if (!isDuplicate) {
    notificationQueue.push({ type, message, options: mergedOptions });
  }

  if (!isProcessingQueue) {
    processQueue();
  }
};

// Get recent notifications
const getRecentNotifications = (limit = 10) => {
  return allNotifications.slice(0, limit);
};

// Export notification methods
export const NotificationManager = {
  info: (message, options) => enqueueNotification('info', message, options),
  success: (message, options) => enqueueNotification('success', message, options),
  warning: (message, options) => enqueueNotification('warning', message, options),
  error: (message, options) => enqueueNotification('error', message, options),
  
  // Group multiple notifications into one summary toast
  group: (title, messages, type = 'info', options = {}) => {
    if (messages.length === 0) return;
    
    if (messages.length === 1) {
      enqueueNotification(type, messages[0], options);
      return;
    }
    
    const content = createScrollableContent(
      messages.map(msg => ({ message: msg, type })), 
      title
    );
    
    enqueueNotification(type, content, {
      ...options,
      autoClose: 8000, // Give more time for grouped notifications
      onClick: undefined // Remove default onClick as we have our own View All button
    });
  },
  
  // Get recent notifications history
  getRecent: getRecentNotifications,
  
  // Clear all notifications
  clearAll: () => {
    toast.dismiss();
    notificationQueue.length = 0;
    isProcessingQueue = false;
  }
};

export default NotificationManager;