const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const studentService = require('./studentService');
const bcrypt = require('bcrypt');

/**
 * Create a user with the appropriate profile based on role
 * @param {Object} userData - User data including role-specific information
 * @returns {Object} Created user and profile
 */
const createUserWithProfile = async (userData) => {
  console.log('Creating user with profile:', userData);

  // Start a session for transaction
  const mongoose = require('mongoose');
  const session = await mongoose.startSession();
  session.startTransaction();

  // Declare savedUser outside the try block so it's accessible in the catch block
  let savedUser = null;

  try {
    // Extract common user data
    const {
      username,
      email,
      password,
      role,
      status = 'active',
      ...profileData
    } = userData;

    // Validate required fields
    if (!username || !email || !password || !role) {
      throw new Error('Username, email, password, and role are required');
    }

    // Check if username or email already exists
    const existingUser = await User.findOne({
      $or: [
        { username },
        { email }
      ]
    });

    if (existingUser) {
      throw new Error(`User with this ${existingUser.username === username ? 'username' : 'email'} already exists`);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      role,
      status
    });

    const savedUser = await user.save({ session });
    console.log(`Created user: ${savedUser._id} with role: ${role}`);

    let profile = null;

    // Create role-specific profile
    try {
      switch (role) {
        case 'teacher':
          profile = await createTeacherProfile(savedUser._id, profileData, session);
          break;
        case 'student':
          console.log(`Creating student profile for user: ${savedUser._id}`);
          // Use the new studentService instead of the local function
          profile = await studentService.createStudentProfile({
            userId: savedUser._id,
            ...profileData
          }, session);
          break;
        case 'admin':
          // Admin doesn't need a separate profile
          profile = { message: 'Admin users do not require a separate profile' };
          break;
        default:
          throw new Error(`Unsupported role: ${role}`);
      }
    } catch (profileError) {
      console.error(`Error creating profile for ${role}:`, profileError);
      // Re-throw the error to be caught by the outer try-catch
      throw new Error(`Failed to create ${role} profile: ${profileError.message}`);
    }

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // Return the created user and profile
    return {
      user: {
        _id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
        role: savedUser.role,
        status: savedUser.status
      },
      profile
    };
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    session.endSession();

    // Log detailed error information
    console.error('Error creating user with profile:', error);
    console.error('Error stack:', error.stack);

    // Check if we need to clean up the user if profile creation failed
    if (error?.message?.includes('Failed to create') && savedUser) {
      try {
        console.log(`Cleaning up user ${savedUser._id} due to profile creation failure`);
        await User.findByIdAndDelete(savedUser._id);
      } catch (cleanupError) {
        console.error('Error cleaning up user after failed profile creation:', cleanupError);
      }
    }

    // Throw a more descriptive error
    throw new Error(`Registration failed: ${error.message}`);
  }
};

/**
 * Create a teacher profile for a user
 * @param {string} userId - User ID
 * @param {Object} teacherData - Teacher profile data
 * @param {Object} session - Mongoose session
 * @returns {Object} Created teacher profile
 */
const createTeacherProfile = async (userId, teacherData, session) => {
  console.log('Creating teacher profile for user:', userId);

  // Extract teacher-specific data
  const {
    firstName,
    lastName,
    contactNumber,
    employeeId,
    ...otherData
  } = teacherData;

  // Validate required fields
  if (!firstName || !lastName || !contactNumber) {
    throw new Error('First name, last name, and contact number are required for teacher profiles');
  }

  // Get user email
  const user = await User.findById(userId).select('email');

  // Create teacher profile
  const teacher = new Teacher({
    userId,
    firstName,
    lastName,
    email: user.email,
    contactNumber,
    employeeId: employeeId || user.username,
    status: 'active',
    ...otherData
  });

  const savedTeacher = await teacher.save({ session });
  console.log(`Created teacher profile: ${savedTeacher._id} for user: ${userId}`);

  return savedTeacher;
};

/**
 * Create a student profile for a user
 * @param {string} userId - User ID
 * @param {Object} studentData - Student profile data
 * @param {Object} session - Mongoose session
 * @returns {Object} Created student profile
 */
const createStudentProfile = async (userId, studentData, session) => {
  console.log('Creating student profile for user:', userId);

  // Extract student-specific data
  const {
    firstName,
    lastName,
    dateOfBirth,
    gender,
    classId,
    admissionNumber,
    ...otherData
  } = studentData;

  // Validate required fields
  if (!firstName || !lastName || !classId) {
    throw new Error('First name, last name, and class ID are required for student profiles');
  }

  // Get user email and username
  const user = await User.findById(userId).select('email username');

  if (!user) {
    throw new Error(`User not found with ID: ${userId}`);
  }

  console.log(`Found user for student profile: ${user._id}, email: ${user.email || 'no email'}, username: ${user.username}`);

  // Determine admission number (use provided one, username, or generate one)
  const finalAdmissionNumber = admissionNumber || user.username || `STU-${Date.now().toString().slice(-6)}`;

  console.log(`Using admission number: ${finalAdmissionNumber} for student profile`);

  // Create student profile
  const student = new Student({
    userId,
    firstName,
    lastName,
    email: user.email || '',  // Handle case where email might be undefined
    dateOfBirth: dateOfBirth || null,
    gender: gender || 'male',
    class: classId,
    admissionNumber: finalAdmissionNumber,
    status: 'active',
    ...otherData
  });

  console.log('Student profile data:', {
    userId,
    firstName,
    lastName,
    email: user.email || '',
    dateOfBirth: dateOfBirth || null,
    gender: gender || 'male',
    classId,
    admissionNumber: finalAdmissionNumber
  });

  const savedStudent = await student.save({ session });
  console.log(`Created student profile: ${savedStudent._id} for user: ${userId}`);

  return savedStudent;
};

module.exports = {
  createUserWithProfile
};
