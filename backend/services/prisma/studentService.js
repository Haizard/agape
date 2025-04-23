/**
 * Prisma Student Service
 * 
 * This service handles student-related operations using Prisma.
 */

const prisma = require('../../lib/prisma');
const logger = require('../../utils/logger');
const bcrypt = require('bcrypt');

/**
 * Register a new student
 * @param {Object} studentData - Student registration data
 * @returns {Promise<Object>} - Newly created student
 */
async function registerStudent(studentData) {
  const {
    username,
    email,
    password,
    firstName,
    lastName,
    middleName,
    dateOfBirth,
    gender,
    classId,
    admissionNumber
  } = studentData;
  
  try {
    logger.info(`[PrismaStudentService] Registering new student: ${firstName} ${lastName}`);
    
    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });
    
    if (existingUser) {
      logger.warn(`[PrismaStudentService] Username already exists: ${username}`);
      return {
        success: false,
        message: 'Username already exists'
      };
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Use a transaction to create both user and student
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          username,
          email: email || `${username}@example.com`,
          password: hashedPassword,
          role: 'student'
        }
      });
      
      // Get class to determine education level
      const classObj = await tx.class.findUnique({
        where: { id: classId }
      });
      
      if (!classObj) {
        throw new Error(`Class with ID ${classId} not found`);
      }
      
      // Generate admission number if not provided
      const finalAdmissionNumber = admissionNumber || username || `STU-${Date.now().toString().slice(-6)}`;
      
      // Create student profile
      const student = await tx.student.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
          middleName: middleName || '',
          email: email || `${username}@example.com`,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          gender: gender || 'male',
          classId,
          educationLevel: classObj.educationLevel,
          form: classObj.educationLevel === 'A_LEVEL' ? 5 : 1,
          admissionNumber: finalAdmissionNumber,
          status: 'active'
        }
      });
      
      return { user, student };
    });
    
    logger.info(`[PrismaStudentService] Student registered successfully: ${result.student.id}`);
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    logger.error(`[PrismaStudentService] Error registering student: ${error.message}`, error);
    return {
      success: false,
      message: `Error registering student: ${error.message}`,
      error
    };
  }
}

/**
 * Get student details by ID
 * @param {string} studentId - Student ID
 * @returns {Promise<Object>} - Student details
 */
async function getStudentById(studentId) {
  try {
    logger.info(`[PrismaStudentService] Getting student by ID: ${studentId}`);
    
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            username: true,
            email: true,
            role: true
          }
        }
      }
    });
    
    if (!student) {
      logger.warn(`[PrismaStudentService] Student not found: ${studentId}`);
      return {
        success: false,
        message: 'Student not found'
      };
    }
    
    return {
      success: true,
      data: student
    };
  } catch (error) {
    logger.error(`[PrismaStudentService] Error getting student: ${error.message}`, error);
    return {
      success: false,
      message: `Error getting student: ${error.message}`,
      error
    };
  }
}

/**
 * Get students by class ID
 * @param {string} classId - Class ID
 * @returns {Promise<Object>} - List of students
 */
async function getStudentsByClass(classId) {
  try {
    logger.info(`[PrismaStudentService] Getting students for class: ${classId}`);
    
    const students = await prisma.student.findMany({
      where: { classId },
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        }
      },
      orderBy: {
        firstName: 'asc'
      }
    });
    
    return {
      success: true,
      data: students
    };
  } catch (error) {
    logger.error(`[PrismaStudentService] Error getting students by class: ${error.message}`, error);
    return {
      success: false,
      message: `Error getting students by class: ${error.message}`,
      error
    };
  }
}

module.exports = {
  registerStudent,
  getStudentById,
  getStudentsByClass
};
