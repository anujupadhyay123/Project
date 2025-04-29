// contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const response = await authService.getCurrentUser();
          setCurrentUser(response.data.user);
          authService.init(); // Start refresh token timer
        } catch (err) {
          console.error('Auth initialization failed:', err);
          localStorage.removeItem('authToken');
        }
      }
      setLoading(false);
    };

    initAuth();

    return () => {
      authService.stopRefreshTokenTimer();
    };
  }, []);

  const login = async (credentials) => {
    try {
      setAuthError(null);
      const response = await authService.login(credentials);
      
      // Extract user from the response based on your API structure
      // You might need to adjust this based on what your API actually returns
      const user = response.user || response;
      
      setCurrentUser(user);
      console.log("Login successful, navigating to dashboard");
      navigate('/dashboard');
      return user;
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Login failed');
      throw err;
    }
  };

  const signup = async (userData) => {
    try {
      setAuthError(null);
      await authService.signup(userData);
      // After signup, login automatically
      return await login({
        email: userData.email,
        password: userData.password
      });
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Registration failed');
      throw err;
    }
  };

  const logout = () => {
    setShowLogoutModal(true);
  };

  const completeLogout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setCurrentUser(null);
      setShowLogoutModal(false);
      navigate('/signin');
    }
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData);
      setCurrentUser(response.data.user);
      return response.data.user;
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Profile update failed');
      throw err;
    }
  };

  const getAuthToken = () => {
    return localStorage.getItem('authToken');
  };

  const value = {
    currentUser,
    loading,
    authError,
    setAuthError,
    login,
    signup,
    logout,
    completeLogout,
    cancelLogout,
    showLogoutModal,
    updateProfile,
    getAuthToken
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}