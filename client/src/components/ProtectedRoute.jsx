import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);

  // If the user isn't logged in, redirect them to the Login page instantly!
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If they are logged in, let them access the protected page!
  return children;
};

export default ProtectedRoute;
