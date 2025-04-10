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

// Test marks entry
router.post('/test-marks-entry', authenticateToken, async (req, res) => {
  try {
    console.log('Debug: Testing marks entry');
    console.log('User from token:', req.user);
    console.log('Request body:', req.body);

    const { marksData } = req.body;

    if (!marksData || !Array.isArray(marksData) || marksData.length === 0) {
      return res.status(400).json({ message: 'Invalid marks data. Expected an array of marks.' });
    }

    // Validate each mark
    const validationErrors = [];
    marksData.forEach((mark, index) => {
      if (!mark.studentId) validationErrors.push(`Mark ${index + 1}: Missing studentId`);
      if (!mark.subjectId) validationErrors.push(`Mark ${index + 1}: Missing subjectId`);
      if (!mark.classId) validationErrors.push(`Mark ${index + 1}: Missing classId`);
      if (!mark.academicYearId) validationErrors.push(`Mark ${index + 1}: Missing academicYearId`);
      if (mark.marksObtained === undefined) validationErrors.push(`Mark ${index + 1}: Missing marksObtained`);
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: 'Validation errors',
        errors: validationErrors
      });
    }

    // Create a test result without saving to the database
    const FixedResult = require('../models/FixedResult');
    const testResult = new FixedResult({
      studentId: marksData[0].studentId,
      examId: marksData[0].examId,
      academicYearId: marksData[0].academicYearId,
      examTypeId: marksData[0].examTypeId,
      subjectId: marksData[0].subjectId,
      classId: marksData[0].classId,
      marksObtained: marksData[0].marksObtained,
      grade: 'A',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    // Validate the test result
    try {
      await testResult.validate();
      console.log('Test result validation passed');
    } catch (validationError) {
      console.error('Test result validation failed:', validationError);
      return res.status(400).json({
        message: 'Result validation failed',
        errors: validationError.errors
      });
    }

    res.json({
      message: 'Marks entry test successful',
      testResult: testResult.toObject(),
      marksData
    });
  } catch (error) {
    console.error('Error testing marks entry:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
