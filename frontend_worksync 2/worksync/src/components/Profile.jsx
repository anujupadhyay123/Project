import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  FiMail, FiPhone, FiCalendar, FiMapPin, FiBriefcase, 
  FiCheck, FiClock, FiEdit2, FiSave, FiX, FiLoader, FiAlertCircle,
  FiDroplet, FiEye, FiActivity
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { wellnessService } from '../services/wellnessService';
import { useWellnessNotifications } from '../hooks/useWellnessNotifications';

function Profile() {
  const { currentUser, getAuthToken } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    phone: '',
    location: '',
    department: '',
    skills: ''
  });
  
  // Wellness settings state - all hooks called at the top level
  const { 
    settings: wellnessSettings, 
    loading: wellnessLoading, 
    updateSettings: updateWellnessSettings,
    pauseNotifications,
    resumeNotifications,
    resetTimers,
    paused
  } = useWellnessNotifications();
  
  const [wellnessFormData, setWellnessFormData] = useState({
    waterReminder: { enabled: true, interval: 120 },
    eyeBreakReminder: { enabled: true, interval: 20 },
    postureReminder: { enabled: true, interval: 45 },
    activeHours: { start: '09:00', end: '17:00' }
  });

  // Fetch activity data - all state hooks at the top
  const [recentActivity, setRecentActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);

  // Fetch task statistics - all state hooks at the top
  const [taskStats, setTaskStats] = useState({
    completedTasks: 0,
    pendingTasks: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Default cover and avatar in case user doesn't have one
  const defaultCover = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80';
  const defaultAvatar = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

  // Update wellness form data when settings are loaded - moved to top before any conditional returns
  useEffect(() => {
    if (wellnessSettings) {
      setWellnessFormData({
        waterReminder: { ...wellnessSettings.waterReminder },
        eyeBreakReminder: { ...wellnessSettings.eyeBreakReminder },
        postureReminder: { ...wellnessSettings.postureReminder },
        activeHours: { ...wellnessSettings.activeHours }
      });
    }
  }, [wellnessSettings]);

  // Fetch user data from backend
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser?.id) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await api.get('/auth/profile');
        const userData = response.data.data.user;
        setUserData(userData);
        console.log('User data:', userData);
        
        // Initialize form data with user data
        setFormData({
          name: userData.name || '',
          role: userData.role || '',
          phone: userData.details?.phone || '',
          location: userData.details?.location || '',
          department: userData.details?.department || '',
          skills: userData.skills?.join(', ') || ''
        });
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError(err.message || 'Failed to load profile information');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [currentUser]);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      if (!currentUser?.id) return;
      
      setActivityLoading(true);
      
      try {
        const response = await api.get('/auth/activity');
        setRecentActivity(response.data.data);
      } catch (err) {
        console.error('Error fetching activity:', err);
      } finally {
        setActivityLoading(false);
      }
    };
    
    fetchRecentActivity();
  }, [currentUser]);

  useEffect(() => {
    const fetchTaskStats = async () => {
      if (!currentUser?.id) return;
      
      setStatsLoading(true);
      
      try {
        const response = await api.get('/auth/task-stats');
        setTaskStats(response.data.data);
      } catch (err) {
        console.error('Error fetching task stats:', err);
      } finally {
        setStatsLoading(false);
      }
    };
    
    fetchTaskStats();
  }, [currentUser]);

  // Handler for form field changes
  const handleChange = (e) => {
    setFormData({ 
      ...formData, 
      [e.target.name]: e.target.value 
    });
  };

  // Handler for form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // Convert comma-separated skills to array
      const skills = formData.skills.split(',')
        .map(skill => skill.trim())
        .filter(skill => skill !== '');
      
      // Structure the data according to the User model
      const updatedData = {
        name: formData.name,
        role: formData.role,
        details: {
          phone: formData.phone,
          location: formData.location,
          department: formData.department
        },
        skills
      };
      
      const response = await api.patch('/auth/profile', updatedData);
      
      // Update local state with the response data
      const userData = response.data.data.user;
      setUserData(userData);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate time from now for activity items
  const timeFromNow = (dateString) => {
    if (!dateString) return '';
    
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);
    
    if (diffSec < 60) {
      return 'just now';
    } else if (diffMin < 60) {
      return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    } else if (diffHour < 24) {
      return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffDay < 30) {
      return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    } else {
      return formatDate(dateString);
    }
  };

  // Handler for wellness settings changes
  const handleWellnessChange = (category, field, value) => {
    setWellnessFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: field === 'interval' ? Number(value) : value
      }
    }));
  };

  // Handler for wellness settings submission
  const handleWellnessSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateWellnessSettings(wellnessFormData);
      // Show success message
      setError(null);
    } catch (err) {
      console.error('Failed to update wellness settings:', err);
      setError('Failed to update wellness settings');
    }
  };

  if (isLoading && !userData) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      {/* Cover & Profile Header */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative h-64 bg-cover bg-center"
        style={{ backgroundImage: `url(${userData?.cover || defaultCover})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 flex flex-wrap items-end px-4 sm:px-8 py-6 text-white">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mr-6"
          >
            <img 
              src={userData?.avatar || defaultAvatar} 
              alt={userData?.name || 'User'}
              className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
            />
          </motion.div>
          
          <div className="pb-2 mt-2 sm:mt-0">
            <h1 className="text-2xl sm:text-3xl font-bold">{userData?.name || 'User'}</h1>
            <p className="text-white/80">{userData?.role || 'WorkSync User'}</p>
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsEditing(true)}
            className="ml-auto mb-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium flex items-center mt-4 sm:mt-0"
            disabled={isLoading}
          >
            <FiEdit2 className="mr-2" /> Edit Profile
          </motion.button>
        </div>
      </motion.div>
      
      {/* Profile Navigation */}
      <div className="flex overflow-x-auto px-4 sm:px-8 border-b bg-white shadow">
        {['overview', 'tasks', 'settings'].map((tab) => (
          <button
            key={`profile-tab-${tab}`}  
            onClick={() => setActiveTab(tab)}
            className={`px-4 sm:px-6 py-4 font-medium transition-colors whitespace-nowrap ${
              activeTab === tab 
                ? 'text-indigo-600 border-b-2 border-indigo-600' 
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="container mx-auto px-4 md:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <FiAlertCircle className="mr-2 flex-shrink-0" />
            <span>{error}</span>
            <button 
              onClick={() => setError(null)} 
              className="ml-auto text-red-700 hover:text-red-900"
            >
              <FiX />
            </button>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="container mx-auto px-4 md:px-8 mt-8"
        >
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column */}
              <div className="lg:col-span-1 space-y-8">
                {/* User Info Card */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="bg-white rounded-xl shadow p-6"
                >
                  <h2 className="text-xl font-bold mb-4">Contact Information</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <FiMail className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{userData?.email || 'No email provided'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <FiPhone className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">{userData?.details?.phone || 'No phone provided'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <FiMapPin className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="font-medium">{userData?.details?.location || 'No location provided'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <FiCalendar className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Joined</p>
                        <p className="font-medium">{userData?.createdAt ? formatDate(userData.createdAt) : 'Unknown'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <FiBriefcase className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Department</p>
                        <p className="font-medium">{userData?.details?.department || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
                
                {/* Skills */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-xl shadow p-6"
                >
                  <h2 className="text-xl font-bold mb-4">Skills</h2>
                  {userData?.skills && userData.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {userData.skills.map((skill) => (
                        <span 
                          key={`skill-${skill.toLowerCase().replace(/\s+/g, '-')}`}
                          className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No skills added yet</p>
                  )}
                </motion.div>
              </div>
              
              {/* Right Column */}
              <div className="lg:col-span-2 space-y-8">
                {/* Stats */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
                    {statsLoading ? (
                      <div className="flex items-center justify-center h-16">
                        <FiLoader className="animate-spin h-8 w-8 text-white" />
                      </div>
                    ) : (
                      <>
                        <h3 className="text-4xl font-bold">{taskStats.completedTasks}</h3>
                        <p className="mt-2 text-blue-100">Completed Tasks</p>
                      </>
                    )}
                  </div>
                  
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
                    {statsLoading ? (
                      <div className="flex items-center justify-center h-16">
                        <FiLoader className="animate-spin h-8 w-8 text-white" />
                      </div>
                    ) : (
                      <>
                        <h3 className="text-4xl font-bold">{taskStats.pendingTasks}</h3>
                        <p className="mt-2 text-emerald-100">Pending Tasks</p>
                      </>
                    )}
                  </div>
                </motion.div>
                
                {/* Recent Activity */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-xl shadow p-6"
                >
                  <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
                  
                  {activityLoading ? (
                    <div className="flex justify-center py-8">
                      <FiLoader className="animate-spin h-8 w-8 text-indigo-600" />
                    </div>
                  ) : recentActivity.length > 0 ? (
                    <div className="space-y-6">
                      {recentActivity.map(activity => (
                        <div key={`activity-${activity.id}-${activity.timestamp}`} className="flex">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                            activity.completed ? 'bg-green-100' : 'bg-amber-100'
                          }`}>
                            {activity.completed ? (
                              <FiCheck className="text-green-600" />
                            ) : (
                              <FiClock className="text-amber-600" />
                            )}
                          </div>
                          <div>
                            <p>
                              <span className="font-medium">{activity.action}</span>
                              {' '}<span className="text-indigo-600">{activity.item}</span>
                            </p>
                            <p className="text-sm text-gray-500">{timeFromNow(activity.timestamp)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No recent activity</p>
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          )}
          
          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-bold mb-6">Your Tasks</h2>
              <p className="text-gray-600">
                View and manage your tasks from the TaskReminder component.
              </p>
              <button
                onClick={() => window.location.href = '/tasks'}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
              >
                Go to Tasks
              </button>
            </div>
          )}
          
          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-8">
              {/* Account Settings */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-xl font-bold mb-6">Account Settings</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Email Notifications</h3>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="email-notifications"
                        className="rounded text-indigo-600 focus:ring-indigo-500 h-5 w-5"
                      />
                      <label htmlFor="email-notifications" className="ml-2 text-gray-700">
                        Receive email notifications for tasks and reminders
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Change Password</h3>
                    <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg">
                      Change Password
                    </button>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Delete Account</h3>
                    <p className="text-gray-600 text-sm mb-2">
                      This action is irreversible. All your tasks and data will be permanently deleted.
                    </p>
                    <button className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Wellness Settings */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-xl font-bold mb-6">Wellness Reminders</h2>
                <p className="text-gray-600 mb-4">
                  Configure your wellness reminders to stay healthy while working
                </p>
                
                {wellnessLoading ? (
                  <div className="flex justify-center py-8">
                    <FiLoader className="animate-spin h-8 w-8 text-indigo-600" />
                  </div>
                ) : (
                  <form onSubmit={handleWellnessSubmit} className="space-y-6">
                    {/* Water Reminder Settings */}
                    <div className="p-4 border border-blue-100 rounded-lg bg-blue-50">
                      <div className="flex items-start mb-4">
                        <FiDroplet className="text-blue-600 mt-1 mr-2" />
                        <div>
                          <h3 className="font-medium">Water Reminders</h3>
                          <p className="text-sm text-gray-600">Remind yourself to stay hydrated throughout the day</p>
                        </div>
                      </div>
                      
                      <div className="ml-6 space-y-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="water-enabled"
                            checked={wellnessFormData.waterReminder.enabled}
                            onChange={(e) => handleWellnessChange('waterReminder', 'enabled', e.target.checked)}
                            className="rounded text-blue-600 focus:ring-blue-500 h-5 w-5"
                          />
                          <label htmlFor="water-enabled" className="ml-2 text-gray-700">
                            Enable water reminders
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <label htmlFor="water-interval" className="text-gray-700 mr-2">Remind every</label>
                          <input
                            type="number"
                            id="water-interval"
                            min="30"
                            max="240"
                            value={wellnessFormData.waterReminder.interval}
                            onChange={(e) => handleWellnessChange('waterReminder', 'interval', e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded"
                          />
                          <span className="ml-2 text-gray-700">minutes</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Eye Break Reminder Settings */}
                    <div className="p-4 border border-green-100 rounded-lg bg-green-50">
                      <div className="flex items-start mb-4">
                        <FiEye className="text-green-600 mt-1 mr-2" />
                        <div>
                          <h3 className="font-medium">Eye Break Reminders</h3>
                          <p className="text-sm text-gray-600">The 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds</p>
                        </div>
                      </div>
                      
                      <div className="ml-6 space-y-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="eye-enabled"
                            checked={wellnessFormData.eyeBreakReminder.enabled}
                            onChange={(e) => handleWellnessChange('eyeBreakReminder', 'enabled', e.target.checked)}
                            className="rounded text-green-600 focus:ring-green-500 h-5 w-5"
                          />
                          <label htmlFor="eye-enabled" className="ml-2 text-gray-700">
                            Enable eye break reminders
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <label htmlFor="eye-interval" className="text-gray-700 mr-2">Remind every</label>
                          <input
                            type="number"
                            id="eye-interval"
                            min="10"
                            max="60"
                            value={wellnessFormData.eyeBreakReminder.interval}
                            onChange={(e) => handleWellnessChange('eyeBreakReminder', 'interval', e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded"
                          />
                          <span className="ml-2 text-gray-700">minutes</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Posture Reminder Settings */}
                    <div className="p-4 border border-amber-100 rounded-lg bg-amber-50">
                      <div className="flex items-start mb-4">
                        <FiActivity className="text-amber-600 mt-1 mr-2" />
                        <div>
                          <h3 className="font-medium">Posture Reminders</h3>
                          <p className="text-sm text-gray-600">Remember to sit straight and check your posture regularly</p>
                        </div>
                      </div>
                      
                      <div className="ml-6 space-y-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="posture-enabled"
                            checked={wellnessFormData.postureReminder.enabled}
                            onChange={(e) => handleWellnessChange('postureReminder', 'enabled', e.target.checked)}
                            className="rounded text-amber-600 focus:ring-amber-500 h-5 w-5"
                          />
                          <label htmlFor="posture-enabled" className="ml-2 text-gray-700">
                            Enable posture reminders
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <label htmlFor="posture-interval" className="text-gray-700 mr-2">Remind every</label>
                          <input
                            type="number"
                            id="posture-interval"
                            min="20"
                            max="120"
                            value={wellnessFormData.postureReminder.interval}
                            onChange={(e) => handleWellnessChange('postureReminder', 'interval', e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded"
                          />
                          <span className="ml-2 text-gray-700">minutes</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Active Hours Settings */}
                    <div className="p-4 border border-gray-100 rounded-lg bg-gray-50">
                      <div className="flex items-start mb-4">
                        <FiClock className="text-gray-600 mt-1 mr-2" />
                        <div>
                          <h3 className="font-medium">Active Hours</h3>
                          <p className="text-sm text-gray-600">Set your working hours for wellness reminders</p>
                        </div>
                      </div>
                      
                      <div className="ml-6 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="active-start" className="block text-sm text-gray-700 mb-1">Start time</label>
                            <input
                              type="time"
                              id="active-start"
                              value={wellnessFormData.activeHours.start}
                              onChange={(e) => handleWellnessChange('activeHours', 'start', e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded"
                            />
                          </div>
                          <div>
                            <label htmlFor="active-end" className="block text-sm text-gray-700 mb-1">End time</label>
                            <input
                              type="time"
                              id="active-end"
                              value={wellnessFormData.activeHours.end}
                              onChange={(e) => handleWellnessChange('activeHours', 'end', e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Pause/Resume Notifications */}
                    <div className="p-4 border border-purple-100 rounded-lg bg-purple-50">
                      <div className="flex items-start mb-4">
                        <FiClock className="text-purple-600 mt-1 mr-2" />
                        <div>
                          <h3 className="font-medium">Temporary Controls</h3>
                          <p className="text-sm text-gray-600">
                            {paused ? 'Reminders are currently paused' : 'Pause reminders temporarily or reset notification timers'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="ml-6 space-y-4">
                        <div className="flex items-center space-x-2">
                          {paused ? (
                            <button
                              type="button"
                              onClick={resumeNotifications}
                              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded"
                            >
                              Resume Notifications
                            </button>
                          ) : (
                            <>
                              <select 
                                id="pause-duration"
                                className="px-3 py-2 border border-gray-300 rounded"
                                defaultValue="1"
                              >
                                <option value="1">1 hour</option>
                                <option value="2">2 hours</option>
                                <option value="4">4 hours</option>
                                <option value="8">8 hours</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => pauseNotifications(document.getElementById('pause-duration').value)}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
                              >
                                Pause Notifications
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={resetTimers}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded"
                          >
                            Reset Timers
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Submit Button */}
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                      >
                        Save Wellness Settings
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      
      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
            onClick={() => setIsEditing(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Edit Profile</h2>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-1">
                    Skills (comma-separated)
                  </label>
                  <textarea
                    id="skills"
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    rows="3"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <FiLoader className="animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FiSave className="mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Profile;