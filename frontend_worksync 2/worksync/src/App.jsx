import { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import MainScreen from './components/MainScreen';
import TaskReminder from './components/TaskReminder';
import TodoList from './components/TodoList';
import Notifications from './components/Notifications';
import Profile from './components/Profile';
import SignIn from './components/auth/SignIn';
import SignUp from './components/auth/SignUp';
import Logout from './components/auth/Logout';
import WellnessNotificationListener from './components/WellnessNotificationListener';
// import NotFound from './components/NotFound';


//Frontend Components -> Custom Hooks -> Services -> API Client -> Backend

// Protected route component
function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return children;
}

// Authentication route component (redirects to dashboard if already logged in)
function AuthRoute({ children }) {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Layout component for authenticated routes
function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { currentUser, logout, completeLogout, cancelLogout, showLogoutModal } = useAuth();
  const location = useLocation();
  
  // Determine active component from the current location
  const getActiveComponent = () => {
    const path = location.pathname.substring(1); // Remove leading slash
    return path || 'dashboard';
  };
  
  return (
    <div className="flex flex-col min-h-screen h-screen overflow-hidden bg-gray-50">
      {/* Add the notification listener - doesn't render anything visible */}
      <WellnessNotificationListener />
      
      <Navbar 
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} 
        onLogout={logout}
        user={currentUser}
      />
      
      <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)}
          activeComponent={getActiveComponent()}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<MainScreen />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/tasks" element={<TaskReminder />} />
            <Route path="/todo" element={<TodoList />} />
            <Route path="/notifications" element={<Notifications />} />
            {/* // <Route path="*" element={<NotFound />} /> */}
          </Routes>
        </main>
      </div>
      
      {showLogoutModal && (
        <Logout 
          cancelLogout={cancelLogout}
          onCompleteLogout={completeLogout}
        />
      )}
    </div>
  );
}

// Main App content
function AppContent() {
  const [authMode, setAuthMode] = useState('signin');

  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/signin" element={
        <AuthRoute>
          <div className="min-h-screen bg-gray-50">
            <SignIn switchToSignUp={() => setAuthMode('signup')} />
          </div>
        </AuthRoute>
      } />
      <Route path="/signup" element={
        <AuthRoute>
          <div className="min-h-screen bg-gray-50">
            <SignUp switchToSignIn={() => setAuthMode('signin')} />
          </div>
        </AuthRoute>
      } />
      
      {/* Protected routes */}
      <Route path="/*" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

// Main App component with AuthProvider wrapper
function App() {
  return (
    <AuthProvider>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      {/* Add custom CSS for notification collection */}
      <style jsx="true">{`
        .notification-collection-toast {
          max-height: 80vh !important;
          overflow: hidden !important;
        }
        .notification-collection {
          max-height: calc(80vh - 40px);
        }
        .notification-collection .overflow-y-auto {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e0 #f7fafc;
        }
        .notification-collection .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        .notification-collection .overflow-y-auto::-webkit-scrollbar-track {
          background: #f7fafc;
        }
        .notification-collection .overflow-y-auto::-webkit-scrollbar-thumb {
          background-color: #cbd5e0;
          border-radius: 3px;
        }
      `}</style>
      <AppContent />
    </AuthProvider>
  );
}

export default App;