/**
 * Prisma Base Subject Service
 * 
 * This service provides base functionality for subject-related operations using Prisma.
 */

const prisma = require('../../../lib/prisma');
const logger = require('../../../utils/logger');

/**
 * Get subjects for a student
 * @param {string} studentId - Student ID
 * @returns {Promise<Object>} - Result with core and optional subjects
 */
async function getSubjectsForStudent(studentId) {
  try {
    logger.info(`[PrismaSubjectService] Getting subjects for student ${studentId}`);
    
    // Get student details
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: true
      }
    });
    
    if (!student) {
      logger.warn(`[PrismaSubjectService] Student with ID ${studentId} not found`);
      return {
        success: false,
        message: `Student with ID ${studentId} not found`
      };
    }
    
    // Handle differently based on education level
    if (student.educationLevel === 'O_LEVEL') {
      return require('./oLevelSubjectService').getOLevelSubjectsForStudent(student);
    } else if (student.educationLevel === 'A_LEVEL') {
      return require('./aLevelSubjectService').getALevelSubjectsForStudent(student);
    } else {
      logger.warn(`[PrismaSubjectService] Unsupported education level: ${student.educationLevel}`);
      return {
        success: false,
        message: `Unsupported education level: ${student.educationLevel}`
      };
    }
  } catch (error) {
    logger.error(`[PrismaSubjectService] Error getting subjects for student: ${error.message}`, error);
    return {
      success: false,
      message: `Error getting subjects for student: ${error.message}`,
      error
    };
  }
}

/**
 * Get subjects for a class
 * @param {string} classId - Class ID
 * @returns {Promise<Object>} - Result with subjects
 */
async function getSubjectsForClass(classId) {
  try {
    logger.info(`[PrismaSubjectService] Getting subjects for class ${classId}`);
    
    // Get class details
    const classObj = await prisma.class.findUnique({
      where: { id: classId }
    });
    
    if (!classObj) {
      logger.warn(`[PrismaSubjectService] Class with ID ${classId} not found`);
      return {
        success: false,
        message: `Class with ID ${classId} not found`
      };
    }
    
    // Get subjects based on education level
    const subjects = await prisma.subject.findMany({
      where: {
        OR: [
          { educationLevel: classObj.educationLevel },
          { educationLevel: 'BOTH' }
        ]
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    logger.info(`[PrismaSubjectService] Found ${subjects.length} subjects for class ${classId}`);
    
    // Separate core and optional subjects
    const coreSubjects = subjects.filter(subject => subject.type === 'CORE');
    const optionalSubjects = subjects.filter(subject => subject.type === 'OPTIONAL');
    
    return {
      success: true,
      data: {
        subjects,
        coreSubjects,
        optionalSubjects,
        educationLevel: classObj.educationLevel
      }
    };
  } catch (error) {
    logger.error(`[PrismaSubjectService] Error getting subjects for class: ${error.message}`, error);
    return {
      success: false,
      message: `Error getting subjects for class: ${error.message}`,
      error
    };
  }
}

/**
 * Check if a teacher is authorized to teach a subject in a class
 * @param {string} teacherId - Teacher ID
 * @param {string} subjectId - Subject ID
 * @param {string} classId - Class ID
 * @returns {Promise<boolean>} - True if authorized, false otherwise
 */
async function isTeacherAuthorizedForSubject(teacherId, subjectId, classId) {
  try {
    logger.info(`[PrismaSubjectService] Checking if teacher ${teacherId} is authorized for subject ${subjectId} in class ${classId}`);
    
    const assignment = await prisma.teacherSubject.findFirst({
      where: {
        teacherId,
        subjectId,
        classId,
        status: 'active'
      }
    });
    
    return !!assignment;
  } catch (error) {
    logger.error(`[PrismaSubjectService] Error checking teacher authorization: ${error.message}`, error);
    return false;
  }
}

module.exports = {
  getSubjectsForStudent,
  getSubjectsForClass,
  isTeacherAuthorizedForSubject
};
