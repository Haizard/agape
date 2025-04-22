/**
 * Middleware to check if a student or class has the correct education level
 * for the requested operation.
 */

const Student = require('../models/Student');
const Class = require('../models/Class');
const logger = require('../utils/logger');

/**
 * Check if a student has the specified education level
 * @param {string} requiredLevel - The required education level (e.g., 'A_LEVEL')
 * @returns {Function} - Express middleware function
 */
const checkStudentEducationLevel = (requiredLevel) => {
  return async (req, res, next) => {
    try {
      const studentId = req.params.studentId || req.body.studentId;

      if (!studentId) {
        return res.status(400).json({
          error: 'Student ID is required',
          message: 'Student ID is required for this operation'
        });
      }

      // Find the student
      const student = await Student.findById(studentId);

      if (!student) {
        return res.status(404).json({
          error: 'Student not found',
          message: 'The specified student could not be found'
        });
      }

      // Check education level
      if (student.educationLevel !== requiredLevel) {
        logger.info(`Education level mismatch: Student ${studentId} has ${student.educationLevel} but ${requiredLevel} is required`);

        return res.status(400).json({
          error: 'Education level mismatch',
          message: `This student cannot be processed as a ${requiredLevel.replace('_', '-')} student`,
          educationLevel: student.educationLevel,
          suggestion: `Please update the student's education level to ${requiredLevel} or use the appropriate endpoint for ${student.educationLevel} students`
        });
      }

      // Add student to request for later use
      req.student = student;
      next();
    } catch (err) {
      logger.error(`Error in education level check: ${err.message}`, err);
      return res.status(500).json({
        error: 'Server error',
        message: 'An error occurred while checking student education level'
      });
    }
  };
};

/**
 * Check if a class has the specified education level
 * @param {string} requiredLevel - The required education level (e.g., 'A_LEVEL')
 * @returns {Function} - Express middleware function
 */
const checkClassEducationLevel = (requiredLevel) => {
  return async (req, res, next) => {
    try {
      const classId = req.params.classId || req.body.classId;

      if (!classId) {
        return res.status(400).json({
          error: 'Class ID is required',
          message: 'Class ID is required for this operation'
        });
      }

      // Find the class
      const classObj = await Class.findById(classId);

      if (!classObj) {
        return res.status(404).json({
          error: 'Class not found',
          message: 'The specified class could not be found'
        });
      }

      // Check education level
      if (classObj.educationLevel !== requiredLevel) {
        logger.info(`Education level mismatch: Class ${classId} has ${classObj.educationLevel} but ${requiredLevel} is required`);

        return res.status(400).json({
          error: 'Education level mismatch',
          message: `This class is not marked as an ${requiredLevel.replace('_', '-')} class`,
          educationLevel: classObj.educationLevel,
          suggestion: `Please update the class education level to ${requiredLevel} or use the appropriate endpoint for ${classObj.educationLevel} classes`
        });
      }

      // Add class to request for later use
      req.class = classObj;
      next();
    } catch (err) {
      logger.error(`Error in education level check: ${err.message}`, err);
      return res.status(500).json({
        error: 'Server error',
        message: 'An error occurred while checking class education level'
      });
    }
  };
};

module.exports = {
  checkStudentEducationLevel,
  checkClassEducationLevel
};
