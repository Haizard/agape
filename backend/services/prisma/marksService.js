/**
 * Prisma Marks Service
 * 
 * This service handles marks-related operations using Prisma.
 */

const prisma = require('../../lib/prisma');
const logger = require('../../utils/logger');

/**
 * Check existing marks for a class, subject, and exam
 * @param {Object} params - Check parameters
 * @param {string} params.classId - Class ID
 * @param {string} params.subjectId - Subject ID
 * @param {string} params.examId - Exam ID
 * @returns {Promise<Object>} - Result with students and their marks
 */
async function checkExistingMarks(params) {
  const { classId, subjectId, examId } = params;
  
  try {
    logger.info(`[PrismaMarksService] Checking existing marks for class ${classId}, subject ${subjectId}, exam ${examId}`);
    
    // Get all O-Level students in the class
    const students = await prisma.student.findMany({
      where: {
        classId,
        educationLevel: 'O_LEVEL'
      },
      orderBy: {
        firstName: 'asc'
      }
    });
    
    logger.info(`[PrismaMarksService] Found ${students.length} O-Level students in class ${classId}`);
    
    if (students.length === 0) {
      return {
        success: true,
        message: 'No students found in this class',
        studentsWithMarks: [],
        totalStudents: 0,
        totalMarksEntered: 0
      };
    }
    
    // Get existing results for these students
    const results = await prisma.result.findMany({
      where: {
        classId,
        subjectId,
        examId,
        studentId: {
          in: students.map(student => student.id)
        }
      }
    });
    
    logger.info(`[PrismaMarksService] Found ${results.length} existing results for class ${classId}, subject ${subjectId}, exam ${examId}`);
    
    // Map students with their marks
    const studentsWithMarks = students.map(student => {
      const result = results.find(r => r.studentId === student.id);
      
      return {
        studentId: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        admissionNumber: student.admissionNumber,
        rollNumber: student.rollNumber,
        hasExistingMarks: !!result,
        marksObtained: result ? result.marksObtained : null,
        grade: result ? result.grade : null,
        points: result ? result.points : null,
        resultId: result ? result.id : null
      };
    });
    
    return {
      success: true,
      message: 'Successfully retrieved existing marks',
      studentsWithMarks,
      totalStudents: students.length,
      totalMarksEntered: results.length
    };
  } catch (error) {
    logger.error(`[PrismaMarksService] Error checking existing marks: ${error.message}`, error);
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
  const { studentId, subjectId, examId } = params;
  
  try {
    logger.info(`[PrismaMarksService] Checking marks for student ${studentId}, subject ${subjectId}, exam ${examId}`);
    
    // Get student details
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });
    
    if (!student) {
      logger.warn(`[PrismaMarksService] Student not found: ${studentId}`);
      return {
        success: false,
        message: 'Student not found'
      };
    }
    
    // Get existing result
    const result = await prisma.result.findFirst({
      where: {
        studentId,
        subjectId,
        examId
      }
    });
    
    return {
      success: true,
      studentId,
      studentName: `${student.firstName} ${student.lastName}`,
      hasExistingMarks: !!result,
      marksObtained: result ? result.marksObtained : '',
      grade: result ? result.grade : '',
      points: result ? result.points : '',
      comment: result ? result.comment : '',
      resultId: result ? result.id : null
    };
  } catch (error) {
    logger.error(`[PrismaMarksService] Error checking student marks: ${error.message}`, error);
    return {
      success: false,
      message: `Error checking student marks: ${error.message}`,
      error
    };
  }
}

module.exports = {
  checkExistingMarks,
  checkStudentMarks
};
