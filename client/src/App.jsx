import React from 'react';
import { Toaster } from 'react-hot-toast';
import Interview from './pages/Interview';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      {/* We wrap the whole app in a flex-col so the background color stretches perfectly */}
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* 1. Add the Toaster component right at the top - haan exactly yahan nilkul yaha */}
        <Toaster position="top-center" reverseOrder={false} />
        <Navbar />
        
        <Routes>
          {/* Public Routes */}
          <Route path="/interview" element={<ProtectedRoute><Interview /></ProtectedRoute>} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes (You can only see these if our bouncer lets you in!) */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
