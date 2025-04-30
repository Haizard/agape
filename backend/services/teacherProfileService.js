/**
 * Teacher Profile Service
 *
 * This service handles teacher profile management and synchronization,
 * ensuring consistency between user accounts and teacher profiles.
 */

const Teacher = require('../models/Teacher');
const User = require('../models/User');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

class TeacherProfileService {
  /**
   * Create a teacher profile with user account
   * @param {Object} teacherData - Teacher profile data
   * @returns {Object} Created teacher profile and user account
   */
  async createTeacherWithUser(teacherData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const {
        username,
        email,
        password,
        firstName,
        lastName,
        contactNumber,
        qualification,
        experience,
        subjects
      } = teacherData;

      // Create user account
      const user = new User({
        username,
        email,
        password,
        role: 'teacher'
      });

      const savedUser = await user.save({ session });

      // Generate employee ID
      const employeeId = await this.generateUniqueEmployeeId();

      // Create teacher profile
      const teacher = new Teacher({
        userId: savedUser._id,
        firstName,
        lastName,
        email,
        contactNumber,
        qualification,
        experience,
        employeeId,
        subjects,
        status: 'active'
      });

      const savedTeacher = await teacher.save({ session });

      await session.commitTransaction();

      return {
        user: savedUser,
        teacher: savedTeacher
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Generate a unique employee ID
   * @returns {string} Unique employee ID
   */
  async generateUniqueEmployeeId() {
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
   * Sync teacher profile with user account
   * @param {string} userId - User ID
   * @returns {Object} Updated teacher profile
   */
  async syncTeacherProfile(userId) {
    const user = await User.findById(userId);
    if (!user || user.role !== 'teacher') {
      throw new Error('Invalid user or not a teacher');
    }

    let teacher = await Teacher.findOne({ userId });

    if (!teacher) {
      // Create new teacher profile
      const nameParts = user.username.split('.');
      const employeeId = await this.generateUniqueEmployeeId();

      teacher = new Teacher({
        userId,
        firstName: nameParts[0] || 'Teacher',
        lastName: nameParts[1] || user.username,
        email: user.email,
        employeeId,
        status: 'active'
      });

      await teacher.save();
      logger.info(`Created new teacher profile for user ${userId}`);
    } else {
      // Update existing profile
      teacher.email = user.email;
      await teacher.save();
      logger.info(`Updated teacher profile for user ${userId}`);
    }

    return teacher;
  }

  /**
   * Update teacher profile
   * @param {string} teacherId - Teacher ID
   * @param {Object} updateData - Update data
   * @returns {Object} Updated teacher profile
   */
  async updateTeacherProfile(teacherId, updateData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        throw new Error('Teacher not found');
      }

      // Update email in user account if it's being changed
      if (updateData.email && updateData.email !== teacher.email) {
        await User.findByIdAndUpdate(
          teacher.userId,
          { email: updateData.email },
          { session }
        );
      }

      // Update teacher profile
      Object.assign(teacher, updateData);
      const updatedTeacher = await teacher.save({ session });

      await session.commitTransaction();
      return updatedTeacher;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get teacher profile with user details
   * @param {string} teacherId - Teacher ID
   * @returns {Object} Teacher profile with user details
   */
  async getTeacherWithUser(teacherId) {
    const teacher = await Teacher.findById(teacherId)
      .populate('userId', 'username email role')
      .populate('subjects', 'name code');

    if (!teacher) {
      throw new Error('Teacher not found');
    }

    return teacher;
  }

  /**
   * Fix missing teacher profiles
   * @returns {Object} Fix results
   */
  async fixMissingTeacherProfiles() {
    const results = {
      processed: 0,
      created: 0,
      errors: []
    };

    const teacherUsers = await User.find({ role: 'teacher' });

    for (const user of teacherUsers) {
      try {
        results.processed++;
        const existingProfile = await Teacher.findOne({ userId: user._id });

        if (!existingProfile) {
          await this.syncTeacherProfile(user._id);
          results.created++;
        }
      } catch (error) {
        results.errors.push({
          userId: user._id,
          error: error.message
        });
      }
    }

    return results;
  }
}

module.exports = new TeacherProfileService();