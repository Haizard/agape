/**
 * Prisma O-Level Marks Service
 *
 * This service handles O-Level marks entry operations using Prisma.
 */

const prisma = require('../../../lib/prisma');
const logger = require('../../../utils/logger');
const gradeCalculator = require('../../../utils/unifiedGradeCalculator');
const subjectService = require('../subjectService');

/**
 * Enter O-Level marks for a student
 * @param {Object} data - Marks data
 * @param {Object} student - Student object
 * @returns {Promise<Object>} - Result of the operation
 */
async function enterOLevelMarks(data, student) {
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

    logger.info(`[PrismaOLevelMarksService] Entering O-Level marks for student ${studentId}, subject ${subjectId}, exam ${examId}`);

    // Calculate grade and points based on marks using the unified calculator
    const { grade, points } = gradeCalculator.calculateGradeAndPoints(marksObtained, gradeCalculator.EDUCATION_LEVELS.O_LEVEL);

    // Check if result already exists for this student, subject, and exam
    const existingResult = await prisma.result.findFirst({
      where: {
        studentId,
        subjectId,
        examId
      }
    });

    let result;

    if (existingResult) {
      // Update existing result
      result = await prisma.result.update({
        where: { id: existingResult.id },
        data: {
          marksObtained,
          grade,
          points,
          comment,
          updatedBy: enteredBy,
          updatedAt: new Date()
        }
      });

      logger.info(`[PrismaOLevelMarksService] Updated O-Level marks for student ${studentId}: ${marksObtained}`);
    } else {
      // Create new result
      result = await prisma.result.create({
        data: {
          studentId,
          examId,
          subjectId,
          classId,
          academicYearId,
          marksObtained,
          grade,
          points,
          comment,
          enteredBy,
          educationLevel: 'O_LEVEL',
          updatedBy: enteredBy
        }
      });

      logger.info(`[PrismaOLevelMarksService] Created new O-Level marks for student ${studentId}: ${marksObtained}`);
    }

    return {
      success: true,
      data: result
    };
  } catch (error) {
    logger.error(`[PrismaOLevelMarksService] Error entering O-Level marks: ${error.message}`, error);
    return {
      success: false,
      message: `Error entering O-Level marks: ${error.message}`,
      error
    };
  }
}

/**
 * Check existing marks for an O-Level class, subject, and exam
 * @param {Object} params - Parameters
 * @param {string} params.classId - Class ID
 * @param {string} params.subjectId - Subject ID
 * @param {string} params.examId - Exam ID
 * @param {string} params.teacherId - Teacher ID (optional, for filtering by teacher)
 * @returns {Promise<Object>} - Result of the operation
 */
async function checkExistingOLevelMarks({ classId, subjectId, examId, teacherId }) {
  try {
    logger.info(`[PrismaOLevelMarksService] Checking existing O-Level marks for class ${classId}, subject ${subjectId}, exam ${examId}`);

    // Get subject details
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId }
    });

    if (!subject) {
      logger.warn(`[PrismaOLevelMarksService] Subject with ID ${subjectId} not found`);
      return {
        success: false,
        message: `Subject with ID ${subjectId} not found`
      };
    }

    // Check if teacher is authorized to teach this subject in this class
    if (teacherId) {
      const isAuthorized = await subjectService.isTeacherAuthorizedForSubject(teacherId, subjectId, classId);

      if (!isAuthorized) {
        logger.warn(`[PrismaOLevelMarksService] Teacher ${teacherId} is not authorized to teach subject ${subjectId} in class ${classId}`);
        return {
          success: false,
          message: 'You are not authorized to view marks for this subject in this class',
          isAuthorized: false
        };
      }
    }

    // Get students who take this subject
    let students = [];

    if (subject.type === 'CORE') {
      // For O-Level core subjects, all students take it
      students = await prisma.student.findMany({
        where: {
          classId,
          educationLevel: 'O_LEVEL'
        },
        orderBy: {
          firstName: 'asc'
        }
      });
    } else {
      // For O-Level optional subjects, only students who selected it
      students = await prisma.student.findMany({
        where: {
          classId,
          educationLevel: 'O_LEVEL',
          subjectSelections: {
            some: {
              subjects: {
                some: {
                  subjectId,
                  selectionType: 'OPTIONAL'
                }
              }
            }
          }
        },
        orderBy: {
          firstName: 'asc'
        }
      });
    }

    logger.info(`[PrismaOLevelMarksService] Found ${students.length} O-Level students for subject ${subjectId} in class ${classId}`);

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

    logger.info(`[PrismaOLevelMarksService] Found ${results.length} existing O-Level results for subject ${subjectId} in class ${classId}`);

    // Map students to results
    const studentsWithMarks = students.map(student => {
      const result = results.find(result => result.studentId === student.id);

      return {
        student: {
          id: student.id,
          admissionNumber: student.admissionNumber,
          firstName: student.firstName,
          lastName: student.lastName
        },
        result: result || null,
        hasMarks: !!result
      };
    });

    return {
      success: true,
      message: 'Successfully retrieved existing O-Level marks',
      data: {
        studentsWithMarks,
        totalStudents: students.length,
        totalMarksEntered: results.length,
        progress: students.length > 0 ? Math.round((results.length / students.length) * 100) : 0
      }
    };
  } catch (error) {
    logger.error(`[PrismaOLevelMarksService] Error checking existing O-Level marks: ${error.message}`, error);
    return {
      success: false,
      message: `Error checking existing O-Level marks: ${error.message}`,
      error
    };
  }
}

module.exports = {
  enterOLevelMarks,
  checkExistingOLevelMarks
};
