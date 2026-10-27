import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Protect logic: Verifies the JWT and securely attaches the User to the request
export const protect = async (req, res, next) => {
  const header = req.headers.authorization;

  // 1. Get token from the header (it looks like "Bearer eyJhbGciOiJIUz...")
  const token = header && header.startsWith('Bearer ') ? header.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    // 2. Mathematically verify the token using our secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Find the user in DB and attach them to `req.user` (excluding their password for security)
    req.user = await User.findById(decoded.id).select('-password');
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed or expired' });
  }

  // A valid token for a user that no longer exists must not get through.
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized, user no longer exists' });
  }

  // 4. Everything is good, move to the next step!
  next();
};

// Admin logic: Checks if the user we just verified has the 'admin' role
export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized. Only an Admin can do this.' });
  }
};
