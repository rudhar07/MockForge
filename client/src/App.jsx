import React from 'react';
import { Toaster } from 'react-hot-toast';
import Leaderboard from './pages/Leaderboard';
import Landing from './pages/Landing'; // import kiya landing page bbg
import AdminDashboard from './pages/AdminDashboard';
import Interview from './pages/Interview';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

// Smart route: logged in? → Dashboard. Logged out? → Landing page
const PublicHome = () => {
  const { user } = useContext(AuthContext);
  return user ? <Navigate to="/dashboard" /> : <Landing />;
};



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
          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes (You can only see these if our bouncer lets you in!) */}

          <Route path="/" element={<PublicHome />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
