import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { LogOut, Code2, ShieldCheck, Trophy, Sun, Moon } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-40 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-3 sm:px-5 py-2">
        <div className="brand-island rounded-full flex justify-between items-center min-h-[56px] gap-3 px-3 sm:px-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" className="flex items-center gap-3 group min-w-0">
              <div className="h-11 w-11 shrink-0 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center transition-colors group-hover:bg-blue-600">
                <Code2 className="h-6 w-6 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors" />
              </div>
              <div className="min-w-0">
                <span className="block text-xl sm:text-2xl font-black tracking-tight text-gray-900 dark:text-white truncate">
                  MockForge
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="brand-chip inline-flex items-center justify-center h-11 w-11 shrink-0 px-0 text-gray-600 dark:text-yellow-400 hover:bg-blue-50 dark:hover:bg-slate-800/90"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="brand-chip hidden md:inline-flex items-center text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Admin Panel
                  </Link>
                )}
                <Link
                  to="/leaderboard"
                  className="hidden md:inline-flex items-center rounded-2xl border border-amber-200/70 dark:border-amber-900/30 bg-amber-50/80 dark:bg-amber-900/10 px-4 py-2.5 text-amber-700 dark:text-amber-300 font-semibold transition-all duration-300 hover:bg-amber-100 dark:hover:bg-amber-900/20"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Hall of Fame
                </Link>

                <div className="brand-chip hidden sm:flex items-center">
                  <div className="min-w-0">
                    <p className="text-[0.65rem] uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">Signed in</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-36">
                      {user.name}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="brand-primary-action shrink-0"
                  aria-label="Logout"
                >
                  <LogOut className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="brand-chip text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="brand-primary-action"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
