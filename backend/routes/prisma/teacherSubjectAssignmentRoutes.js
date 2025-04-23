/**
 * Prisma Teacher Subject Assignment Routes
 *
 * These routes handle teacher-subject assignments using Prisma.
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../../middleware/auth');
const { assignTeacherToSubject, updateClassSubjectAssignments, getTeacherSubjectsForClass } = require('../../services/prisma/teacherAssignmentService');
const logger = require('../../utils/logger');

/**
 * @route   POST /api/prisma/teacher-subject-assignments
 * @desc    Assign a teacher to a subject in a class
 * @access  Private (Admin)
 */
router.post('/', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { teacherId, subjectId, classId } = req.body;

    // Validate required fields
    if (!teacherId || !subjectId || !classId) {
      return res.status(400).json({
        success: false,
        message: 'Teacher ID, Subject ID, and Class ID are required'
      });
    }

    logger.info(`[Prisma] POST /api/prisma/teacher-subject-assignments - Assigning teacher ${teacherId} to subject ${subjectId} in class ${classId}`);

    // Use the Prisma service
    const result = await assignTeacherToSubject({
      classId,
      subjectId,
      teacherId,
      assignedBy: req.user.userId
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Teacher assigned to subject successfully',
      data: result.data
    });
  } catch (error) {
    logger.error(`[Prisma] Error assigning teacher to subject: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   POST /api/prisma/teacher-subject-assignments/batch
 * @desc    Assign a teacher to multiple subjects in a class
 * @access  Private (Admin)
 */
router.post('/batch', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { teacherId, subjectIds, classId } = req.body;

    // Validate input
    if (!teacherId || !Array.isArray(subjectIds) || subjectIds.length === 0 || !classId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input. Please provide teacherId, subjectIds array, and classId.'
      });
    }

    logger.info(`[Prisma] POST /api/prisma/teacher-subject-assignments/batch - Assigning teacher ${teacherId} to ${subjectIds.length} subjects in class ${classId}`);

    // Create assignments array
    const assignments = subjectIds.map(subjectId => ({
      subjectId,
      teacherId
    }));

    // Use the Prisma service
    const result = await updateClassSubjectAssignments({
      classId,
      assignments,
      assignedBy: req.user.userId
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
        results: result.results
      });
    }

    return res.status(200).json({
      success: true,
      message: `Successfully assigned teacher to ${result.results.filter(r => r.success).length} subjects`,
      results: result.results
    });
  } catch (error) {
    logger.error(`[Prisma] Error assigning teacher to multiple subjects: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   PUT /api/prisma/classes/:id/subjects
 * @desc    Update subjects for a class
 * @access  Private (Admin)
 */
router.put('/classes/:id/subjects', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const classId = req.params.id;
    const { subjects } = req.body;

    // Validate input
    if (!Array.isArray(subjects)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input. Please provide subjects array.'
      });
    }

    logger.info(`[Prisma] PUT /api/prisma/classes/${classId}/subjects - Updating subjects for class`);

    // Map subjects to assignments
    const assignments = subjects.map(subject => {
      const subjectId = subject.subject || subject.subjectId;
      const teacherId = subject.teacher || subject.teacherId;

      // Validate that teacherId is not empty string
      const finalTeacherId = teacherId === '' ? null : teacherId;

      return {
        subjectId,
        teacherId: finalTeacherId
      };
    });

    // Use the Prisma service
    const result = await updateClassSubjectAssignments({
      classId,
      assignments,
      assignedBy: req.user.userId
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
        results: result.results
      });
    }

    // Get the updated class with populated data
    const updatedClass = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        subjects: true
      }
    });

    return res.status(200).json({
      success: true,
      message: `Successfully updated ${result.results.filter(r => r.success).length} subject assignments`,
      data: updatedClass
    });
  } catch (error) {
    logger.error(`[Prisma] Error updating class subjects: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   GET /api/prisma/teacher-subject-assignments/teacher/:teacherId/class/:classId
 * @desc    Get subjects assigned to a teacher for a specific class
 * @access  Private (Admin, Teacher)
 */
router.get('/teacher/:teacherId/class/:classId', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { teacherId, classId } = req.params;

    // Validate that the teacher is requesting their own assignments or user is admin
    if (req.user.role === 'teacher' && req.user.teacherId !== teacherId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view assignments for other teachers'
      });
    }

    logger.info(`[Prisma] GET /api/prisma/teacher-subject-assignments/teacher/${teacherId}/class/${classId} - Getting subjects for teacher in class`);

    // Use the Prisma service
    const result = await getTeacherSubjectsForClass(teacherId, classId);

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
    logger.error(`[Prisma] Error getting teacher subjects: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});



module.exports = router;
