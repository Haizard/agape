/**
 * Prisma O-Level Subject Service
 * 
 * This service handles O-Level subject-related operations using Prisma.
 */

const prisma = require('../../../lib/prisma');
const logger = require('../../../utils/logger');

/**
 * Get O-Level subjects for a student
 * @param {Object} student - Student object
 * @returns {Promise<Object>} - Result with core and optional subjects
 */
async function getOLevelSubjectsForStudent(student) {
  try {
    logger.info(`[PrismaOLevelSubjectService] Getting O-Level subjects for student ${student.id}`);
    
    // Get core subjects
    const coreSubjects = await prisma.subject.findMany({
      where: {
        type: 'CORE',
        educationLevel: {
          in: ['O_LEVEL', 'BOTH']
        }
      }
    });
    
    logger.info(`[PrismaOLevelSubjectService] Found ${coreSubjects.length} core subjects for O-Level`);
    
    // Get student's subject selection
    const selection = await prisma.studentSubjectSelection.findFirst({
      where: {
        studentId: student.id
      },
      include: {
        subjects: {
          include: {
            subject: true
          },
          where: {
            selectionType: 'OPTIONAL'
          }
        }
      }
    });
    
    // Get optional subjects from selection
    const optionalSubjects = selection
      ? selection.subjects.map(item => item.subject)
      : [];
    
    logger.info(`[PrismaOLevelSubjectService] Found ${optionalSubjects.length} optional subjects for student ${student.id}`);
    
    return {
      success: true,
      data: {
        coreSubjects,
        optionalSubjects,
        allSubjects: [...coreSubjects, ...optionalSubjects]
      }
    };
  } catch (error) {
    logger.error(`[PrismaOLevelSubjectService] Error getting O-Level subjects: ${error.message}`, error);
    return {
      success: false,
      message: `Error getting O-Level subjects: ${error.message}`,
      error
    };
  }
}

/**
 * Get students for an O-Level subject in a class
 * @param {string} subjectId - Subject ID
 * @param {string} classId - Class ID
 * @param {Object} subject - Subject object
 * @returns {Promise<Object>} - Result with students
 */
async function getStudentsForOLevelSubject(subjectId, classId, subject) {
  try {
    logger.info(`[PrismaOLevelSubjectService] Getting students for O-Level subject ${subjectId} in class ${classId}`);
    
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
      
      logger.info(`[PrismaOLevelSubjectService] Found ${students.length} O-Level students for core subject ${subjectId}`);
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
      
      logger.info(`[PrismaOLevelSubjectService] Found ${students.length} O-Level students for optional subject ${subjectId}`);
    }
    
    return students;
  } catch (error) {
    logger.error(`[PrismaOLevelSubjectService] Error getting students for O-Level subject: ${error.message}`, error);
    throw error;
  }
}

module.exports = {
  getOLevelSubjectsForStudent,
  getStudentsForOLevelSubject
};
