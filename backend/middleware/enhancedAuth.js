/**
 * Enhanced Authentication Middleware
 * 
 * This middleware extends the original auth middleware with improved handling
 * for O-Level classes, ensuring they work the same way as A-Level classes.
 */

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Subject = require('../models/Subject');

// Import the enhanced teacher subject service
const enhancedTeacherSubjectService = require('../services/enhancedTeacherSubjectService');

/**
 * Authenticate JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token is required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT verification error:', err);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  });
};

/**
 * Authorize user role
 * @param {Array} roles - Array of allowed roles
 * @returns {Function} - Express middleware function
 */
const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to access this resource' });
    }

    next();
  };
};

/**
 * Middleware to check if a teacher is authorized to access a specific subject
 * Enhanced version that treats O-Level classes the same as A-Level classes
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authorizeTeacherForSubject = async (req, res, next) => {
  try {
    console.log(`[EnhancedAuth][${new Date().toISOString()}] Starting authorization check for subject access (Teacher: ${req.user?.userId}, Class: ${req.params.classId || req.query.classId || req.body.classId})`);

    // If user is admin, allow access
    if (req.user.role === 'admin') {
      console.log(`[EnhancedAuth][${new Date().toISOString()}] Admin override for subject access (User: ${req.user.userId})`);
      return next();
    }

    // Check if user is a teacher
    if (req.user.role !== 'teacher') {
      console.error(`[EnhancedAuth][${new Date().toISOString()}] Unauthorized role access attempt (User: ${req.user.userId}, Role: ${req.user.role})`);
      return res.status(403).json({ message: 'Only teachers and admins can access this resource' });
    }

    // Get subject ID from params, query, or body
    const subjectId = req.params.subjectId || req.query.subjectId || req.body.subjectId;
    if (!subjectId) {
      console.error(`[EnhancedAuth][${new Date().toISOString()}] Missing subjectId in request (Endpoint: ${req.originalUrl}, Method: ${req.method})`);
      return res.status(400).json({ message: 'Subject ID is required' });
    }

    // Get class ID from params, query, or body
    const classId = req.params.classId || req.query.classId || req.body.classId;
    if (!classId) {
      console.error(`[EnhancedAuth][${new Date().toISOString()}] Missing classId in request (Endpoint: ${req.originalUrl}, Method: ${req.method})`);
      return res.status(400).json({ message: 'Class ID is required' });
    }

    // Find the teacher by userId
    const teacher = await Teacher.findOne({ userId: req.user.userId });
    if (!teacher) {
      console.log(`[EnhancedAuth] Teacher profile not found for userId: ${req.user.userId}`);
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    // Use the enhanced teacher subject service to check if the teacher is authorized
    const isAuthorized = await enhancedTeacherSubjectService.isTeacherAuthorizedForSubject(
      teacher._id, classId, subjectId
    );

    if (!isAuthorized) {
      console.log(`[EnhancedAuth] Teacher ${teacher._id} is not authorized to access subject ${subjectId} in class ${classId}`);
      return res.status(403).json({
        message: 'You are not authorized to access this subject',
        details: 'You must be assigned to teach this subject in this class to access it.'
      });
    }

    // Add teacher ID to request for convenience in route handlers
    req.teacherId = teacher._id;
    console.log(`[EnhancedAuth] Teacher ${teacher._id} is authorized to access subject ${subjectId} in class ${classId}`);
    next();
  } catch (error) {
    console.error('[EnhancedAuth] Error in authorizeTeacherForSubject middleware:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
};

/**
 * Middleware to check if a teacher is authorized to access a specific class
 * Enhanced version that treats O-Level classes the same as A-Level classes
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authorizeTeacherForClass = async (req, res, next) => {
  try {
    console.log('[EnhancedAuth] Authorizing teacher for class access...');

    // If user is admin, allow access
    if (req.user.role === 'admin') {
      console.log('[EnhancedAuth] User is admin, granting class access');
      return next();
    }

    // Check if user is a teacher
    if (req.user.role !== 'teacher') {
      console.log('[EnhancedAuth] User is not a teacher or admin, denying class access');
      return res.status(403).json({ message: 'Only teachers and admins can access this resource' });
    }

    // Get class ID from params, query, or body
    const classId = req.params.classId || req.query.classId || req.body.classId;
    if (!classId) {
      console.error(`[EnhancedAuth][${new Date().toISOString()}] Missing classId in request (Endpoint: ${req.originalUrl}, Method: ${req.method})`);
    }

    // Find the teacher by userId
    const teacher = await Teacher.findOne({ userId: req.user.userId });
    if (!teacher) {
      console.log(`[EnhancedAuth] Teacher profile not found for userId: ${req.user.userId}`);
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    // Use the enhanced teacher subject service to check if the teacher is authorized
    const isAuthorized = await enhancedTeacherSubjectService.isTeacherAuthorizedForClass(
      teacher._id, classId
    );

    if (!isAuthorized) {
      console.log(`[EnhancedAuth] Teacher ${teacher._id} is not authorized to access class ${classId}`);
      return res.status(403).json({
        message: 'You are not authorized to access this class',
        details: 'You must be assigned to teach at least one subject in this class to access it.'
      });
    }

    // Add teacher ID to request for convenience in route handlers
    req.teacherId = teacher._id;
    console.log(`[EnhancedAuth] Teacher ${teacher._id} is authorized to access class ${classId}`);
    next();
  } catch (error) {
    console.error('[EnhancedAuth] Error in authorizeTeacherForClass middleware:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
};

module.exports = {
  authenticateToken,
  authorizeRole,
  authorizeTeacherForSubject,
  authorizeTeacherForClass
};
