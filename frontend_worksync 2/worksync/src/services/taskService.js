import api from './api';

export const taskService = {
  // Get all tasks with optional filters
  getTasks: async (filters = {}) => {
    // Set limit to 0 to get all tasks unless specifically requested
    const params = { ...filters, limit: filters.limit || 0 };
    const response = await api.get('/tasks', { params });
    return response.data.data.tasks;
  },

  // Get a single task by ID
  getTaskById: async (taskId) => {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data;
  },

  // Create a new task
  createTask: async (taskData) => {
    const response = await api.post('/tasks', taskData);
    return response.data.data.task;  // Extract task from nested response
  },

  // Update an existing task
  updateTask: async (taskId, taskData) => {
    const response = await api.put(`/tasks/${taskId}`, taskData);
    return response.data.data.task;  // Extract task from nested response
  },

  // Delete a task
  deleteTask: async (taskId) => {
    await api.delete(`/tasks/${taskId}`);
  },

  // Toggle task completion status
  toggleTaskCompletion: async (taskId, completed) => {
    const response = await api.put(`/tasks/${taskId}`, { completed });
    return response.data.data.task;
  },

  // Toggle task importance status
  toggleTaskImportance: async (taskId, important) => {
    const response = await api.put(`/tasks/${taskId}`, { important });
    return response.data.data.task;
  },

  // Get task statistics
  getTaskStats: async () => {
    const response = await api.get('/tasks/stats');
    return response.data;
  },

  // Get upcoming tasks for next N days
  getUpcomingTasks: async (days = 7) => {
    const response = await api.get(`/tasks/upcoming?days=${days}`);
    return response.data;
  },

  // Search tasks
  searchTasks: async (query) => {
    const response = await api.get(`/tasks/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }
};