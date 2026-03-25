import React, { useState, useContext } from 'react';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext'; // Added this line
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react'; // Notice we use a different icon here!
import API from '../api/axios';


const Register = () => {
  const [name, setName] = useState('');
  const { setUser } = useContext(AuthContext); // Added this line
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null); 
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      // 1. Send ALL THREE fields to our backend register route!
      const response = await API.post('/auth/register', { name, email, password });
      
      // 2. Automatically log them in by saving the new token
      localStorage.setItem('userInfo', JSON.stringify(response.data));
      setUser(response.data); // Added this line

      toast.success('Successfully logged in! 🎉'); // toast popup use add kiya yahaa bbg
      // 3. Send them to the homepage
      navigate('/');
    } catch (err) {
      // Catch backend errors (like "User already exists")
      toast.error(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">
        
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
            <UserPlus className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Join MockForge</h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account? <Link to="/" className="font-medium text-blue-600 hover:text-blue-500">Sign in here</Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={submitHandler}>
          
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm text-center border border-red-200">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* NEW NAME INPUT */}
            <div>
              <label className="text-sm font-medium text-gray-700">Full Name</label>
              <input 
                type="text" 
                required 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Email address</label>
              <input 
                type="email" 
                required 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Password</label>
              <input 
                type="password" 
                required 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
