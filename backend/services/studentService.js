/**
 * Student Service
 *
 * This service handles all operations related to student profiles.
 */
const mongoose = require('mongoose');
const Student = require('../models/Student');
const User = require('../models/User');

/**
 * Create a student profile
 * @param {Object} userData - User data including profile information
 * @param {Object} session - Mongoose session for transaction
 * @returns {Object} Created student profile
 */
const createStudentProfile = async (userData, session) => {
  try {
    const {
      userId,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      classId,
      admissionNumber,
      email,
      ...otherData
    } = userData;

    console.log('Creating student profile with data:', {
      userId,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      classId,
      admissionNumber
    });

    // Validate required fields
    if (!userId) {
      throw new Error('User ID is required to create a student profile');
    }

    if (!firstName || !lastName) {
      throw new Error('First name and last name are required for student profiles');
    }

    if (!classId) {
      throw new Error('Class ID is required for student profiles');
    }

    // Get user information if needed
    const user = await User.findById(userId).select('email username');
    if (!user) {
      throw new Error(`User not found with ID: ${userId}`);
    }

    // Determine admission number (use provided one, username, or generate one)
    let finalAdmissionNumber = admissionNumber;

    if (!finalAdmissionNumber) {
      // Generate a unique admission number
      finalAdmissionNumber = user.username || `STU-${Date.now().toString().slice(-6)}`;
      console.log(`Generated admission number: ${finalAdmissionNumber}`);
    }

    // Create student profile
    const studentData = {
      userId,
      firstName,
      lastName,
      email: email || user.email || '',
      dateOfBirth: dateOfBirth || null,
      gender: gender || 'male',
      class: classId,
      admissionNumber: finalAdmissionNumber,
      status: 'active',
      ...otherData
    };

    console.log('Final student data:', studentData);

    const student = new Student(studentData);
    const savedStudent = await student.save({ session });

    console.log(`Created student profile: ${savedStudent._id} for user: ${userId}`);
    return savedStudent;
  } catch (error) {
    console.error('Error creating student profile:', error);
    throw error;
  }
};

/**
 * Get student profile by user ID
 * @param {string} userId - User ID
 * @returns {Object} Student profile
 */
const getStudentProfileByUserId = async (userId) => {
  try {
    const student = await Student.findOne({ userId }).populate('class');
    return student;
  } catch (error) {
    console.error('Error getting student profile:', error);
    throw error;
  }
};

/**
 * Update student profile
 * @param {string} studentId - Student ID
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated student profile
 */
const updateStudentProfile = async (studentId, updateData) => {
  try {
    const student = await Student.findByIdAndUpdate(
      studentId,
      updateData,
      { new: true, runValidators: true }
    );
    return student;
  } catch (error) {
    console.error('Error updating student profile:', error);
    throw error;
  }
};

module.exports = {
  createStudentProfile,
  getStudentProfileByUserId,
  updateStudentProfile
};
