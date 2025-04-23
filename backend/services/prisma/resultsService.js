/**
 * Prisma Results Service
 * 
 * This service handles results-related operations using Prisma.
 */

const prisma = require('../../lib/prisma');
const logger = require('../../utils/logger');
const { calculateGrade, calculatePoints } = require('../../utils/gradeUtils');

/**
 * Create or update a student's result
 * @param {Object} resultData - Result data
 * @returns {Promise<Object>} - Result of the operation
 */
async function saveResult(resultData) {
  const {
    studentId,
    examId,
    subjectId,
    marks,
    enteredBy,
    comments
  } = resultData;
  
  try {
    logger.info(`[PrismaResultsService] Saving result for student ${studentId}, exam ${examId}, subject ${subjectId}`);
    
    // Validate required fields
    if (!studentId || !examId || !subjectId || marks === undefined) {
      return {
        success: false,
        message: 'Missing required fields: studentId, examId, subjectId, marks'
      };
    }
    
    // Calculate grade and points based on marks
    const grade = calculateGrade(marks);
    const points = calculatePoints(grade);
    
    // Check if result already exists
    const existingResult = await prisma.result.findFirst({
      where: {
        studentId,
        examId,
        subjectId
      }
    });
    
    let result;
    
    if (existingResult) {
      // Update existing result
      result = await prisma.result.update({
        where: { id: existingResult.id },
        data: {
          marks,
          grade,
          points,
          enteredBy,
          comments,
          updatedAt: new Date()
        }
      });
      
      logger.info(`[PrismaResultsService] Updated result: ${result.id}`);
    } else {
      // Create new result
      result = await prisma.result.create({
        data: {
          studentId,
          examId,
          subjectId,
          marks,
          grade,
          points,
          enteredBy,
          comments
        }
      });
      
      logger.info(`[PrismaResultsService] Created new result: ${result.id}`);
    }
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    logger.error(`[PrismaResultsService] Error saving result: ${error.message}`, error);
    return {
      success: false,
      message: `Error saving result: ${error.message}`,
      error
    };
  }
}

/**
 * Save multiple results in a batch
 * @param {Array} resultsData - Array of result data objects
 * @returns {Promise<Object>} - Result of the operation
 */
async function saveBatchResults(resultsData) {
  try {
    logger.info(`[PrismaResultsService] Saving batch of ${resultsData.length} results`);
    
    const results = [];
    const errors = [];
    
    // Process each result
    for (const resultData of resultsData) {
      const result = await saveResult(resultData);
      
      if (result.success) {
        results.push(result.data);
      } else {
        errors.push({
          data: resultData,
          error: result.message
        });
      }
    }
    
    return {
      success: errors.length === 0,
      message: `Saved ${results.length} results, failed ${errors.length} results`,
      data: {
        results,
        errors
      }
    };
  } catch (error) {
    logger.error(`[PrismaResultsService] Error saving batch results: ${error.message}`, error);
    return {
      success: false,
      message: `Error saving batch results: ${error.message}`,
      error
    };
  }
}

/**
 * Get results for a student
 * @param {string} studentId - Student ID
 * @param {string} examId - Exam ID (optional)
 * @returns {Promise<Object>} - Student results
 */
