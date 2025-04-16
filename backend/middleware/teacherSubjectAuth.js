/**
 * Middleware for enforcing teacher subject restrictions
 * 
 * This middleware ensures that teachers can only access subjects they are assigned to teach.
 * It works by checking the request parameters and query strings for subject IDs and validating
 * that the teacher is authorized to access those subjects.
 */

const teacherSubjectService = require('../services/teacherSubjectService');
const Teacher = require('../models/Teacher');

/**
 * Middleware to enforce teacher subject restrictions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const enforceTeacherSubjectRestrictions = async (req, res, next) => {
  try {
    // Skip for admin users
    if (req.user && req.user.role === 'admin') {
      return next();
    }

    // Get the teacher ID from the user
    const userId = req.user.userId;
    if (!userId) {
      console.log('[TeacherSubjectAuth] No userId found in token');
      return res.status(401).json({ message: 'Unauthorized - Invalid user token' });
    }

    // Find the teacher
    const teacher = await Teacher.findOne({ userId });
    if (!teacher) {
      console.log('[TeacherSubjectAuth] No teacher found for userId:', userId);
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    // Get the class ID and subject ID from the request
    const classId = req.params.classId || req.query.classId || req.body.classId;
    const subjectId = req.params.subjectId || req.query.subjectId || req.body.subjectId;

    // If no class ID or subject ID, skip the check
    if (!classId || !subjectId) {
      return next();
    }

    console.log(`[TeacherSubjectAuth] Checking if teacher ${teacher._id} is authorized to access subject ${subjectId} in class ${classId}`);

    // Check if the teacher is authorized to access the subject
    const isAuthorized = await teacherSubjectService.isTeacherAuthorizedForSubject(teacher._id, classId, subjectId);
    
    if (!isAuthorized) {
      console.log(`[TeacherSubjectAuth] Teacher ${teacher._id} is not authorized to access subject ${subjectId} in class ${classId}`);
      return res.status(403).json({ message: 'You are not authorized to access this subject' });
    }

    console.log(`[TeacherSubjectAuth] Teacher ${teacher._id} is authorized to access subject ${subjectId} in class ${classId}`);
    next();
  } catch (error) {
    console.error('[TeacherSubjectAuth] Error enforcing teacher subject restrictions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  enforceTeacherSubjectRestrictions
};
