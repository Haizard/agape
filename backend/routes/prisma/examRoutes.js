/**
 * Prisma Exam Routes
 * 
 * These routes handle exam-related operations using Prisma.
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../../middleware/auth');
const { 
  createExam, 
  getExamById, 
  updateExam, 
  getExamsByAcademicYear, 
  getExamsByTerm, 
  deleteExam 
} = require('../../services/prisma/examService');
const logger = require('../../utils/logger');

/**
 * @route   POST /api/prisma/exams
 * @desc    Create a new exam
 * @access  Private (Admin, Teacher)
 */
router.post('/', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    logger.info('[Prisma] POST /api/prisma/exams - Creating new exam');
    
    const result = await createExam(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    return res.status(201).json({
      success: true,
      message: 'Exam created successfully',
      data: result.data
    });
  } catch (error) {
    logger.error(`[Prisma] Error creating exam: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   GET /api/prisma/exams/:id
 * @desc    Get exam by ID
 * @access  Private (Admin, Teacher)
 */
router.get('/:id', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const examId = req.params.id;
    
    logger.info(`[Prisma] GET /api/prisma/exams/${examId} - Getting exam by ID`);
    
    const result = await getExamById(examId);
    
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
    logger.error(`[Prisma] Error getting exam: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   PUT /api/prisma/exams/:id
 * @desc    Update an existing exam
 * @access  Private (Admin, Teacher)
 */
router.put('/:id', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const examId = req.params.id;
    
    logger.info(`[Prisma] PUT /api/prisma/exams/${examId} - Updating exam`);
    
    const result = await updateExam(examId, req.body);
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Exam updated successfully',
      data: result.data
    });
  } catch (error) {
    logger.error(`[Prisma] Error updating exam: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   GET /api/prisma/exams/academic-year/:academicYearId
 * @desc    Get exams by academic year
 * @access  Private (Admin, Teacher)
 */
router.get('/academic-year/:academicYearId', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const academicYearId = req.params.academicYearId;
    
    logger.info(`[Prisma] GET /api/prisma/exams/academic-year/${academicYearId} - Getting exams by academic year`);
    
    const result = await getExamsByAcademicYear(academicYearId);
    
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error(`[Prisma] Error getting exams by academic year: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   GET /api/prisma/exams/academic-year/:academicYearId/term/:term
 * @desc    Get exams by term
 * @access  Private (Admin, Teacher)
 */
router.get('/academic-year/:academicYearId/term/:term', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { academicYearId, term } = req.params;
    
    logger.info(`[Prisma] GET /api/prisma/exams/academic-year/${academicYearId}/term/${term} - Getting exams by term`);
    
    const result = await getExamsByTerm(academicYearId, term);
    
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error(`[Prisma] Error getting exams by term: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   DELETE /api/prisma/exams/:id
 * @desc    Delete an exam
 * @access  Private (Admin)
 */
router.delete('/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const examId = req.params.id;
    
    logger.info(`[Prisma] DELETE /api/prisma/exams/${examId} - Deleting exam`);
    
    const result = await deleteExam(examId);
    
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
    logger.error(`[Prisma] Error deleting exam: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

module.exports = router;
