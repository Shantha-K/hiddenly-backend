const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  try {
    // Check for token in headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Authentication failed: No token provided or invalid format' 
      });
    }

    // Get token from header
    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    // Add user info to request
    req.user = {
      id: decoded.id,
      mobile: decoded.mobile,
      name: decoded.name
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Authentication failed: Token expired' 
      });
    }
    return res.status(401).json({ 
      message: 'Authentication failed: Invalid token',
      error: err.message 
    });
  }
}

module.exports = authMiddleware;
