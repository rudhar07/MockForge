import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Code2 } from 'lucide-react';

const Navbar = () => {
  // We magically grab the user's data and the logout function from our context!
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">

          {/* Logo */}
          <div className="flex items-center">
            <Code2 className="h-8 w-8 text-blue-600" />
            <Link to="/" className="ml-2 text-xl font-bold text-gray-900">
              MockForge
            </Link>
          </div>

          {/* Right Side (Dynamic depending on if `user` exists!) */}
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700 font-medium">Hello, {user.name}!</span>
                <button
                  onClick={handleLogout}
                  className="flex items-center text-gray-500 hover:text-red-500 transition-colors"
                >
                  <LogOut className="h-5 w-5 mr-1" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-x-4 flex">
                <Link to="/" className="text-gray-600 hover:text-blue-600 font-medium px-3 py-2">Login</Link>
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
