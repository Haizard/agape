/**
 * Prisma Marks Check Service
 *
 * This service handles checking existing marks for classes, subjects, and exams.
 */

const prisma = require('../../../lib/prisma');
const logger = require('../../../utils/logger');
const gradeCalculator = require('../../../utils/unifiedGradeCalculator');
const subjectService = require('../subjectService');

/**
 * Check existing marks for a class, subject, and exam
 * @param {Object} params - Parameters
 * @param {string} params.classId - Class ID
 * @param {string} params.subjectId - Subject ID
 * @param {string} params.examId - Exam ID
 * @param {string} params.teacherId - Teacher ID (optional, for filtering by teacher)
 * @returns {Promise<Object>} - Result of the operation
 */
async function checkExistingMarks({ classId, subjectId, examId, teacherId }) {
  try {
    logger.info(`[PrismaMarksCheckService] Checking existing marks for class ${classId}, subject ${subjectId}, exam ${examId}`);

    // Validate required fields
    if (!classId || !subjectId || !examId) {
      logger.warn('[PrismaMarksCheckService] Missing required fields for checking marks');
      return {
        success: false,
        message: 'Missing required fields: classId, subjectId, examId'
      };
    }

    // Get class details to determine education level
    const classObj = await prisma.class.findUnique({
      where: { id: classId }
    });

    if (!classObj) {
      logger.warn(`[PrismaMarksCheckService] Class with ID ${classId} not found`);
      return {
        success: false,
        message: `Class with ID ${classId} not found`
      };
    }

    // Handle differently based on education level
    if (classObj.educationLevel === 'O_LEVEL') {
      return require('./oLevelMarksService').checkExistingOLevelMarks({ classId, subjectId, examId, teacherId });
    } else if (classObj.educationLevel === 'A_LEVEL') {
      return require('./aLevelMarksService').checkExistingALevelMarks({ classId, subjectId, examId, teacherId });
    } else {
      logger.warn(`[PrismaMarksCheckService] Unsupported education level: ${classObj.educationLevel}`);
      return {
        success: false,
        message: `Unsupported education level: ${classObj.educationLevel}`
      };
    }
  } catch (error) {
    logger.error(`[PrismaMarksCheckService] Error checking existing marks: ${error.message}`, error);
    return {
      success: false,
      message: `Error checking existing marks: ${error.message}`,
      error
    };
  }
}

/**
 * Check marks for a specific student, subject, and exam
 * @param {Object} params - Check parameters
 * @param {string} params.studentId - Student ID
 * @param {string} params.subjectId - Subject ID
 * @param {string} params.examId - Exam ID
 * @returns {Promise<Object>} - Result with student marks
 */
async function checkStudentMarks(params) {
  try {
    const { studentId, subjectId, examId } = params;

    logger.info(`[PrismaMarksCheckService] Checking marks for student ${studentId}, subject ${subjectId}, exam ${examId}`);

    // Validate required fields
    if (!studentId || !subjectId || !examId) {
      logger.warn('[PrismaMarksCheckService] Missing required fields for checking student marks');
      return {
        success: false,
        message: 'Missing required fields: studentId, subjectId, examId'
      };
    }

    // Get student details
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        educationLevel: true
      }
    });

    if (!student) {
      logger.warn(`[PrismaMarksCheckService] Student with ID ${studentId} not found`);
      return {
        success: false,
        message: `Student with ID ${studentId} not found`
      };
    }

    // Get result for this student, subject, and exam
    const result = await prisma.result.findFirst({
      where: {
        studentId,
        subjectId,
        examId
      }
    });

    logger.info(`[PrismaMarksCheckService] ${result ? 'Found' : 'Did not find'} marks for student ${studentId}, subject ${subjectId}, exam ${examId}`);

    return {
      success: true,
      studentId,
      studentName: `${student.firstName} ${student.lastName}`,
      educationLevel: student.educationLevel,
      hasExistingMarks: !!result,
      marksObtained: result ? result.marksObtained : '',
      grade: result ? result.grade : '',
      points: result ? result.points : '',
      comment: result ? result.comment : '',
      resultId: result ? result.id : null
    };
  } catch (error) {
    logger.error(`[PrismaMarksCheckService] Error checking student marks: ${error.message}`, error);
    return {
      success: false,
      message: `Error checking student marks: ${error.message}`,
      error
    };
  }
}

