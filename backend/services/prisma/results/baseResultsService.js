/**
 * Prisma Base Results Service
 * 
 * This service provides base functionality for results-related operations using Prisma.
 */

const prisma = require('../../../lib/prisma');
const logger = require('../../../utils/logger');

/**
 * Get results for a student in an exam
 * @param {Object} params - Parameters
 * @param {string} params.studentId - Student ID
 * @param {string} params.examId - Exam ID
 * @returns {Promise<Object>} - Result of the operation
 */
async function getStudentResults({ studentId, examId }) {
  try {
    logger.info(`[PrismaResultsService] Getting results for student ${studentId}, exam ${examId}`);
    
    // Validate required fields
    if (!studentId || !examId) {
      logger.warn('[PrismaResultsService] Missing required fields');
      return {
        success: false,
        message: 'Missing required fields: studentId, examId'
      };
    }
    
    // Get student details
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        admissionNumber: true,
        firstName: true,
        lastName: true,
        classId: true,
        educationLevel: true
      }
    });
    
    if (!student) {
      logger.warn(`[PrismaResultsService] Student with ID ${studentId} not found`);
      return {
        success: false,
        message: `Student with ID ${studentId} not found`
      };
    }
    
    // Handle differently based on education level
    if (student.educationLevel === 'O_LEVEL') {
      return require('./oLevelResultsService').getOLevelStudentResults({ studentId, examId, student });
    } else if (student.educationLevel === 'A_LEVEL') {
      return require('./aLevelResultsService').getALevelStudentResults({ studentId, examId, student });
    } else {
      logger.warn(`[PrismaResultsService] Unsupported education level: ${student.educationLevel}`);
      return {
        success: false,
        message: `Unsupported education level: ${student.educationLevel}`
      };
    }
  } catch (error) {
    logger.error(`[PrismaResultsService] Error getting student results: ${error.message}`, error);
    return {
      success: false,
      message: `Error getting student results: ${error.message}`,
      error
    };
  }
}

/**
 * Get class results for an exam
 * @param {Object} params - Parameters
 * @param {string} params.classId - Class ID
 * @param {string} params.examId - Exam ID
 * @returns {Promise<Object>} - Result of the operation
 */
async function getClassResults({ classId, examId }) {
  try {
    logger.info(`[PrismaResultsService] Getting class results for class ${classId}, exam ${examId}`);
    
    // Validate required fields
    if (!classId || !examId) {
      logger.warn('[PrismaResultsService] Missing required fields');
      return {
        success: false,
        message: 'Missing required fields: classId, examId'
      };
    }
    
    // Get class details
    const classObj = await prisma.class.findUnique({
      where: { id: classId },
      select: {
        id: true,
        name: true,
        academicYearId: true,
        educationLevel: true
      }
    });
    
    if (!classObj) {
      logger.warn(`[PrismaResultsService] Class with ID ${classId} not found`);
      return {
        success: false,
        message: `Class with ID ${classId} not found`
      };
    }
    
    // Handle differently based on education level
    if (classObj.educationLevel === 'O_LEVEL') {
      return require('./oLevelResultsService').getOLevelClassResults({ classId, examId, classObj });
    } else if (classObj.educationLevel === 'A_LEVEL') {
      return require('./aLevelResultsService').getALevelClassResults({ classId, examId, classObj });
    } else {
      logger.warn(`[PrismaResultsService] Unsupported education level: ${classObj.educationLevel}`);
      return {
        success: false,
        message: `Unsupported education level: ${classObj.educationLevel}`
      };
    }
  } catch (error) {
    logger.error(`[PrismaResultsService] Error getting class results: ${error.message}`, error);
    return {
      success: false,
      message: `Error getting class results: ${error.message}`,
      error
    };
  }
}

/**
 * Generate student report
 * @param {Object} params - Parameters
 * @param {string} params.studentId - Student ID
 * @param {string} params.examId - Exam ID
 * @returns {Promise<Object>} - Result of the operation
 */
async function generateStudentReport({ studentId, examId }) {
  try {
    logger.info(`[PrismaResultsService] Generating report for student ${studentId}, exam ${examId}`);
    
    // Validate required fields
    if (!studentId || !examId) {
      logger.warn('[PrismaResultsService] Missing required fields');
      return {
        success: false,
        message: 'Missing required fields: studentId, examId'
      };
    }
    
    // Get student details
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        admissionNumber: true,
        firstName: true,
        lastName: true,
        classId: true,
        educationLevel: true
      }
    });
    
    if (!student) {
      logger.warn(`[PrismaResultsService] Student with ID ${studentId} not found`);
      return {
        success: false,
        message: `Student with ID ${studentId} not found`
      };
    }
    
    // Handle differently based on education level
    if (student.educationLevel === 'O_LEVEL') {
      return require('./oLevelResultsService').generateOLevelStudentReport({ studentId, examId, student });
    } else if (student.educationLevel === 'A_LEVEL') {
      return require('./aLevelResultsService').generateALevelStudentReport({ studentId, examId, student });
    } else {
      logger.warn(`[PrismaResultsService] Unsupported education level: ${student.educationLevel}`);
      return {
        success: false,
        message: `Unsupported education level: ${student.educationLevel}`
      };
    }
  } catch (error) {
    logger.error(`[PrismaResultsService] Error generating student report: ${error.message}`, error);
    return {
      success: false,
      message: `Error generating student report: ${error.message}`,
      error
    };
  }
}

/**
 * Generate class report
 * @param {Object} params - Parameters
 * @param {string} params.classId - Class ID
 * @param {string} params.examId - Exam ID
 * @returns {Promise<Object>} - Result of the operation
 */
async function generateClassReport({ classId, examId }) {
  try {
    logger.info(`[PrismaResultsService] Generating class report for class ${classId}, exam ${examId}`);
    
    // Validate required fields
    if (!classId || !examId) {
      logger.warn('[PrismaResultsService] Missing required fields');
      return {
        success: false,
        message: 'Missing required fields: classId, examId'
      };
    }
    
    // Get class details
    const classObj = await prisma.class.findUnique({
      where: { id: classId },
      select: {
        id: true,
        name: true,
        academicYearId: true,
        educationLevel: true
      }
    });
    
    if (!classObj) {
      logger.warn(`[PrismaResultsService] Class with ID ${classId} not found`);
      return {
        success: false,
        message: `Class with ID ${classId} not found`
      };
    }
    
    // Handle differently based on education level
    if (classObj.educationLevel === 'O_LEVEL') {
      return require('./oLevelResultsService').generateOLevelClassReport({ classId, examId, classObj });
    } else if (classObj.educationLevel === 'A_LEVEL') {
      return require('./aLevelResultsService').generateALevelClassReport({ classId, examId, classObj });
    } else {
      logger.warn(`[PrismaResultsService] Unsupported education level: ${classObj.educationLevel}`);
      return {
        success: false,
        message: `Unsupported education level: ${classObj.educationLevel}`
      };
    }
  } catch (error) {
    logger.error(`[PrismaResultsService] Error generating class report: ${error.message}`, error);
    return {
      success: false,
      message: `Error generating class report: ${error.message}`,
      error
    };
  }
}

module.exports = {
  getStudentResults,
  getClassResults,
  generateStudentReport,
  generateClassReport
};
