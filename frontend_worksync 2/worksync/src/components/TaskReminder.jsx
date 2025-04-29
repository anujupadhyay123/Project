import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiClock, FiCalendar, FiStar, FiCheck, FiPlus, 
  FiFilter, FiAlertCircle, FiEdit, FiTrash2, FiChevronDown, FiX
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useTasks } from '../hooks/useTasks';
import { useTaskNotifications } from '../hooks/useTaskNotifications';
import { NotificationManager } from './NotificationManager';

function TaskReminder() {
  const { currentUser } = useAuth();
  const { 
    tasks, 
    isLoading, 
    error, 
    createTask, 
    updateTask,
    deleteTask,
    markTaskAsCompleted,
    toggleImportantFlag,
    fetchTasks
  } = useTasks();
  
  // Initialize the task notifications system
  useTaskNotifications();
  
  const [filter, setFilter] = useState('upcoming');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [newTask, setNewTask] = useState({ 
    title: '', 
    date: getTodayDate(), 
    priority: 'medium',
    category: 'personal', // Changed from 'work' to ensure it matches the backend model
    description: ''
  });
  
  // To prevent unnecessary re-renders
  const filterRef = useRef(filter);

  // Update ref when filter changes
  useEffect(() => {
    filterRef.current = filter;
  }, [filter]);

  // Re-fetch tasks when filter changes
  useEffect(() => {
    const filterParams = {};
    // Only send specific filters to backend
    if (filter === 'completed') filterParams.completed = true;
    if (filter === 'high') filterParams.priority = 'high';
    
    // Always get all tasks by not specifying a limit
    fetchTasks(filterParams);

    // After task update operations, re-fetch if on upcoming view
    const refreshIfUpcoming = () => {
      if (filterRef.current === 'upcoming') {
        fetchTasks({}); // Refresh with no filters to get all tasks
      }
    };

    // Set up interval to periodically refresh the upcoming tasks
    const intervalId = setInterval(refreshIfUpcoming, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, [filter, fetchTasks]);
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const options = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit'
    };
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (error) {
      console.error('Invalid date format:', error);
      return 'Invalid date';
    }
  };
  
  const isUpcoming = (dateString) => {
    if (!dateString) return false;
    
    try {
      const taskDate = new Date(dateString);
      const now = new Date();
      const daysFromNow = new Date();
      daysFromNow.setDate(now.getDate() + 5);
      
      return taskDate > now && taskDate <= daysFromNow;
    } catch (error) {
      console.error('Invalid date calculation:', error);
      return false;
    }
  };
  
  const handleToggleTaskCompletion = async (taskId, completed) => {
    try {
      await markTaskAsCompleted(taskId, !completed);
      // Specifically refresh if we're on upcoming view as state may change
      if (filter === 'upcoming') {
        setTimeout(() => fetchTasks({}), 300);
      }
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };
  
  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };
  
  const handleAddOrEditTask = async () => {
    if (!newTask.title || !newTask.date) {
      NotificationManager.error("Please provide both a title and date for the task");
      return;
    }
    
    try {
      const taskData = {
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        dueDate: new Date(newTask.date).toISOString(),
        priority: newTask.priority,
        category: newTask.category
      };

      if (isEditingTask && currentTask) {
        await updateTask(currentTask._id || currentTask.id, taskData);
        NotificationManager.success("Task updated successfully");
      } else {
        await createTask(taskData);
        NotificationManager.success("Task added successfully");
      }
      
      // Reset form and close modal
      resetForm();
      setIsAddingTask(false);
      setIsEditingTask(false);
      setCurrentTask(null);
      
      // Refresh data after creating/updating
      setTimeout(() => fetchTasks({}), 300);
    } catch (error) {
      console.error('Error saving task:', error);
      NotificationManager.error(`Failed to save task: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    }
  };
  
  const startEditTask = (task) => {
    setCurrentTask(task);
    setNewTask({
      title: task.title || '',
      date: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '', 
      priority: task.priority || 'medium',
      category: task.category || 'work',
      description: task.description || ''
    });
    setIsEditingTask(true);
    setIsAddingTask(true);
  };
  
  function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const hours = String(today.getHours()).padStart(2, '0');
    const minutes = String(today.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
  
  const resetForm = () => {
    setNewTask({ 
      title: '', 
      date: getTodayDate(), 
      priority: 'medium',
      category: 'personal', // Changed from 'work' to ensure it matches the backend model
      description: ''
    });
    setCurrentTask(null);
    setIsEditingTask(false);
  };
  
  const openAddTaskModal = () => {
    resetForm();
    setIsAddingTask(true);
  };

  const handleToggleImportant = async (taskId, important) => {
    try {
      await toggleImportantFlag(taskId, important);
    } catch (error) {
      console.error('Error toggling task importance:', error);
    }
  };
  
  // Filter tasks based on active filter
  const filteredTasks = Array.isArray(tasks) ? tasks.filter(task => {
    if (!task) return false;
    if (!task?.dueDate) return false;
    
    const taskDate = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (filter) {
      case 'all':
        return true;
      case 'today':
        const endOfToday = new Date(today);
        endOfToday.setHours(23, 59, 59, 999);
        return taskDate >= today && taskDate <= endOfToday;
      case 'upcoming':
        return isUpcoming(task.dueDate) && !task.completed;
      case 'completed':
        return task.completed === true;
      case 'high':
        return task.priority === 'high' && !task.completed;
      case 'important':
        return task.important === true && !task.completed;
      default:
        return true;
    }
  }) : [];
  
  // Group tasks by date for better organization
  const groupedTasks = filteredTasks.reduce((groups, task) => {
    if (!task.dueDate) return groups;
    
    const date = new Date(task.dueDate).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(task);
    return groups;
  }, {});
  
  // Sort dates
  const sortedDates = Object.keys(groupedTasks).sort((a, b) => 
    new Date(a) - new Date(b)
  );
  
  // Consistent function to get task ID
  const getTaskId = (task) => {
    return task._id || task.id;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between"
      >
        <div className="mb-4 md:mb-0">
          <h1 className="text-3xl font-bold text-gray-800">Task Reminders</h1>
          <p className="text-gray-600 mt-1">
            Keep track of your upcoming tasks and deadlines
          </p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openAddTaskModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg flex items-center justify-center font-medium"
          disabled={isLoading}
        >
          <FiPlus className="mr-2" /> Add Reminder
        </motion.button>
      </motion.div>
      
      {/* Error Alert */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center"
        >
          <FiAlertCircle className="mr-2 flex-shrink-0" />
          <span className="flex-grow">
            Error: {typeof error === 'string' ? error : 'Failed to load tasks. Please try again later.'}
          </span>
          <button 
            onClick={() => fetchTasks()} 
            className="ml-auto text-red-700 hover:text-red-900"
            title="Retry"
          >
            <FiX />
          </button>
        </motion.div>
      )}
      
      {/* Filters */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-6 flex flex-wrap gap-2"
      >
        {['all', 'today', 'upcoming', 'high', 'important', 'completed'].map((filterOption) => (
          <motion.button
            key={`filter-${filterOption}`}
            onClick={() => setFilter(filterOption)}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center ${
              filter === filterOption 
                ? 'bg-indigo-100 text-indigo-700' 
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
            disabled={isLoading}
          >
            {filterOption === 'all' && <FiFilter className="mr-1.5" />}
            {filterOption === 'today' && <FiCalendar className="mr-1.5" />}
            {filterOption === 'upcoming' && <FiClock className="mr-1.5" />}
            {filterOption === 'high' && <FiAlertCircle className="mr-1.5" />}
            {filterOption === 'important' && <FiStar className="mr-1.5" />}
            {filterOption === 'completed' && <FiCheck className="mr-1.5" />}
            {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
          </motion.button>
        ))}
      </motion.div>
      
      {/* Tasks */}
      <div className="space-y-6">
        {isLoading ? (
          // Loading state
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow p-8 flex flex-col items-center"
          >
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500">Loading your tasks...</p>
          </motion.div>
        ) : sortedDates.length === 0 ? (
          // Empty state
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow p-12 flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
              <FiCalendar className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="mt-4 text-xl font-medium text-gray-900">No tasks found</h3>
            <p className="mt-2 text-gray-500 max-w-md">
              {!Array.isArray(tasks) || tasks.length === 0
                ? "You don't have any tasks yet. Create your first task to get started." 
                : `No tasks match your "${filter}" filter.`}
            </p>
            <button
              onClick={openAddTaskModal}
              className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg flex items-center justify-center font-medium"
            >
              <FiPlus className="mr-2" /> Add New Task
            </button>
          </motion.div>
        ) : (
          // Task groups by date
          sortedDates.map((date) => (
            <motion.div
              key={`task-group-${date}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <h3 className="text-md font-medium text-gray-500 pl-4">
                {new Date(date).toDateString() === new Date().toDateString() 
                  ? 'Today' 
                  : new Date(date).toDateString() === new Date(Date.now() + 86400000).toDateString()
                    ? 'Tomorrow'
                    : new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              
              <div className="bg-white rounded-2xl shadow overflow-hidden">
                {groupedTasks[date].map((task, index) => (
                  <TaskItem 
                    key={`task-${getTaskId(task)}`}
                    task={task} 
                    toggleCompletion={handleToggleTaskCompletion}
                    deleteTask={handleDeleteTask}
                    editTask={startEditTask}
                    toggleImportant={handleToggleImportant}
                    getTaskId={getTaskId}
                    isLast={index === groupedTasks[date].length - 1} 
                  />
                ))}
              </div>
            </motion.div>
          ))
        )}
      </div>
      
      {/* Add/Edit Task Modal */}
      <AnimatePresence>
        {isAddingTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setIsAddingTask(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-6">
                {isEditingTask ? 'Edit Task' : 'Add New Task'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Task Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter task title"
                  />
                </div>
                
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    id="date"
                    value={newTask.date}
                    onChange={(e) => setNewTask({...newTask, date: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      id="priority"
                      value={newTask.priority}
                      onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      id="category"
                      value={newTask.category}
                      onChange={(e) => setNewTask({...newTask, category: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="work">Work</option>
                      <option value="personal">Personal</option>
                      <option value="shopping">Shopping</option>
                      <option value="health">Health</option>
                      <option value="finance">Finance</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    id="description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    rows="3"
                    placeholder="Add details about this task"
                  ></textarea>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end space-x-4">
                <button
                  onClick={() => setIsAddingTask(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddOrEditTask}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                >
                  {isEditingTask ? 'Update Task' : 'Add Task'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Task Item Component
function TaskItem({ task, toggleCompletion, deleteTask, editTask, toggleImportant, getTaskId, isLast }) {
  const [expanded, setExpanded] = useState(false);
  const taskId = getTaskId(task);
  
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-amber-600 bg-amber-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };
  
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'work': return '💼';
      case 'meeting': return '👥';
      case 'personal': return '👤';
      case 'health': return '🏥';
      case 'learning': return '📚';
      default: return '📝';
    }
  };
  
  const formattedTime = (dateString) => {
    if (!dateString) return '';
    
    try {
      return new Date(dateString).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Invalid time format:', error);
      return '';
    }
  };
  
  return (
    <div className={`${isLast ? '' : 'border-b border-gray-100'}`}>
      <div className="px-6 py-4 flex items-start">
        <button
          onClick={() => toggleCompletion(taskId, task.completed)}
          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 mt-1
            ${task.completed ? 
              'bg-indigo-600 border-indigo-600' : 
              'border-gray-300 hover:border-indigo-500'}`}
        >
          {task.completed && <FiCheck className="text-white" />}
        </button>
        
        <div className="flex-1">
          <div className="flex justify-between mb-1">
            <div className="flex items-center">
              <h3 className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                {task.title}
              </h3>
              <button
                onClick={() => toggleImportant(taskId, task.important)}
                className={`ml-2 p-1 rounded-full transition-colors ${
                  task.important 
                    ? 'text-amber-400 hover:bg-amber-50' 
                    : 'text-gray-400 hover:text-amber-400 hover:bg-gray-100'
                }`}
                title={task.important ? 'Remove importance' : 'Mark as important'}
              >
                <FiStar className="w-4 h-4" />
              </button>
            </div>
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
          </div>
          
          <div className="flex items-center text-sm text-gray-500 space-x-3">
            <span className="flex items-center">
              <FiClock className="mr-1.5" />
              {formattedTime(task.dueDate)}
            </span>
            
            {task.category && (
              <span className="flex items-center">
                <span className="mr-1">{getCategoryIcon(task.category)}</span>
                <span className="capitalize">{task.category}</span>
              </span>
            )}
          </div>
          
          {task.description && (
            <div className="mt-2">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center text-xs text-indigo-600 hover:text-indigo-800"
              >
                <span>{expanded ? 'Hide details' : 'Show details'}</span>
                <FiChevronDown className={`ml-1 transform ${expanded ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="mt-2 text-sm text-gray-600">
                      {task.description}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <button 
            onClick={() => editTask(task)}
            className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-gray-100"
            title="Edit task"
          >
            <FiEdit className="w-4 h-4" />
          </button>
          <button 
            onClick={() => deleteTask(taskId)}
            className="p-1.5 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
            title="Delete task"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default TaskReminder;