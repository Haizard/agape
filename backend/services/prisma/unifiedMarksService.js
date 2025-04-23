/**
 * Prisma Unified Marks Service
 * 
 * This service handles marks entry operations for both O-Level and A-Level using Prisma.
 */

const prisma = require('../../lib/prisma');
const logger = require('../../utils/logger');
const { calculateGrade, calculatePoints, calculateDivision } = require('../../utils/gradeUtils');
const { isTeacherAuthorizedForSubject } = require('./unifiedSubjectService');

/**
 * Enter marks for a student
 * @param {Object} data - Marks data
 * @returns {Promise<Object>} - Result of the operation
 */
async function enterMarks(data) {
  try {
    const {
      studentId,
      examId,
      subjectId,
      classId,
      academicYearId,
      marksObtained,
      enteredBy,
      comment
    } = data;
    
    logger.info(`[PrismaUnifiedMarksService] Entering marks for student ${studentId}, subject ${subjectId}, exam ${examId}`);
    
    // Validate required fields
    if (!studentId || !examId || !subjectId || !classId || !academicYearId || marksObtained === undefined || !enteredBy) {
      logger.warn('[PrismaUnifiedMarksService] Missing required fields');
      return {
        success: false,
        message: 'Missing required fields: studentId, examId, subjectId, classId, academicYearId, marksObtained, enteredBy'
      };
    }
    
    // Validate marks range
    if (marksObtained < 0 || marksObtained > 100) {
      logger.warn(`[PrismaUnifiedMarksService] Invalid marks: ${marksObtained}`);
      return {
        success: false,
        message: 'Marks must be between 0 and 100'
      };
    }
    
    // Get student to determine education level
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });
    
    if (!student) {
      logger.warn(`[PrismaUnifiedMarksService] Student with ID ${studentId} not found`);
      return {
        success: false,
        message: `Student with ID ${studentId} not found`
      };
    }
    
    // Handle differently based on education level
    if (student.educationLevel === 'O_LEVEL') {
      return enterOLevelMarks(data, student);
    } else if (student.educationLevel === 'A_LEVEL') {
      return enterALevelMarks(data, student);
    } else {
      logger.warn(`[PrismaUnifiedMarksService] Unsupported education level: ${student.educationLevel}`);
      return {
        success: false,
        message: `Unsupported education level: ${student.educationLevel}`
      };
    }
  } catch (error) {
    logger.error(`[PrismaUnifiedMarksService] Error entering marks: ${error.message}`, error);
    return {
      success: false,
      message: `Error entering marks: ${error.message}`,
      error
    };
  }
}

/**
 * Enter O-Level marks for a student
 * @param {Object} data - Marks data
 * @param {Object} student - Student object
 * @returns {Promise<Object>} - Result of the operation
 */
async function enterOLevelMarks(data, student) {
  try {
    const {
      studentId,
      examId,
      subjectId,
      classId,
      academicYearId,
      marksObtained,
      enteredBy,
      comment
    } = data;
    
    logger.info(`[PrismaUnifiedMarksService] Entering O-Level marks for student ${studentId}, subject ${subjectId}, exam ${examId}`);
    
    // Calculate grade and points based on marks
    const grade = calculateGrade(marksObtained);
    const points = calculatePoints(grade);
    
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
          comment,
          updatedBy: enteredBy,
          updatedAt: new Date()
        }
      });
      
      logger.info(`[PrismaUnifiedMarksService] Updated O-Level marks for student ${studentId}: ${marksObtained}`);
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
          comment,
          enteredBy,
          educationLevel: 'O_LEVEL',
          updatedBy: enteredBy
        }
      });
      
      logger.info(`[PrismaUnifiedMarksService] Created new O-Level marks for student ${studentId}: ${marksObtained}`);
    }
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    logger.error(`[PrismaUnifiedMarksService] Error entering O-Level marks: ${error.message}`, error);
    return {
      success: false,
      message: `Error entering O-Level marks: ${error.message}`,
      error
    };
  }
}

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
    
    logger.info(`[PrismaUnifiedMarksService] Entering A-Level marks for student ${studentId}, subject ${subjectId}, exam ${examId}`);
    
    // Calculate grade and points based on marks
    const grade = calculateGrade(marksObtained);
    const points = calculatePoints(grade);
    
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
      
      logger.info(`[PrismaUnifiedMarksService] Updated A-Level marks for student ${studentId}: ${marksObtained}`);
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
      
      logger.info(`[PrismaUnifiedMarksService] Created new A-Level marks for student ${studentId}: ${marksObtained}`);
    }
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    logger.error(`[PrismaUnifiedMarksService] Error entering A-Level marks: ${error.message}`, error);
    return {
      success: false,
      message: `Error entering A-Level marks: ${error.message}`,
      error
    };
  }
}

/**
 * Enter marks for multiple students
 * @param {Object} data - Batch marks data
 * @returns {Promise<Object>} - Result of the operation
 */
