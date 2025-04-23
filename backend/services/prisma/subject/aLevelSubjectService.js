/**
 * Prisma A-Level Subject Service
 * 
 * This service handles A-Level subject-related operations using Prisma.
 */

const prisma = require('../../../lib/prisma');
const logger = require('../../../utils/logger');

/**
 * Get A-Level subjects for a student
 * @param {Object} student - Student object
 * @returns {Promise<Object>} - Result with principal and subsidiary subjects
 */
async function getALevelSubjectsForStudent(student) {
  try {
    logger.info(`[PrismaALevelSubjectService] Getting A-Level subjects for student ${student.id}`);
    
    // If student has no combination, return empty
    if (!student.subjectCombinationId) {
      logger.warn(`[PrismaALevelSubjectService] Student ${student.id} has no subject combination`);
      return {
        success: true,
        data: {
          principalSubjects: [],
          subsidiarySubjects: [],
          allSubjects: []
        }
      };
    }
    
    // Get student's combination
    const combination = await prisma.subjectCombination.findUnique({
      where: {
        id: student.subjectCombinationId
      },
      include: {
        subjects: {
          include: {
            subject: true
          }
        }
      }
    });
    
    if (!combination) {
      logger.warn(`[PrismaALevelSubjectService] Subject combination with ID ${student.subjectCombinationId} not found`);
      return {
        success: false,
        message: `Subject combination with ID ${student.subjectCombinationId} not found`
      };
    }
    
    // Separate principal and subsidiary subjects
    const principalSubjects = combination.subjects
      .filter(item => item.isPrincipal)
      .map(item => item.subject);
    
    const subsidiarySubjects = combination.subjects
      .filter(item => item.isSubsidiary)
      .map(item => item.subject);
    
    logger.info(`[PrismaALevelSubjectService] Found ${principalSubjects.length} principal subjects and ${subsidiarySubjects.length} subsidiary subjects for student ${student.id}`);
    
    return {
      success: true,
      data: {
        principalSubjects,
        subsidiarySubjects,
        allSubjects: [...principalSubjects, ...subsidiarySubjects]
      }
    };
  } catch (error) {
    logger.error(`[PrismaALevelSubjectService] Error getting A-Level subjects: ${error.message}`, error);
    return {
      success: false,
      message: `Error getting A-Level subjects: ${error.message}`,
      error
    };
  }
}

/**
 * Get students for an A-Level subject in a class
 * @param {string} subjectId - Subject ID
 * @param {string} classId - Class ID
 * @param {Object} subject - Subject object
 * @returns {Promise<Array>} - Array of students
 */
async function getStudentsForALevelSubject(subjectId, classId, subject) {
  try {
    logger.info(`[PrismaALevelSubjectService] Getting students for A-Level subject ${subjectId} in class ${classId}`);
    
    let students = [];
    
    if (subject.isPrincipal) {
      // For principal subjects
      students = await prisma.student.findMany({
        where: {
          classId,
          educationLevel: 'A_LEVEL',
          subjectCombination: {
            subjects: {
              some: {
                subjectId,
                isPrincipal: true
              }
            }
          }
        },
        orderBy: {
          firstName: 'asc'
        }
      });
      
      logger.info(`[PrismaALevelSubjectService] Found ${students.length} A-Level students for principal subject ${subjectId}`);
    } else {
      // For subsidiary subjects
      students = await prisma.student.findMany({
        where: {
          classId,
          educationLevel: 'A_LEVEL',
          subjectCombination: {
            subjects: {
              some: {
                subjectId,
                isSubsidiary: true
              }
            }
          }
        },
        orderBy: {
          firstName: 'asc'
        }
      });
      
      logger.info(`[PrismaALevelSubjectService] Found ${students.length} A-Level students for subsidiary subject ${subjectId}`);
    }
    
    return students;
  } catch (error) {
    logger.error(`[PrismaALevelSubjectService] Error getting students for A-Level subject: ${error.message}`, error);
    throw error;
  }
}

module.exports = {
  getALevelSubjectsForStudent,
  getStudentsForALevelSubject
};
