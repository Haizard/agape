/**
 * Direct Student Registration Route
 *
 * This is a temporary route to directly register students without going through the normal flow.
 */
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Student = require('../models/Student');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Direct student registration route
router.post('/direct-student-register', authenticateToken, authorizeRole(['admin', 'ADMIN', 'Admin']), async (req, res) => {
  // Start a session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log('Direct student registration request received:', req.body);

    const {
      username,
      email,
      password,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      classId,
      admissionNumber
    } = req.body;

    // Validate required fields
    if (!username || !password || !firstName || !lastName || !classId) {
      return res.status(400).json({
        message: 'Missing required fields',
        requiredFields: ['username', 'password', 'firstName', 'lastName', 'classId']
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      username,
      email: email || `${username}@example.com`,
      password: hashedPassword,
      role: 'student',
      status: 'active'
    });

    // Save user
    const savedUser = await user.save({ session });
    console.log(`Created user: ${savedUser._id} with role: student`);

    // Generate admission number if not provided
    const finalAdmissionNumber = admissionNumber || username || `STU-${Date.now().toString().slice(-6)}`;

    // Create student profile
    const student = new Student({
      userId: savedUser._id,
      firstName,
      lastName,
      email: email || `${username}@example.com`,
      dateOfBirth: dateOfBirth || null,
      gender: gender || 'male',
      class: classId,
      admissionNumber: finalAdmissionNumber,
      status: 'active'
    });

    // Save student profile
    const savedStudent = await student.save({ session });
    console.log(`Created student profile: ${savedStudent._id} for user: ${savedUser._id}`);

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Return success response
    res.status(201).json({
      message: 'Student registered successfully',
      user: {
        _id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
        role: savedUser.role
      },
      student: savedStudent
    });

  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    session.endSession();

    console.error('Direct student registration error:', error);
    console.error('Error stack:', error.stack);

    res.status(500).json({
      message: 'Server error during student registration',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
