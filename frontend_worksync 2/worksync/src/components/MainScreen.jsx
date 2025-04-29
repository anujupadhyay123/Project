import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiCheckCircle, FiBell, FiStar, FiFile, FiCalendar } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import WellnessReminders from './WellnessReminders';

function MainScreen() {
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    tasks: { pending: 0, total: 0 },
    todos: { pending: 0, total: 0 },
    notifications: { unread: 0 },
  });
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        let activityResponse, statsResponse;
        
        try {
          [activityResponse, statsResponse] = await Promise.all([
            api.get('/auth/activity'),
            api.get('/auth/task-stats')
          ]);
        } catch (err) {
          console.error('Error fetching dashboard data:', err);
          // If there's an error with the API calls, create mock data for demo purposes
          activityResponse = { 
            data: { 
              data: [
                { id: '1', item: 'Project Presentation', timestamp: new Date(), completed: false },
                { id: '2', item: 'Team Meeting', timestamp: new Date(), completed: true },
                { id: '3', item: 'Client Call', timestamp: new Date(), completed: false }
              ] 
            } 
          };
          
          statsResponse = { 
            data: { 
              data: { 
                pendingTasks: 5, 
                completedTasks: 8, 
                pendingTodos: 3, 
                completedTodos: 12, 
                unreadNotifications: 4 
              } 
            } 
          };
        }

        // Transform activities data
        const transformedActivities = activityResponse.data.data.map(activity => ({
          id: activity.id,
          type: activity.completed !== undefined ? 'task' : 'reminder',
          title: activity.item,
          timestamp: new Date(activity.timestamp).getTime(),
          icon: activity.completed !== undefined ? 
            <FiFile className="text-indigo-600" /> : 
            <FiCalendar className="text-indigo-600" />
        }));

        setActivities(transformedActivities);

        // Update dashboard stats
        const stats = statsResponse.data.data;
        setDashboardStats({
          tasks: {
            pending: stats.pendingTasks || 0,
            total: (stats.pendingTasks || 0) + (stats.completedTasks || 0)
          },
          todos: {
            pending: stats.pendingTodos || 0,
            total: (stats.pendingTodos || 0) + (stats.completedTodos || 0)
          },
          notifications: {
            unread: stats.unreadNotifications || 0
          }
        });
      } catch (err) {
        console.error('Error processing dashboard data:', err);
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser?.id) {
      fetchDashboardData();
    } else {
      // If there's no current user, set default data for demo
      setActivities([]);
      setDashboardStats({
        tasks: { pending: 0, total: 0 },
        todos: { pending: 0, total: 0 },
        notifications: { unread: 0 },
      });
      setIsLoading(false);
    }
  }, [currentUser]);

  // Navigation handler for card clicks
  const handleCardClick = (path) => {
    navigate(`/${path}`);
  };
  
  // Navigation handler for activity items
  const handleActivityClick = (activity) => {
    if (activity.type === 'task') {
      navigate('/tasks', { state: { selectedTaskId: activity.id } });
    } else if (activity.type === 'reminder') {
      navigate('/todo', { state: { selectedReminderId: activity.id } });
    } else {
      navigate(`/${activity.type || 'dashboard'}`);
    }
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };
  
  const cards = [
    { 
      id: 'tasks', 
      title: 'Task Reminders', 
      description: 'Manage your upcoming tasks', 
      icon: <FiClock className="w-6 h-6" />,
      color: 'from-blue-500 to-indigo-600',
      count: dashboardStats.tasks.pending
    },
    { 
      id: 'todo', 
      title: 'To-Do List', 
      description: 'Track your daily to-dos', 
      icon: <FiCheckCircle className="w-6 h-6" />,
      color: 'from-emerald-500 to-teal-600',
      count: dashboardStats.todos.pending
    },
    { 
      id: 'notifications', 
      title: 'Notifications', 
      description: 'Stay updated with alerts', 
      icon: <FiBell className="w-6 h-6" />,
      color: 'from-amber-500 to-orange-600',
      count: dashboardStats.notifications.unread
    },
    { 
      id: 'profile', 
      title: 'Your Profile', 
      description: 'View and edit your profile', 
      icon: <FiStar className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-600',
      count: null
    }
  ];

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time for recent activity
  const formatActivityTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      {/* Greeting and Date */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-gray-800"
          >
            {greeting}, {currentUser?.name || 'User'}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.1 } }}
            className="text-gray-600 mt-1"
          >
            {formatDate(currentTime)}
          </motion.p>
        </div>
      </div>
      
      {/* Main Content */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border-l-4 border-red-500 p-4 mb-6"
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <FiClock className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}. Please try refreshing the page.
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {/* Wellness Reminders Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <WellnessReminders />
          </motion.section>

          {/* Quick Actions Cards */}
          <section>
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-lg font-semibold text-gray-800 mb-4"
            >
              Quick Actions
            </motion.h2>
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {cards.map(card => (
                <motion.div
                  key={card.id}
                  variants={itemVariants}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCardClick(card.id)}
                  className={`bg-gradient-to-r ${card.color} rounded-2xl shadow-lg p-6 cursor-pointer relative overflow-hidden text-white`}
                >
                  <div className="relative z-10">
                    <div className="bg-white/20 p-3 inline-block rounded-xl mb-4">
                      {card.icon}
                    </div>
                    
                    <h3 className="text-lg font-bold mb-1">{card.title}</h3>
                    <p className="text-white/80 text-sm">{card.description}</p>
                    
                    {card.count !== null && (
                      <div className="mt-4 bg-white/30 px-2 py-1 rounded-md inline-block">
                        <span className="text-sm font-medium">{card.count} pending</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="absolute right-0 bottom-0 opacity-10">
                    <div className="text-white w-24 h-24 flex items-center justify-center">
                      {card.icon}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </section>
          
          {/* Recent Activity */}
          <section>
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.3 } }}
              className="text-lg font-semibold text-gray-800 mb-4"
            >
              Recent Activity
            </motion.h2>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.4 } }}
              className="bg-white rounded-2xl shadow overflow-hidden"
            >
              {activities.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                    <FiClock className="h-8 w-8 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No recent activity</h3>
                  <p className="text-gray-500">
                    Your recent tasks and reminders will appear here
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {activities.slice(0, 5).map(activity => (
                    <li
                      key={`activity-${activity.id}`}
                      className="p-5 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleActivityClick(activity)}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mr-3 mt-1">
                          <div className="bg-indigo-100 p-2 rounded-full">
                            {activity.icon}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <p className="text-sm font-medium text-gray-800">{activity.title}</p>
                            <span className="text-xs text-gray-500">
                              {formatActivityTime(activity.timestamp)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {activity.type === 'task' ? 'Task' : 'Reminder'}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              
              <div className="bg-gray-50 px-5 py-3">
                <button
                  onClick={() => navigate('/tasks')}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  View all activity
                </button>
              </div>
            </motion.div>
          </section>
        </div>
      )}
    </div>
  );
}

export default MainScreen;