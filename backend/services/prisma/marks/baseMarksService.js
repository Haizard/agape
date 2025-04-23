/**
 * Prisma Base Marks Service
 *
 * This service provides base functionality for marks entry operations using Prisma.
 */

const prisma = require('../../../lib/prisma');
const logger = require('../../../utils/logger');
const subjectService = require('../subject');
const gradeCalculator = require('../../../utils/unifiedGradeCalculator');

/**
 * Enter marks for a student
 * @param {Object} data - Marks data
 * @returns {Promise<Object>} - Result of the operation
 */
async function enterMarks(data) {
  try {
    const {
      studentId,
      examId,
      subjectId,
      classId,
      academicYearId,
      marksObtained,
      enteredBy,
      comment
    } = data;

    logger.info(`[PrismaMarksService] Entering marks for student ${studentId}, subject ${subjectId}, exam ${examId}`);

    // Validate required fields
    if (!studentId || !examId || !subjectId || !classId || !academicYearId || marksObtained === undefined || !enteredBy) {
      logger.warn('[PrismaMarksService] Missing required fields');
      return {
        success: false,
        message: 'Missing required fields: studentId, examId, subjectId, classId, academicYearId, marksObtained, enteredBy'
      };
    }

    // Validate marks range
    if (marksObtained < 0 || marksObtained > 100) {
      logger.warn(`[PrismaMarksService] Invalid marks: ${marksObtained}`);
      return {
        success: false,
        message: 'Marks must be between 0 and 100'
      };
    }

    // Get student to determine education level
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      logger.warn(`[PrismaMarksService] Student with ID ${studentId} not found`);
      return {
        success: false,
        message: `Student with ID ${studentId} not found`
      };
    }

    // Handle differently based on education level
    if (student.educationLevel === 'O_LEVEL') {
      return require('./oLevelMarksService').enterOLevelMarks(data, student);
    } else if (student.educationLevel === 'A_LEVEL') {
      return require('./aLevelMarksService').enterALevelMarks(data, student);
    } else {
      logger.warn(`[PrismaMarksService] Unsupported education level: ${student.educationLevel}`);
      return {
        success: false,
        message: `Unsupported education level: ${student.educationLevel}`
      };
    }
  } catch (error) {
    logger.error(`[PrismaMarksService] Error entering marks: ${error.message}`, error);
    return {
      success: false,
      message: `Error entering marks: ${error.message}`,
      error
    };
  }
}

/**
 * Enter marks for multiple students
 * @param {Object} data - Batch marks data
 * @returns {Promise<Object>} - Result of the operation
 */
async function enterBatchMarks(data) {
  try {
    const {
      classId,
      subjectId,
      examId,
      academicYearId,
      studentMarks,
      enteredBy
    } = data;

    logger.info(`[PrismaMarksService] Entering batch marks for class ${classId}, subject ${subjectId}, exam ${examId}`);

    // Validate required fields
    if (!classId || !subjectId || !examId || !academicYearId || !studentMarks || !Array.isArray(studentMarks) || !enteredBy) {
      logger.warn('[PrismaMarksService] Missing required fields for batch marks entry');
      return {
        success: false,
        message: 'Missing required fields: classId, subjectId, examId, academicYearId, studentMarks, enteredBy'
      };
    }

    const results = [];
    const errors = [];

    // Process each student's marks
    for (const studentMark of studentMarks) {
      const { studentId, marksObtained, comment, isPrincipal, isSubsidiary } = studentMark;

      if (!studentId || marksObtained === undefined) {
        errors.push({
          studentId,
          error: 'Missing studentId or marksObtained'
        });
        continue;
      }

      const result = await enterMarks({
        studentId,
        examId,
        subjectId,
        classId,
        academicYearId,
        marksObtained,
        enteredBy,
        comment,
        isPrincipal,
        isSubsidiary
      });

      if (result.success) {
        results.push(result.data);
      } else {
        errors.push({
          studentId,
          error: result.message
        });
      }
    }

    logger.info(`[PrismaMarksService] Batch marks entry completed: ${results.length} successful, ${errors.length} failed`);

    return {
      success: errors.length === 0,
      message: `Saved marks for ${results.length} students, failed for ${errors.length} students`,
      data: {
        results,
        errors
      }
    };
  } catch (error) {
    logger.error(`[PrismaMarksService] Error entering batch marks: ${error.message}`, error);
    return {
      success: false,
      message: `Error entering batch marks: ${error.message}`,
      error
    };
  }
}

/**
 * Check if a teacher is authorized to enter marks
 * @param {string} teacherId - Teacher ID
 * @param {string} subjectId - Subject ID
 * @param {string} classId - Class ID
 * @returns {Promise<Object>} - Result of the operation
 */
async function checkTeacherAuthorization(teacherId, subjectId, classId) {
  try {
    logger.info(`[PrismaMarksService] Checking if teacher ${teacherId} is authorized for subject ${subjectId} in class ${classId}`);

    const isAuthorized = await subjectService.isTeacherAuthorizedForSubject(teacherId, subjectId, classId);

    return {
      success: true,
      isAuthorized
    };
  } catch (error) {
    logger.error(`[PrismaMarksService] Error checking teacher authorization: ${error.message}`, error);
    return {
      success: false,
      message: `Error checking teacher authorization: ${error.message}`,
      error
    };
  }
}

module.exports = {
  enterMarks,
  enterBatchMarks,
  checkTeacherAuthorization
};
