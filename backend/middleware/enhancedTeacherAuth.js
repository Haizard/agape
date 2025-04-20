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
    // For all classes, we want to return only the subjects the teacher is assigned to teach
    console.log(`[EnhancedTeacherAuth] Getting subjects for teacher ${req.teacher._id} in class ${classId}, returning only assigned subjects`);

    // Get only the subjects this teacher is assigned to teach in this class
    const teacherSubjects = await enhancedTeacherSubjectService.getTeacherSubjects(
      req.teacher._id,
      classId,
      false // Don't use cache to ensure fresh data
    );

    if (!teacherSubjects || teacherSubjects.length === 0) {
      console.log(`[EnhancedTeacherAuth] No subjects found for teacher ${req.teacher._id} in class ${classId}`);
      req.teacherSubjects = [];
      return next();
    }

    console.log(`[EnhancedTeacherAuth] Found ${teacherSubjects.length} subjects assigned to teacher ${req.teacher._id} in class ${classId}`);

    // Add assignment type for tracking
    const subjects = teacherSubjects.map(subject => ({
      ...subject,
      assignmentType: 'teacher-specific' // Special assignment type for teacher-specific subjects
    }));

      // If studentId is provided, filter subjects to only those the student takes
      if (req.query.studentId) {
        const studentId = req.query.studentId;
        console.log(`[EnhancedTeacherAuth] Filtering subjects for student ${studentId}`);

        // Get student's selected subjects
        const Student = require('../models/Student');
        const student = await Student.findById(studentId);

        if (student) {
          let studentSubjectIds = [];

          // First try to get directly from student record
          if (student.selectedSubjects && Array.isArray(student.selectedSubjects)) {
            studentSubjectIds = student.selectedSubjects.map(s =>
              typeof s === 'object' && s._id ? s._id.toString() : s.toString());
            console.log(`[EnhancedTeacherAuth] Student ${studentId} has ${studentSubjectIds.length} selected subjects directly on their record`);
          }

          // If no subjects found, try to find from StudentSubjectSelection model
          if (studentSubjectIds.length === 0) {
            try {
              const StudentSubjectSelection = require('../models/StudentSubjectSelection');
              const subjectSelection = await StudentSubjectSelection.findOne({ student: studentId });

              if (subjectSelection) {
                // Combine core and optional subjects
                const coreSubjectIds = subjectSelection.coreSubjects.map(s => s.toString());
                const optionalSubjectIds = subjectSelection.optionalSubjects.map(s => s.toString());
                studentSubjectIds = [...coreSubjectIds, ...optionalSubjectIds];
                console.log(`[EnhancedTeacherAuth] Student ${studentId} has ${studentSubjectIds.length} subjects from StudentSubjectSelection (${coreSubjectIds.length} core, ${optionalSubjectIds.length} optional)`);
              }
            } catch (error) {
              console.log(`[EnhancedTeacherAuth] Error fetching subject selection for student ${studentId}:`, error.message);
            }
          }

          if (studentSubjectIds.length > 0) {
            // Filter subjects to only those the student takes
            const filteredSubjects = subjects.filter(subject =>
              studentSubjectIds.includes(subject._id.toString()));
            console.log(`[EnhancedTeacherAuth] Filtered to ${filteredSubjects.length} subjects that student ${studentId} takes`);
            req.teacherSubjects = filteredSubjects;
            return next();
          }
        }
      }

      req.teacherSubjects = subjects;
      return next();
  } catch (error) {
    console.error('[EnhancedTeacherAuth] Error in getEnhancedTeacherSubjects middleware:', error);
    res.status(500).json({
      message: 'Server error while getting teacher subjects',
      error: error.message
    });
  }
};

