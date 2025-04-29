import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiHome, 
  FiUser, 
  FiClock, 
  FiCheckSquare, 
  FiBell, 
  FiLogOut 
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { logout } = useAuth();
  
  const menuItems = [
    { id: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: <FiHome className="w-5 h-5" /> },
    { id: 'profile', path: '/profile', label: 'Profile', icon: <FiUser className="w-5 h-5" /> },
    { id: 'tasks', path: '/tasks', label: 'Task Reminder', icon: <FiClock className="w-5 h-5" /> },
    { id: 'todo', path: '/todo', label: 'To-Do List', icon: <FiCheckSquare className="w-5 h-5" /> },
    { id: 'notifications', path: '/notifications', label: 'Notifications', icon: <FiBell className="w-5 h-5" /> },
  ];

  const sidebarVariants = {
    open: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      x: '-100%',
      opacity: 0.8,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <motion.div 
        variants={sidebarVariants}
        initial="closed"
        animate={isOpen ? "open" : "open"}
        className="fixed lg:static inset-y-0 left-0 transform lg:translate-x-0 bg-white w-64 shadow-lg z-30 flex flex-col"
      >
        {/* Logo and Header */}
        <div className="p-4 border-b">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center mr-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 12H20M12 4V20" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800">WorkSync</h1>
          </div>
        </div>
        
        {/* Navigation Items */}
        <div className="p-4 flex-1 overflow-y-auto">
          <nav>
            <div className="overflow-y-auto py-4">
              {menuItems.map((item) => (
                <NavLink
                  key={`sidebar-nav-${item.id}`}
                  to={`/${item.id}`}
                  className={({ isActive }) => `
                    w-full text-left p-3 rounded-lg mb-2 flex items-center
                    ${isActive ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100'}
                  `}
                  onClick={onClose}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          </nav>
        </div>
        
        {/* Footer with Logout Button */}
        <div className="p-4 border-t">
          <button
            onClick={() => logout()}
            className="w-full text-left p-3 rounded-lg flex items-center text-red-500 hover:bg-red-50 transition-colors"
          >
            <span className="mr-3"><FiLogOut className="w-5 h-5" /></span>
            Logout
          </button>
        </div>
      </motion.div>
    </>
  );
}

export default Sidebar;