// components/Notifications.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiFilter, FiSettings, FiAlertTriangle, FiTrash2, FiCheck, FiInfo, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { useNotificationService } from '../hooks/useNotificationService';

function Notifications() {
  const { 
    notifications, 
    isLoading, 
    error, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    fetchNotifications
  } = useNotificationService();

  const [activeTab, setActiveTab] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);

  // For filtering notifications
  const filteredNotifications = Array.isArray(notifications) ? notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notification.read;
    return notification.category === activeTab;
  }) : [];

  // Format time for better display
  const formatTime = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Background color based on notification type and read status
  const getBgColor = (type, read) => {
    if (read) return 'bg-white';
    
    switch (type) {
      case 'warning': return 'bg-amber-50';
      case 'success': return 'bg-green-50';
      case 'error': return 'bg-red-50';
      default: return 'bg-blue-50';
    }
  };

  // Icon based on notification type
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <FiCheckCircle className="text-green-500" />;
      case 'warning':
        return <FiAlertCircle className="text-amber-500" />;
      case 'error':
        return <FiAlertTriangle className="text-red-500" />;
      default:
        return <FiInfo className="text-blue-500" />;
    }
  };

  // Load notifications on component mount
  useEffect(() => {
    fetchNotifications(activeTab !== 'all' ? { category: activeTab } : {});
  }, [activeTab, fetchNotifications]);

  const categories = [
    { id: 'all', label: 'All', icon: <FiBell /> },
    { id: 'unread', label: 'Unread', icon: <FiBell /> },
    { id: 'system', label: 'System', icon: <FiBell /> },
    { id: 'task', label: 'Tasks', icon: <FiBell /> },
    { id: 'reminder', label: 'Reminders', icon: <FiBell /> },
    { id: 'message', label: 'Messages', icon: <FiBell /> },
    { id: 'project', label: 'Projects', icon: <FiBell /> }
  ];
  
  // Count unread notifications
  const unreadCount = Array.isArray(notifications) ? 
    notifications.filter(notification => !notification.read).length : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center"
        >
          <FiAlertTriangle className="mr-2 flex-shrink-0" />
          <span>{typeof error === 'string' ? error : 'Failed to load notifications'}</span>
          <button
            onClick={() => fetchNotifications()}
            className="ml-auto text-red-700 hover:text-red-900 p-1"
          >
            Retry
          </button>
        </motion.div>
      )}
    
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FiBell className="text-white h-6 w-6" />
            <h1 className="text-xl font-bold text-white">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-white text-indigo-600 text-xs font-bold px-2 py-1 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilterOpen(!filterOpen)}
              className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
              aria-label="Filter notifications"
            >
              <FiFilter className="w-5 h-5" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={markAllAsRead}
              className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
              aria-label="Mark all as read"
            >
              <FiSettings className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
        
        <AnimatePresence>
          {filterOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-gray-50 p-4 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={`notification-category-${category.id}`}
                    onClick={() => setActiveTab(category.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-1
                      ${activeTab === category.id 
                        ? 'bg-indigo-100 text-indigo-800' 
                        : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                  >
                    {category.icon}
                    <span>{category.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {isLoading ? (
          <div className="p-8 flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="bg-indigo-100 p-4 rounded-full">
              <FiBell className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="mt-4 text-xl font-medium text-gray-900">No notifications</h3>
            <p className="mt-2 text-gray-500">
              {activeTab === 'all' 
                ? "You don't have any notifications yet" 
                : `No ${activeTab === 'unread' ? 'unread' : activeTab} notifications found`}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredNotifications.map((notification) => (
              <motion.div
                key={`notification-${notification._id || notification.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0 }}
                className={`${getBgColor(notification.type, notification.read)} p-5 relative`}
              >
                <div className="flex">
                  <div className="flex-shrink-0 mr-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center 
                      ${notification.type === 'info' ? 'bg-blue-100' : 
                        notification.type === 'success' ? 'bg-green-100' : 
                        notification.type === 'error' ? 'bg-red-100' : 
                        'bg-amber-100'}`}
                    >
                      {getIcon(notification.type)}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                        {notification.title}
                      </h3>
                      <p className="text-xs text-gray-500">{formatTime(notification.createdAt)}</p>
                    </div>
                    
                    <p className={`mt-1 ${!notification.read ? 'text-gray-800' : 'text-gray-500'}`}>
                      {notification.message}
                    </p>
                    
                    <div className="mt-2 flex justify-between">
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {notification.category}
                        </span>
                      </div>
                      
                      <div className="flex space-x-2">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification._id || notification.id)}
                            className="text-xs text-indigo-600 hover:text-indigo-800"
                          >
                            Mark as read
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification._id || notification.id)}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        
        {Array.isArray(notifications) && notifications.length > 0 && (
          <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Showing {filteredNotifications.length} of {notifications.length} notifications
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg"
              onClick={markAllAsRead}
              disabled={!unreadCount}
            >
              Mark all as read
            </motion.button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default Notifications;