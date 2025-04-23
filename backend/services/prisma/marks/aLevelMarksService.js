/**
 * Prisma A-Level Marks Service
 *
 * This service handles A-Level marks entry operations using Prisma.
 */

const prisma = require('../../../lib/prisma');
const logger = require('../../../utils/logger');
const gradeCalculator = require('../../../utils/unifiedGradeCalculator');
const subjectService = require('../subjectService');

/**
 * Enter A-Level marks for a student
 * @param {Object} data - Marks data
 * @param {Object} student - Student object
 * @returns {Promise<Object>} - Result of the operation
 */
async function enterALevelMarks(data, student) {
  try {
    const {
      studentId,
      examId,
      subjectId,
      classId,
      academicYearId,
      marksObtained,
      enteredBy,
      comment,
      isPrincipal = false,
      isSubsidiary = false
    } = data;

    logger.info(`[PrismaALevelMarksService] Entering A-Level marks for student ${studentId}, subject ${subjectId}, exam ${examId}`);

    // Calculate grade and points based on marks using the unified calculator
    const { grade, points } = gradeCalculator.calculateGradeAndPoints(marksObtained, gradeCalculator.EDUCATION_LEVELS.A_LEVEL);

    // Check if this is a principal subject for A-Level students
    let isPrincipalSubject = isPrincipal;
    let isSubsidiarySubject = isSubsidiary;

    // If not explicitly specified, check from the student's combination
    if (!isPrincipalSubject && !isSubsidiarySubject && student.subjectCombinationId) {
      // Check if this subject is marked as principal in the student's combination
      const combinationItem = await prisma.subjectCombinationItem.findFirst({
        where: {
          combinationId: student.subjectCombinationId,
          subjectId
        }
      });

      if (combinationItem) {
        isPrincipalSubject = combinationItem.isPrincipal;
        isSubsidiarySubject = combinationItem.isSubsidiary;
      }
    }

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
          isPrincipal: isPrincipalSubject,
          isSubsidiary: isSubsidiarySubject,
          comment,
          updatedBy: enteredBy,
          updatedAt: new Date()
        }
      });

      logger.info(`[PrismaALevelMarksService] Updated A-Level marks for student ${studentId}: ${marksObtained}`);
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
          isPrincipal: isPrincipalSubject,
          isSubsidiary: isSubsidiarySubject,
          comment,
          enteredBy,
          educationLevel: 'A_LEVEL',
          updatedBy: enteredBy
        }
      });

      logger.info(`[PrismaALevelMarksService] Created new A-Level marks for student ${studentId}: ${marksObtained}`);
    }

    return {
      success: true,
      data: result
    };
  } catch (error) {
    logger.error(`[PrismaALevelMarksService] Error entering A-Level marks: ${error.message}`, error);
    return {
      success: false,
      message: `Error entering A-Level marks: ${error.message}`,
      error
    };
  }
}

/**
 * Check existing marks for an A-Level class, subject, and exam
 * @param {Object} params - Parameters
 * @param {string} params.classId - Class ID
 * @param {string} params.subjectId - Subject ID
 * @param {string} params.examId - Exam ID
 * @param {string} params.teacherId - Teacher ID (optional, for filtering by teacher)
 * @returns {Promise<Object>} - Result of the operation
 */
async function checkExistingALevelMarks({ classId, subjectId, examId, teacherId }) {
  try {
    logger.info(`[PrismaALevelMarksService] Checking existing A-Level marks for class ${classId}, subject ${subjectId}, exam ${examId}`);

    // Get subject details
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId }
    });

    if (!subject) {
      logger.warn(`[PrismaALevelMarksService] Subject with ID ${subjectId} not found`);
      return {
        success: false,
        message: `Subject with ID ${subjectId} not found`
      };
    }

    // Check if teacher is authorized to teach this subject in this class
    if (teacherId) {
      const isAuthorized = await subjectService.isTeacherAuthorizedForSubject(teacherId, subjectId, classId);

      if (!isAuthorized) {
        logger.warn(`[PrismaALevelMarksService] Teacher ${teacherId} is not authorized to teach subject ${subjectId} in class ${classId}`);
        return {
          success: false,
          message: 'You are not authorized to view marks for this subject in this class',
          isAuthorized: false
        };
      }
    }

    // Get students who take this subject
    const students = await prisma.student.findMany({
      where: {
        classId,
        educationLevel: 'A_LEVEL',
        subjectCombination: {
          subjects: {
            some: {
              subjectId
            }
          }
        }
      },
      orderBy: {
        firstName: 'asc'
      }
    });

    logger.info(`[PrismaALevelMarksService] Found ${students.length} A-Level students for subject ${subjectId} in class ${classId}`);

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

    logger.info(`[PrismaALevelMarksService] Found ${results.length} existing A-Level results for subject ${subjectId} in class ${classId}`);

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
      message: 'Successfully retrieved existing A-Level marks',
      data: {
        studentsWithMarks,
        totalStudents: students.length,
        totalMarksEntered: results.length,
        progress: students.length > 0 ? Math.round((results.length / students.length) * 100) : 0
      }
    };
  } catch (error) {
    logger.error(`[PrismaALevelMarksService] Error checking existing A-Level marks: ${error.message}`, error);
    return {
      success: false,
      message: `Error checking existing A-Level marks: ${error.message}`,
      error
    };
  }
}

module.exports = {
  enterALevelMarks,
  checkExistingALevelMarks
};
