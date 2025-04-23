/**
 * Prisma Results Routes
 * 
 * These routes handle results-related operations using Prisma.
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../../middleware/auth');
const { 
  saveResult, 
  saveBatchResults, 
  getStudentResults, 
  getClassResults, 
  getSubjectResults, 
  calculateOLevelDivision, 
  deleteResult 
} = require('../../services/prisma/resultsService');
const logger = require('../../utils/logger');

/**
 * @route   POST /api/prisma/results
 * @desc    Create or update a result
 * @access  Private (Admin, Teacher)
 */
router.post('/', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    logger.info('[Prisma] POST /api/prisma/results - Creating/updating result');
    
    // Add the user ID as the enteredBy field if not provided
    if (!req.body.enteredBy) {
      req.body.enteredBy = req.user.userId;
    }
    
    const result = await saveResult(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    return res.status(201).json({
      success: true,
      message: 'Result saved successfully',
      data: result.data
    });
  } catch (error) {
    logger.error(`[Prisma] Error saving result: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   POST /api/prisma/results/batch
 * @desc    Create or update multiple results
 * @access  Private (Admin, Teacher)
 */
router.post('/batch', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    logger.info('[Prisma] POST /api/prisma/results/batch - Creating/updating batch results');
    
    const { results } = req.body;
    
    if (!results || !Array.isArray(results) || results.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No results provided or invalid format'
      });
    }
    
    // Add the user ID as the enteredBy field if not provided
    const resultsWithUser = results.map(result => ({
      ...result,
      enteredBy: result.enteredBy || req.user.userId
    }));
    
    const result = await saveBatchResults(resultsWithUser);
    
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
    logger.error(`[Prisma] Error saving batch results: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   GET /api/prisma/results/student/:studentId
 * @desc    Get results for a student
 * @access  Private (Admin, Teacher, Student)
 */
router.get('/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { examId } = req.query;
    
    logger.info(`[Prisma] GET /api/prisma/results/student/${studentId} - Getting student results`);
    
    // Check if the user is authorized to view this student's results
    if (req.user.role === 'student' && req.user.userId !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this student\'s results'
      });
    }
    
    const result = await getStudentResults(studentId, examId);
    
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
 * @route   GET /api/prisma/results/class/:classId/exam/:examId
 * @desc    Get results for a class
 * @access  Private (Admin, Teacher)
 */
router.get('/class/:classId/exam/:examId', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { classId, examId } = req.params;
    
    logger.info(`[Prisma] GET /api/prisma/results/class/${classId}/exam/${examId} - Getting class results`);
    
    const result = await getClassResults(classId, examId);
    
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
 * @route   GET /api/prisma/results/subject/:subjectId/class/:classId/exam/:examId
 * @desc    Get results for a subject
 * @access  Private (Admin, Teacher)
 */
router.get('/subject/:subjectId/class/:classId/exam/:examId', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { subjectId, classId, examId } = req.params;
    
    logger.info(`[Prisma] GET /api/prisma/results/subject/${subjectId}/class/${classId}/exam/${examId} - Getting subject results`);
    
    const result = await getSubjectResults(subjectId, classId, examId);
    
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
    logger.error(`[Prisma] Error getting subject results: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   GET /api/prisma/results/o-level/division/student/:studentId/exam/:examId
 * @desc    Calculate O-Level division for a student
 * @access  Private (Admin, Teacher, Student)
 */
router.get('/o-level/division/student/:studentId/exam/:examId', authenticateToken, async (req, res) => {
  try {
    const { studentId, examId } = req.params;
    
    logger.info(`[Prisma] GET /api/prisma/results/o-level/division/student/${studentId}/exam/${examId} - Calculating O-Level division`);
    
    // Check if the user is authorized to view this student's results
    if (req.user.role === 'student' && req.user.userId !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this student\'s results'
      });
    }
    
    const result = await calculateOLevelDivision(studentId, examId);
    
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
    logger.error(`[Prisma] Error calculating O-Level division: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   DELETE /api/prisma/results/:id
 * @desc    Delete a result
 * @access  Private (Admin)
 */
router.delete('/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    logger.info(`[Prisma] DELETE /api/prisma/results/${id} - Deleting result`);
    
    const result = await deleteResult(id);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    logger.error(`[Prisma] Error deleting result: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

module.exports = router;
