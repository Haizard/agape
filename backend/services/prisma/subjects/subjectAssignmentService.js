/**
 * Prisma Subject Assignment Service
 *
 * This service provides functionality for assigning subjects to students using Prisma.
 */

const prisma = require('../../../lib/prisma');
const logger = require('../../../utils/logger');

/**
 * Assign a subject to a student
 * @param {Object} params - Parameters
 * @param {string} params.studentId - Student ID
 * @param {string} params.subjectId - Subject ID
 * @param {boolean} params.isPrincipal - Whether this is a principal subject
 * @returns {Promise<Object>} - Result of the operation
 */
async function assignSubjectToStudent({ studentId, subjectId, isPrincipal = false }) {
  try {
    logger.info(`[PrismaSubjectAssignmentService] Assigning subject ${subjectId} to student ${studentId}`);

    // Validate required fields
    if (!studentId || !subjectId) {
      logger.warn('[PrismaSubjectAssignmentService] Missing required fields');
      return {
        success: false,
        message: 'Missing required fields: studentId, subjectId'
      };
    }

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        subjects: true
      }
    });

    if (!student) {
      logger.warn(`[PrismaSubjectAssignmentService] Student with ID ${studentId} not found`);
      return {
        success: false,
        message: `Student with ID ${studentId} not found`
      };
    }

    // Check if subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId }
    });

    if (!subject) {
      logger.warn(`[PrismaSubjectAssignmentService] Subject with ID ${subjectId} not found`);
      return {
        success: false,
        message: `Subject with ID ${subjectId} not found`
      };
    }

    // Check if the student already has this subject
    const existingAssignment = await prisma.studentSubject.findFirst({
      where: {
        studentId,
        subjectId
      }
    });

    if (existingAssignment) {
      // Update the existing assignment if isPrincipal has changed
      if (existingAssignment.isPrincipal !== isPrincipal) {
        await prisma.studentSubject.update({
          where: { id: existingAssignment.id },
          data: { isPrincipal }
        });

        logger.info(`[PrismaSubjectAssignmentService] Updated subject assignment for student ${studentId}`);
        return {
          success: true,
          message: 'Subject assignment updated',
          data: {
            studentId,
            subjectId,
            isPrincipal
          }
        };
      }

      logger.info(`[PrismaSubjectAssignmentService] Student ${studentId} already has subject ${subjectId}`);
      return {
        success: true,
        message: 'Student already has this subject',
        data: {
          studentId,
          subjectId,
          isPrincipal: existingAssignment.isPrincipal
        }
      };
    }

    // Create a new subject assignment
    const assignment = await prisma.studentSubject.create({
      data: {
        studentId,
        subjectId,
        isPrincipal
      }
    });

    logger.info(`[PrismaSubjectAssignmentService] Subject ${subjectId} assigned to student ${studentId}`);
    return {
      success: true,
      message: 'Subject assigned to student',
      data: assignment
    };
  } catch (error) {
    logger.error(`[PrismaSubjectAssignmentService] Error assigning subject: ${error.message}`, error);
    return {
      success: false,
      message: `Error assigning subject: ${error.message}`,
      error
    };
  }
}

/**
 * Bulk assign a subject to multiple students
 * @param {Object} params - Parameters
 * @param {string[]} params.studentIds - Array of student IDs
 * @param {string} params.subjectId - Subject ID
 * @param {boolean} params.isPrincipal - Whether this is a principal subject
 * @returns {Promise<Object>} - Result of the operation
 */
