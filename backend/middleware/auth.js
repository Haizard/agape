const jwt = require('jsonwebtoken');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const mongoose = require('mongoose');

const authenticateToken = (req, res, next) => {
  console.log('Authenticating token...');
  console.log('Request path:', req.path);
  console.log('Request method:', req.method);

  // Check for token in authorization header
  const authHeader = req.headers.authorization || req.headers.Authorization;
  console.log('Auth header:', authHeader ? 'Present' : 'Not present');

  // Check for token in query parameters (for PDF downloads)
  const queryToken = req.query.token;
  console.log('Query token:', queryToken ? 'Present' : 'Not present');

  // Get token from header or query parameter
  let token;
  if (authHeader) {
    token = authHeader.split(' ')[1];
  } else if (queryToken) {
    token = queryToken;
  }

  if (!token) {
    console.log('No token found in auth header or query parameters');

    // For development or specific endpoints, allow access without token
    if (process.env.NODE_ENV !== 'production' ||
        (req.path === '/classes' && req.method === 'GET')) {
      console.log('Allowing access without token for development or specific endpoint');
      req.user = { role: 'guest' };
      return next();
    }

    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    // Use a consistent JWT secret key with a fallback
    const jwtSecret = process.env.JWT_SECRET || 'kjjf6565i87utgfu64erd';
    console.log('Using JWT secret:', jwtSecret ? 'Secret is set' : 'Using fallback secret');
    console.log('JWT_SECRET from env:', process.env.JWT_SECRET);

    const decoded = jwt.verify(token, jwtSecret);
    console.log('Token verified successfully for user:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);

    // For development, allow access even with invalid token
    if (process.env.NODE_ENV !== 'production') {
      console.log('Allowing access with invalid token for development');
      req.user = { role: 'guest' };
      return next();
    }

    return res.status(403).json({ message: 'Invalid token' });
  }
};

const authorizeRole = (requiredRoles) => {
  return (req, res, next) => {
    console.log('Authorizing role...');
    console.log('User:', req.user);
    console.log('Required roles:', requiredRoles);

    // Convert to array if a single role is provided
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

    // Check if user and role exist
    if (!req.user) {
      console.log('User not found in request');
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!req.user.role) {
      console.log('User role not found in request');
      return res.status(403).json({ message: 'Unauthorized: User role not found' });
    }

    // Special case for admin2 user - always grant admin access
    if (req.user.username === 'admin2') {
      console.log('Special case: admin2 user detected, granting admin access');
      console.log('Authorization successful for admin2 user');
      next();
      return;
    }

    // Normalize roles for case-insensitive comparison
    const userRole = req.user.role.toLowerCase();
    const normalizedRoles = roles.map(role => role.toLowerCase());

    console.log(`User role (normalized): ${userRole}`);
    console.log(`Required roles (normalized): ${normalizedRoles.join(', ')}`);

    // Check if user's role is in the required roles
    if (!normalizedRoles.includes(userRole)) {
      console.log(`User role ${userRole} not in required roles: ${normalizedRoles.join(', ')}`);
      return res.status(403).json({
        message: `Unauthorized: Required role(s): ${roles.join(', ')}, your role: ${req.user.role}`
      });
    }

    console.log('Authorization successful for role:', req.user.role);
    next();
  };
};

// Middleware to check if a teacher is authorized to access a specific subject
const authorizeTeacherForSubject = async (req, res, next) => {
  try {
    console.log('Authorizing teacher for subject access...');

    // If user is admin, allow access
    if (req.user.role === 'admin') {
      console.log('User is admin, granting subject access');
      return next();
    }

    // Check if user is a teacher
    if (req.user.role !== 'teacher') {
      console.log('User is not a teacher or admin, denying subject access');
      return res.status(403).json({ message: 'Only teachers and admins can access this resource' });
    }

    const { subjectId } = req.params;
    if (!subjectId) {
      console.log('No subjectId provided in request parameters');
      return res.status(400).json({ message: 'Subject ID is required' });
    }

    // Find the teacher by userId
    const teacher = await Teacher.findOne({ userId: req.user.userId });
    if (!teacher) {
      console.log(`Teacher profile not found for userId: ${req.user.userId}`);
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    // Check if teacher is assigned to this subject
    const isAssigned = teacher.subjects?.some(subject =>
      subject.toString() === subjectId
    ) || false;

    if (!isAssigned) {
      console.log(`Teacher ${teacher._id} is not assigned to subject ${subjectId}`);
      return res.status(403).json({
        message: 'You are not authorized to access this subject',
        details: 'You must be assigned to teach this subject to access it.'
      });
    }

    // Add teacher ID to request for convenience in route handlers
    req.teacherId = teacher._id;
    console.log(`Teacher ${teacher._id} is authorized to access subject ${subjectId}`);
    next();
  } catch (error) {
    console.error('Error in authorizeTeacherForSubject middleware:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
};

// Middleware to check if a teacher is authorized to access a specific class
const authorizeTeacherForClass = async (req, res, next) => {
  try {
    console.log('Authorizing teacher for class access...');

    // If user is admin, allow access
    if (req.user.role === 'admin') {
      console.log('User is admin, granting class access');
      return next();
    }

    // Check if user is a teacher
    if (req.user.role !== 'teacher') {
      console.log('User is not a teacher or admin, denying class access');
      return res.status(403).json({ message: 'Only teachers and admins can access this resource' });
    }

    const { classId } = req.params;
    if (!classId) {
      console.log('No classId provided in request parameters');
      return res.status(400).json({ message: 'Class ID is required' });
    }

    // Find the teacher by userId
    const teacher = await Teacher.findOne({ userId: req.user.userId });
    if (!teacher) {
      console.log(`Teacher profile not found for userId: ${req.user.userId}`);
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    // Check if teacher is assigned to this class
    const classItem = await Class.findById(classId).populate('subjects.subject');
    if (!classItem) {
      console.log(`Class not found with ID: ${classId}`);
      return res.status(404).json({ message: 'Class not found' });
    }

    const isTeacherAssigned = classItem.subjects?.some(subject =>
      subject.teacher && subject.teacher.toString() === teacher._id.toString()
    ) || false;

    if (!isTeacherAssigned) {
      console.log(`Teacher ${teacher._id} is not assigned to class ${classId}`);
      return res.status(403).json({
        message: 'You are not authorized to access this class',
        details: 'You must be assigned to teach at least one subject in this class to access it.'
      });
    }

    // Add teacher ID and assigned subjects to request for convenience in route handlers
    req.teacherId = teacher._id;

    // Get the subjects this teacher teaches in this class
    req.teacherSubjects = classItem.subjects
      .filter(subject => subject.teacher && subject.teacher.toString() === teacher._id.toString())
      .map(subject => ({
        id: subject.subject?._id || subject.subject,
        code: subject.subject?.code || 'Unknown',
        name: subject.subject?.name || 'Unknown Subject'
      }));

    console.log(`Teacher ${teacher._id} is authorized to access class ${classId}`);
    console.log('Teacher is assigned to subjects:', req.teacherSubjects);

    next();
  } catch (error) {
    console.error('Error in authorizeTeacherForClass middleware:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
};

// Middleware to check if a teacher is authorized to view reports for a specific class
const authorizeTeacherForReports = async (req, res, next) => {
  try {
    console.log('Authorizing teacher for reports access...');

    // If user is admin, allow access
    if (req.user.role === 'admin') {
      console.log('User is admin, granting report access');
      return next();
    }

    // Check if user is a teacher
    if (req.user.role !== 'teacher') {
      console.log('User is not a teacher or admin, denying report access');
      return res.status(403).json({ message: 'Only teachers and admins can access reports' });
    }

    const { classId } = req.params;
    if (!classId) {
      console.log('No classId provided in request parameters');
      return res.status(400).json({ message: 'Class ID is required' });
    }

    // Find the teacher by userId
    const teacher = await Teacher.findOne({ userId: req.user.userId });
    if (!teacher) {
      console.log(`Teacher profile not found for userId: ${req.user.userId}`);
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    // Check if teacher is assigned to this class
    const classItem = await Class.findById(classId).populate('subjects.subject');
    if (!classItem) {
      console.log(`Class not found with ID: ${classId}`);
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check if teacher is assigned to any subject in this class
    const isTeacherAssigned = classItem.subjects.some(subject =>
      subject.teacher && subject.teacher.toString() === teacher._id.toString()
    );

    if (!isTeacherAssigned) {
      console.log(`Teacher ${teacher._id} is not assigned to class ${classId}`);
      return res.status(403).json({
        message: 'You are not authorized to view reports for this class',
        details: 'You must be assigned to teach at least one subject in this class to view reports.'
      });
    }

    // Add teacher ID and assigned subjects to request for convenience in route handlers
    req.teacherId = teacher._id;

    // Get the subjects this teacher teaches in this class
    req.teacherSubjects = classItem.subjects
      .filter(subject => subject.teacher && subject.teacher.toString() === teacher._id.toString())
      .map(subject => ({
        id: subject.subject._id,
        code: subject.subject.code,
        name: subject.subject.name
      }));

    console.log(`Teacher ${teacher._id} is authorized to view reports for class ${classId}`);
    console.log('Teacher is assigned to subjects:', req.teacherSubjects);

    next();
  } catch (error) {
    console.error('Error in authorizeTeacherForReports middleware:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
};

module.exports = {
  authenticateToken,
  authorizeRole,
  authorizeTeacherForSubject,
  authorizeTeacherForClass,
  authorizeTeacherForReports
};
