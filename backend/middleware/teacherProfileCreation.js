/**
 * Teacher Profile Creation Middleware
 *
 * This middleware handles automatic teacher profile creation during user registration
 * and ensures proper linking between user accounts and teacher profiles.
 */

const Teacher = require('../models/Teacher');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Create a teacher profile for a newly registered user
 * @param {Object} userData - User registration data
 * @param {mongoose.ClientSession} session - Mongoose session for transaction
 * @returns {Object} Created teacher profile
 */
async function createTeacherProfile(userData, session) {
  const {
    username,
    email,
    firstName,
    lastName,
    contactNumber,
    qualification = 'Teacher',
    experience = '1 year',
    subjects = [],
    userId
  } = userData;

  // Generate a unique employee ID
  const employeeId = await generateUniqueEmployeeId();

  // Create the teacher profile
  const teacher = new Teacher({
    userId,
    firstName: firstName || username.split('.')[0],
    lastName: lastName || username.split('.')[1] || username,
    email,
    contactNumber,
    qualification,
    experience,
    employeeId,
    subjects,
    status: 'active'
  });

  return await teacher.save({ session });
}

/**
 * Generate a unique employee ID
 * @returns {string} Unique employee ID
 */
async function generateUniqueEmployeeId() {
  const prefix = 'TCH';
  let counter = 1;
  let employeeId;
  let isUnique = false;

  while (!isUnique) {
    employeeId = `${prefix}${counter.toString().padStart(3, '0')}`;
    const existingTeacher = await Teacher.findOne({ employeeId });
    if (!existingTeacher) {
      isUnique = true;
    } else {
      counter++;
    }
  }

  return employeeId;
}

/**
 * Middleware to ensure teacher profile creation during registration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const ensureTeacherProfileCreation = async (req, res, next) => {
  // Only proceed for teacher role
  if (req.body.role !== 'teacher') {
    return next();
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Create teacher profile
    const teacherProfile = await createTeacherProfile({
      ...req.body,
      userId: req.user.userId // Set by previous middleware after user creation
    }, session);

    // Attach the created profile to the request
    req.teacherProfile = teacherProfile;

    await session.commitTransaction();
    next();
  } catch (error) {
    await session.abortTransaction();
    console.error('Error creating teacher profile:', error);
    res.status(500).json({
      message: 'Failed to create teacher profile',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

/**
 * Middleware to validate teacher profile data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateTeacherProfileData = (req, res, next) => {
  if (req.body.role !== 'teacher') {
    return next();
  }

  const { email, firstName, lastName } = req.body;

  if (!email) {
    return res.status(400).json({
      message: 'Email is required for teacher profile'
    });
  }

  if (!firstName || !lastName) {
    // Try to extract from username if not provided
    const nameParts = req.body.username.split('.');
    if (nameParts.length < 2) {
      return res.status(400).json({
        message: 'First name and last name are required for teacher profile'
      });
    }
    req.body.firstName = firstName || nameParts[0];
    req.body.lastName = lastName || nameParts[1];
  }

  next();
};

module.exports = {
  ensureTeacherProfileCreation,
  validateTeacherProfileData,
  createTeacherProfile
};