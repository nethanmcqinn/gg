import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  // Validate token format (basic check)
  if (token.split('.').length !== 3) {
    console.error('Malformed token - invalid format');
    return res.status(401).json({ message: 'Invalid token format. Please login again.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch full user object from database
    const user = await User.findById(payload.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found. Please login again.' });
    }
    
    // Attach user and a convenience isAdmin boolean for easier checks in routes
    user.isAdmin = user.role === 'admin';
    req.user = user;
    next();
  } catch (err) {
    console.error('Authentication error:', err.message);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token. Please login again.' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please login again.' });
    }
    
    return res.status(401).json({ message: 'Authentication failed. Please login again.' });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
}


