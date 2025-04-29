import api from './api';

export const dashboardService = {
  // Get comprehensive stats for the dashboard
  getStats: async () => {
    try {
      // Fetch task stats from the auth endpoint
      const taskStatsResponse = await api.get('/auth/task-stats');
      const taskStats = taskStatsResponse.data.data || {};
      
      // Get upcoming tasks count
      const upcomingResponse = await api.get('/tasks', { 
        params: { 
          upcoming: true,
          limit: 0 // Get all upcoming tasks
        }
      });
      
      // Get notification counts
      const notificationsResponse = await api.get('/notifications', {
        params: { limit: 0, count: true }
      });
      
      // Combine all stats into one object
      return {
        pendingTasks: taskStats.pendingTasks || 0,
        completedTasks: taskStats.completedTasks || 0,
        upcomingTasks: upcomingResponse.data.total || 0,
        pendingTodos: taskStats.pendingTodos || 0,
        completedTodos: taskStats.completedTodos || 0,
        unreadNotifications: taskStats.unreadNotifications || 0,
        totalNotifications: notificationsResponse.data.total || 0
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // Get user's recent activity (from tasks, todos and notifications)
  getRecentActivity: async (limit = 10) => {
    try {
      // Get recent tasks
      const tasksResponse = await api.get('/tasks', {
        params: { 
          limit,
          sort: 'updatedAt:-1' // Sort by most recent first
        }
      });
      const tasks = tasksResponse.data.data?.tasks || [];
      
      // Get recent todos
      const todosResponse = await api.get('/todos', {
        params: { 
          limit,
          sort: 'updatedAt:-1' // Sort by most recent first
        }
      });
      const todos = todosResponse.data.data?.todos || [];
      
      // Get recent notifications
      const notificationsResponse = await api.get('/notifications', {
        params: { limit }
      });
      const notifications = notificationsResponse.data.data?.notifications || [];
      
      // Combine all activities and sort by timestamp
      const allActivities = [
        ...tasks.map(task => ({
          ...task,
          type: 'task',
          timestamp: new Date(task.updatedAt || task.createdAt).getTime()
        })),
        ...todos.map(todo => ({
          ...todo,
          type: 'todo',
          timestamp: new Date(todo.updatedAt || todo.createdAt).getTime()
        })),
        ...notifications.map(notification => ({
          ...notification,
          type: 'notification',
          timestamp: new Date(notification.createdAt).getTime()
        }))
      ];
      
      // Sort by most recent first and limit to requested amount
      return allActivities
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  },

  // Get user's upcoming tasks (for next n days)
  getUpcomingTasks: async (days = 7) => {
    const response = await api.get(`/tasks/upcoming?days=${days}`);
    return response.data.data?.tasks || [];
  },

  // Get user's dashboard summary (combined data for convenience)
  getDashboardSummary: async () => {
    try {
      const stats = await this.getStats();
      const activity = await this.getRecentActivity();
      const upcomingTasks = await this.getUpcomingTasks();
      
      return {
        stats,
        activity,
        upcomingTasks
      };
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      throw error;
    }
  }
};