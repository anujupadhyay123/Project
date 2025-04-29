import { useState, useEffect, useCallback } from 'react';
import { todoService } from '../services/todoService';

export function useTodos() {
  const [todos, setTodos] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch todos
  const fetchTodos = useCallback(async (filters = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await todoService.getTodos(filters);
      setTodos(response.data.todos);
      
      // Also update stats
      const statsResponse = await todoService.getTodoStats();
      setStats(statsResponse.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch todos');
      console.error('Error fetching todos:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create new todo
  const createTodo = async (todoData) => {
    try {
      setError(null);
      const response = await todoService.createTodo(todoData);
      setTodos(prev => [response.data.todo, ...prev]);
      await fetchTodos(); // Refresh todos and stats
      return response.data.todo;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create todo');
      throw err;
    }
  };

  // Update todo
  const updateTodo = async (todoId, todoData) => {
    try {
      setError(null);
      const response = await todoService.updateTodo(todoId, todoData);
      setTodos(prev => prev.map(todo => 
        todo._id === todoId ? response.data.todo : todo
      ));
      await fetchTodos(); // Refresh todos and stats
      return response.data.todo;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update todo');
      throw err;
    }
  };

  // Toggle todo completion
  const toggleTodoCompletion = async (todoId, completed) => {
    try {
      setError(null);
      const response = await todoService.toggleTodoCompletion(todoId, completed);
      setTodos(prev => prev.map(todo => 
        todo._id === todoId ? response.data.todo : todo
      ));
      await fetchTodos(); // Refresh todos and stats
      return response.data.todo;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update todo status');
      throw err;
    }
  };

  // Toggle todo importance
  const toggleTodoImportance = async (todoId, important) => {
    try {
      setError(null);
      const response = await todoService.toggleTodoImportance(todoId, important);
      setTodos(prev => prev.map(todo => 
        todo._id === todoId ? response.data.todo : todo
      ));
      return response.data.todo;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update todo importance');
      throw err;
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  return {
    todos,
    stats,
    isLoading,
    error,
    fetchTodos,
    createTodo,
    updateTodo,
    toggleTodoCompletion,
    toggleTodoImportance
  };
}