/**
 * Middleware to strictly enforce subject-level access control for teachers
 * This ensures teachers can only access subjects they are specifically assigned to teach
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const strictSubjectAccessControl = async (req, res, next) => {
  try {
    // Skip for admin users
    if (req.user.role === 'admin') {
      console.log('[EnhancedTeacherAuth] Admin user, bypassing strict subject access control');
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

    if (!subjectId) {
      console.log('[EnhancedTeacherAuth] No subjectId provided in request');
      return res.status(400).json({
        message: 'Subject ID is required',
        error: 'MISSING_SUBJECT_ID'
      });
    }

    // Use the enhanced teacher subject service to check if the teacher is specifically assigned to this subject
    const enhancedTeacherSubjectService = require('../services/enhancedTeacherSubjectService');
    const Class = require('../models/Class');
    const Subject = require('../models/Subject');
    const TeacherAssignment = require('../models/TeacherAssignment');
    const TeacherSubject = require('../models/TeacherSubject');

    // If classId is provided, check specific assignment in that class
    if (classId) {
      console.log(`[EnhancedTeacherAuth] Checking if teacher ${req.teacher._id} is assigned to subject ${subjectId} in class ${classId}`);

      // Check if this is an O-Level class
      const classObj = await Class.findById(classId);
      const isOLevelClass = classObj && classObj.educationLevel === 'O_LEVEL';

      if (isOLevelClass) {
        console.log(`[EnhancedTeacherAuth] Class ${classId} is an O-Level class, using strict subject-level access control`);

        // For O-Level classes, always use the strict check
        const isSpecificallyAssigned = await enhancedTeacherSubjectService.isTeacherSpecificallyAssignedToSubject(
          req.teacher._id,
          classId,
          subjectId
        );

        if (isSpecificallyAssigned) {
          console.log(`[EnhancedTeacherAuth] Teacher ${req.teacher._id} is specifically assigned to subject ${subjectId} in O-Level class ${classId}`);

          // Get the subject to check if it's a core or optional subject
          const subject = await Subject.findById(subjectId);
          const isCoreSubject = subject && subject.type === 'CORE';

          // Store subject type in request for later use in student filtering
          req.subjectType = subject ? subject.type : null;

          return next();
        }
      } else {
        // For A-Level classes, use the regular authorization check
        const isAuthorized = await enhancedTeacherSubjectService.isTeacherAuthorizedForSubject(
          req.teacher._id,
          classId,
          subjectId
        );

        if (isAuthorized) {
          console.log(`[EnhancedTeacherAuth] Teacher ${req.teacher._id} is authorized for subject ${subjectId} in class ${classId}`);
          return next();
        }
      }
    } else {
      // If no classId is provided, check if the teacher is assigned to this subject in any class
      console.log(`[EnhancedTeacherAuth] Checking if teacher ${req.teacher._id} is assigned to subject ${subjectId} in any class`);

      // Method 1: Check TeacherAssignment model
      const assignment = await TeacherAssignment.findOne({
        teacher: req.teacher._id,
        subject: subjectId
      });

      if (assignment) {
        console.log(`[EnhancedTeacherAuth] Teacher ${req.teacher._id} is assigned to subject ${subjectId} via TeacherAssignment model`);
        return next();
      }

      // Method 2: Check TeacherSubject model
      const teacherSubject = await TeacherSubject.findOne({
        teacherId: req.teacher._id,
        subjectId: subjectId,
        status: 'active'
      });

      if (teacherSubject) {
        console.log(`[EnhancedTeacherAuth] Teacher ${req.teacher._id} is assigned to subject ${subjectId} via TeacherSubject model`);
        return next();
      }

      // Method 3: Check Class model's subjects array
      const classes = await Class.find({
        'subjects.subject': subjectId,
        'subjects.teacher': req.teacher._id
      });

      if (classes.length > 0) {
        console.log(`[EnhancedTeacherAuth] Teacher ${req.teacher._id} is assigned to subject ${subjectId} in ${classes.length} classes via Class model`);
        return next();
      }
    }

    // If we get here, the teacher is not assigned to this subject
    console.log(`[EnhancedTeacherAuth] Teacher ${req.teacher._id} is NOT assigned to subject ${subjectId}${classId ? ` in class ${classId}` : ''}`);
    return res.status(403).json({
      message: 'You are not assigned to teach this subject. Please contact an administrator.',
      error: 'NOT_ASSIGNED_TO_SUBJECT',
      teacherId: req.teacher._id,
      subjectId,
      ...(classId ? { classId } : {})
    });
  } catch (error) {
    console.error('[EnhancedTeacherAuth] Error in strictSubjectAccessControl middleware:', error);
    res.status(500).json({
      message: 'Server error while checking teacher subject assignment',
      error: error.message
    });
  }
};

/**
 * Middleware to filter students based on subject selection for O-Level classes
 * This ensures teachers can only see students who take the subject they teach
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const filterStudentsBySubjectSelection = async (req, res, next) => {
  try {
    // Skip for admin users
    if (req.user.role === 'admin') {
      console.log('[EnhancedTeacherAuth] Admin user, bypassing student filtering');
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

    if (!classId || !subjectId) {
      console.log('[EnhancedTeacherAuth] Missing classId or subjectId in request');
      return res.status(400).json({
        message: 'Class ID and Subject ID are required',
        error: 'MISSING_PARAMETERS'
      });
    }

    // Check if this is an O-Level class
    const Class = require('../models/Class');
    const Subject = require('../models/Subject');
    const Student = require('../models/Student');
    const StudentSubjectSelection = require('../models/StudentSubjectSelection');

    const classObj = await Class.findById(classId);
    if (!classObj) {
      return res.status(404).json({
        message: 'Class not found',
        error: 'CLASS_NOT_FOUND'
      });
    }

    const isOLevelClass = classObj.educationLevel === 'O_LEVEL';
    if (!isOLevelClass) {
      // For A-Level classes, we don't need to filter students
      console.log(`[EnhancedTeacherAuth] Class ${classId} is not an O-Level class, skipping student filtering`);
      return next();
    }

    // Get the subject to check if it's a core or optional subject
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        message: 'Subject not found',
        error: 'SUBJECT_NOT_FOUND'
      });
    }

    const isCoreSubject = subject.type === 'CORE';
    console.log(`[EnhancedTeacherAuth] Subject ${subjectId} is a ${isCoreSubject ? 'core' : 'optional'} subject`);

    // If it's a core subject, all students take it, so we don't need to filter
    if (isCoreSubject) {
      console.log(`[EnhancedTeacherAuth] Core subject ${subjectId}, all students take it, no filtering needed`);
      return next();
    }

    // For optional subjects, we need to filter students who have selected this subject
    console.log(`[EnhancedTeacherAuth] Optional subject ${subjectId}, filtering students who take it`);

    // Get all students in the class
    const students = await Student.find({ class: classId });
    if (!students || students.length === 0) {
      console.log(`[EnhancedTeacherAuth] No students found in class ${classId}`);
      // If there are no students, just continue
      return next();
    }

    console.log(`[EnhancedTeacherAuth] Found ${students.length} students in class ${classId}`);

    // Get student IDs
    const studentIds = students.map(student => student._id);

    // Get subject selections for these students
    const subjectSelections = await StudentSubjectSelection.find({
      student: { $in: studentIds },
      status: 'APPROVED'
    });

    console.log(`[EnhancedTeacherAuth] Found ${subjectSelections.length} subject selections for students in class ${classId}`);

    // Create a set of student IDs who take this subject
    const studentsTakingSubject = new Set();

    // Check each selection
    for (const selection of subjectSelections) {
      // Check if the subject is in the optional subjects list
      const optionalSubjects = selection.optionalSubjects.map(s => s.toString());
      if (optionalSubjects.includes(subjectId.toString())) {
        studentsTakingSubject.add(selection.student.toString());
      }
    }

    // Also check students with direct subject assignments
    for (const student of students) {
      if (student.selectedSubjects && Array.isArray(student.selectedSubjects)) {
        const selectedSubjects = student.selectedSubjects.map(s =>
          typeof s === 'object' && s._id ? s._id.toString() : s.toString());
        if (selectedSubjects.includes(subjectId.toString())) {
          studentsTakingSubject.add(student._id.toString());
        }
      }
    }

    console.log(`[EnhancedTeacherAuth] Found ${studentsTakingSubject.size} students who take subject ${subjectId}`);

    // Attach the filtered student IDs to the request
    req.filteredStudentIds = Array.from(studentsTakingSubject);

    // If we're returning students directly, filter them
    if (req.students) {
      req.students = req.students.filter(student =>
        studentsTakingSubject.has(student._id.toString()));
      console.log(`[EnhancedTeacherAuth] Filtered students array to ${req.students.length} students`);
    }

    next();
  } catch (error) {
    console.error('[EnhancedTeacherAuth] Error in filterStudentsBySubjectSelection middleware:', error);
    res.status(500).json({
      message: 'Server error while filtering students by subject selection',
      error: error.message
    });
  }
};

module.exports = {
  ensureTeacherProfile,
  ensureTeacherClassAssignment,
  ensureTeacherSubjectAssignment,
  diagnoseAndFixTeacherAssignments,
  getEnhancedTeacherSubjects,
  strictSubjectAccessControl,
  filterStudentsBySubjectSelection
};
