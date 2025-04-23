/**
 * A-Level Student Filter Service
 *
 * This service provides functions to filter A-Level students based on their subject combinations.
 */

const prisma = require('../../../lib/prisma');
const logger = require('../../../utils/logger');

/**
 * Get students for a class filtered by subject
 * @param {string} classId - Class ID
 * @param {string} subjectId - Subject ID
 * @param {boolean} includeIneligible - Whether to include students who don't take the subject
 * @returns {Promise<Object>} - Result with filtered students
 */
async function getStudentsFilteredBySubject(classId, subjectId, includeIneligible = false) {
  try {
    logger.info(`[PrismaALevelStudentFilterService] Getting students for class ${classId} filtered by subject ${subjectId}, includeIneligible=${includeIneligible}`);

    // Validate parameters
    if (!classId) {
      logger.error('[PrismaALevelStudentFilterService] Missing required parameter: classId');
      return {
        success: false,
        message: 'Class ID is required'
      };
    }

    if (!subjectId) {
      logger.error('[PrismaALevelStudentFilterService] Missing required parameter: subjectId');
      return {
        success: false,
        message: 'Subject ID is required'
      };
    }

    // Get the class to verify it exists and is A-Level
    logger.debug(`[PrismaALevelStudentFilterService] Fetching class details for ID ${classId}`);
    const classDetails = await prisma.class.findUnique({
      where: { id: classId },
      select: {
        id: true,
        name: true,
        educationLevel: true,
        academicYearId: true
      }
    });

    if (!classDetails) {
      logger.warn(`[PrismaALevelStudentFilterService] Class ${classId} not found`);
      return {
        success: false,
        message: `Class with ID ${classId} not found`
      };
    }

    logger.info(`[PrismaALevelStudentFilterService] Found class: ${classDetails.name} (${classDetails.educationLevel})`);

    // Verify it's an A-Level class
    if (classDetails.educationLevel !== 'A_LEVEL' && classDetails.educationLevel !== 'A') {
      logger.warn(`[PrismaALevelStudentFilterService] Class ${classId} is not an A-Level class (${classDetails.educationLevel})`);
      return {
        success: false,
        message: `Class with ID ${classId} is not an A-Level class (${classDetails.educationLevel})`
      };
    }

    // Get the subject to verify it exists
    logger.debug(`[PrismaALevelStudentFilterService] Fetching subject details for ID ${subjectId}`);
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
      logger.warn(`[PrismaALevelStudentFilterService] Subject ${subjectId} not found`);
      return {
        success: false,
        message: `Subject with ID ${subjectId} not found`
      };
    }

    logger.info(`[PrismaALevelStudentFilterService] Found subject: ${subject.name} (${subject.code || 'No code'})`);

    // Check if the subject is appropriate for A-Level
    if (subject.educationLevel &&
        subject.educationLevel !== 'A_LEVEL' &&
        subject.educationLevel !== 'A' &&
        subject.educationLevel !== 'BOTH') {
      logger.warn(`[PrismaALevelStudentFilterService] Subject ${subject.name} is not for A-Level (${subject.educationLevel})`);
      // We'll continue anyway but log a warning
    }

    // Get all students in the class
    logger.debug(`[PrismaALevelStudentFilterService] Fetching A-Level students for class ${classId}`);
    const allStudents = await prisma.student.findMany({
      where: {
        classId: classId,
        educationLevel: {
          in: ['A_LEVEL', 'A']
        },
        status: 'active'
      },
      include: {
        // Include subject combinations to check eligibility
        subjectCombination: {
          include: {
            subjects: {
              include: {
                subject: true
              }
            }
          }
        },
        // Include direct subject assignments
        subjects: {
          include: {
            subject: true
          }
        }
      },
      orderBy: {
        firstName: 'asc'
      }
    });

    logger.info(`[PrismaALevelStudentFilterService] Found ${allStudents.length} A-Level students in class ${classDetails.name}`);

    // If no students found, return early
    if (allStudents.length === 0) {
      logger.warn(`[PrismaALevelStudentFilterService] No A-Level students found in class ${classDetails.name}`);
      return {
        success: true,
        data: {
          class: classDetails,
          subject,
          students: [],
          eligibleCount: 0,
          totalCount: 0
        }
      };
    }

    // Process students to determine eligibility
    logger.debug(`[PrismaALevelStudentFilterService] Processing ${allStudents.length} students to determine eligibility`);
    const processedStudents = allStudents.map(student => {
      // Check if student has this subject in their combination
      let isEligible = false;
      let isPrincipal = false;
      let eligibilitySource = 'none';

      // Check in subjectCombination
      if (student.subjectCombination && student.subjectCombination.subjects) {
        const combinationSubject = student.subjectCombination.subjects.find(s =>
          s.subjectId === subjectId ||
          (s.subject && s.subject.id === subjectId)
        );

        if (combinationSubject) {
          isEligible = true;
          isPrincipal = combinationSubject.isPrincipal || false;
          eligibilitySource = 'combination';
          logger.debug(`[PrismaALevelStudentFilterService] Student ${student.id} has subject ${subjectId} in combination (isPrincipal=${isPrincipal})`);
        }
      }

      // Check in direct subjects assignment
      if (!isEligible && student.subjects && student.subjects.length > 0) {
        const directSubject = student.subjects.find(s =>
          s.subjectId === subjectId ||
          (s.subject && s.subject.id === subjectId)
        );

        if (directSubject) {
          isEligible = true;
          isPrincipal = directSubject.isPrincipal || false;
          eligibilitySource = 'direct';
          logger.debug(`[PrismaALevelStudentFilterService] Student ${student.id} has subject ${subjectId} directly assigned (isPrincipal=${isPrincipal})`);
        }
      }

      // Format student name
      const studentName = student.firstName && student.lastName
        ? `${student.firstName} ${student.lastName}`
        : student.name || 'Unknown Student';

      if (!isEligible) {
        logger.debug(`[PrismaALevelStudentFilterService] Student ${student.id} (${studentName}) is NOT eligible for subject ${subject.name}`);
      }

      return {
        id: student.id,
        studentId: student.id,
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        name: studentName,
        isEligible,
        isPrincipal,
        eligibilitySource,
        eligibilityMessage: isEligible ? null : 'Subject is not in student\'s combination'
      };
    });

    // Filter students based on eligibility if required
    const filteredStudents = includeIneligible
      ? processedStudents
      : processedStudents.filter(student => student.isEligible);

    const eligibleCount = processedStudents.filter(s => s.isEligible).length;
    logger.info(`[PrismaALevelStudentFilterService] ${eligibleCount} out of ${processedStudents.length} students are eligible for subject ${subject.name}`);
    logger.info(`[PrismaALevelStudentFilterService] Returning ${filteredStudents.length} students (includeIneligible=${includeIneligible})`);

    // Log detailed information about the first few students for debugging
    if (filteredStudents.length > 0) {
      const sampleSize = Math.min(3, filteredStudents.length);
      const sampleStudents = filteredStudents.slice(0, sampleSize);

      sampleStudents.forEach(student => {
        logger.debug(`[PrismaALevelStudentFilterService] Sample student: ${student.name}, isEligible=${student.isEligible}, isPrincipal=${student.isPrincipal}, source=${student.eligibilitySource}`);
      });
    }

    return {
      success: true,
      data: {
        class: classDetails,
        subject,
        students: filteredStudents,
        eligibleCount,
        totalCount: processedStudents.length
      }
    };
  } catch (error) {
    logger.error(`[PrismaALevelStudentFilterService] Error getting filtered students: ${error.message}`, error);
    return {
      success: false,
      message: `Error getting filtered students: ${error.message}`,
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    };
  }
}

module.exports = {
  getStudentsFilteredBySubject
};
