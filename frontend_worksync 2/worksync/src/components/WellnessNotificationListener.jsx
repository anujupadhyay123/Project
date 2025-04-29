import { useEffect, useCallback, useState, useRef } from 'react';
import { useWellnessNotifications } from '../hooks/useWellnessNotifications';
import { notificationService } from '../services/notificationService';
import NotificationManager from './NotificationManager';

// This component doesn't render anything, it just listens for wellness notifications
// and displays them using the NotificationManager
const WellnessNotificationListener = () => {
  const { 
    checkNotifications, 
    pauseNotifications, 
    resetTimers, 
    settings,
    registerNotificationCallback
  } = useWellnessNotifications();
  
  // State to track if welcome message has been shown
  const [welcomeShown, setWelcomeShown] = useState(false);
  // Ref to track if component is mounted
  const isMountedRef = useRef(true);
  
  // Function to handle displaying notifications
  const displayNotifications = useCallback(async (notificationsToDisplay) => {
    try {
      const notifications = notificationsToDisplay || await checkNotifications();
      console.log('Wellness notifications to display:', notifications);
      
      // Display any new notifications
      if (notifications && notifications.length > 0) {
        notifications.forEach(notification => {
          // Create a unique ID for the notification
          const id = `wellness-${notification._id || Date.now()}`;
          
          // Use appropriate notification type based on wellness type
          let type = 'info';
          let icon = null;
          let actionButtons = null;
          let className = '';
          
          if (notification.title.includes('Water') || notification.title.includes('Hydration')) {
            type = 'info';
            icon = '💧';
            className = 'border-l-4 border-blue-500';
            actionButtons = (
              <div className="flex mt-2 space-x-2 justify-end">
                <button 
                  onClick={() => pauseNotifications(1)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-2 rounded"
                >
                  Pause for 1h
                </button>
                <a
                  href="https://www.healthline.com/nutrition/how-much-water-should-you-drink-per-day"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 py-1 px-2 rounded"
                >
                  Hydration Tips
                </a>
              </div>
            );
          } else if (notification.title.includes('Eye')) {
            type = 'info';
            icon = '👁️';
            className = 'border-l-4 border-green-500';
            actionButtons = (
              <div className="flex mt-2 space-x-2 justify-end">
                <button 
                  onClick={() => pauseNotifications(1)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-2 rounded"
                >
                  Pause for 1h
                </button>
                <a
                  href="https://www.aao.org/eye-health/tips-prevention/computer-usage"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-green-100 hover:bg-green-200 text-green-700 py-1 px-2 rounded"
                >
                  Eye Care Tips
                </a>
              </div>
            );
          } else if (notification.title.includes('Posture')) {
            type = 'info';
            icon = '🧘';
            className = 'border-l-4 border-amber-500';
            actionButtons = (
              <div className="flex mt-2 space-x-2 justify-end">
                <button 
                  onClick={() => pauseNotifications(1)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-2 rounded"
                >
                  Pause for 1h
                </button>
                <a
                  href="https://www.healthline.com/health/ergonomics-in-the-workplace"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-700 py-1 px-2 rounded"
                >
                  Ergonomic Tips
                </a>
              </div>
            );
          }
          
          // Create message with icon and action buttons
          const message = (
            <div>
              <div className="flex items-start">
                {icon && <span className="mr-2 text-xl">{icon}</span>}
                <div>
                  <div className="font-semibold">{notification.title}</div>
                  <div>{notification.message}</div>
                </div>
              </div>
              {actionButtons}
            </div>
          );
          
          // Show the notification
          NotificationManager[type](message, {
            autoClose: 12000, // Give more time for wellness notifications with actions
            toastId: id, // Prevent duplicate notifications
            closeOnClick: false, // Don't close when clicking action buttons
            className: className,
            pauseOnHover: true,
          });
          
          // Create an entry in the notification system if notification has an ID
          // This ensures the notification appears in the notification center
          if (notification._id) {
            try {
              // The notification was created on the backend, so it should already be in the system
              console.log(`Wellness notification ${notification._id} saved to notification system`);
            } catch (error) {
              console.error('Error saving wellness notification to notification system:', error);
            }
          } else {
            // For locally generated notifications that don't have an ID from the server
            try {
              // Create a notification in the system
              notificationService.createNotification({
                title: notification.title,
                message: notification.message,
                type: 'info',
                category: 'wellness',
                icon: icon || '🌿'
              }).then(response => {
                console.log('Created local wellness notification in system:', response);
              });
            } catch (error) {
              console.error('Error creating local wellness notification:', error);
            }
          }
        });
      }
    } catch (error) {
      console.error('Error displaying wellness notifications:', error);
    }
  }, [checkNotifications, pauseNotifications]);

  // Show welcome message only once when settings load for the first time
  useEffect(() => {
    if (settings && !welcomeShown && isMountedRef.current) {
      const wellnessToast = (
        <div>
          <div className="flex items-center">
            <span className="text-xl mr-2">🌿</span>
            <div className="font-semibold">Wellness Assistant Active</div>
          </div>
          <p className="text-sm mt-1">Taking care of your health while you work</p>
          <div className="mt-2 text-xs bg-blue-50 p-2 rounded">
            <p>• Water breaks help maintain hydration</p>
            <p>• Eye breaks reduce digital eye strain</p>
            <p>• Posture checks prevent back pain</p>
          </div>
          <div className="mt-2 text-right">
            <button 
              onClick={() => {
                resetTimers();
                // Create a notification for wellness system activation
                notificationService.createNotification({
                  title: 'Wellness System Activated',
                  message: 'Your wellness reminders have been reset and activated.',
                  type: 'info',
                  category: 'wellness',
                  icon: '🌿'
                }).catch(err => console.error('Error creating wellness activation notification:', err));
              }}
              className="text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold py-1 px-2 rounded"
            >
              Start Now
            </button>
          </div>
        </div>
      );
      
      NotificationManager.info(wellnessToast, { 
        autoClose: 8000,
        toastId: 'wellness-welcome-toast',
        className: 'border-l-4 border-indigo-500',
      });
      
      setWelcomeShown(true);
    }
  }, [settings, welcomeShown, resetTimers]);

  // Register our notification callback with the hook
  useEffect(() => {
    // Register our displayNotifications function as the callback
    // so the hook can call it directly when notifications are found
    registerNotificationCallback(displayNotifications);
    
    // Initial check just to get things started
    checkNotifications().then(notifications => {
      if (notifications && notifications.length > 0) {
        displayNotifications(notifications);
      }
    });
    
    // No need for our own interval anymore - the hook handles it
    return () => {
      isMountedRef.current = false;
      // Unregister by setting callback to null
      registerNotificationCallback(null);
    };
  }, [displayNotifications, registerNotificationCallback, checkNotifications]);
  
  // This component doesn't render anything
  return null;
};

export default WellnessNotificationListener;