/**
 * Middleware to check if a teacher has subject assignments
 * and provide fallback options if needed.
 */

const TeacherSubject = require('../models/TeacherSubject');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const logger = require('../utils/logger');

/**
 * Check if a teacher has subject assignments for a class
 * @param {boolean} allowFallback - Whether to allow fallback to all subjects if no assignments found
 * @returns {Function} - Express middleware function
 */
const checkTeacherSubjectAssignments = (allowFallback = true) => {
  return async (req, res, next) => {
    try {
      // Get teacher ID and class ID from request
      const teacherId = req.query.teacherId || req.params.teacherId || (req.user ? req.user.userId : null);
      const classId = req.query.classId || req.params.classId || req.body.classId;
      
      // If no teacher ID or class ID, skip this middleware
      if (!teacherId || !classId) {
        logger.debug(`No teacherId (${teacherId}) or classId (${classId}) found, skipping teacher-subject check`);
        return next();
      }
      
      // Find the teacher
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        logger.warn(`Teacher not found with ID: ${teacherId}`);
        return res.status(404).json({
          success: false,
          message: 'Teacher not found',
          error: 'TEACHER_NOT_FOUND'
        });
      }
      
      // Find the class
      const classObj = await Class.findById(classId);
      if (!classObj) {
        logger.warn(`Class not found with ID: ${classId}`);
        return res.status(404).json({
          success: false,
          message: 'Class not found',
          error: 'CLASS_NOT_FOUND'
        });
      }
      
      // Check if the teacher has subject assignments for this class
      const teacherSubjects = await TeacherSubject.find({
        teacherId,
        classId,
        status: 'active'
      }).populate('subjectId', 'name code type');
      
      logger.debug(`Found ${teacherSubjects.length} subject assignments for teacher ${teacherId} in class ${classId}`);
      
      // If no assignments found and fallback is allowed, get all subjects for the class
      if (teacherSubjects.length === 0 && allowFallback) {
        logger.info(`No subject assignments found for teacher ${teacherId} in class ${classId}, using fallback`);
        
        // Get all subjects for the class
        const subjects = await Subject.find({
          educationLevel: classObj.educationLevel
        });
        
        // Add subjects to request
        req.teacherSubjects = subjects;
        req.usingFallback = true;
        
        logger.debug(`Using fallback with ${subjects.length} subjects for class ${classId}`);
        return next();
      }
      
      // Add subjects to request
      req.teacherSubjects = teacherSubjects.map(ts => ts.subjectId);
      req.usingFallback = false;
      
      next();
    } catch (err) {
      logger.error(`Error in teacher-subject check: ${err.message}`);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while checking teacher-subject assignments',
        error: err.message
      });
    }
  };
};

module.exports = {
  checkTeacherSubjectAssignments
};
