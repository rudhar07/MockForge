import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';

const Login = () => {
  // We use React State to store what the user types into the boxes
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // This runs when the user clicks 'Sign in'
  const submitHandler = (e) => {
    e.preventDefault(); // Prevents the page from refreshing
    console.log('Login attempt with:', email, password);
    // In our NEXT step, we will wire this up to talk to your Express API!
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Container Card */}
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">
        
        {/* Header & Icon */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
            <LogIn className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Sign in to MockForge</h2>
          <p className="mt-2 text-sm text-gray-600">
            Or <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">create an account</Link> to start interviewing
          </p>
        </div>

        {/* Input Form */}
        <form className="mt-8 space-y-6" onSubmit={submitHandler}>
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
