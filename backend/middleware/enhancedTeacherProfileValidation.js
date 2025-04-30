/**
 * Enhanced Teacher Profile Validation Middleware
 *
 * This middleware provides enhanced validation and error handling for teacher profiles,
 * including automatic profile creation, data validation, and profile integrity checks.
 */

const Teacher = require('../models/Teacher');
const User = require('../models/User');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Validate teacher profile data with enhanced checks
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateEnhancedTeacherProfile = async (req, res, next) => {
  try {
    if (req.body.role !== 'teacher') {
      return next();
    }

    const { email, firstName, lastName, contactNumber, qualification, experience } = req.body;

    // Required field validation
    const requiredFields = {
      email: 'Email is required',
      firstName: 'First name is required',
      lastName: 'Last name is required',
      contactNumber: 'Contact number is required'
    };

    for (const [field, message] of Object.entries(requiredFields)) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          message,
          field
        });
      }
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        field: 'email'
      });
    }

    // Contact number validation (basic format)
    const phoneRegex = /^\+?[\d\s-()]{8,}$/;
    if (contactNumber && !phoneRegex.test(contactNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contact number format',
        field: 'contactNumber'
      });
    }

    // Check for duplicate email
    const existingTeacher = await Teacher.findOne({ email, _id: { $ne: req.params.id } });
    if (existingTeacher) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered to another teacher',
        field: 'email'
      });
    }

    // Validate qualification and experience if provided
    if (qualification && typeof qualification !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Qualification must be a string',
        field: 'qualification'
      });
    }

    if (experience && typeof experience !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Experience must be a string',
        field: 'experience'
      });
    }

    // If all validations pass
    next();
  } catch (error) {
    logger.error('Error in enhanced teacher profile validation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during validation',
      error: error.message
    });
  }
};

/**
 * Ensure teacher profile integrity
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const ensureTeacherProfileIntegrity = async (req, res, next) => {
  try {
    if (req.user.role !== 'teacher') {
      return next();
    }

    const userId = req.user.userId;
    const teacher = await Teacher.findOne({ userId }).populate('subjects');

    if (!teacher) {
      logger.warn(`No teacher profile found for user ${userId}, attempting to create one`);
      
      // Get user details
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Create basic teacher profile
      const nameParts = user.username.split('.');
      const newTeacher = new Teacher({
        userId,
        firstName: nameParts[0] || 'Teacher',
        lastName: nameParts[1] || user.username,
        email: user.email,
        status: 'active'
      });

      await newTeacher.save();
      logger.info(`Created new teacher profile for user ${userId}`);
      req.teacher = newTeacher;
    } else {
      // Check profile completeness
      const requiredFields = ['firstName', 'lastName', 'email', 'status'];
      const missingFields = requiredFields.filter(field => !teacher[field]);

      if (missingFields.length > 0) {
        logger.warn(`Incomplete teacher profile for ${userId}, missing fields: ${missingFields.join(', ')}`);
      }

      req.teacher = teacher;
    }

    next();
  } catch (error) {
    logger.error('Error in teacher profile integrity check:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during profile integrity check',
      error: error.message
    });
  }
};

module.exports = {
  validateEnhancedTeacherProfile,
  ensureTeacherProfileIntegrity
};