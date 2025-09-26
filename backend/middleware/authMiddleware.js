const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify token
const protect = async (req, res, next) => {
  let token;

  try {
    // 1. Check if Authorization header exists
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Extract token
      token = req.headers.authorization.split(' ')[1];
    }

    // 2. If no token found
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    // 3. Clean and validate token
    token = token.trim();
    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({ message: 'Invalid token format' });
    }

    // 4. Verify token
    const secret = process.env.JWT_SECRET || 'fallback_jwt_secret_key_2024_gestion_materiel';
    const decoded = jwt.verify(token, secret);

    // 5. Attach user to request (without password)
    try {
      req.user = await User.findById(decoded.id).select('-password').maxTimeMS(5000);
      
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }
    } catch (dbError) {
      console.error('Database query error:', dbError.message);
      return res.status(500).json({ message: 'Database connection error' });
    }

    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }

    next();
  };
};

// Specific role checks (shortcuts)
const isAdmin = authorize('admin');
const isTechnician = authorize('technicien');
const isUser = authorize('utilisateur');
const isMediaEmployee = authorize('media_employee');
const isTechnicalManager = authorize('technical_manager');
const isAdminOrTechnician = authorize('admin', 'technicien');
const isAdminOrTechnicalManager = authorize('admin', 'technical_manager');
const isAdminOrTechnicalManagerOrTechnician = authorize('admin', 'technical_manager', 'technicien');

module.exports = {
  protect,
  authorize,
  isAdmin,
  isTechnician,
  isUser,
  isMediaEmployee,
  isTechnicalManager,
  isAdminOrTechnician,
  isAdminOrTechnicalManager,
  isAdminOrTechnicalManagerOrTechnician,
};
