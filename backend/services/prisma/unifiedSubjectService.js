/**
 * Prisma Unified Subject Service
 * 
 * This service handles subject-related operations for both O-Level and A-Level using Prisma.
 */

const prisma = require('../../lib/prisma');
const logger = require('../../utils/logger');

/**
 * Get subjects for a student
 * @param {string} studentId - Student ID
 * @returns {Promise<Object>} - Result with core and optional subjects
 */
async function getSubjectsForStudent(studentId) {
  try {
    logger.info(`[PrismaUnifiedSubjectService] Getting subjects for student ${studentId}`);
    
    // Get student details
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: true
      }
    });
    
    if (!student) {
      logger.warn(`[PrismaUnifiedSubjectService] Student with ID ${studentId} not found`);
      return {
        success: false,
        message: `Student with ID ${studentId} not found`
      };
    }
    
    // Handle differently based on education level
    if (student.educationLevel === 'O_LEVEL') {
      return getOLevelSubjectsForStudent(student);
    } else if (student.educationLevel === 'A_LEVEL') {
      return getALevelSubjectsForStudent(student);
    } else {
      logger.warn(`[PrismaUnifiedSubjectService] Unsupported education level: ${student.educationLevel}`);
      return {
        success: false,
        message: `Unsupported education level: ${student.educationLevel}`
      };
    }
  } catch (error) {
    logger.error(`[PrismaUnifiedSubjectService] Error getting subjects for student: ${error.message}`, error);
    return {
      success: false,
      message: `Error getting subjects for student: ${error.message}`,
      error
    };
  }
}

/**
 * Get O-Level subjects for a student
 * @param {Object} student - Student object
 * @returns {Promise<Object>} - Result with core and optional subjects
 */
async function getOLevelSubjectsForStudent(student) {
  try {
    logger.info(`[PrismaUnifiedSubjectService] Getting O-Level subjects for student ${student.id}`);
    
    // Get core subjects
    const coreSubjects = await prisma.subject.findMany({
      where: {
        type: 'CORE',
        educationLevel: {
          in: ['O_LEVEL', 'BOTH']
        }
      }
    });
    
    logger.info(`[PrismaUnifiedSubjectService] Found ${coreSubjects.length} core subjects for O-Level`);
    
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
    
    logger.info(`[PrismaUnifiedSubjectService] Found ${optionalSubjects.length} optional subjects for student ${student.id}`);
    
    return {
      success: true,
      data: {
        coreSubjects,
        optionalSubjects,
        allSubjects: [...coreSubjects, ...optionalSubjects]
      }
    };
  } catch (error) {
    logger.error(`[PrismaUnifiedSubjectService] Error getting O-Level subjects: ${error.message}`, error);
    return {
      success: false,
      message: `Error getting O-Level subjects: ${error.message}`,
      error
    };
  }
}

/**
 * Get A-Level subjects for a student
 * @param {Object} student - Student object
 * @returns {Promise<Object>} - Result with principal and subsidiary subjects
 */
async function getALevelSubjectsForStudent(student) {
  try {
    logger.info(`[PrismaUnifiedSubjectService] Getting A-Level subjects for student ${student.id}`);
    
    // If student has no combination, return empty
    if (!student.subjectCombinationId) {
      logger.warn(`[PrismaUnifiedSubjectService] Student ${student.id} has no subject combination`);
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
      logger.warn(`[PrismaUnifiedSubjectService] Subject combination with ID ${student.subjectCombinationId} not found`);
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
    
    logger.info(`[PrismaUnifiedSubjectService] Found ${principalSubjects.length} principal subjects and ${subsidiarySubjects.length} subsidiary subjects for student ${student.id}`);
    
    return {
      success: true,
      data: {
        principalSubjects,
        subsidiarySubjects,
        allSubjects: [...principalSubjects, ...subsidiarySubjects]
      }
    };
  } catch (error) {
    logger.error(`[PrismaUnifiedSubjectService] Error getting A-Level subjects: ${error.message}`, error);
    return {
      success: false,
      message: `Error getting A-Level subjects: ${error.message}`,
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
    logger.info(`[PrismaUnifiedSubjectService] Getting subjects for class ${classId}`);
    
    // Get class details
    const classObj = await prisma.class.findUnique({
      where: { id: classId }
    });
    
    if (!classObj) {
      logger.warn(`[PrismaUnifiedSubjectService] Class with ID ${classId} not found`);
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
    
    logger.info(`[PrismaUnifiedSubjectService] Found ${subjects.length} subjects for class ${classId}`);
    
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
    logger.error(`[PrismaUnifiedSubjectService] Error getting subjects for class: ${error.message}`, error);
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
    logger.info(`[PrismaUnifiedSubjectService] Checking if teacher ${teacherId} is authorized for subject ${subjectId} in class ${classId}`);
    
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
    logger.error(`[PrismaUnifiedSubjectService] Error checking teacher authorization: ${error.message}`, error);
    return false;
  }
}

/**
 * Get subjects taught by a teacher
 * @param {string} teacherId - Teacher ID
 * @returns {Promise<Object>} - Result with subjects
 */
async function getSubjectsForTeacher(teacherId) {
  try {
    logger.info(`[PrismaUnifiedSubjectService] Getting subjects for teacher ${teacherId}`);
    
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
    
    logger.info(`[PrismaUnifiedSubjectService] Found ${assignments.length} subject assignments for teacher ${teacherId}`);
    
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
    logger.error(`[PrismaUnifiedSubjectService] Error getting subjects for teacher: ${error.message}`, error);
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
    logger.info(`[PrismaUnifiedSubjectService] Getting students for subject ${subjectId} in class ${classId}`);
    
    // Get subject details
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId }
    });
    
    if (!subject) {
      logger.warn(`[PrismaUnifiedSubjectService] Subject with ID ${subjectId} not found`);
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
      logger.warn(`[PrismaUnifiedSubjectService] Class with ID ${classId} not found`);
      return {
        success: false,
        message: `Class with ID ${classId} not found`
      };
    }
    
    let students = [];
    
    // Handle differently based on subject type and education level
    if (classObj.educationLevel === 'O_LEVEL') {
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
        
        logger.info(`[PrismaUnifiedSubjectService] Found ${students.length} O-Level students for core subject ${subjectId}`);
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
        
        logger.info(`[PrismaUnifiedSubjectService] Found ${students.length} O-Level students for optional subject ${subjectId}`);
      }
    } else if (classObj.educationLevel === 'A_LEVEL') {
      // For A-Level, check subject combinations
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
        
        logger.info(`[PrismaUnifiedSubjectService] Found ${students.length} A-Level students for principal subject ${subjectId}`);
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
        
        logger.info(`[PrismaUnifiedSubjectService] Found ${students.length} A-Level students for subsidiary subject ${subjectId}`);
      }
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
    logger.error(`[PrismaUnifiedSubjectService] Error getting students for subject: ${error.message}`, error);
    return {
      success: false,
      message: `Error getting students for subject: ${error.message}`,
      error
    };
  }
}

module.exports = {
  getSubjectsForStudent,
  getSubjectsForClass,
  isTeacherAuthorizedForSubject,
  getSubjectsForTeacher,
  getStudentsForSubject
};
