const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const teacherAssignmentService = require('../services/teacherAssignmentService');
const { fixTeacherSubjectAssignment } = require('../utils/fixTeacherAssignments');
const logger = require('../utils/logger');

// Fix teacher assignments
router.post('/fix-teacher-assignments', authenticateToken, async (req, res) => {
  try {
    console.log('POST /api/fix-teacher-assignments - Fixing teacher assignments');

    // Get the username and class ID from the request body
    const { username, classId } = req.body;

    if (!username || !classId) {
      return res.status(400).json({ message: 'Username and class ID are required' });
    }

    // Get the teacher by username
    const teacher = await teacherAssignmentService.getTeacherByUsername(username);
    if (!teacher) {
      return res.status(404).json({ message: `Teacher profile for user ${username} not found` });
    }

    // Use the comprehensive service to assign the teacher to all subjects in the class
    const result = await teacherAssignmentService.assignTeacherToAllSubjectsInClass(teacher._id, classId);

    if (!result.success) {
      return res.status(400).json({ message: result.message, error: result.error });
    }

    res.json(result);
  } catch (error) {
    console.error('Error fixing teacher assignments:', error);
    res.status(500).json({ message: 'Failed to fix teacher assignments', error: error.message });
  }
});

// Diagnose and fix teacher assignments
router.post('/diagnose-and-fix', authenticateToken, async (req, res) => {
  try {
    console.log('POST /api/fix-teacher/diagnose-and-fix - Diagnosing and fixing teacher assignments');
    console.log('Request body:', req.body);

    // Get the teacher ID and class ID from the request body
    // Support both username and teacherId for backward compatibility
    const { username, teacherId, classId } = req.body;

    if (!classId) {
      return res.status(400).json({ message: 'Class ID is required' });
    }

    let teacher;

    // If teacherId is provided, use it directly
    if (teacherId) {
      console.log(`Using provided teacherId: ${teacherId}`);
      // Use the comprehensive service to diagnose and fix teacher assignments
      const result = await teacherAssignmentService.diagnoseAndFixTeacherAssignments(teacherId, classId);
      return res.json(result);
    }

    // Otherwise, try to find the teacher by username
    if (username) {
      console.log(`Looking up teacher by username: ${username}`);
      teacher = await teacherAssignmentService.getTeacherByUsername(username);
      if (!teacher) {
        return res.status(404).json({ message: `Teacher profile for user ${username} not found` });
      }

      // Use the comprehensive service to diagnose and fix teacher assignments
      const result = await teacherAssignmentService.diagnoseAndFixTeacherAssignments(teacher._id, classId);
      return res.json(result);
    }

    return res.status(400).json({ message: 'Either username or teacherId is required' });
  } catch (error) {
    console.error('Error diagnosing teacher assignments:', error);
    res.status(500).json({ message: 'Failed to diagnose teacher assignments', error: error.message });
  }
});

// Get teacher subjects in class
router.get('/teacher-subjects/:teacherId/:classId', authenticateToken, async (req, res) => {
  try {
    const { teacherId, classId } = req.params;

    if (!teacherId || !classId) {
      return res.status(400).json({ message: 'Teacher ID and Class ID are required' });
    }

    // Get the teacher's subjects in the class
    const subjects = await teacherAssignmentService.getTeacherSubjectsInClass(teacherId, classId, false);

    res.json({
      teacherId,
      classId,
      subjectCount: subjects.length,
      subjects
    });
  } catch (error) {
    console.error('Error getting teacher subjects:', error);
    res.status(500).json({ message: 'Failed to get teacher subjects', error: error.message });
  }
});

// Get teacher classes
router.get('/teacher-classes/:teacherId', authenticateToken, async (req, res) => {
  try {
    const { teacherId } = req.params;

    if (!teacherId) {
      return res.status(400).json({ message: 'Teacher ID is required' });
    }

    // Get the teacher's classes
    const classes = await teacherAssignmentService.getTeacherClasses(teacherId);

    res.json({
      teacherId,
      classCount: classes.length,
      classes
    });
  } catch (error) {
    console.error('Error getting teacher classes:', error);
    res.status(500).json({ message: 'Failed to get teacher classes', error: error.message });
  }
});

/**
 * @route   POST /api/fix-teacher/subject-assignment
 * @desc    Fix teacher-subject assignment
 * @access  Private (Admin, Teacher)
 */
router.post('/subject-assignment',
  authenticateToken,
  authorizeRole(['admin', 'teacher']),
  async (req, res) => {
    try {
      const { classId, subjectId, teacherId } = req.body;

      // Validate required fields
      if (!classId || !subjectId || !teacherId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: classId, subjectId, teacherId'
        });
      }

      // Fix the assignment
      const result = await fixTeacherSubjectAssignment(classId, subjectId, teacherId);

      // Return the result
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error(`Error in fix-teacher/subject-assignment: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
});

module.exports = router;
