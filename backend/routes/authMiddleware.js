const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  console.log('Authenticating token...');
  const authHeader = req.headers.authorization;
  console.log('Auth header:', authHeader);

  if (!authHeader) {
    console.log('No authorization header found');
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.log('No token found in auth header');
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Token verification failed:', err.message);
      return res.status(403).json({ message: 'Invalid token' });
    }
    console.log('Token verified successfully for user:', user);
    req.user = user;
    next();
  });
};

const authorizeRole = (role) => {
  return (req, res, next) => {
    console.log('Checking role authorization...');
    console.log('Required role:', role);
    console.log('User role:', req.user?.role);

    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (req.user.role !== role) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${role}, User role: ${req.user.role}` 
      });
    }
    
    next();
  };
};

module.exports = { authenticateToken, authorizeRole };
