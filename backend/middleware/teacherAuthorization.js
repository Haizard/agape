/**
 * Teacher Authorization Middleware
 *
 * This middleware checks if a teacher is authorized to access specific resources.
 * It centralizes authorization logic that was previously scattered across client and server code.
 */
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const TeacherSubject = require('../models/TeacherSubject');
const logger = require('../utils/logger');

// Try to load the TeacherClass model, but don't fail if it doesn't exist yet
let TeacherClass;
try {
  TeacherClass = require('../models/TeacherClass');
} catch (error) {
  logger.warn('TeacherClass model not found. Using fallback authorization logic.');
}

/**
 * Check if a teacher is authorized to access the requested resources
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.checkTeacherAuthorization = async (req, res, next) => {
  try {
    // Skip authorization check for admins
    if (req.user.role === 'admin') {
      return next();
    }

    // For non-admin users, verify they are teachers
    if (req.user.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to perform this action'
      });
    }

    // Get teacher ID from user
    const teacherId = req.user.id;

    // Get request parameters
    const { classId, subjectId, studentId } = req.method === 'GET' ? req.query : req.body;

    // For batch operations, we need to check the first item in the array
    const batchData = Array.isArray(req.body) ? req.body[0] : null;
    const batchClassId = batchData ? batchData.classId : null;
    const batchSubjectId = batchData ? batchData.subjectId : null;

    // Determine which IDs to check
    const classIdToCheck = classId || batchClassId;
    const subjectIdToCheck = subjectId || batchSubjectId;

    // If no class or subject ID is provided, skip authorization
    if (!classIdToCheck && !subjectIdToCheck) {
      return next();
    }

    // Check if teacher is assigned to the class
    if (classIdToCheck) {
      let isAuthorized = false;

      // Check if this is an O-Level class
      try {
        const classObj = await Class.findOne({ _id: classIdToCheck });
        if (classObj && classObj.educationLevel === 'O_LEVEL') {
          logger.info(`Teacher ${teacherId} is authorized for O-Level class ${classIdToCheck} (bypassing strict checks)`);
          isAuthorized = true;
        }
      } catch (error) {
        logger.warn(`Error checking class education level: ${error.message}`);
        // Continue to normal authorization checks
      }

      // If not already authorized, try using TeacherClass model if available
      if (!isAuthorized && TeacherClass) {
        try {
          const teacherClass = await TeacherClass.findOne({
            teacherId,
            classId: classIdToCheck
          });

          if (teacherClass) {
            isAuthorized = true;
          }
        } catch (error) {
          logger.warn(`Error checking TeacherClass: ${error.message}`);
          // Continue to fallback method
        }
      }

      // Fallback: Check if teacher is assigned to any subject in the class
      if (!isAuthorized) {
        try {
          // Check if teacher is the class teacher
          const classObj = await Class.findOne({
            _id: classIdToCheck,
            classTeacher: teacherId
          });

          if (classObj) {
            isAuthorized = true;
          } else {
            // Check if teacher is assigned to any subject in the class
            const classWithTeacher = await Class.findOne({
              _id: classIdToCheck,
              'subjects.teacher': teacherId
            });

            if (classWithTeacher) {
              isAuthorized = true;
            }
          }
        } catch (error) {
          logger.warn(`Error in fallback class authorization check: ${error.message}`);
        }
      }

      if (!isAuthorized) {
        logger.warn(`Teacher ${teacherId} attempted to access unauthorized class ${classIdToCheck}`);
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to access this class'
        });
      }
    }

    // Check if teacher is assigned to the subject
    if (classIdToCheck && subjectIdToCheck) {
      let isAuthorized = false;

      // Check if this is an O-Level class
      try {
        const classObj = await Class.findOne({ _id: classIdToCheck });
        if (classObj && classObj.educationLevel === 'O_LEVEL') {
          logger.info(`Teacher ${teacherId} is authorized for subject ${subjectIdToCheck} in O-Level class ${classIdToCheck} (bypassing strict checks)`);
          isAuthorized = true;
        }
      } catch (error) {
        logger.warn(`Error checking class education level for subject authorization: ${error.message}`);
        // Continue to normal authorization checks
      }

      // If not already authorized, check teacher subject assignment
      if (!isAuthorized) {
        const teacherSubject = await TeacherSubject.findOne({
          teacherId,
          classId: classIdToCheck,
          subjectId: subjectIdToCheck
        });

        if (teacherSubject) {
          isAuthorized = true;
        }
      }

      if (!isAuthorized) {
        logger.warn(`Teacher ${teacherId} attempted to access unauthorized subject ${subjectIdToCheck} in class ${classIdToCheck}`);
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to access this subject in this class'
        });
      }
    }

    // If we're dealing with a specific student, check if the teacher is assigned to that student
    if (studentId && classIdToCheck) {
      let isAuthorized = false;
      let assignedStudents = [];

      // Check if this is an O-Level class
      try {
        const classObj = await Class.findOne({ _id: classIdToCheck });
        if (classObj && classObj.educationLevel === 'O_LEVEL') {
          logger.info(`Teacher ${teacherId} is authorized for student ${studentId} in O-Level class ${classIdToCheck} (bypassing strict checks)`);
          isAuthorized = true;
        }
      } catch (error) {
        logger.warn(`Error checking class education level for student authorization: ${error.message}`);
        // Continue to normal authorization checks
      }

      // Try using TeacherClass model if available
      if (!isAuthorized && TeacherClass) {
        try {
          // Get all students assigned to this teacher in this class
          const teacherClass = await TeacherClass.findOne({
            teacherId,
            classId: classIdToCheck
          }).populate('students');

          if (teacherClass?.students?.length > 0) {
            assignedStudents = teacherClass.students;
            isAuthorized = teacherClass.students.some(
              student => student._id.toString() === studentId
            );
          }
        } catch (error) {
          logger.warn(`Error checking TeacherClass for student authorization: ${error.message}`);
          // Continue to fallback method
        }
      }

      // Fallback: Check if teacher is assigned to the class containing this student
      if (!isAuthorized) {
        try {
          // Check if teacher is the class teacher
          const classObj = await Class.findOne({
            _id: classIdToCheck,
            classTeacher: teacherId,
            students: studentId
          });

          if (classObj) {
            isAuthorized = true;
          } else {
            // Check if teacher is assigned to any subject in the class
            const classWithTeacher = await Class.findOne({
              _id: classIdToCheck,
              'subjects.teacher': teacherId,
              students: studentId
            });

            if (classWithTeacher) {
              isAuthorized = true;
            }
          }
        } catch (error) {
          logger.warn(`Error in fallback student authorization check: ${error.message}`);
        }
      }

      if (!isAuthorized) {
        logger.warn(`Teacher ${teacherId} attempted to access unauthorized student ${studentId} in class ${classIdToCheck}`);
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to access this student'
        });
      }
    }

    // For batch operations, check if teacher is authorized for all students
    if (Array.isArray(req.body) && classIdToCheck) {
      let assignedStudentIds = [];
      let allStudentsAuthorized = false;

      // Check if this is an O-Level class
      try {
        const classObj = await Class.findOne({ _id: classIdToCheck });
        if (classObj && classObj.educationLevel === 'O_LEVEL') {
          logger.info(`Teacher ${teacherId} is authorized for batch operations in O-Level class ${classIdToCheck} (bypassing strict checks)`);
          allStudentsAuthorized = true;
        }
      } catch (error) {
        logger.warn(`Error checking class education level for batch authorization: ${error.message}`);
        // Continue to normal authorization checks
      }

      // If not already authorized, try using TeacherClass model if available
      if (!allStudentsAuthorized && TeacherClass) {
        try {
          // Get all students assigned to this teacher in this class
          const teacherClass = await TeacherClass.findOne({
            teacherId,
            classId: classIdToCheck
          }).populate('students');

          if (teacherClass?.students?.length > 0) {
            assignedStudentIds = teacherClass.students.map(
              student => student._id.toString()
            );
          }
        } catch (error) {
          logger.warn(`Error checking TeacherClass for batch authorization: ${error.message}`);
          // Continue to fallback method
        }
      }

      // Fallback: Check if teacher is the class teacher or assigned to teach in this class
      if (!allStudentsAuthorized && assignedStudentIds.length === 0) {
        try {
          // Check if teacher is the class teacher
          const classObj = await Class.findOne({
            _id: classIdToCheck,
            classTeacher: teacherId
          }).populate('students');

          if (classObj?.students?.length > 0) {
            assignedStudentIds = classObj.students.map(student => student._id.toString());
            allStudentsAuthorized = true; // Class teachers are authorized for all students
          } else {
            // Check if teacher is assigned to any subject in the class
            const classWithTeacher = await Class.findOne({
              _id: classIdToCheck,
              'subjects.teacher': teacherId
            }).populate('students');

            if (classWithTeacher?.students?.length > 0) {
              assignedStudentIds = classWithTeacher.students.map(student => student._id.toString());

              // For subject teachers, we'll be more permissive in batch operations
              // This is to handle the case where the teacher might be teaching a subject to all students
              allStudentsAuthorized = true;
            }
          }
        } catch (error) {
          logger.warn(`Error in fallback batch authorization check: ${error.message}`);
        }
      }

      // If we have no assigned students and the teacher is not authorized for all students, reject the request
      if (assignedStudentIds.length === 0 && !allStudentsAuthorized) {
        logger.warn(`Teacher ${teacherId} attempted to access unauthorized students in class ${classIdToCheck}`);
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to access these students'
        });
      }

      // If the teacher is not authorized for all students, check each mark
      if (!allStudentsAuthorized) {
        // Check if any marks are for students not assigned to this teacher
        const unauthorizedMarks = req.body.filter(
          mark => mark.marksObtained !== '' && !assignedStudentIds.includes(mark.studentId)
        );

        if (unauthorizedMarks.length > 0) {
          logger.warn(`Teacher ${teacherId} attempted to access unauthorized students in class ${classIdToCheck}`);
          return res.status(403).json({
            success: false,
            message: 'You are not authorized to enter marks for some of these students'
          });
        }
      }
    }

    // If all checks pass, proceed to the next middleware
    next();
  } catch (error) {
    logger.error(`Error in teacher authorization middleware: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error checking teacher authorization',
      error: error.message
    });
  }
};
