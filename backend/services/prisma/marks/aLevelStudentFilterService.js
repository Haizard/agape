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
    logger.info(`[PrismaALevelStudentFilterService] Getting students for class ${classId} filtered by subject ${subjectId}`);
    
    // Get the class to verify it exists and is A-Level
    const classDetails = await prisma.class.findUnique({
      where: { id: classId },
      select: {
        id: true,
        name: true,
        educationLevel: true
      }
    });

    if (!classDetails) {
      logger.warn(`[PrismaALevelStudentFilterService] Class ${classId} not found`);
      return {
        success: false,
        message: `Class with ID ${classId} not found`
      };
    }

    // Verify it's an A-Level class
    if (classDetails.educationLevel !== 'A_LEVEL' && classDetails.educationLevel !== 'A') {
      logger.warn(`[PrismaALevelStudentFilterService] Class ${classId} is not an A-Level class`);
      return {
        success: false,
        message: `Class with ID ${classId} is not an A-Level class`
      };
    }

    // Get the subject to verify it exists
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: {
        id: true,
        name: true,
        code: true
      }
    });

    if (!subject) {
      logger.warn(`[PrismaALevelStudentFilterService] Subject ${subjectId} not found`);
      return {
        success: false,
        message: `Subject with ID ${subjectId} not found`
      };
    }

    // Get all students in the class
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

    logger.info(`[PrismaALevelStudentFilterService] Found ${allStudents.length} students in class ${classId}`);

    // Process students to determine eligibility
    const processedStudents = allStudents.map(student => {
      // Check if student has this subject in their combination
      let isEligible = false;
      let isPrincipal = false;

      // Check in subjectCombination
      if (student.subjectCombination && student.subjectCombination.subjects) {
        const combinationSubject = student.subjectCombination.subjects.find(s => 
          s.subjectId === subjectId || 
          (s.subject && s.subject.id === subjectId)
        );
        
        if (combinationSubject) {
          isEligible = true;
          isPrincipal = combinationSubject.isPrincipal || false;
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
        }
      }

      // Format student name
      const studentName = student.firstName && student.lastName 
        ? `${student.firstName} ${student.lastName}`
        : student.name || 'Unknown Student';

      return {
        id: student.id,
        studentId: student.id,
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        name: studentName,
        isEligible,
        isPrincipal,
        eligibilityMessage: isEligible ? null : 'Subject is not in student\'s combination'
      };
    });

    // Filter students based on eligibility if required
    const filteredStudents = includeIneligible 
      ? processedStudents 
      : processedStudents.filter(student => student.isEligible);

    logger.info(`[PrismaALevelStudentFilterService] Returning ${filteredStudents.length} filtered students`);

    return {
      success: true,
      data: {
        class: classDetails,
        subject,
        students: filteredStudents,
        eligibleCount: processedStudents.filter(s => s.isEligible).length,
        totalCount: processedStudents.length
      }
    };
  } catch (error) {
    logger.error(`[PrismaALevelStudentFilterService] Error getting filtered students: ${error.message}`, error);
    return {
      success: false,
      message: `Error getting filtered students: ${error.message}`,
      error
    };
  }
}

module.exports = {
  getStudentsFilteredBySubject
};
