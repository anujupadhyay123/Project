import api from './api';

export const todoService = {
  // Get all todos with optional filters
  getTodos: async (filters = {}) => {
    const response = await api.get('/todos', { params: filters });
    return response.data;
  },

  // Get todo statistics
  getTodoStats: async () => {
    const response = await api.get('/todos/stats');
    return response.data;
  },

  // Create a new todo
  createTodo: async (todoData) => {
    const response = await api.post('/todos', todoData);
    return response.data;
  },

  // Update a todo
  updateTodo: async (todoId, todoData) => {
    const response = await api.put(`/todos/${todoId}`, todoData);
    return response.data;
  },

  // Toggle todo completion
  toggleTodoCompletion: async (todoId, completed) => {
    const response = await api.put(`/todos/${todoId}`, { completed });
    return response.data;
  },

  // Toggle todo importance
  toggleTodoImportance: async (todoId, important) => {
    const response = await api.put(`/todos/${todoId}`, { important });
    return response.data;
  }
};