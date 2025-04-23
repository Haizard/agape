/**
 * Prisma Eligibility Service
 *
 * This service handles student eligibility validation for subjects.
 */

const prisma = require('../../../lib/prisma');
const logger = require('../../../utils/logger');

/**
 * Validate if a student is eligible to take a subject
 * @param {string} studentId - Student ID
 * @param {string} subjectId - Subject ID
 * @returns {Promise<Object>} - Result of the validation
 */
async function validateStudentSubjectEligibility(studentId, subjectId) {
  try {
    logger.info(`[PrismaEligibilityService] Validating eligibility for student ${studentId}, subject ${subjectId}`);

    // Get student details
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: true,
        subjectCombination: {
          include: {
            subjects: {
              include: {
                subject: true
              }
            }
          }
        }
      }
    });

    if (!student) {
      logger.warn(`[PrismaEligibilityService] Student with ID ${studentId} not found`);
      return {
        success: false,
        isEligible: false,
        message: `Student with ID ${studentId} not found`
      };
    }

    // Get subject details
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId }
    });

    if (!subject) {
      logger.warn(`[PrismaEligibilityService] Subject with ID ${subjectId} not found`);
      return {
        success: false,
        isEligible: false,
        message: `Subject with ID ${subjectId} not found`
      };
    }

    // Check if student is in A-Level
    if (student.educationLevel !== 'A_LEVEL') {
      logger.warn(`[PrismaEligibilityService] Student ${studentId} is not in A-Level`);
      return {
        success: true,
        isEligible: false,
        message: `Student is not in A-Level`
      };
    }

    // Check if student has a subject combination
    if (!student.subjectCombination) {
      logger.warn(`[PrismaEligibilityService] Student ${studentId} does not have a subject combination`);
      return {
        success: true,
        isEligible: false,
        message: `Student does not have a subject combination`
      };
    }

    // Check if subject is in student's combination
    const isInCombination = student.subjectCombination.subjects.some(
      s => s.subjectId === subjectId
    );

    if (!isInCombination) {
      logger.warn(`[PrismaEligibilityService] Subject ${subjectId} is not in student ${studentId}'s combination`);
      return {
        success: true,
        isEligible: false,
        message: `Subject is not in student's combination`
      };
    }

    // Get the combination item to check if it's principal or subsidiary
    const combinationItem = student.subjectCombination.subjects.find(
      s => s.subjectId === subjectId
    );

    const isPrincipal = combinationItem ? combinationItem.isPrincipal : false;
    const isSubsidiary = combinationItem ? combinationItem.isSubsidiary : false;

    // If we got here, the student is eligible
    logger.info(`[PrismaEligibilityService] Student ${studentId} is eligible for subject ${subjectId}`);
    return {
      success: true,
      isEligible: true,
      message: `Student is eligible for this subject`,
      isPrincipal,
      isSubsidiary
    };
  } catch (error) {
    logger.error(`[PrismaEligibilityService] Error validating student eligibility: ${error.message}`, error);
    return {
      success: false,
      isEligible: false,
      message: `Error validating student eligibility: ${error.message}`,
      error
    };
  }
}

/**
 * Batch validate eligibility for multiple students and a subject
 * @param {Array<string>} studentIds - Array of student IDs
 * @param {string} subjectId - Subject ID
 * @returns {Promise<Object>} - Result of the validation
 */
async function batchValidateEligibility(studentIds, subjectId) {
  try {
    logger.info(`[PrismaEligibilityService] Batch validating eligibility for ${studentIds.length} students, subject ${subjectId}`);

    // Get all students with their combinations
    const students = await prisma.student.findMany({
      where: {
        id: {
          in: studentIds
        }
      },
      include: {
        subjectCombination: {
          include: {
            subjects: true
          }
        }
      }
    });

    // Get subject details
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId }
    });

    if (!subject) {
      logger.warn(`[PrismaEligibilityService] Subject with ID ${subjectId} not found`);
      return {
        success: false,
        message: `Subject with ID ${subjectId} not found`
      };
    }

    // Validate each student
    const results = {};
    for (const student of students) {
      // Check if student is in A-Level
      if (student.educationLevel !== 'A_LEVEL') {
        results[student.id] = {
          isEligible: false,
          message: `Student is not in A-Level`
        };
        continue;
      }

      // Check if student has a subject combination
      if (!student.subjectCombination) {
        results[student.id] = {
          isEligible: false,
          message: `Student does not have a subject combination`
        };
        continue;
      }

      // Check if subject is in student's combination
      const isInCombination = student.subjectCombination.subjects.some(
        s => s.subjectId === subjectId
      );

      if (!isInCombination) {
        results[student.id] = {
          isEligible: false,
          message: `Subject is not in student's combination`
        };
        continue;
      }

      // Get the combination item to check if it's principal or subsidiary
      const combinationItem = student.subjectCombination.subjects.find(
        s => s.subjectId === subjectId
      );

      const isPrincipal = combinationItem ? combinationItem.isPrincipal : false;
      const isSubsidiary = combinationItem ? combinationItem.isSubsidiary : false;

      // If we got here, the student is eligible
      results[student.id] = {
        isEligible: true,
        message: `Student is eligible for this subject`,
        isPrincipal,
        isSubsidiary
      };
    }

    return {
      success: true,
      results
    };
  } catch (error) {
    logger.error(`[PrismaEligibilityService] Error batch validating eligibility: ${error.message}`, error);
    return {
      success: false,
      message: `Error batch validating eligibility: ${error.message}`,
      error
    };
  }
}

module.exports = {
  validateStudentSubjectEligibility,
  batchValidateEligibility
};