/**
 * Validate if a student is eligible to take a subject
 * @param {string} studentId - Student ID
 * @param {string} subjectId - Subject ID
 * @returns {Promise<Object>} - Result with validation info
 */
async function validateStudentSubjectEligibility(studentId, subjectId) {
  try {
    logger.info(`[PrismaMarksCheckService] Validating if student ${studentId} is eligible for subject ${subjectId}`);

    // Get student details
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: true
      }
    });

    if (!student) {
      logger.warn(`[PrismaMarksCheckService] Student with ID ${studentId} not found`);
      return {
        success: false,
        message: `Student with ID ${studentId} not found`,
        isEligible: false
      };
    }

    // Get subject details
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId }
    });

    if (!subject) {
      logger.warn(`[PrismaMarksCheckService] Subject with ID ${subjectId} not found`);
      return {
        success: false,
        message: `Subject with ID ${subjectId} not found`,
        isEligible: false
      };
    }

    // Check if education levels match
    if (subject.educationLevel !== 'BOTH' && subject.educationLevel !== student.educationLevel) {
      logger.warn(`[PrismaMarksCheckService] Education level mismatch: Student is ${student.educationLevel}, Subject is ${subject.educationLevel}`);
      return {
        success: true,
        isEligible: false,
        message: `Education level mismatch: Student is ${student.educationLevel}, Subject is ${subject.educationLevel}`,
        student,
        subject
      };
    }

    // Handle differently based on education level
    if (student.educationLevel === 'O_LEVEL') {
      // For O-Level, check if subject is core or selected by student
      if (subject.type === 'CORE') {
        // All O-Level students take core subjects
        return {
          success: true,
          isEligible: true,
          message: 'Student is eligible for this core subject',
          student,
          subject
        };
      } else {
        // For optional subjects, check if student has selected it
        const selection = await prisma.studentSubjectSelection.findFirst({
          where: {
            studentId: student.id
          },
          include: {
            subjects: {
              where: {
                subjectId,
                selectionType: 'OPTIONAL'
              }
            }
          }
        });

        const hasSelected = selection && selection.subjects.length > 0;

        return {
          success: true,
          isEligible: hasSelected,
          message: hasSelected
            ? 'Student has selected this optional subject'
            : 'Student has not selected this optional subject',
          student,
          subject,
          warning: !hasSelected ? 'Entering marks for a subject not selected by the student' : null
        };
      }
    } else if (student.educationLevel === 'A_LEVEL') {
      // For A-Level, check if subject is in student's combination
      if (!student.subjectCombinationId) {
        logger.warn(`[PrismaMarksCheckService] A-Level student ${studentId} has no subject combination`);
        return {
          success: true,
          isEligible: false,
          message: 'A-Level student has no subject combination assigned',
          student,
          subject,
          warning: 'Student has no subject combination assigned'
        };
      }

      // Check if subject is in student's combination
      const combinationItem = await prisma.subjectCombinationItem.findFirst({
        where: {
          combinationId: student.subjectCombinationId,
          subjectId
        }
      });

      const isInCombination = !!combinationItem;

      return {
        success: true,
        isEligible: isInCombination,
        message: isInCombination
          ? `Subject is in student's combination${combinationItem.isPrincipal ? ' as principal' : combinationItem.isSubsidiary ? ' as subsidiary' : ''}`
          : 'Subject is not in student\'s combination',
        student,
        subject,
        isPrincipal: combinationItem?.isPrincipal || false,
        isSubsidiary: combinationItem?.isSubsidiary || false,
        warning: !isInCombination ? 'Entering marks for a subject not in student\'s combination' : null
      };
    }

    // Default case for unsupported education levels
    logger.warn(`[PrismaMarksCheckService] Unsupported education level: ${student.educationLevel}`);
    return {
      success: false,
      isEligible: false,
      message: `Unsupported education level: ${student.educationLevel}`,
      student,
      subject
    };
  } catch (error) {
    logger.error(`[PrismaMarksCheckService] Error validating student subject eligibility: ${error.message}`, error);
    return {
      success: false,
      isEligible: false,
      message: `Error validating student subject eligibility: ${error.message}`,
      error
    };
  }
}

module.exports = {
  checkExistingMarks,
  checkStudentMarks,
  validateStudentSubjectEligibility
};
