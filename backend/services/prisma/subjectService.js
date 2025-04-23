/**
 * Prisma Subject Service
 * 
 * This service handles subject-related operations using Prisma.
 */

const prisma = require('../../lib/prisma');
const logger = require('../../utils/logger');

/**
 * Check if a teacher is authorized to teach a subject in a class
 * @param {string} teacherId - Teacher ID
 * @param {string} subjectId - Subject ID
 * @param {string} classId - Class ID
 * @returns {Promise<boolean>} - True if teacher is authorized, false otherwise
 */
async function isTeacherAuthorizedForSubject(teacherId, subjectId, classId) {
  try {
    logger.info(`[PrismaSubjectService] Checking if teacher ${teacherId} is authorized for subject ${subjectId} in class ${classId}`);
    
    // Check if teacher is assigned to this subject in this class
    const assignment = await prisma.teacherSubject.findFirst({
      where: {
        teacherId,
        subjectId,
        classId,
        status: 'active'
      }
    });
    
    // Also check the ClassSubject table as a fallback
    const classSubject = await prisma.classSubject.findFirst({
      where: {
        classId,
        subjectId,
        teacherId
      }
    });
    
    const isAuthorized = !!assignment || !!classSubject;
    
    logger.info(`[PrismaSubjectService] Teacher ${teacherId} is ${isAuthorized ? '' : 'not '}authorized for subject ${subjectId} in class ${classId}`);
    
    return isAuthorized;
  } catch (error) {
    logger.error(`[PrismaSubjectService] Error checking teacher authorization: ${error.message}`, error);
    return false;
  }
}

/**
 * Check if a teacher is authorized to teach any subject in a class
 * @param {string} teacherId - Teacher ID
 * @param {string} classId - Class ID
 * @returns {Promise<boolean>} - True if teacher is authorized, false otherwise
 */
async function isTeacherAuthorizedForClass(teacherId, classId) {
  try {
    logger.info(`[PrismaSubjectService] Checking if teacher ${teacherId} is authorized for class ${classId}`);
    
    // Check if teacher is assigned to any subject in this class
    const assignments = await prisma.teacherSubject.findMany({
      where: {
        teacherId,
        classId,
        status: 'active'
      }
    });
    
    // Also check the ClassSubject table as a fallback
    const classSubjects = await prisma.classSubject.findMany({
      where: {
        classId,
        teacherId
      }
    });
    
    const isAuthorized = assignments.length > 0 || classSubjects.length > 0;
    
    logger.info(`[PrismaSubjectService] Teacher ${teacherId} is ${isAuthorized ? '' : 'not '}authorized for class ${classId}`);
    
    return isAuthorized;
  } catch (error) {
    logger.error(`[PrismaSubjectService] Error checking teacher class authorization: ${error.message}`, error);
    return false;
  }
}

module.exports = {
  isTeacherAuthorizedForSubject,
  isTeacherAuthorizedForClass
};