async function bulkAssignSubject({ studentIds, subjectId, isPrincipal = false }) {
  try {
    logger.info(`[PrismaSubjectAssignmentService] Bulk assigning subject ${subjectId} to ${studentIds.length} students`);

    // Validate required fields
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0 || !subjectId) {
      logger.warn('[PrismaSubjectAssignmentService] Missing required fields');
      return {
        success: false,
        message: 'Missing required fields: studentIds (array), subjectId'
      };
    }

    // Check if subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId }
    });

    if (!subject) {
      logger.warn(`[PrismaSubjectAssignmentService] Subject with ID ${subjectId} not found`);
      return {
        success: false,
        message: `Subject with ID ${subjectId} not found`
      };
    }

    // Process each student
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const studentId of studentIds) {
      try {
        // Check if student exists
        const student = await prisma.student.findUnique({
          where: { id: studentId }
        });

        if (!student) {
          results.push({
            studentId,
            success: false,
            message: `Student with ID ${studentId} not found`
          });
          errorCount++;
          continue;
        }

        // Check if the student already has this subject
        const existingAssignment = await prisma.studentSubject.findFirst({
          where: {
            studentId,
            subjectId
          }
        });

        if (existingAssignment) {
          // Update the existing assignment if isPrincipal has changed
          if (existingAssignment.isPrincipal !== isPrincipal) {
            await prisma.studentSubject.update({
              where: { id: existingAssignment.id },
              data: { isPrincipal }
            });

            results.push({
              studentId,
              success: true,
              message: 'Subject assignment updated'
            });
            successCount++;
          } else {
            results.push({
              studentId,
              success: true,
              message: 'Student already has this subject'
            });
            successCount++;
          }
        } else {
          // Create a new subject assignment
          await prisma.studentSubject.create({
            data: {
              studentId,
              subjectId,
              isPrincipal
            }
          });

          results.push({
            studentId,
            success: true,
            message: 'Subject assigned to student'
          });
          successCount++;
        }
      } catch (error) {
        logger.error(`[PrismaSubjectAssignmentService] Error assigning subject to student ${studentId}: ${error.message}`);
        results.push({
          studentId,
          success: false,
          message: `Error: ${error.message}`
        });
        errorCount++;
      }
    }

    logger.info(`[PrismaSubjectAssignmentService] Bulk assignment completed: ${successCount} successful, ${errorCount} failed`);
    return {
      success: true,
      message: `Subject assigned to ${successCount} students, ${errorCount} failed`,
      data: {
        successCount,
        errorCount,
        results
      }
    };
  } catch (error) {
    logger.error(`[PrismaSubjectAssignmentService] Error in bulk subject assignment: ${error.message}`, error);
    return {
      success: false,
      message: `Error in bulk subject assignment: ${error.message}`,
      error
    };
  }
}

/**
 * Get students by subject for a class
 * @param {Object} params - Parameters
 * @param {string} params.classId - Class ID
 * @param {string} params.subjectId - Subject ID
 * @param {string} params.teacherId - Teacher ID (optional, for authorization)
 * @param {boolean} params.includeIneligible - Whether to include students who don't take the subject
 * @returns {Promise<Object>} - Result of the operation
 */