async function getStudentResults(studentId, examId = null) {
  try {
    logger.info(`[PrismaResultsService] Getting results for student ${studentId}${examId ? `, exam ${examId}` : ''}`);
    
    const whereClause = {
      studentId
    };
    
    if (examId) {
      whereClause.examId = examId;
    }
    
    const results = await prisma.result.findMany({
      where: whereClause,
      include: {
        subject: true,
        exam: true
      },
      orderBy: {
        subject: {
          name: 'asc'
        }
      }
    });
    
    return {
      success: true,
      data: results
    };
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
 * Get results for a class
 * @param {string} classId - Class ID
 * @param {string} examId - Exam ID
 * @returns {Promise<Object>} - Class results
 */
async function getClassResults(classId, examId) {
  try {
    logger.info(`[PrismaResultsService] Getting results for class ${classId}, exam ${examId}`);
    
    // Get all students in the class
    const students = await prisma.student.findMany({
      where: { classId },
      select: { id: true, admissionNumber: true, firstName: true, lastName: true }
    });
    
    // Get results for all students
    const studentsWithResults = await Promise.all(
      students.map(async (student) => {
        const resultsResponse = await getStudentResults(student.id, examId);
        
        if (!resultsResponse.success) {
          return {
            ...student,
            results: []
          };
        }
        
        return {
          ...student,
          results: resultsResponse.data
        };
      })
    );
    
    return {
      success: true,
      data: studentsWithResults
    };
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
 * Get results for a subject
 * @param {string} subjectId - Subject ID
 * @param {string} classId - Class ID
 * @param {string} examId - Exam ID
 * @returns {Promise<Object>} - Subject results
 */
async function getSubjectResults(subjectId, classId, examId) {
  try {
    logger.info(`[PrismaResultsService] Getting results for subject ${subjectId}, class ${classId}, exam ${examId}`);
    
    // Get all students in the class
    const students = await prisma.student.findMany({
      where: { classId },
      select: { id: true, admissionNumber: true, firstName: true, lastName: true }
    });
    
    // Get results for the subject
    const results = await prisma.result.findMany({
      where: {
        subjectId,
        examId,
        student: {
          classId
        }
      },
      include: {
        student: {
          select: { id: true, admissionNumber: true, firstName: true, lastName: true }
        }
      }
    });
    
    // Map results to students
    const studentsWithResults = students.map(student => {
      const result = results.find(r => r.studentId === student.id);
      
      return {
        ...student,
        result: result || null
      };
    });
    
    return {
      success: true,
      data: studentsWithResults
    };
  } catch (error) {
    logger.error(`[PrismaResultsService] Error getting subject results: ${error.message}`, error);
    return {
      success: false,
      message: `Error getting subject results: ${error.message}`,
      error
    };
  }
}

/**
 * Calculate O-Level division for a student
 * @param {string} studentId - Student ID
 * @param {string} examId - Exam ID
 * @returns {Promise<Object>} - Division calculation result
 */
async function calculateOLevelDivision(studentId, examId) {
  try {
    logger.info(`[PrismaResultsService] Calculating O-Level division for student ${studentId}, exam ${examId}`);
    
    // Get student results
    const resultsResponse = await getStudentResults(studentId, examId);
    
    if (!resultsResponse.success) {
      return resultsResponse;
    }
    
    const results = resultsResponse.data;
    
    // Check if student has enough subjects (at least 7)
    if (results.length < 7) {
      return {
        success: false,
        message: `Student has only ${results.length} subjects. At least 7 subjects are required for division calculation.`
      };
    }
    
    // Sort results by points (ascending)
    const sortedResults = [...results].sort((a, b) => a.points - b.points);
    
    // Take the best 7 subjects (lowest points)
    const bestSubjects = sortedResults.slice(0, 7);
    
    // Calculate total points
    const totalPoints = bestSubjects.reduce((sum, result) => sum + result.points, 0);
    
    // Determine division
    let division;
    if (totalPoints >= 7 && totalPoints <= 17) {
      division = 'I';
    } else if (totalPoints >= 18 && totalPoints <= 21) {
      division = 'II';
    } else if (totalPoints >= 22 && totalPoints <= 25) {
      division = 'III';
    } else if (totalPoints >= 26 && totalPoints <= 33) {
      division = 'IV';
    } else {
      division = '0';
    }
    
    return {
      success: true,
      data: {
        studentId,
        examId,
        totalPoints,
        division,
        subjects: bestSubjects
      }
    };
  } catch (error) {
    logger.error(`[PrismaResultsService] Error calculating O-Level division: ${error.message}`, error);
    return {
      success: false,
      message: `Error calculating O-Level division: ${error.message}`,
      error
    };
  }
}

/**
 * Delete a result
 * @param {string} resultId - Result ID
 * @returns {Promise<Object>} - Result of the operation
 */
async function deleteResult(resultId) {
  try {
    logger.info(`[PrismaResultsService] Deleting result ${resultId}`);
    
    // Check if result exists
    const existingResult = await prisma.result.findUnique({
      where: { id: resultId }
    });
    
    if (!existingResult) {
      logger.warn(`[PrismaResultsService] Result not found: ${resultId}`);
      return {
        success: false,
        message: 'Result not found'
      };
    }
    
    // Delete result
    await prisma.result.delete({
      where: { id: resultId }
    });
    
    logger.info(`[PrismaResultsService] Result deleted successfully: ${resultId}`);
    
    return {
      success: true,
      message: 'Result deleted successfully'
    };
  } catch (error) {
    logger.error(`[PrismaResultsService] Error deleting result: ${error.message}`, error);
    return {
      success: false,
      message: `Error deleting result: ${error.message}`,
      error
    };
  }
}

module.exports = {
  saveResult,
  saveBatchResults,
  getStudentResults,
  getClassResults,
  getSubjectResults,
  calculateOLevelDivision,
  deleteResult
};
