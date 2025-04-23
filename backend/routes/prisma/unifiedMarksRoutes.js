/**
 * Prisma Unified Marks Routes
 *
 * These routes handle marks entry operations for both O-Level and A-Level using Prisma.
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../../middleware/auth');
const marksService = require('../../services/prisma/marks');
const logger = require('../../utils/logger');

/**
 * @route   POST /api/prisma/marks
 * @desc    Enter marks for a student
 * @access  Private (Admin, Teacher)
 */
router.post('/', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    logger.info('[Prisma] POST /api/prisma/marks - Entering marks');

    // Add the user ID as the enteredBy field if not provided
    if (!req.body.enteredBy) {
      req.body.enteredBy = req.user.userId;
    }

    // Check if teacher is authorized to enter marks for this subject and class
    if (req.user.role === 'teacher') {
      const authResult = await marksService.checkTeacherAuthorization(
        req.user.teacherId,
        req.body.subjectId,
        req.body.classId
      );

      if (!authResult.success || !authResult.isAuthorized) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to enter marks for this subject in this class'
        });
      }
    }

    const result = await marksService.enterMarks(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Marks entered successfully',
      data: result.data
    });
  } catch (error) {
    logger.error(`[Prisma] Error entering marks: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   POST /api/prisma/marks/batch
 * @desc    Enter marks for multiple students
 * @access  Private (Admin, Teacher)
 */
router.post('/batch', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    logger.info('[Prisma] POST /api/prisma/marks/batch - Entering batch marks');

    // Add the user ID as the enteredBy field if not provided
    if (!req.body.enteredBy) {
      req.body.enteredBy = req.user.userId;
    }

    // Check if teacher is authorized to enter marks for this subject and class
    if (req.user.role === 'teacher') {
      const authResult = await marksService.checkTeacherAuthorization(
        req.user.teacherId,
        req.body.subjectId,
        req.body.classId
      );

      if (!authResult.success || !authResult.isAuthorized) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to enter marks for this subject in this class'
        });
      }
    }

    const result = await marksService.enterBatchMarks(req.body);

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
    logger.error(`[Prisma] Error entering batch marks: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   GET /api/prisma/marks/check
 * @desc    Check existing marks for a class, subject, and exam
 * @access  Private (Admin, Teacher)
 */
router.get('/check', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { classId, subjectId, examId } = req.query;

    logger.info(`[Prisma] GET /api/prisma/marks/check - Checking marks for class ${classId}, subject ${subjectId}, exam ${examId}`);

    // Check if teacher is authorized to view marks for this subject and class
    if (req.user.role === 'teacher') {
      const authResult = await marksService.checkTeacherAuthorization(
        req.user.teacherId,
        subjectId,
        classId
      );

      if (!authResult.success || !authResult.isAuthorized) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view marks for this subject in this class'
        });
      }
    }

    // Pass teacherId if the user is a teacher
    const teacherId = req.user.role === 'teacher' ? req.user.teacherId : null;
    const result = await marksService.checkExistingMarks({ classId, subjectId, examId, teacherId });

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
    logger.error(`[Prisma] Error checking marks: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   GET /api/prisma/marks/student
 * @desc    Check marks for a specific student, subject, and exam
 * @access  Private (Admin, Teacher, Student, Parent)
 */
router.get('/student', authenticateToken, async (req, res) => {
  try {
    const { studentId, subjectId, examId } = req.query;

    logger.info(`[Prisma] GET /api/prisma/marks/student - Checking marks for student ${studentId}, subject ${subjectId}, exam ${examId}`);

    // Check if the user is authorized to view this student's marks
    if (req.user.role === 'student' && req.user.userId !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this student\'s marks'
      });
    }

    // If user is a parent, check if they are the parent of the student
    if (req.user.role === 'parent') {
      // This would require a parent-student relationship check
      // For now, we'll assume this check is done elsewhere
    }

    const result = await marksService.checkStudentMarks({ studentId, subjectId, examId });

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

/**
 * @route   GET /api/prisma/marks/validate-eligibility
 * @desc    Validate if a student is eligible to take a subject
 * @access  Private (Admin, Teacher)
 */
router.get('/validate-eligibility', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { studentId, subjectId } = req.query;

    if (!studentId || !subjectId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: studentId, subjectId'
      });
    }

    logger.info(`[Prisma] GET /api/prisma/marks/validate-eligibility - Validating eligibility for student ${studentId}, subject ${subjectId}`);

    const result = await marksService.validateStudentSubjectEligibility(studentId, subjectId);

    return res.status(200).json(result);
  } catch (error) {
    logger.error(`[Prisma] Error validating student eligibility: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   POST /api/prisma/marks/batch-validate-eligibility
 * @desc    Batch validate eligibility for multiple students and a subject
 * @access  Private (Admin, Teacher)
 */
router.post('/batch-validate-eligibility', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { studentIds, subjectId } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || !subjectId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: studentIds (array), subjectId'
      });
    }

    logger.info(`[Prisma] POST /api/prisma/marks/batch-validate-eligibility - Batch validating eligibility for ${studentIds.length} students, subject ${subjectId}`);

    const result = await marksService.batchValidateEligibility(studentIds, subjectId);

    return res.status(200).json(result);
  } catch (error) {
    logger.error(`[Prisma] Error batch validating eligibility: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   GET /api/prisma/marks/a-level/students-by-subject
 * @desc    Get A-Level students filtered by subject for a class
 * @access  Private (Admin, Teacher)
 */
router.get('/a-level/students-by-subject', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { classId, subjectId, includeIneligible } = req.query;

    if (!classId || !subjectId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: classId, subjectId'
      });
    }

    // Convert includeIneligible to boolean
    const showIneligible = includeIneligible === 'true' || includeIneligible === true;

    logger.info(`[Prisma] GET /api/prisma/marks/a-level/students-by-subject - Getting students for class ${classId}, subject ${subjectId}, includeIneligible: ${showIneligible}`);

    // Check if teacher is authorized to view this class and subject
    if (req.user.role === 'teacher') {
      const teacherId = req.user.teacherId;
      if (!teacherId) {
        return res.status(403).json({
          success: false,
          message: 'Teacher ID not found in token'
        });
      }

      const isAuthorized = await marksService.checkTeacherAuthorization(teacherId, classId, subjectId);
      if (!isAuthorized.success) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view this class or subject'
        });
      }
    }

    const result = await marksService.getStudentsFilteredBySubject(classId, subjectId, showIneligible);

    return res.status(200).json(result);
  } catch (error) {
    logger.error(`[Prisma] Error getting students filtered by subject: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

module.exports = router;
