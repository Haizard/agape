/**
 * A-Level Marks Routes
 *
 * This file contains routes for A-Level marks and student filtering.
 */

const express = require('express');
const router = express.Router();
const logger = require('../../utils/logger');
const { authenticateJWT, authorizeRole } = require('../../middleware/prismaAuth');
const aLevelStudentFilterService = require('../../services/prisma/marks/aLevelStudentFilterService');

/**
 * @route GET /api/prisma/marks/a-level/students-by-subject
 * @desc Get A-Level students filtered by subject
 * @access Private
 */
router.get('/students-by-subject', authenticateJWT, async (req, res) => {
  try {
    const { classId, subjectId, includeIneligible } = req.query;
    logger.info(`[A-Level Marks Routes] GET /api/prisma/marks/a-level/students-by-subject - classId=${classId}, subjectId=${subjectId}, includeIneligible=${includeIneligible}`);

    // Validate required parameters
    if (!classId || !subjectId) {
      logger.warn('[A-Level Marks Routes] Missing required parameters');
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: classId, subjectId'
      });
    }

    // Convert includeIneligible to boolean
    const includeIneligibleBool = includeIneligible === 'true' || includeIneligible === true;

    // Get teacher ID from authenticated user if available
    const teacherId = req.user.role === 'teacher' ? req.user.teacherId : null;

    // Get students filtered by subject
    const result = await aLevelStudentFilterService.getStudentsFilteredBySubject(
      classId,
      subjectId,
      includeIneligibleBool
    );

    // Return the result
    return res.json(result);
  } catch (error) {
    logger.error(`[A-Level Marks Routes] Error getting students by subject: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Error getting students by subject: ${error.message}`,
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
  }
});

/**
 * @route GET /api/prisma/marks/a-level/validate-eligibility
 * @desc Validate if a student is eligible for a subject
 * @access Private
 */
router.get('/validate-eligibility', authenticateJWT, async (req, res) => {
  try {
    const { studentId, subjectId } = req.query;
    logger.info(`[A-Level Marks Routes] GET /api/prisma/marks/a-level/validate-eligibility - studentId=${studentId}, subjectId=${subjectId}`);

    // Validate required parameters
    if (!studentId || !subjectId) {
      logger.warn('[A-Level Marks Routes] Missing required parameters');
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: studentId, subjectId'
      });
    }

    // TODO: Implement eligibility validation logic
    // For now, return a placeholder response
    return res.json({
      success: true,
      data: {
        isEligible: true,
        isPrincipal: false,
        message: 'Eligibility validation not yet implemented'
      }
    });
  } catch (error) {
    logger.error(`[A-Level Marks Routes] Error validating eligibility: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Error validating eligibility: ${error.message}`,
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
  }
});

module.exports = router;
