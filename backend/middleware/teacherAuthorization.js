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

    // Get user ID from user
    const userId = req.user.userId;

    // If we don't have a userId, return an error
    if (!userId) {
      logger.warn('No userId found in req.user.');
      return res.status(403).json({
        success: false,
        message: 'User ID not found in authenticated user'
      });
    }

    // Find the teacher profile by userId
    const teacher = await Teacher.findOne({ userId });

    if (!teacher) {
      logger.warn(`No teacher found with userId: ${userId}`);
      return res.status(404).json({
        success: false,
        message: 'Teacher profile not found'
      });
    }

    // Use the teacher's _id for authorization checks
    const teacherId = teacher._id.toString();

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
        const isOLevelClass = classObj && classObj.educationLevel === 'O_LEVEL';

        if (isOLevelClass) {
          logger.info(`Teacher ${teacherId} is checking authorization for subject ${subjectIdToCheck} in O-Level class ${classIdToCheck} (using strict checks)`);

          // For O-Level classes, use strict subject-level access control
          // Check all three assignment models

          // Method 1: Check if the teacher is directly assigned to this subject in the Class model
          if (classObj.subjects && Array.isArray(classObj.subjects)) {
            for (const subjectAssignment of classObj.subjects) {
              const assignedSubjectId = subjectAssignment.subject?.toString() || subjectAssignment.subject;
              const assignedTeacherId = subjectAssignment.teacher?.toString();

              if (assignedSubjectId === subjectIdToCheck && assignedTeacherId === teacherId) {
                logger.info(`Teacher ${teacherId} is authorized for subject ${subjectIdToCheck} in O-Level class ${classIdToCheck} via Class.subjects`);
                isAuthorized = true;
                break;
              }
            }
          }

          // Method 2: Check TeacherSubject assignments
          if (!isAuthorized) {
            const teacherSubject = await TeacherSubject.findOne({
              teacherId,
              classId: classIdToCheck,
              subjectId: subjectIdToCheck,
              status: 'active'
            });

            if (teacherSubject) {
              logger.info(`Teacher ${teacherId} is authorized for subject ${subjectIdToCheck} in O-Level class ${classIdToCheck} via TeacherSubject model`);
              isAuthorized = true;
            }
          }

          // Method 3: Check TeacherAssignment assignments
          if (!isAuthorized) {
            const TeacherAssignment = require('../models/TeacherAssignment');
            const teacherAssignment = await TeacherAssignment.findOne({
              teacher: teacherId,
              class: classIdToCheck,
              subject: subjectIdToCheck
            });

            if (teacherAssignment) {
              logger.info(`Teacher ${teacherId} is authorized for subject ${subjectIdToCheck} in O-Level class ${classIdToCheck} via TeacherAssignment model`);
              isAuthorized = true;
            }
          }
        } else {
          // For A-Level classes, use the regular authorization check
          const teacherSubject = await TeacherSubject.findOne({
            teacherId,
            classId: classIdToCheck,
            subjectId: subjectIdToCheck
          });

          if (teacherSubject) {
            logger.info(`Teacher ${teacherId} is authorized for subject ${subjectIdToCheck} in A-Level class ${classIdToCheck} via TeacherSubject model`);
            isAuthorized = true;
          }
        }
      } catch (error) {
        logger.warn(`Error checking class education level for subject authorization: ${error.message}`);
        // Continue to normal authorization checks
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
    if (studentId && classIdToCheck && subjectIdToCheck) {
      let isAuthorized = false;
      let assignedStudents = [];

      // Check if this is an O-Level class
      try {
        const classObj = await Class.findOne({ _id: classIdToCheck });
        const isOLevelClass = classObj && classObj.educationLevel === 'O_LEVEL';

        if (isOLevelClass) {
          logger.info(`Teacher ${teacherId} is checking authorization for student ${studentId} in O-Level class ${classIdToCheck} with subject ${subjectIdToCheck}`);

          // For O-Level classes, we need to check if the teacher is assigned to the subject
          // and if the student takes this subject

          // First, check if the teacher is assigned to the subject
          let isTeacherAssignedToSubject = false;

          // Method 1: Check Class.subjects
          if (classObj.subjects && Array.isArray(classObj.subjects)) {
            for (const subjectAssignment of classObj.subjects) {
              const assignedSubjectId = subjectAssignment.subject?.toString() || subjectAssignment.subject;
              const assignedTeacherId = subjectAssignment.teacher?.toString();

              if (assignedSubjectId === subjectIdToCheck && assignedTeacherId === teacherId) {
                logger.info(`Teacher ${teacherId} is assigned to subject ${subjectIdToCheck} in O-Level class ${classIdToCheck} via Class.subjects`);
                isTeacherAssignedToSubject = true;
                break;
              }
            }
          }

          // Method 2: Check TeacherSubject
          if (!isTeacherAssignedToSubject) {
            const teacherSubject = await TeacherSubject.findOne({
              teacherId,
              classId: classIdToCheck,
              subjectId: subjectIdToCheck,
              status: 'active'
            });

            if (teacherSubject) {
              logger.info(`Teacher ${teacherId} is assigned to subject ${subjectIdToCheck} in O-Level class ${classIdToCheck} via TeacherSubject model`);
              isTeacherAssignedToSubject = true;
            }
          }

          // Method 3: Check TeacherAssignment
          if (!isTeacherAssignedToSubject) {
            const TeacherAssignment = require('../models/TeacherAssignment');
            const teacherAssignment = await TeacherAssignment.findOne({
              teacher: teacherId,
              class: classIdToCheck,
              subject: subjectIdToCheck
            });

            if (teacherAssignment) {
              logger.info(`Teacher ${teacherId} is assigned to subject ${subjectIdToCheck} in O-Level class ${classIdToCheck} via TeacherAssignment model`);
              isTeacherAssignedToSubject = true;
            }
          }

          if (!isTeacherAssignedToSubject) {
            logger.warn(`Teacher ${teacherId} is not assigned to subject ${subjectIdToCheck} in O-Level class ${classIdToCheck}`);
            return res.status(403).json({
              success: false,
              message: 'You are not assigned to teach this subject in this class'
            });
          }

          // Now, check if this is a core or optional subject
          const Subject = require('../models/Subject');
          const subject = await Subject.findById(subjectIdToCheck);
          const isCoreSubject = subject && subject.type === 'CORE';

          if (isCoreSubject) {
            // If it's a core subject, all students take it
            logger.info(`Subject ${subjectIdToCheck} is a core subject, student ${studentId} takes it`);
            isAuthorized = true;
          } else {
            // If it's an optional subject, check if the student takes it
            logger.info(`Subject ${subjectIdToCheck} is an optional subject, checking if student ${studentId} takes it`);

            // Method 1: Check StudentSubjectSelection model
            const StudentSubjectSelection = require('../models/StudentSubjectSelection');
            const subjectSelection = await StudentSubjectSelection.findOne({
              student: studentId,
              status: 'APPROVED'
            });

            if (subjectSelection) {
              const optionalSubjects = subjectSelection.optionalSubjects.map(s => s.toString());
              if (optionalSubjects.includes(subjectIdToCheck)) {
                logger.info(`Student ${studentId} takes optional subject ${subjectIdToCheck} via StudentSubjectSelection model`);
                isAuthorized = true;
              }
            }

            // Method 2: Check Student model's selectedSubjects field
            if (!isAuthorized) {
              const Student = require('../models/Student');
              const student = await Student.findById(studentId);

              if (student && student.selectedSubjects && Array.isArray(student.selectedSubjects)) {
                const selectedSubjects = student.selectedSubjects.map(s =>
                  typeof s === 'object' && s._id ? s._id.toString() : s.toString());
                if (selectedSubjects.includes(subjectIdToCheck)) {
                  logger.info(`Student ${studentId} takes optional subject ${subjectIdToCheck} via Student.selectedSubjects`);
                  isAuthorized = true;
                }
              }
            }

            if (!isAuthorized) {
              logger.warn(`Student ${studentId} does not take optional subject ${subjectIdToCheck}`);
              return res.status(403).json({
                success: false,
                message: 'This student does not take this optional subject',
                details: 'You can only enter marks for students who take this subject'
              });
            }
          }
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
    if (Array.isArray(req.body) && classIdToCheck && subjectIdToCheck) {
      let assignedStudentIds = [];
      let allStudentsAuthorized = false;

      // Check if this is an O-Level class
      try {
        const classObj = await Class.findOne({ _id: classIdToCheck });
        const isOLevelClass = classObj && classObj.educationLevel === 'O_LEVEL';

        if (isOLevelClass) {
          logger.info(`Teacher ${teacherId} is checking authorization for batch operations in O-Level class ${classIdToCheck} with subject ${subjectIdToCheck}`);

          // For O-Level classes, we need to check if the teacher is assigned to the subject
          // and filter students based on subject selection

          // First, check if the teacher is assigned to the subject
          let isTeacherAssignedToSubject = false;

          // Method 1: Check Class.subjects
          if (classObj.subjects && Array.isArray(classObj.subjects)) {
            for (const subjectAssignment of classObj.subjects) {
              const assignedSubjectId = subjectAssignment.subject?.toString() || subjectAssignment.subject;
              const assignedTeacherId = subjectAssignment.teacher?.toString();

              if (assignedSubjectId === subjectIdToCheck && assignedTeacherId === teacherId) {
                logger.info(`Teacher ${teacherId} is assigned to subject ${subjectIdToCheck} in O-Level class ${classIdToCheck} via Class.subjects`);
                isTeacherAssignedToSubject = true;
                break;
              }
            }
          }

          // Method 2: Check TeacherSubject
          if (!isTeacherAssignedToSubject) {
            const teacherSubject = await TeacherSubject.findOne({
              teacherId,
              classId: classIdToCheck,
              subjectId: subjectIdToCheck,
              status: 'active'
            });

            if (teacherSubject) {
              logger.info(`Teacher ${teacherId} is assigned to subject ${subjectIdToCheck} in O-Level class ${classIdToCheck} via TeacherSubject model`);
              isTeacherAssignedToSubject = true;
            }
          }

          // Method 3: Check TeacherAssignment
          if (!isTeacherAssignedToSubject) {
            const TeacherAssignment = require('../models/TeacherAssignment');
            const teacherAssignment = await TeacherAssignment.findOne({
              teacher: teacherId,
              class: classIdToCheck,
              subject: subjectIdToCheck
            });

            if (teacherAssignment) {
              logger.info(`Teacher ${teacherId} is assigned to subject ${subjectIdToCheck} in O-Level class ${classIdToCheck} via TeacherAssignment model`);
              isTeacherAssignedToSubject = true;
            }
          }

          if (!isTeacherAssignedToSubject) {
            logger.warn(`Teacher ${teacherId} is not assigned to subject ${subjectIdToCheck} in O-Level class ${classIdToCheck}`);
            return res.status(403).json({
              success: false,
              message: 'You are not assigned to teach this subject in this class'
            });
          }

          // Now, check if this is a core or optional subject
          const Subject = require('../models/Subject');
          const subject = await Subject.findById(subjectIdToCheck);
          const isCoreSubject = subject && subject.type === 'CORE';

          if (isCoreSubject) {
            // If it's a core subject, all students take it
            logger.info(`Subject ${subjectIdToCheck} is a core subject, all students in class ${classIdToCheck} take it`);
            allStudentsAuthorized = true;
          } else {
            // If it's an optional subject, we need to filter students who take it
            logger.info(`Subject ${subjectIdToCheck} is an optional subject, filtering students in class ${classIdToCheck} who take it`);

            // Get all students in the class
            const Student = require('../models/Student');
            const students = await Student.find({ class: classIdToCheck });

            // Get student IDs
            const studentIds = students.map(student => student._id.toString());

            // Get subject selections for these students
            const StudentSubjectSelection = require('../models/StudentSubjectSelection');
            const subjectSelections = await StudentSubjectSelection.find({
              student: { $in: studentIds },
              status: 'APPROVED'
            });

            // Create a set of student IDs who take this subject
            const studentsTakingSubject = new Set();

            // Check each selection
            for (const selection of subjectSelections) {
              // Check if the subject is in the optional subjects list
              const optionalSubjects = selection.optionalSubjects.map(s => s.toString());
              if (optionalSubjects.includes(subjectIdToCheck)) {
                studentsTakingSubject.add(selection.student.toString());
              }
            }

            // Also check students with direct subject assignments
            for (const student of students) {
              if (student.selectedSubjects && Array.isArray(student.selectedSubjects)) {
                const selectedSubjects = student.selectedSubjects.map(s =>
                  typeof s === 'object' && s._id ? s._id.toString() : s.toString());
                if (selectedSubjects.includes(subjectIdToCheck)) {
                  studentsTakingSubject.add(student._id.toString());
                }
              }
            }

            // Store the filtered student IDs
            assignedStudentIds = Array.from(studentsTakingSubject);
            logger.info(`Found ${assignedStudentIds.length} students who take subject ${subjectIdToCheck} in class ${classIdToCheck}`);

            // Check if any marks are for students not assigned to this subject
            const unauthorizedMarks = req.body.filter(
              mark => mark.marksObtained !== '' && !assignedStudentIds.includes(mark.studentId)
            );

            if (unauthorizedMarks.length > 0) {
              logger.warn(`Teacher ${teacherId} attempted to enter marks for ${unauthorizedMarks.length} unauthorized students in class ${classIdToCheck} for subject ${subjectIdToCheck}`);
              return res.status(403).json({
                success: false,
                message: 'You are not authorized to enter marks for some students',
                details: `${unauthorizedMarks.length} students do not take this optional subject`,
                unauthorizedStudentIds: unauthorizedMarks.map(mark => mark.studentId)
              });
            }

            // If we get here, all students are authorized
            allStudentsAuthorized = true;
          }
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
