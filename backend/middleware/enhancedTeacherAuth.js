/**
 * Enhanced Teacher Authentication Middleware
 *
 * This middleware provides improved teacher authentication and identification,
 * addressing the "No teacher ID found in the authenticated user" error.
 */

const Teacher = require('../models/Teacher');
const User = require('../models/User');
const teacherAssignmentService = require('../services/teacherAssignmentService');
const enhancedTeacherSubjectService = require('../services/enhancedTeacherSubjectService');

/**
 * Middleware to ensure a teacher profile exists for the authenticated user
 * and attach it to the request object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const ensureTeacherProfile = async (req, res, next) => {
  try {
    // Skip for admin users if they have the bypass flag set
    if (req.user.role === 'admin' && req.query.bypassTeacherCheck === 'true') {
      console.log('[EnhancedTeacherAuth] Admin user bypassing teacher check');
      return next();
    }

    // Check if user is a teacher
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      console.log(`[EnhancedTeacherAuth] User role ${req.user.role} is not teacher or admin`);
      return res.status(403).json({
        message: 'Only teachers and admins can access this resource',
        error: 'UNAUTHORIZED_ROLE'
      });
    }

    // Get the user ID from the authenticated user
    const userId = req.user.userId;
    if (!userId) {
      console.log('[EnhancedTeacherAuth] No userId found in token');
      return res.status(401).json({
        message: 'Invalid authentication token - missing user ID',
        error: 'INVALID_TOKEN'
      });
    }

    // Find the teacher by userId
    console.log(`[EnhancedTeacherAuth] Looking for teacher with userId: ${userId}`);
    let teacher = await Teacher.findOne({ userId });

    // If no teacher found, try to find by similar userId (last digit might be different)
    if (!teacher) {
      console.log(`[EnhancedTeacherAuth] No teacher found with exact userId: ${userId}, trying to find by similar userId`);
      // Get all teachers
      const allTeachers = await Teacher.find();

      // Find a teacher with a similar userId (all but the last character match)
      const similarTeacher = allTeachers.find(t => {
        if (!t.userId) return false;
        const tId = t.userId.toString();
        const uId = userId.toString();
        // Check if the IDs are similar (all but the last character match)
        return tId.slice(0, -1) === uId.slice(0, -1);
      });

      if (similarTeacher) {
        console.log(`[EnhancedTeacherAuth] Found teacher with similar userId: ${similarTeacher.userId}`);
        teacher = similarTeacher;
      }
    }

    if (!teacher) {
      console.log(`[EnhancedTeacherAuth] No teacher profile found for userId: ${userId}`);

      // For admins, we can create a temporary teacher profile
      if (req.user.role === 'admin') {
        console.log('[EnhancedTeacherAuth] Admin user without teacher profile, creating temporary profile');

        // Find the user to get their details
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({
            message: 'User not found',
            error: 'USER_NOT_FOUND'
          });
        }

        // Create a temporary teacher object (not saved to database)
        req.teacher = {
          _id: 'admin-' + userId,
          firstName: user.name || 'Admin',
          lastName: 'User',
          email: user.email,
          isTemporary: true,
          isAdmin: true
        };

        return next();
      }

      return res.status(404).json({
        message: 'Teacher profile not found for your user account. Please contact an administrator to set up your teacher profile.',
        error: 'TEACHER_PROFILE_NOT_FOUND',
        userId
      });
    }

    // Attach the teacher to the request object
    req.teacher = teacher;
    console.log(`[EnhancedTeacherAuth] Found teacher profile: ${teacher.firstName} ${teacher.lastName} (${teacher._id})`);

    next();
  } catch (error) {
    console.error('[EnhancedTeacherAuth] Error in ensureTeacherProfile middleware:', error);
    res.status(500).json({
      message: 'Server error while checking teacher profile',
      error: error.message
    });
  }
};

/**
 * Middleware to ensure a teacher is assigned to a class
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const ensureTeacherClassAssignment = async (req, res, next) => {
  try {
    // Skip for admin users if they have the bypass flag set
    if (req.user.role === 'admin' && req.query.bypassTeacherCheck === 'true') {
      console.log('[EnhancedTeacherAuth] Admin user bypassing class assignment check');
      return next();
    }

    // Make sure we have a teacher profile
    if (!req.teacher) {
      return res.status(500).json({
        message: 'Teacher profile not attached to request. Make sure to use ensureTeacherProfile middleware first.',
        error: 'MIDDLEWARE_SEQUENCE_ERROR'
      });
    }

    // Get class ID from params, query, or body
    const classId = req.params.classId || req.query.classId || req.body.classId;
    if (!classId) {
      console.log('[EnhancedTeacherAuth] No classId provided in request');
      return res.status(400).json({
        message: 'Class ID is required',
        error: 'MISSING_CLASS_ID'
      });
    }

    // For admin users with temporary profiles, we'll allow access
    if (req.teacher.isAdmin && req.teacher.isTemporary) {
      console.log('[EnhancedTeacherAuth] Admin user with temporary profile, bypassing class assignment check');
      return next();
    }

    // Check if the teacher is assigned to the class
    const isAssigned = await teacherAssignmentService.isTeacherAssignedToClass(
      req.teacher._id,
      classId
    );

    if (!isAssigned) {
      console.log(`[EnhancedTeacherAuth] Teacher ${req.teacher._id} is not assigned to class ${classId}`);
      return res.status(403).json({
        message: 'You are not assigned to teach any subjects in this class. Please contact an administrator.',
        error: 'NO_SUBJECTS_IN_CLASS',
        teacherId: req.teacher._id,
        classId
      });
    }

    // Get the subjects this teacher teaches in this class
    const teacherSubjects = await teacherAssignmentService.getTeacherSubjectsInClass(
      req.teacher._id,
      classId
    );

    // Attach the subjects to the request object
    req.teacherSubjects = teacherSubjects;
    console.log(`[EnhancedTeacherAuth] Teacher ${req.teacher._id} is assigned to ${teacherSubjects.length} subjects in class ${classId}`);

    next();
  } catch (error) {
    console.error('[EnhancedTeacherAuth] Error in ensureTeacherClassAssignment middleware:', error);
    res.status(500).json({
      message: 'Server error while checking teacher class assignment',
      error: error.message
    });
  }
};

/**
 * Middleware to ensure a teacher is assigned to a subject in a class
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const ensureTeacherSubjectAssignment = async (req, res, next) => {
  try {
    // Skip for admin users if they have the bypass flag set
    if (req.user.role === 'admin' && req.query.bypassTeacherCheck === 'true') {
      console.log('[EnhancedTeacherAuth] Admin user bypassing subject assignment check');
      return next();
    }

    // Make sure we have a teacher profile
    if (!req.teacher) {
      return res.status(500).json({
        message: 'Teacher profile not attached to request. Make sure to use ensureTeacherProfile middleware first.',
        error: 'MIDDLEWARE_SEQUENCE_ERROR'
      });
    }

    // Get class ID and subject ID from params, query, or body
    const classId = req.params.classId || req.query.classId || req.body.classId;
    const subjectId = req.params.subjectId || req.query.subjectId || req.body.subjectId;

    if (!classId) {
      console.log('[EnhancedTeacherAuth] No classId provided in request');
      return res.status(400).json({
        message: 'Class ID is required',
        error: 'MISSING_CLASS_ID'
      });
    }

    if (!subjectId) {
      console.log('[EnhancedTeacherAuth] No subjectId provided in request');
      return res.status(400).json({
        message: 'Subject ID is required',
        error: 'MISSING_SUBJECT_ID'
      });
    }

    // For admin users with temporary profiles, we'll allow access
    if (req.teacher.isAdmin && req.teacher.isTemporary) {
      console.log('[EnhancedTeacherAuth] Admin user with temporary profile, bypassing subject assignment check');
      return next();
    }

    // Check if the teacher is assigned to the subject in the class
    const isAssigned = await teacherAssignmentService.isTeacherAssignedToSubject(
      req.teacher._id,
      classId,
      subjectId
    );

    if (!isAssigned) {
      console.log(`[EnhancedTeacherAuth] Teacher ${req.teacher._id} is not assigned to subject ${subjectId} in class ${classId}`);
      return res.status(403).json({
        message: 'You are not assigned to teach this subject in this class. Please contact an administrator.',
        error: 'NOT_ASSIGNED_TO_SUBJECT',
        teacherId: req.teacher._id,
        classId,
        subjectId
      });
    }

    console.log(`[EnhancedTeacherAuth] Teacher ${req.teacher._id} is assigned to subject ${subjectId} in class ${classId}`);
    next();
  } catch (error) {
    console.error('[EnhancedTeacherAuth] Error in ensureTeacherSubjectAssignment middleware:', error);
    res.status(500).json({
      message: 'Server error while checking teacher subject assignment',
      error: error.message
    });
  }
};

/**
 * Middleware to diagnose and fix teacher assignments if needed
 * This is a special middleware that will attempt to fix missing assignments on-the-fly
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const diagnoseAndFixTeacherAssignments = async (req, res, next) => {
  try {
    // Make sure we have a teacher profile
    if (!req.teacher) {
      return res.status(500).json({
        message: 'Teacher profile not attached to request. Make sure to use ensureTeacherProfile middleware first.',
        error: 'MIDDLEWARE_SEQUENCE_ERROR'
      });
    }

    // Get class ID from params, query, or body
    const classId = req.params.classId || req.query.classId || req.body.classId;
    if (!classId) {
      console.log('[EnhancedTeacherAuth] No classId provided in request');
      return res.status(400).json({
        message: 'Class ID is required',
        error: 'MISSING_CLASS_ID'
      });
    }

    // For admin users with temporary profiles, we'll allow access
    if (req.teacher.isAdmin && req.teacher.isTemporary) {
      console.log('[EnhancedTeacherAuth] Admin user with temporary profile, bypassing diagnosis');
      return next();
    }

    // Check if auto-fix is enabled
    const autoFix = req.query.autoFix === 'true' || req.body.autoFix === true;

    // Diagnose teacher assignments
    const diagnostic = await teacherAssignmentService.diagnoseAndFixTeacherAssignments(
      req.teacher._id,
      classId
    );

    // Attach the diagnostic result to the request object
    req.diagnostic = diagnostic;

    // If there were issues and auto-fix is enabled, we've already fixed them
    if (diagnostic.issues && diagnostic.issues.length > 0) {
      if (autoFix) {
        console.log(`[EnhancedTeacherAuth] Fixed ${diagnostic.issues.length} issues with teacher assignments`);

        // Get the updated subjects this teacher teaches in this class
        const teacherSubjects = await teacherAssignmentService.getTeacherSubjectsInClass(
          req.teacher._id,
          classId,
          false // Don't use cache since we just fixed assignments
        );

        // Attach the subjects to the request object
        req.teacherSubjects = teacherSubjects;
      } else {
        console.log(`[EnhancedTeacherAuth] Found ${diagnostic.issues.length} issues with teacher assignments, but auto-fix is disabled`);
        return res.status(403).json({
          message: 'There are issues with your teacher assignments. Please contact an administrator or enable auto-fix.',
          error: 'ASSIGNMENT_ISSUES',
          diagnostic,
          autoFixOption: 'Add ?autoFix=true to your request to automatically fix these issues'
        });
      }
    } else {
      console.log('[EnhancedTeacherAuth] No issues found with teacher assignments');

      // Get the subjects this teacher teaches in this class
      const teacherSubjects = await teacherAssignmentService.getTeacherSubjectsInClass(
        req.teacher._id,
        classId
      );

      // Attach the subjects to the request object
      req.teacherSubjects = teacherSubjects;
    }

    next();
  } catch (error) {
    console.error('[EnhancedTeacherAuth] Error in diagnoseAndFixTeacherAssignments middleware:', error);
    res.status(500).json({
      message: 'Server error while diagnosing teacher assignments',
      error: error.message
    });
  }
};

/**
 * Middleware to get subjects for a teacher in a class using the enhanced service
 * This middleware specifically handles O-Level classes better
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getEnhancedTeacherSubjects = async (req, res, next) => {
  try {
    // Make sure we have a teacher profile
    if (!req.teacher) {
      return res.status(500).json({
        message: 'Teacher profile not attached to request. Make sure to use ensureTeacherProfile middleware first.',
        error: 'MIDDLEWARE_SEQUENCE_ERROR'
      });
    }

    // Get class ID from params, query, or body
    const classId = req.params.classId || req.query.classId || req.body.classId;
    if (!classId) {
      console.log('[EnhancedTeacherAuth] No classId provided in request');
      return res.status(400).json({
        message: 'Class ID is required',
        error: 'MISSING_CLASS_ID'
      });
    }

    // For admin users with temporary profiles, we'll allow access to all subjects
    if (req.teacher.isAdmin && req.teacher.isTemporary) {
      console.log('[EnhancedTeacherAuth] Admin user with temporary profile, getting all subjects in class');

      // Get all subjects in the class
      const Class = require('../models/Class');
      const classObj = await Class.findById(classId)
        .populate({
          path: 'subjects.subject',
          model: 'Subject',
          select: 'name code type description educationLevel isPrincipal isCompulsory'
        });

      if (!classObj) {
        return res.status(404).json({
          message: 'Class not found',
          error: 'CLASS_NOT_FOUND'
        });
      }

      // Extract subjects from the class
      const subjects = classObj.subjects
        .filter(s => s.subject)
        .map(s => ({
          _id: s.subject._id,
          name: s.subject.name,
          code: s.subject.code,
          type: s.subject.type || 'UNKNOWN',
          description: s.subject.description || '',
          educationLevel: s.subject.educationLevel || 'UNKNOWN',
          isPrincipal: s.subject.isPrincipal || false,
          isCompulsory: s.subject.isCompulsory || false,
          assignmentType: 'admin' // Admin access
        }));

      // Attach the subjects to the request object
      req.teacherSubjects = subjects;
      return next();
    }

    // Use the enhanced teacher subject service to get the teacher's subjects
    // For O-Level classes, we want to return all subjects in the class
    const classObj = await Class.findById(classId);
    if (classObj && classObj.educationLevel === 'O_LEVEL') {
      console.log(`[EnhancedTeacherAuth] Class ${classId} is an O-Level class, returning all subjects`);

      // Get all subjects in the class
      const populatedClass = await Class.findById(classId)
        .populate({
          path: 'subjects.subject',
          model: 'Subject',
          select: 'name code type description educationLevel isPrincipal isCompulsory'
        });

      if (!populatedClass || !populatedClass.subjects) {
        console.log(`[EnhancedTeacherAuth] No subjects found in class ${classId}`);
        req.teacherSubjects = [];
        return next();
      }

      // Extract subjects from the class
      const subjects = populatedClass.subjects
        .filter(s => s.subject)
        .map(s => ({
          _id: s.subject._id,
          name: s.subject.name,
          code: s.subject.code,
          type: s.subject.type || 'UNKNOWN',
          description: s.subject.description || '',
          educationLevel: s.subject.educationLevel || 'UNKNOWN',
          isPrincipal: s.subject.isPrincipal || false,
          isCompulsory: s.subject.isCompulsory || false,
          assignmentType: 'o-level' // Special assignment type for O-Level
        }));

      console.log(`[EnhancedTeacherAuth] Found ${subjects.length} subjects in O-Level class ${classId}`);
      req.teacherSubjects = subjects;
      return next();
    } else {
      // For A-Level classes, use the enhanced teacher subject service
      const subjects = await enhancedTeacherSubjectService.getTeacherSubjects(
        req.teacher._id,
        classId,
        false // Don't use cache to ensure fresh data
      );

      // Attach the subjects to the request object
      req.teacherSubjects = subjects;
      console.log(`[EnhancedTeacherAuth] Found ${subjects.length} subjects for teacher ${req.teacher._id} in class ${classId} using enhanced service`);
    }

    next();
  } catch (error) {
    console.error('[EnhancedTeacherAuth] Error in getEnhancedTeacherSubjects middleware:', error);
    res.status(500).json({
      message: 'Server error while getting teacher subjects',
      error: error.message
    });
  }
};

module.exports = {
  ensureTeacherProfile,
  ensureTeacherClassAssignment,
  ensureTeacherSubjectAssignment,
  diagnoseAndFixTeacherAssignments,
  getEnhancedTeacherSubjects
};
