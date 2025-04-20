const express = require('express');
const router = express.Router();
const Teacher = require('../../models/Teacher');
const Subject = require('../../models/Subject');
const Class = require('../../models/Class');
const { authenticateJWT, authorizeRole } = require('../../middleware/auth');
const unifiedTeacherAssignmentService = require('../../services/unifiedTeacherAssignmentService');

// @route   POST /api/teacher-subject-assignment
// @desc    Assign subjects to a teacher
// @access  Private (Admin)
router.post('/', authenticateJWT, authorizeRole(['admin']), async (req, res) => {
  try {
    const { teacherId, subjectIds, classId } = req.body;

    // Validate input
    if (!teacherId || !Array.isArray(subjectIds) || subjectIds.length === 0 || !classId) {
      return res.status(400).json({ message: 'Invalid input. Please provide teacherId, subjectIds array, and classId.' });
    }

    console.log(`POST /api/teacher-subject-assignment - Assigning teacher ${teacherId} to ${subjectIds.length} subjects in class ${classId}`);

    // Process each subject assignment using the unified service
    const results = [];
    for (const subjectId of subjectIds) {
      const result = await unifiedTeacherAssignmentService.assignTeacherToSubject({
        classId,
        subjectId,
        teacherId,
        assignedBy: req.user.userId,
        allowAdminFallback: false, // Never allow admin fallback
        updateAllModels: true // Update all related models
      });

      results.push({
        subjectId,
        success: result.success,
        message: result.message,
        details: result.details
      });
    }

    // Check if any assignments failed
    const failures = results.filter(r => !r.success);
    if (failures.length > 0) {
      console.error(`${failures.length} subject assignments failed:`, failures);
      return res.status(400).json({
        message: 'Some subject assignments failed',
        failures,
        successes: results.filter(r => r.success)
      });
    }

    // Get the updated teacher and class data
    const [teacher, classObj] = await Promise.all([
      Teacher.findById(teacherId).populate('subjects', 'name code'),
      Class.findById(classId)
        .populate({
          path: 'subjects.subject',
          model: 'Subject',
          select: 'name code'
        })
        .populate({
          path: 'subjects.teacher',
          model: 'Teacher',
          select: 'firstName lastName'
        })
    ]);

    return res.json({
      message: 'Teacher assigned to subjects successfully',
      teacher: {
        _id: teacher._id,
        name: `${teacher.firstName} ${teacher.lastName}`,
        subjects: teacher.subjects
      },
      class: {
        _id: classObj._id,
        name: classObj.name,
        subjects: classObj.subjects
      }
    });
  } catch (error) {
    console.error('Error assigning subjects to teacher:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