async function enterBatchMarks(data) {
  try {
    const {
      classId,
      subjectId,
      examId,
      academicYearId,
      studentMarks,
      enteredBy
    } = data;
    
    logger.info(`[PrismaUnifiedMarksService] Entering batch marks for class ${classId}, subject ${subjectId}, exam ${examId}`);
    
    // Validate required fields
    if (!classId || !subjectId || !examId || !academicYearId || !studentMarks || !Array.isArray(studentMarks) || !enteredBy) {
      logger.warn('[PrismaUnifiedMarksService] Missing required fields for batch marks entry');
      return {
        success: false,
        message: 'Missing required fields: classId, subjectId, examId, academicYearId, studentMarks, enteredBy'
      };
    }
    
    const results = [];
    const errors = [];
    
    // Process each student's marks
    for (const studentMark of studentMarks) {
      const { studentId, marksObtained, comment, isPrincipal, isSubsidiary } = studentMark;
      
      if (!studentId || marksObtained === undefined) {
        errors.push({
          studentId,
          error: 'Missing studentId or marksObtained'
        });
        continue;
      }
      
      const result = await enterMarks({
        studentId,
        examId,
        subjectId,
        classId,
        academicYearId,
        marksObtained,
        enteredBy,
        comment,
        isPrincipal,
        isSubsidiary
      });
      
      if (result.success) {
        results.push(result.data);
      } else {
        errors.push({
          studentId,
          error: result.message
        });
      }
    }
    
    logger.info(`[PrismaUnifiedMarksService] Batch marks entry completed: ${results.length} successful, ${errors.length} failed`);
    
    return {
      success: errors.length === 0,
      message: `Saved marks for ${results.length} students, failed for ${errors.length} students`,
      data: {
        results,
        errors
      }
    };
  } catch (error) {
    logger.error(`[PrismaUnifiedMarksService] Error entering batch marks: ${error.message}`, error);
    return {
      success: false,
      message: `Error entering batch marks: ${error.message}`,
      error
    };
  }
}

/**
 * Check existing marks for a class, subject, and exam
 * @param {Object} params - Parameters
 * @param {string} params.classId - Class ID
 * @param {string} params.subjectId - Subject ID
 * @param {string} params.examId - Exam ID
 * @returns {Promise<Object>} - Result of the operation
 */
async function checkExistingMarks({ classId, subjectId, examId }) {
  try {
    logger.info(`[PrismaUnifiedMarksService] Checking existing marks for class ${classId}, subject ${subjectId}, exam ${examId}`);
    
    // Validate required fields
    if (!classId || !subjectId || !examId) {
      logger.warn('[PrismaUnifiedMarksService] Missing required fields for checking marks');
      return {
        success: false,
        message: 'Missing required fields: classId, subjectId, examId'
      };
    }
    
    // Get class details to determine education level
    const classObj = await prisma.class.findUnique({
      where: { id: classId }
    });
    
    if (!classObj) {
      logger.warn(`[PrismaUnifiedMarksService] Class with ID ${classId} not found`);
      return {
        success: false,
        message: `Class with ID ${classId} not found`
      };
    }
    
    // Get subject details
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId }
    });
    
    if (!subject) {
      logger.warn(`[PrismaUnifiedMarksService] Subject with ID ${subjectId} not found`);
      return {
        success: false,
        message: `Subject with ID ${subjectId} not found`
      };
    }
    
    // Get students who take this subject
    let students = [];
    
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
      }
    } else if (classObj.educationLevel === 'A_LEVEL') {
      // For A-Level, check subject combinations
      students = await prisma.student.findMany({
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
    }
    
    logger.info(`[PrismaUnifiedMarksService] Found ${students.length} students for subject ${subjectId} in class ${classId}`);
    
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
    
    logger.info(`[PrismaUnifiedMarksService] Found ${results.length} existing results for subject ${subjectId} in class ${classId}`);
    
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
      message: 'Successfully retrieved existing marks',
      data: {
        class: classObj,
        subject,
        studentsWithMarks,
        totalStudents: students.length,
        totalMarksEntered: results.length,
        progress: students.length > 0 ? Math.round((results.length / students.length) * 100) : 0
      }
    };
  } catch (error) {
    logger.error(`[PrismaUnifiedMarksService] Error checking existing marks: ${error.message}`, error);
    return {
      success: false,
      message: `Error checking existing marks: ${error.message}`,
      error
    };
  }
}

/**
 * Check if a teacher is authorized to enter marks
 * @param {string} teacherId - Teacher ID
 * @param {string} subjectId - Subject ID
 * @param {string} classId - Class ID
 * @returns {Promise<Object>} - Result of the operation
 */
async function checkTeacherAuthorization(teacherId, subjectId, classId) {
  try {
    logger.info(`[PrismaUnifiedMarksService] Checking if teacher ${teacherId} is authorized for subject ${subjectId} in class ${classId}`);
    
    const isAuthorized = await isTeacherAuthorizedForSubject(teacherId, subjectId, classId);
    
    return {
      success: true,
      isAuthorized
    };
  } catch (error) {
    logger.error(`[PrismaUnifiedMarksService] Error checking teacher authorization: ${error.message}`, error);
    return {
      success: false,
      message: `Error checking teacher authorization: ${error.message}`,
      error
    };
  }
}

module.exports = {
  enterMarks,
  enterBatchMarks,
  checkExistingMarks,
  checkTeacherAuthorization
};
