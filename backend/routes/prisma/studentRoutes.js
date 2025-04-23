/**
 * Prisma Student Routes
 * 
 * These routes handle student-related operations using Prisma.
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../../middleware/auth');
const { registerStudent, getStudentById, getStudentsByClass } = require('../../services/prisma/studentService');
const logger = require('../../utils/logger');

/**
 * @route   POST /api/prisma/students/register
 * @desc    Register a new student
 * @access  Private (Admin, Teacher)
 */
router.post('/register', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    logger.info('[Prisma] POST /api/prisma/students/register - Registering new student');
    
    const result = await registerStudent(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    return res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      data: result.data
    });
  } catch (error) {
    logger.error(`[Prisma] Error registering student: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   GET /api/prisma/students/:id
 * @desc    Get student by ID
 * @access  Private (Admin, Teacher)
 */
router.get('/:id', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const studentId = req.params.id;
    
    logger.info(`[Prisma] GET /api/prisma/students/${studentId} - Getting student by ID`);
    
    const result = await getStudentById(studentId);
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message
      });
    }
    
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error(`[Prisma] Error getting student: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   GET /api/prisma/students/class/:classId
 * @desc    Get students by class ID
 * @access  Private (Admin, Teacher)
 */
router.get('/class/:classId', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const classId = req.params.classId;
    
    logger.info(`[Prisma] GET /api/prisma/students/class/${classId} - Getting students by class ID`);
    
    const result = await getStudentsByClass(classId);
    
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error(`[Prisma] Error getting students by class: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

module.exports = router;
