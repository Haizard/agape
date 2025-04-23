/**
 * Prisma O-Level Marks Routes
 * 
 * These routes handle O-Level marks-related operations using Prisma.
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../../middleware/auth');
const { checkExistingMarks, checkStudentMarks } = require('../../services/prisma/marksService');
const logger = require('../../utils/logger');

/**
 * @route   POST /api/prisma/o-level/marks/check
 * @desc    Check existing marks for a class, subject, and exam
 * @access  Private (Admin, Teacher)
 */
router.post('/check', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { classId, subjectId, examId } = req.body;
    
    // Validate required fields
    if (!classId || !subjectId || !examId) {
      return res.status(400).json({
        success: false,
        message: 'Class ID, Subject ID, and Exam ID are required'
      });
    }
    
    logger.info(`[Prisma] POST /api/prisma/o-level/marks/check - Checking marks for class ${classId}, subject ${subjectId}, exam ${examId}`);
    
    // Use the Prisma service
    const result = await checkExistingMarks({
      classId,
      subjectId,
      examId
    });
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    return res.status(200).json({
      success: true,
      message: result.message,
      data: {
        students: result.studentsWithMarks,
        totalStudents: result.totalStudents,
        totalMarksEntered: result.totalMarksEntered,
        progress: result.totalStudents > 0 ? Math.round((result.totalMarksEntered / result.totalStudents) * 100) : 0
      }
    });
  } catch (error) {
    logger.error(`[Prisma] Error checking marks: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   POST /api/prisma/o-level/marks/check-student
 * @desc    Check marks for a specific student, subject, and exam
 * @access  Private (Admin, Teacher)
 */
router.post('/check-student', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { studentId, subjectId, examId } = req.body;
    
    // Validate required fields
    if (!studentId || !subjectId || !examId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID, Subject ID, and Exam ID are required'
      });
    }
    
    logger.info(`[Prisma] POST /api/prisma/o-level/marks/check-student - Checking marks for student ${studentId}, subject ${subjectId}, exam ${examId}`);
    
    // Use the Prisma service
    const result = await checkStudentMarks({
      studentId,
      subjectId,
      examId
    });
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`[Prisma] Error checking student marks: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

module.exports = router;
