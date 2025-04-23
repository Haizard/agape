/**
 * Prisma Teacher Subject Service
 * 
 * This service handles teacher-subject related operations using Prisma.
 */

const prisma = require('../../../lib/prisma');
const logger = require('../../../utils/logger');

/**
 * Get subjects taught by a teacher
 * @param {string} teacherId - Teacher ID
 * @returns {Promise<Object>} - Result with subjects
 */
async function getSubjectsForTeacher(teacherId) {
  try {
    logger.info(`[PrismaTeacherSubjectService] Getting subjects for teacher ${teacherId}`);
    
    // Get teacher's subject assignments
    const assignments = await prisma.teacherSubject.findMany({
      where: {
        teacherId,
        status: 'active'
      },
      include: {
        subject: true,
        class: true
      }
    });
    
    logger.info(`[PrismaTeacherSubjectService] Found ${assignments.length} subject assignments for teacher ${teacherId}`);
    
    // Group by class
    const subjectsByClass = {};
    
    assignments.forEach(assignment => {
      const classId = assignment.classId;
      
      if (!subjectsByClass[classId]) {
        subjectsByClass[classId] = {
          class: assignment.class,
          subjects: []
        };
      }
      
      subjectsByClass[classId].subjects.push(assignment.subject);
    });
    
    return {
      success: true,
      data: {
        assignments,
        subjectsByClass
      }
    };
  } catch (error) {
    logger.error(`[PrismaTeacherSubjectService] Error getting subjects for teacher: ${error.message}`, error);
    return {
      success: false,
      message: `Error getting subjects for teacher: ${error.message}`,
      error
    };
  }
}

/**
 * Get students for a subject in a class
 * @param {string} subjectId - Subject ID
 * @param {string} classId - Class ID
 * @returns {Promise<Object>} - Result with students
 */
async function getStudentsForSubject(subjectId, classId) {
  try {
    logger.info(`[PrismaTeacherSubjectService] Getting students for subject ${subjectId} in class ${classId}`);
    
    // Get subject details
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId }
    });
    
    if (!subject) {
      logger.warn(`[PrismaTeacherSubjectService] Subject with ID ${subjectId} not found`);
      return {
        success: false,
        message: `Subject with ID ${subjectId} not found`
      };
    }
    
    // Get class details
    const classObj = await prisma.class.findUnique({
      where: { id: classId }
    });
    
    if (!classObj) {
      logger.warn(`[PrismaTeacherSubjectService] Class with ID ${classId} not found`);
      return {
        success: false,
        message: `Class with ID ${classId} not found`
      };
    }
    
    let students = [];
    
    // Handle differently based on subject type and education level
    if (classObj.educationLevel === 'O_LEVEL') {
      const oLevelSubjectService = require('./oLevelSubjectService');
      students = await oLevelSubjectService.getStudentsForOLevelSubject(subjectId, classId, subject);
    } else if (classObj.educationLevel === 'A_LEVEL') {
      const aLevelSubjectService = require('./aLevelSubjectService');
      students = await aLevelSubjectService.getStudentsForALevelSubject(subjectId, classId, subject);
    }
    
    return {
      success: true,
      data: {
        students,
        subject,
        class: classObj
      }
    };
  } catch (error) {
    logger.error(`[PrismaTeacherSubjectService] Error getting students for subject: ${error.message}`, error);
    return {
      success: false,
      message: `Error getting students for subject: ${error.message}`,
      error
    };
  }
}

module.exports = {
  getSubjectsForTeacher,
  getStudentsForSubject
};
