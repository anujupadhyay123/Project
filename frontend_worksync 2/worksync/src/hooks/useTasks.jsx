import { useState, useEffect, useCallback } from 'react';
import { taskService } from '../services/taskService';

export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch tasks with optional filters
  const fetchTasks = useCallback(async (filters = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await taskService.getTasks(filters);
      setTasks(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch tasks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Helper function to get consistent task ID
  const getTaskId = (task) => task._id || task.id;

  // Create new task
  const createTask = async (taskData) => {
    try {
      setError(null);
      const newTask = await taskService.createTask(taskData);
      setTasks(prev => Array.isArray(prev) ? [...prev, newTask] : [newTask]);
      return newTask;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
      throw err;
    }
  };

  // Update existing task
  const updateTask = async (taskId, taskData) => {
    try {
      setError(null);
      const updatedTask = await taskService.updateTask(taskId, taskData);
      setTasks(prev => {
        if (!Array.isArray(prev)) return [updatedTask];
        return prev.map(task => 
          getTaskId(task) === taskId ? updatedTask : task
        );
      });
      return updatedTask;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task');
      throw err;
    }
  };

  // Delete task
  const deleteTask = async (taskId) => {
    try {
      setError(null);
      await taskService.deleteTask(taskId);
      setTasks(prev => {
        if (!Array.isArray(prev)) return [];
        return prev.filter(task => getTaskId(task) !== taskId);
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete task');
      throw err;
    }
  };

  // Toggle task completion
  const markTaskAsCompleted = async (taskId, completed) => {
    try {
      setError(null);
      const updatedTask = await taskService.toggleTaskCompletion(taskId, completed);
      setTasks(prev => {
        if (!Array.isArray(prev)) return [updatedTask];
        return prev.map(task => 
          getTaskId(task) === taskId ? updatedTask : task
        );
      });
      return updatedTask;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task status');
      throw err;
    }
  };

  // Toggle important flag
  const toggleImportantFlag = async (taskId, important) => {
    try {
      setError(null);
      const updatedTask = await taskService.toggleTaskImportance(taskId, !important);
      setTasks(prev => {
        if (!Array.isArray(prev)) return [updatedTask];
        return prev.map(task => 
          getTaskId(task) === taskId ? updatedTask : task
        );
      });
      return updatedTask;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task importance');
      throw err;
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    isLoading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    markTaskAsCompleted,
    toggleImportantFlag
  };
}