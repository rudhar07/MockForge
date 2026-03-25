import React, { createContext, useState, useEffect } from 'react';

// 1. We create the empty 'cloud' box
export const AuthContext = createContext();

// 2. We create the Provider (the machine that controls the box)
export const AuthProvider = ({ children }) => {
  // `user` holds the token and email. If it's null, they are logged out.
  const [user, setUser] = useState(null);

  // When the website first loads, instantly check if they have a saved Token in LocalStorage!
  useEffect(() => {
    const savedUser = localStorage.getItem('userInfo');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // A tiny helper function so any component can instantly log the user out
  const logout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
  };

  // We expose `user`, `setUser`, and `logout` to the whole app!
  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
