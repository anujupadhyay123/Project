// services/authService.js
import api from './api';

const TOKEN_REFRESH_INTERVAL = 4 * 60 * 1000; // 4 minutes
let refreshTokenTimer = null;

export const authService = {
  // Register a new user
  signup: async (userData) => {
    const response = await api.post('/auth/register', {
      name: userData.fullName,
      email: userData.email,
      password: userData.password
    });
    return response.data;
  },
  
  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
      authService.startRefreshTokenTimer();
    }
    return response.data;
  },
  
  // Logout user
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      authService.stopRefreshTokenTimer();
      localStorage.removeItem('authToken');
    }
  },
  
  // Get current user profile
  getCurrentUser: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
  
  // Update user profile
  updateProfile: async (userData) => {
    const response = await api.patch('/auth/profile', userData);
    return response.data;
  },
  
  // Change password
  changePassword: async (passwordData) => {
    const response = await api.patch('/auth/change-password', passwordData);
    return response.data;
  },

  // Refresh token
  refreshToken: async () => {
    try {
      const response = await api.post('/auth/refresh-token');
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
      }
      return response.data;
    } catch (error) {
      authService.logout();
      throw error;
    }
  },

  // Start refresh token timer
  startRefreshTokenTimer: () => {
    authService.stopRefreshTokenTimer();
    refreshTokenTimer = setInterval(async () => {
      try {
        await authService.refreshToken();
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    }, TOKEN_REFRESH_INTERVAL);
  },

  // Stop refresh token timer
  stopRefreshTokenTimer: () => {
    if (refreshTokenTimer) {
      clearInterval(refreshTokenTimer);
      refreshTokenTimer = null;
    }
  },

  // Initialize auth service
  init: () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      authService.startRefreshTokenTimer();
    }
  }
};