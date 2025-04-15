/**
 * Marks History Routes
 * Handles API routes for marks history
 */
const express = require('express');
const router = express.Router();
const marksHistoryService = require('../services/marksHistoryService');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * @route   GET /api/marks-history/result/:resultId
 * @desc    Get history for a specific result
 * @access  Private (Admin, Teacher)
 */
router.get('/result/:resultId', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { resultId } = req.params;
    const { resultModel } = req.query;

    if (!resultModel) {
      return res.status(400).json({
        success: false,
        message: 'Result model type is required'
      });
    }

    const history = await marksHistoryService.getHistoryForResult(resultId, resultModel);
    
    res.json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    logger.error(`Error getting history for result: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error getting history for result',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/marks-history/student/:studentId
 * @desc    Get history for a specific student
 * @access  Private (Admin, Teacher)
 */
router.get('/student/:studentId', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { studentId } = req.params;
    const filters = {
      examId: req.query.examId,
      subjectId: req.query.subjectId,
      academicYearId: req.query.academicYearId,
      changeType: req.query.changeType,
      educationLevel: req.query.educationLevel
    };

    const history = await marksHistoryService.getHistoryForStudent(studentId, filters);
    
    res.json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    logger.error(`Error getting history for student: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error getting history for student',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/marks-history/subject/:subjectId
 * @desc    Get history for a specific subject
 * @access  Private (Admin, Teacher)
 */
router.get('/subject/:subjectId', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { subjectId } = req.params;
    const filters = {
      examId: req.query.examId,
      classId: req.query.classId,
      academicYearId: req.query.academicYearId,
      changeType: req.query.changeType,
      educationLevel: req.query.educationLevel
    };

    const history = await marksHistoryService.getHistoryForSubject(subjectId, filters);
    
    res.json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    logger.error(`Error getting history for subject: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error getting history for subject',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/marks-history/exam/:examId
 * @desc    Get history for a specific exam
 * @access  Private (Admin, Teacher)
 */
router.get('/exam/:examId', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { examId } = req.params;
    const filters = {
      classId: req.query.classId,
      subjectId: req.query.subjectId,
      academicYearId: req.query.academicYearId,
      changeType: req.query.changeType,
      educationLevel: req.query.educationLevel
    };

    const history = await marksHistoryService.getHistoryForExam(examId, filters);
    
    res.json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    logger.error(`Error getting history for exam: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error getting history for exam',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/marks-history/revert/:historyId
 * @desc    Revert a result to a previous state
 * @access  Private (Admin)
 */
router.post('/revert/:historyId', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { historyId } = req.params;
    
    // Prepare user data for tracking
    const userData = {
      userId: req.user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };

    const result = await marksHistoryService.revertToHistoryEntry(historyId, userData);
    
    res.json({
      success: true,
      message: 'Result reverted successfully',
      data: result
    });
  } catch (error) {
    logger.error(`Error reverting to history entry: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error reverting to history entry',
      error: error.message
    });
  }
});

module.exports = router;
