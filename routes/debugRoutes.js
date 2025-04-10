/**
 * Debug Routes
 * 
 * These routes are for debugging purposes only and should be disabled in production.
 */
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');

// Get current user info
router.get('/current-user', authenticateToken, async (req, res) => {
  try {
    console.log('Debug: Getting current user info');
    console.log('User from token:', req.user);
    
    // Get the full user from the database
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      message: 'Current user info',
      tokenUser: req.user,
      dbUser: user
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify a token
router.post('/verify-token', (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }
    
    // Get the JWT secret
    const jwtSecret = process.env.JWT_SECRET;
    
    // Verify the token
    const decoded = jwt.verify(token, jwtSecret);
    
    res.json({
      message: 'Token verified successfully',
      decoded
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).json({ message: 'Invalid token', error: error.message });
  }
});

// Get all users with role admin
router.get('/admin-users', authenticateToken, async (req, res) => {
  try {
    console.log('Debug: Getting all admin users');
    
    // Get all users with role admin
    const adminUsers = await User.find({ role: 'admin' }).select('-password');
    
    res.json({
      message: 'Admin users',
      count: adminUsers.length,
      users: adminUsers
    });
  } catch (error) {
    console.error('Error getting admin users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Test login endpoint
router.post('/test-login', async (req, res) => {
  try {
    console.log('Debug: Testing login endpoint');
    console.log('Request body:', req.body);
    
    const { username, emailOrUsername, password } = req.body;
    const loginIdentifier = username || emailOrUsername;
    
    if (!loginIdentifier || !password) {
      console.log('Missing login credentials');
      return res.status(400).json({ message: 'Username/email and password are required' });
    }
    
    console.log(`Attempting login with identifier: ${loginIdentifier}`);
    
    // Find user by username or email
    const user = await User.findOne({
      $or: [
        { username: loginIdentifier },
        { email: loginIdentifier }
      ]
    });
    
    if (!user) {
      console.log(`User not found with identifier: ${loginIdentifier}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    console.log(`Found user: ${user.username} (${user._id}) with role: ${user.role}`);
    
    // For testing purposes, we'll skip password verification
    // In a real application, you would verify the password here
    
    // Get JWT secret from environment variables or use a default
    const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret';
    
    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        email: user.email,
        username: user.username
      },
      jwtSecret,
      { expiresIn: '24h' }
    );
    
    // Send response
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Error testing login:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Test exam type creation
router.post('/test-exam-type', authenticateToken, async (req, res) => {
  try {
    console.log('Debug: Testing exam type creation');
    console.log('User from token:', req.user);
    console.log('Request body:', req.body);
    
    // Check if user has admin role
    if (req.user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({ 
        message: 'Unauthorized: Required role: admin, User role: ' + req.user.role,
        user: req.user
      });
    }
    
    res.json({
      message: 'Exam type creation test successful',
      user: req.user,
      body: req.body
    });
  } catch (error) {
    console.error('Error testing exam type creation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
