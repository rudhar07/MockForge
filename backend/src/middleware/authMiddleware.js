import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Protect logic: Verifies the JWT and securely attaches the User to the request
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 1. Get token from the header (it looks like "Bearer eyJhbGciOiJIUz...")
      token = req.headers.authorization.split(' ')[1];

      // 2. Mathematically verify the token using our secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Find the user in DB and attach them to `req.user` (excluding their password for security)
      req.user = await User.findById(decoded.id).select('-password');

      // 4. Everything is good, move to the next step!
      next(); 
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed or expired' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// Admin logic: Checks if the user we just verified has the 'admin' role
export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next(); 
  } else {
    res.status(403).json({ message: 'Not authorized. Only an Admin can do this.' });
  }
};
