/**
 * Prisma Exam Service
 * 
 * This service handles exam-related operations using Prisma.
 */

const prisma = require('../../lib/prisma');
const logger = require('../../utils/logger');

/**
 * Create a new exam
 * @param {Object} examData - Exam data
 * @returns {Promise<Object>} - Newly created exam
 */
async function createExam(examData) {
  const {
    name,
    type,
    examTypeId,
    academicYearId,
    term,
    startDate,
    endDate,
    status = 'DRAFT'
  } = examData;
  
  try {
    logger.info(`[PrismaExamService] Creating new exam: ${name}`);
    
    // Validate required fields
    if (!name || !type || !examTypeId || !academicYearId || !term) {
      return {
        success: false,
        message: 'Missing required fields: name, type, examTypeId, academicYearId, term'
      };
    }
    
    // Create exam
    const exam = await prisma.exam.create({
      data: {
        name,
        type,
        examTypeId,
        academicYearId,
        term,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status
      }
    });
    
    logger.info(`[PrismaExamService] Exam created successfully: ${exam.id}`);
    
    return {
      success: true,
      data: exam
    };
  } catch (error) {
    logger.error(`[PrismaExamService] Error creating exam: ${error.message}`, error);
    return {
      success: false,
      message: `Error creating exam: ${error.message}`,
      error
    };
  }
}

/**
 * Get exam by ID
 * @param {string} examId - Exam ID
 * @returns {Promise<Object>} - Exam details
 */
async function getExamById(examId) {
  try {
    logger.info(`[PrismaExamService] Getting exam by ID: ${examId}`);
    
    const exam = await prisma.exam.findUnique({
      where: { id: examId }
    });
    
    if (!exam) {
      logger.warn(`[PrismaExamService] Exam not found: ${examId}`);
      return {
        success: false,
        message: 'Exam not found'
      };
    }
    
    return {
      success: true,
      data: exam
    };
  } catch (error) {
    logger.error(`[PrismaExamService] Error getting exam: ${error.message}`, error);
    return {
      success: false,
      message: `Error getting exam: ${error.message}`,
      error
    };
  }
}

/**
 * Update an existing exam
 * @param {string} examId - Exam ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Updated exam
 */
async function updateExam(examId, updateData) {
  try {
    logger.info(`[PrismaExamService] Updating exam: ${examId}`);
    
    // Check if exam exists
    const existingExam = await prisma.exam.findUnique({
      where: { id: examId }
    });
    
    if (!existingExam) {
      logger.warn(`[PrismaExamService] Exam not found: ${examId}`);
      return {
        success: false,
        message: 'Exam not found'
      };
    }
    
    // Prepare update data
    const {
      name,
      type,
      examTypeId,
      academicYearId,
      term,
      startDate,
      endDate,
      status
    } = updateData;
    
    // Update exam
    const updatedExam = await prisma.exam.update({
      where: { id: examId },
      data: {
        name: name !== undefined ? name : undefined,
        type: type !== undefined ? type : undefined,
        examTypeId: examTypeId !== undefined ? examTypeId : undefined,
        academicYearId: academicYearId !== undefined ? academicYearId : undefined,
        term: term !== undefined ? term : undefined,
        startDate: startDate !== undefined ? new Date(startDate) : undefined,
        endDate: endDate !== undefined ? new Date(endDate) : undefined,
        status: status !== undefined ? status : undefined
      }
    });
    
    logger.info(`[PrismaExamService] Exam updated successfully: ${examId}`);
    
    return {
      success: true,
      data: updatedExam
    };
  } catch (error) {
    logger.error(`[PrismaExamService] Error updating exam: ${error.message}`, error);
    return {
      success: false,
      message: `Error updating exam: ${error.message}`,
      error
    };
  }
}

/**
 * Get exams by academic year
 * @param {string} academicYearId - Academic year ID
 * @returns {Promise<Object>} - List of exams
 */
async function getExamsByAcademicYear(academicYearId) {
  try {
    logger.info(`[PrismaExamService] Getting exams for academic year: ${academicYearId}`);
    
    const exams = await prisma.exam.findMany({
      where: { academicYearId },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return {
      success: true,
      data: exams
    };
  } catch (error) {
    logger.error(`[PrismaExamService] Error getting exams by academic year: ${error.message}`, error);
    return {
      success: false,
      message: `Error getting exams by academic year: ${error.message}`,
      error
    };
  }
}

/**
 * Get exams by term
 * @param {string} academicYearId - Academic year ID
 * @param {string} term - Term (e.g., 'TERM1', 'TERM2', 'TERM3')
 * @returns {Promise<Object>} - List of exams
 */
async function getExamsByTerm(academicYearId, term) {
  try {
    logger.info(`[PrismaExamService] Getting exams for academic year ${academicYearId}, term ${term}`);
    
    const exams = await prisma.exam.findMany({
      where: { 
        academicYearId,
        term
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return {
      success: true,
      data: exams
    };
  } catch (error) {
    logger.error(`[PrismaExamService] Error getting exams by term: ${error.message}`, error);
    return {
      success: false,
      message: `Error getting exams by term: ${error.message}`,
      error
    };
  }
}

/**
 * Delete an exam
 * @param {string} examId - Exam ID
 * @returns {Promise<Object>} - Result of the operation
 */
async function deleteExam(examId) {
  try {
    logger.info(`[PrismaExamService] Deleting exam: ${examId}`);
    
    // Check if exam exists
    const existingExam = await prisma.exam.findUnique({
      where: { id: examId }
    });
    
    if (!existingExam) {
      logger.warn(`[PrismaExamService] Exam not found: ${examId}`);
      return {
        success: false,
        message: 'Exam not found'
      };
    }
    
    // Check if there are any results associated with this exam
    const resultsCount = await prisma.result.count({
      where: { examId }
    });
    
    if (resultsCount > 0) {
      logger.warn(`[PrismaExamService] Cannot delete exam with associated results: ${examId}`);
      return {
        success: false,
        message: `Cannot delete exam with ${resultsCount} associated results`
      };
    }
    
    // Delete exam
    await prisma.exam.delete({
      where: { id: examId }
    });
    
    logger.info(`[PrismaExamService] Exam deleted successfully: ${examId}`);
    
    return {
      success: true,
      message: 'Exam deleted successfully'
    };
  } catch (error) {
    logger.error(`[PrismaExamService] Error deleting exam: ${error.message}`, error);
    return {
      success: false,
      message: `Error deleting exam: ${error.message}`,
      error
    };
  }
}

module.exports = {
  createExam,
  getExamById,
  updateExam,
  getExamsByAcademicYear,
  getExamsByTerm,
  deleteExam
};
