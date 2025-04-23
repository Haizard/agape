/**
 * Prisma Subject Assignment Routes
 *
 * This file defines routes for subject assignment operations using Prisma.
 */

const express = require('express');
const router = express.Router();
const subjectAssignmentService = require('../../services/prisma/subjects/subjectAssignmentService');
const { authenticateToken, authorizeRoles } = require('../../middleware/auth');

/**
 * @route GET /api/prisma/subject-assignments/students-by-subject
 * @desc Get students by subject for a class
 * @access Private (admin, teacher)
 */
router.get('/students-by-subject',
  authenticateToken,
  authorizeRoles(['admin', 'teacher']),
  async (req, res) => {
    try {
      const { classId, subjectId, includeIneligible } = req.query;

      // Convert includeIneligible to boolean
      const includeIneligibleBool = includeIneligible === 'true';

      // Get the teacher ID from the authenticated user
      const teacherId = req.user.role === 'teacher' ? req.user.userId : null;

      const result = await subjectAssignmentService.getStudentsBySubject({
        classId,
        subjectId,
        teacherId,
        includeIneligible: includeIneligibleBool
      });

      if (result.success) {
        return res.json(result);
      }

      return res.status(400).json(result);
    } catch (error) {
      console.error('Error in GET /students-by-subject:', error);
      return res.status(500).json({
        success: false,
        message: `Server error: ${error.message}`
      });
    }
  }
);

/**
 * @route POST /api/prisma/subject-assignments/assign
 * @desc Assign a subject to a student
 * @access Private (admin, teacher)
 */
router.post('/assign',
  authenticateToken,
  authorizeRoles(['admin', 'teacher']),
  async (req, res) => {
    try {
      const { studentId, subjectId, isPrincipal } = req.body;

      const result = await subjectAssignmentService.assignSubjectToStudent({
        studentId,
        subjectId,
        isPrincipal: isPrincipal || false
      });

      if (result.success) {
        return res.json(result);
      }

      return res.status(400).json(result);
    } catch (error) {
      console.error('Error in POST /assign:', error);
      return res.status(500).json({
        success: false,
        message: `Server error: ${error.message}`
      });
    }
  }
);

/**
 * @route POST /api/prisma/subject-assignments/bulk
 * @desc Bulk assign a subject to multiple students
 * @access Private (admin, teacher)
 */
router.post('/bulk',
  authenticateToken,
  authorizeRoles(['admin', 'teacher']),
  async (req, res) => {
    try {
      const { studentIds, subjectId, isPrincipal, classId } = req.body;

      // Validate required fields
      if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0 || !subjectId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: studentIds (array), subjectId'
        });
      }

      // Log the request
      console.log(`[SubjectAssignmentRoutes] Bulk assigning subject ${subjectId} to ${studentIds.length} students`);

      const result = await subjectAssignmentService.bulkAssignSubject({
        studentIds,
        subjectId,
        isPrincipal: isPrincipal || false
      });

      if (result.success) {
        return res.json(result);
      }

      return res.status(400).json(result);
    } catch (error) {
      console.error('Error in POST /bulk:', error);
      return res.status(500).json({
        success: false,
        message: `Server error: ${error.message}`
      });
    }
  }
);

module.exports = router;
