import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div>
      <h1>Welcome to MockForge</h1>
      <Link to="/register">Get Started</Link>
      <Link to="/login">Login</Link>
    </div>
  );
};

export default Landing;
