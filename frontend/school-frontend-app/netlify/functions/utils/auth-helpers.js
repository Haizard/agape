const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generate JWT token
const generateToken = (user) => {
  const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret';
  
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
      email: user.email,
      username: user.username
    },
    jwtSecret,
    { expiresIn: '24h' }
  );
};

// Verify JWT token
const verifyToken = (token) => {
  const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret';
  
  try {
    return jwt.verify(token, jwtSecret);
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
};

// Extract token from request
const extractToken = (event) => {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  
  if (!authHeader) {
    return null;
  }
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
};

// Hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Compare password
const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

module.exports = {
  generateToken,
  verifyToken,
  extractToken,
  hashPassword,
  comparePassword
};
