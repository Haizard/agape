/**
 * Prisma O-Level Results Routes
 * 
 * These routes handle O-Level results-related operations using Prisma.
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../../middleware/auth');
const { 
  saveMarks, 
  saveBulkMarks, 
  getStudentResults, 
  getClassResults, 
  generateStudentReport, 
  generateClassReport 
} = require('../../services/prisma/oLevelResultsService');
const logger = require('../../utils/logger');

/**
 * @route   POST /api/prisma/o-level/results
 * @desc    Save marks for a student
 * @access  Private (Admin, Teacher)
 */
router.post('/', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    logger.info('[Prisma] POST /api/prisma/o-level/results - Saving marks');
    
    // Add the user ID as the enteredBy field if not provided
    if (!req.body.enteredBy) {
      req.body.enteredBy = req.user.userId;
    }
    
    const result = await saveMarks(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    return res.status(201).json({
      success: true,
      message: 'Marks saved successfully',
      data: result.data
    });
  } catch (error) {
    logger.error(`[Prisma] Error saving marks: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   POST /api/prisma/o-level/results/bulk
 * @desc    Save marks for multiple students
 * @access  Private (Admin, Teacher)
 */
router.post('/bulk', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    logger.info('[Prisma] POST /api/prisma/o-level/results/bulk - Saving bulk marks');
    
    // Add the user ID as the enteredBy field if not provided
    if (!req.body.enteredBy) {
      req.body.enteredBy = req.user.userId;
    }
    
    const result = await saveBulkMarks(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
        data: result.data
      });
    }
    
    return res.status(201).json({
      success: true,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    logger.error(`[Prisma] Error saving bulk marks: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   GET /api/prisma/o-level/results/student/:studentId/exam/:examId
 * @desc    Get results for a student in an exam
 * @access  Private (Admin, Teacher, Student, Parent)
 */
router.get('/student/:studentId/exam/:examId', authenticateToken, async (req, res) => {
  try {
    const { studentId, examId } = req.params;
    
    logger.info(`[Prisma] GET /api/prisma/o-level/results/student/${studentId}/exam/${examId} - Getting student results`);
    
    // Check if the user is authorized to view this student's results
    if (req.user.role === 'student' && req.user.userId !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this student\'s results'
      });
    }
    
    // If user is a parent, check if they are the parent of the student
    if (req.user.role === 'parent') {
      // This would require a parent-student relationship check
      // For now, we'll assume this check is done elsewhere
    }
    
    const result = await getStudentResults({ studentId, examId });
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error(`[Prisma] Error getting student results: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   GET /api/prisma/o-level/results/class/:classId/exam/:examId
 * @desc    Get class results for an exam
 * @access  Private (Admin, Teacher)
 */
router.get('/class/:classId/exam/:examId', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { classId, examId } = req.params;
    
    logger.info(`[Prisma] GET /api/prisma/o-level/results/class/${classId}/exam/${examId} - Getting class results`);
    
    const result = await getClassResults({ classId, examId });
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error(`[Prisma] Error getting class results: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   GET /api/prisma/o-level/results/report/student/:studentId/exam/:examId
 * @desc    Generate student report
 * @access  Private (Admin, Teacher, Student, Parent)
 */
router.get('/report/student/:studentId/exam/:examId', authenticateToken, async (req, res) => {
  try {
    const { studentId, examId } = req.params;
    
    logger.info(`[Prisma] GET /api/prisma/o-level/results/report/student/${studentId}/exam/${examId} - Generating student report`);
    
    // Check if the user is authorized to view this student's report
    if (req.user.role === 'student' && req.user.userId !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this student\'s report'
      });
    }
    
    // If user is a parent, check if they are the parent of the student
    if (req.user.role === 'parent') {
      // This would require a parent-student relationship check
      // For now, we'll assume this check is done elsewhere
    }
    
    const result = await generateStudentReport({ studentId, examId });
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error(`[Prisma] Error generating student report: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   GET /api/prisma/o-level/results/report/class/:classId/exam/:examId
 * @desc    Generate class report
 * @access  Private (Admin, Teacher)
 */
router.get('/report/class/:classId/exam/:examId', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { classId, examId } = req.params;
    
    logger.info(`[Prisma] GET /api/prisma/o-level/results/report/class/${classId}/exam/${examId} - Generating class report`);
    
    const result = await generateClassReport({ classId, examId });
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error(`[Prisma] Error generating class report: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

module.exports = router;
