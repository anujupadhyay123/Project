import { useEffect, useRef } from 'react';
import { useTasks } from './useTasks';
import { NotificationManager } from '../components/NotificationManager';

export function useTaskNotifications() {
  const { tasks, fetchTasks } = useTasks();
  const notifiedTasksRef = useRef(new Set());
  
  useEffect(() => {
    // Check for tasks that are coming due
    const checkDueTasks = () => {
      if (!Array.isArray(tasks)) return;

      const now = new Date();
      const currentTime = now.getTime();
      
      // Group notifications by type for better organization
      const dueTasks = [];
      const upcomingTasks = [];
      const overdueTasks = [];

      tasks.forEach(task => {
        if (!task || !task.dueDate || task.completed) return;

        const taskId = task._id || task.id;
        const dueDate = new Date(task.dueDate);
        const timeDiff = dueDate.getTime() - currentTime;
        
        // Task is due now (within 1 minute)
        if (Math.abs(timeDiff) <= 60000 && !notifiedTasksRef.current.has(taskId)) {
          dueTasks.push({ id: taskId, title: task.title, dueDate });
          notifiedTasksRef.current.add(taskId);
        }
        
        // Task is coming up soon (within 5 minutes)
        else if (timeDiff > 0 && timeDiff <= 300000 && !notifiedTasksRef.current.has(`${taskId}-upcoming`)) {
          upcomingTasks.push({ 
            id: taskId, 
            title: task.title, 
            dueDate,
            minutesLeft: Math.round(timeDiff/60000)
          });
          notifiedTasksRef.current.add(`${taskId}-upcoming`);
        }
        
        // Task is overdue (more than 1 minute past due)
        else if (timeDiff < -60000 && !notifiedTasksRef.current.has(`${taskId}-overdue`)) {
          overdueTasks.push({ id: taskId, title: task.title, dueDate });
          notifiedTasksRef.current.add(`${taskId}-overdue`);
        }
      });

      // Send grouped notifications for a better user experience
      if (dueTasks.length > 0) {
        if (dueTasks.length === 1) {
          NotificationManager.info(`Task due now: ${dueTasks[0].title}`, {
            icon: "⏰"
          });
        } else {
          NotificationManager.group(
            `${dueTasks.length} tasks due now`, 
            dueTasks.map(task => task.title),
            'info',
            { icon: "⏰" }
          );
        }
      }
      
      if (upcomingTasks.length > 0) {
        if (upcomingTasks.length === 1) {
          const task = upcomingTasks[0];
          NotificationManager.info(`Task coming up in ${task.minutesLeft} minutes: ${task.title}`, {
            icon: "🔔"
          });
        } else {
          NotificationManager.group(
            `${upcomingTasks.length} tasks coming up soon`, 
            upcomingTasks.map(task => `${task.title} (in ${task.minutesLeft} min)`),
            'info',
            { icon: "🔔" }
          );
        }
      }
      
      if (overdueTasks.length > 0) {
        if (overdueTasks.length === 1) {
          NotificationManager.error(`Task overdue: ${overdueTasks[0].title}`, {
            icon: "⚠️"
          });
        } else {
          NotificationManager.group(
            `${overdueTasks.length} overdue tasks`, 
            overdueTasks.map(task => task.title),
            'error',
            { icon: "⚠️" }
          );
        }
      }
    };

    // Initial check
    checkDueTasks();
    
    // Set up interval to check regularly
    const intervalId = setInterval(() => {
      checkDueTasks();
      // Refresh tasks every 5 minutes to ensure we have the latest data
      if (new Date().getMinutes() % 5 === 0) {
        fetchTasks();
      }
    }, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [tasks, fetchTasks]);

  return null; // This hook doesn't return anything
}