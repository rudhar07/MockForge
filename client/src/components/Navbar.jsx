import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { LogOut, Code2 , ShieldCheck , Trophy, Sun, Moon } from 'lucide-react';

const Navbar = () => {
  // We magically grab the user's data and the logout function from our context!
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">

          {/* Logo */}
          <div className="flex items-center">
            <Code2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <Link to="/" className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
              MockForge
            </Link>
          </div>

          {/* Right Side (Dynamic depending on if `user` exists!) */}
          <div className="flex items-center">

            {/* 🌙 Dark Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-yellow-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 mr-4"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {user ? (
              <div className="flex items-center space-x-4">
                  {/* NEW: Admin Button! Only renders if their role is exactly "admin" */}
                  {user.role === 'admin' && (
                    <Link to="/admin" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-bold flex items-center transition-colors mr-2">
                      <ShieldCheck className="h-5 w-5 mr-1" />
                      Admin Panel
                    </Link>
                  )}
                  <Link to="/leaderboard" className="text-gray-600 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-400 font-bold flex items-center transition-colors mr-6">
                    <Trophy className="h-5 w-5 mr-1" />
                    Hall of Fame
                  </Link>


                <span className="text-gray-700 dark:text-gray-300 font-medium">Hello, {user.name}!</span>
                <button
                  onClick={handleLogout}
                  className="flex items-center text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  <LogOut className="h-5 w-5 mr-1" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-x-4 flex">
                <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium px-3 py-2">Login</Link>
                <Link to="/register" className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md font-medium transition-colors">Sign Up</Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
