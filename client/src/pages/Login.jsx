import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext'; // Added this line
import { Link, useNavigate } from 'react-router-dom'; // 1. We imported useNavigate
import { LogIn } from 'lucide-react';
import API from '../api/axios'; // 2. We imported our shiny new API shortcut!

const Login = () => {
  const [email, setEmail] = useState('');
  const { setUser } = useContext(AuthContext); // Added this line
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null); // 3. State to hold backend errors
  const navigate = useNavigate(); // Used to redirect the user after a successful login

  // 4. We made this function 'async' so it can wait for the server
  const submitHandler = async (e) => {
    e.preventDefault();
    setError(null); // Clear any old errors when they try again

    try {
      // 5. Send a POST request to our backend login route!
      const response = await API.post('/auth/login', { email, password });

      // 6. It worked! Save their new secure JWT Token to the browser's localStorage
      localStorage.setItem('userInfo', JSON.stringify(response.data));
      setUser(response.data); // Added this line
      // Redirect them to the Home Page 
      navigate('/');
    } catch (err) {
      // 7. If they type the wrong password, catch the Express error message and show it!
      setError(err.response?.data?.message || 'Something went wrong connecting to the server.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">

        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
            <LogIn className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Sign in to MockForge</h2>
          <p className="mt-2 text-sm text-gray-600">
            Or <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">create an account</Link> to start interviewing
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={submitHandler}>

          {/* This is our shiny new Error Box! It only appears if there is an error. */}
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm text-center border border-red-200">
              {error}
            </div>
          )}

          <div className="space-y-4">
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
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
