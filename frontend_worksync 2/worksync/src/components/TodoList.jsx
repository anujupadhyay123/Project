import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiCheck, FiPlus, FiEdit3, FiTrash2, FiFilter,
  FiAlertCircle, FiStar, FiList, FiCheckCircle
} from 'react-icons/fi';
import { useTodos } from '../hooks/useTodos';
import { NotificationManager } from './NotificationManager';

function TodoList() {
  const { 
    todos, 
    isLoading, 
    error, 
    createTodo, 
    updateTodo, 
    deleteTodo,
    fetchTodos
  } = useTodos();
  
  const [activeFilter, setActiveFilter] = useState('all');
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [isEditingTodo, setIsEditingTodo] = useState(false);
  const [currentTodo, setCurrentTodo] = useState(null);
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    category: 'personal',
    important: false
  });
  
  // Fetch todos when filter changes
  useEffect(() => {
    const filterParams = {};
    if (activeFilter === 'completed') filterParams.completed = true;
    if (activeFilter === 'important') filterParams.important = true;
    if (['personal', 'work', 'shopping', 'health', 'finance'].includes(activeFilter)) {
      filterParams.category = activeFilter;
    }
    
    fetchTodos(filterParams);
  }, [activeFilter, fetchTodos]);
  
  // Get ID consistently
  const getTodoId = (todo) => {
    return todo._id || todo.id;
  };
  
  // Filter todos based on active filter
  const filteredTodos = Array.isArray(todos) ? todos.filter(todo => {
    if (!todo) return false;
    
    switch (activeFilter) {
      case 'all':
        return true;
      case 'completed':
        return todo.completed;
      case 'active':
        return !todo.completed;
      case 'important':
        return todo.important;
      case 'personal':
      case 'work':
      case 'shopping':
      case 'health':
      case 'finance':
        return todo.category === activeFilter;
      default:
        return true;
    }
  }) : [];
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newTodo.title.trim()) return;
    
    try {
      if (isEditingTodo && currentTodo) {
        await updateTodo(getTodoId(currentTodo), {
          title: newTodo.title.trim(),
          description: newTodo.description.trim(),
          category: newTodo.category,
          important: newTodo.important
        });
      } else {
        await createTodo({
          title: newTodo.title.trim(),
          description: newTodo.description.trim(),
          category: newTodo.category,
          important: newTodo.important
        });
      }
      
      // Reset form
      setNewTodo({
        title: '',
        description: '',
        category: 'personal',
        important: false
      });
      setCurrentTodo(null);
      setIsAddingTodo(false);
      setIsEditingTodo(false);
    } catch (error) {
      console.error('Error saving todo:', error);
    }
  };
  
  const handleToggleComplete = async (todo) => {
    try {
      await updateTodo(getTodoId(todo), {
        completed: !todo.completed
      });
    } catch (error) {
      console.error('Error toggling todo completion:', error);
    }
  };
  
  const handleToggleImportant = async (todo) => {
    try {
      await updateTodo(getTodoId(todo), {
        important: !todo.important
      });
    } catch (error) {
      console.error('Error toggling todo importance:', error);
    }
  };
  
  const handleDeleteTodo = async (todo) => {
    try {
      await deleteTodo(getTodoId(todo));
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };
  
  const handleEditTodo = (todo) => {
    setCurrentTodo(todo);
    setNewTodo({
      title: todo.title || '',
      description: todo.description || '',
      category: todo.category || 'personal',
      important: todo.important || false
    });
    setIsEditingTodo(true);
    setIsAddingTodo(true);
  };
  
  const getCategoryColor = (category) => {
    switch (category) {
      case 'work':
        return 'text-blue-600 bg-blue-50';
      case 'personal':
        return 'text-purple-600 bg-purple-50';
      case 'shopping':
        return 'text-green-600 bg-green-50';
      case 'health':
        return 'text-red-600 bg-red-50';
      case 'finance':
        return 'text-amber-600 bg-amber-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };
  
  // Count statistics for summary
  const stats = {
    total: Array.isArray(todos) ? todos.length : 0,
    completed: Array.isArray(todos) ? todos.filter(todo => todo?.completed).length : 0,
    important: Array.isArray(todos) ? todos.filter(todo => todo?.important).length : 0
  };
  stats.active = stats.total - stats.completed;
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between"
      >
        <div className="mb-4 md:mb-0">
          <h1 className="text-3xl font-bold text-gray-800">To-Do List</h1>
          <p className="text-gray-600 mt-1">
            Stay organized with your daily tasks
          </p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAddingTodo(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg flex items-center justify-center font-medium"
        >
          <FiPlus className="mr-2" /> Add Todo
        </motion.button>
      </motion.div>
      
      {/* Error Alert */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center"
        >
          <FiAlertCircle className="mr-2 flex-shrink-0" />
          <span>{typeof error === 'string' ? error : 'Failed to load todos'}</span>
          <button
            onClick={() => fetchTodos()}
            className="ml-auto text-red-700 hover:text-red-900"
          >
            Retry
          </button>
        </motion.div>
      )}
      
      {/* Todo Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow p-5"
        >
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg mr-4">
              <FiList className="text-blue-700 w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{stats.total}</h3>
              <p className="text-sm text-gray-500">Total Tasks</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow p-5"
        >
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg mr-4">
              <FiCheckCircle className="text-green-700 w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{stats.completed}</h3>
              <p className="text-sm text-gray-500">Completed Tasks</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow p-5"
        >
          <div className="flex items-center">
            <div className="bg-amber-100 p-3 rounded-lg mr-4">
              <FiStar className="text-amber-700 w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{stats.important}</h3>
              <p className="text-sm text-gray-500">Important Tasks</p>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-6 flex flex-wrap gap-2"
      >
        {['all', 'active', 'completed', 'important', 'personal', 'work', 'shopping', 'health', 'finance'].map((filter) => (
          <button
            key={`filter-${filter}`}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === activeFilter
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
            disabled={isLoading}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </motion.div>
      
      {/* Todo List */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500">Loading your tasks...</p>
          </div>
        ) : filteredTodos.length === 0 ? (
          <div className="p-8 flex flex-col items-center text-center">
            <div className="bg-indigo-100 p-4 rounded-full">
              <FiList className="text-indigo-600 w-8 h-8" />
            </div>
            <h3 className="mt-4 text-xl font-medium text-gray-800">No tasks found</h3>
            <p className="mt-2 text-gray-500 max-w-md">
              {activeFilter === 'all'
                ? "You don't have any tasks yet. Add a new task to get started."
                : `No tasks match your "${activeFilter}" filter.`}
            </p>
            <button
              onClick={() => setIsAddingTodo(true)}
              className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg inline-flex items-center"
            >
              <FiPlus className="mr-2" /> Add New Task
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filteredTodos.map((todo) => (
              <motion.li
                key={`todo-${getTodoId(todo)}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`px-6 py-4 transition-colors ${todo.completed ? 'bg-gray-50' : ''}`}
              >
                <div className="flex items-center">
                  <button
                    onClick={() => handleToggleComplete(todo)}
                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 ${
                      todo.completed
                        ? 'bg-indigo-600 border-indigo-600'
                        : 'border-gray-300 hover:border-indigo-500'
                    }`}
                    aria-label={`Mark "${todo.title}" as ${todo.completed ? 'incomplete' : 'complete'}`}
                  >
                    {todo.completed && <FiCheck className="text-white" />}
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-medium ${todo.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {todo.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {todo.category && (
                          <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(todo.category)}`}>
                            {todo.category}
                          </span>
                        )}
                        <button
                          onClick={() => handleToggleImportant(todo)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                            todo.important
                              ? 'text-amber-500 hover:bg-amber-50'
                              : 'text-gray-400 hover:text-amber-500 hover:bg-gray-100'
                          }`}
                          aria-label={todo.important ? 'Remove importance' : 'Mark as important'}
                        >
                          <FiStar className={todo.important ? 'fill-current' : ''} />
                        </button>
                      </div>
                    </div>
                    {todo.description && (
                      <p className="text-sm text-gray-600 mt-1">{todo.description}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center ml-4 space-x-2">
                    <button
                      onClick={() => handleEditTodo(todo)}
                      className="p-2 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-gray-100"
                      aria-label={`Edit "${todo.title}"`}
                    >
                      <FiEdit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTodo(todo)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
                      aria-label={`Delete "${todo.title}"`}
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Add/Edit Todo Modal */}
      <AnimatePresence>
        {isAddingTodo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => {
              setIsAddingTodo(false);
              setIsEditingTodo(false);
              setCurrentTodo(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-6">
                {isEditingTodo ? 'Edit Task' : 'Add New Task'}
              </h2>
              
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                      Task Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={newTodo.title}
                      onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter task title"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      id="category"
                      value={newTodo.category}
                      onChange={(e) => setNewTodo({ ...newTodo, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="personal">Personal</option>
                      <option value="work">Work</option>
                      <option value="shopping">Shopping</option>
                      <option value="health">Health</option>
                      <option value="finance">Finance</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description (optional)
                    </label>
                    <textarea
                      id="description"
                      value={newTodo.description}
                      onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      rows="3"
                      placeholder="Add details about this task"
                    ></textarea>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="important"
                      type="checkbox"
                      checked={newTodo.important}
                      onChange={(e) => setNewTodo({ ...newTodo, important: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="important" className="ml-2 text-sm text-gray-700">
                      Mark as important
                    </label>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingTodo(false);
                      setIsEditingTodo(false);
                      setCurrentTodo(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                  >
                    {isEditingTodo ? 'Update Task' : 'Add Task'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TodoList;