async function getStudentsBySubject({ classId, subjectId, teacherId, includeIneligible = false }) {
  try {
    logger.info(`[PrismaSubjectAssignmentService] Getting students for class ${classId}, subject ${subjectId}, includeIneligible=${includeIneligible}`);

    // Validate required fields
    if (!classId || !subjectId) {
      logger.warn('[PrismaSubjectAssignmentService] Missing required fields');
      return {
        success: false,
        message: 'Missing required fields: classId, subjectId'
      };
    }

    // Log the parameters for debugging
    logger.debug(`[PrismaSubjectAssignmentService] Parameters: classId=${classId}, subjectId=${subjectId}, teacherId=${teacherId || 'none'}, includeIneligible=${includeIneligible}`);

    // Get class details
    logger.debug(`[PrismaSubjectAssignmentService] Fetching class details for ID ${classId}`);
    const classObj = await prisma.class.findUnique({
      where: { id: classId },
      select: {
        id: true,
        name: true,
        educationLevel: true
      }
    });

    if (!classObj) {
      logger.warn(`[PrismaSubjectAssignmentService] Class with ID ${classId} not found`);
      return {
        success: false,
        message: `Class with ID ${classId} not found`
      };
    }

    logger.info(`[PrismaSubjectAssignmentService] Found class: ${classObj.name} (${classObj.educationLevel})`);

    // Get subject details
    logger.debug(`[PrismaSubjectAssignmentService] Fetching subject details for ID ${subjectId}`);
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: {
        id: true,
        name: true,
        code: true,
        educationLevel: true,
        type: true
      }
    });

    if (!subject) {
      logger.warn(`[PrismaSubjectAssignmentService] Subject with ID ${subjectId} not found`);
      return {
        success: false,
        message: `Subject with ID ${subjectId} not found`
      };
    }

    logger.info(`[PrismaSubjectAssignmentService] Found subject: ${subject.name} (${subject.code || 'No code'})`);

    // Check if the education levels match
    if (subject.educationLevel &&
        classObj.educationLevel &&
        subject.educationLevel !== 'BOTH' &&
        subject.educationLevel !== classObj.educationLevel) {
      logger.warn(`[PrismaSubjectAssignmentService] Education level mismatch: Class=${classObj.educationLevel}, Subject=${subject.educationLevel}`);
      // We'll continue anyway but log a warning
    }

    // Check if teacher is authorized to access this subject-class combination
    let isTeacherAuthorized = true;
    if (teacherId) {
      logger.debug(`[PrismaSubjectAssignmentService] Checking authorization for teacher ${teacherId}`);
      // Check if the teacher is assigned to this subject in this class
      const teacherSubject = await prisma.teacherSubject.findFirst({
        where: {
          teacherId,
          subjectId,
          classId,
          status: 'active'
        }
      });

      isTeacherAuthorized = !!teacherSubject;

      if (!isTeacherAuthorized) {
        logger.warn(`[PrismaSubjectAssignmentService] Teacher ${teacherId} is not authorized to access subject ${subjectId} in class ${classId}`);
        return {
          success: false,
          message: 'You are not authorized to access this subject in this class',
          data: {
            class: classObj,
            subject,
            students: [],
            eligibleCount: 0,
            totalCount: 0,
            authorized: false
          }
        };
      }

      logger.info(`[PrismaSubjectAssignmentService] Teacher ${teacherId} is authorized to access subject ${subject.name} in class ${classObj.name}`);
    }

    // Get all students in the class
    logger.debug(`[PrismaSubjectAssignmentService] Fetching students for class ${classId}`);
    const students = await prisma.student.findMany({
      where: {
        classId,
        educationLevel: classObj.educationLevel,
        status: 'active' // Only include active students
      },
      include: {
        subjects: {
          include: {
            subject: true
          }
        },
        // Include subject combination information
        subjectCombination: {
          include: {
            subjects: {
              include: {
                subject: true
              }
            }
          }
        }
      },
      orderBy: {
        firstName: 'asc' // Order by first name for consistency
      }
    });

    logger.info(`[PrismaSubjectAssignmentService] Found ${students.length} students in class ${classObj.name}`);

    // Process students to determine eligibility
    logger.debug(`[PrismaSubjectAssignmentService] Processing ${students.length} students to determine eligibility`);
    const processedStudents = students.map(student => {
      // Check if student has this subject directly assigned
      const directSubjects = student.subjects.filter(s => s.subjectId === subjectId);
      const hasDirectSubject = directSubjects.length > 0;
      const directSubject = directSubjects[0];
      const isPrincipal = directSubject?.isPrincipal || false;

      // Check if student has this subject in their combination
      let hasSubjectInCombination = false;
      let combinationSubject = null;

      if (student.subjectCombination?.subjects) {
        // Find the subject in the combination
        combinationSubject = student.subjectCombination.subjects.find(s => {
          // Check by ID
          if (s.subjectId === subjectId) return true;

          // Check by reference
          if (s.subject && s.subject.id === subjectId) return true;

          return false;
        });

        hasSubjectInCombination = !!combinationSubject;
      }

      // Student is eligible if they have the subject directly assigned or in their combination
      const isEligible = hasDirectSubject || hasSubjectInCombination;

      // Determine if it's a principal subject (from either direct assignment or combination)
      const isPrincipalFromCombination = combinationSubject?.isPrincipal || false;
      const finalIsPrincipal = isPrincipal || isPrincipalFromCombination;

      // Log detailed eligibility information for debugging
      logger.debug(`[PrismaSubjectAssignmentService] Student ${student.id} (${student.firstName} ${student.lastName}): ` +
        `directAssignment=${hasDirectSubject}, inCombination=${hasSubjectInCombination}, ` +
        `isPrincipal=${finalIsPrincipal}, isEligible=${isEligible}`);

      return {
        id: student.id,
        studentId: student.id,
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown Student',
        isEligible,
        isPrincipal: finalIsPrincipal,
        hasDirectAssignment: hasDirectSubject,
        hasSubjectInCombination,
        eligibilityMessage: isEligible ? null : 'Subject is not in student\'s combination'
      };
    });

    // Filter students based on eligibility if required
    const filteredStudents = includeIneligible
      ? processedStudents
      : processedStudents.filter(student => student.isEligible);

    const eligibleCount = processedStudents.filter(s => s.isEligible).length;
    logger.info(`[PrismaSubjectAssignmentService] ${eligibleCount} out of ${processedStudents.length} students are eligible for subject ${subject.name}`);
    logger.info(`[PrismaSubjectAssignmentService] Returning ${filteredStudents.length} students (includeIneligible=${includeIneligible})`);

    return {
      success: true,
      data: {
        class: classObj,
        subject,
        students: filteredStudents,
        eligibleCount,
        totalCount: processedStudents.length,
        authorized: isTeacherAuthorized
      }
    };
  } catch (error) {
    logger.error(`[PrismaSubjectAssignmentService] Error getting students by subject: ${error.message}`, error);
    return {
      success: false,
      message: `Error getting students by subject: ${error.message}`,
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    };
  }
}

module.exports = {
  assignSubjectToStudent,
  bulkAssignSubject,
  getStudentsBySubject
};
