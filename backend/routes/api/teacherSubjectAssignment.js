const express = require('express');
const router = express.Router();
const Teacher = require('../../models/Teacher');
const Subject = require('../../models/Subject');
const Class = require('../../models/Class');
const { authenticateJWT, authorizeRole } = require('../../middleware/auth');

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

    // Find teacher
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Find class
    const classObj = await Class.findById(classId);
    if (!classObj) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Find subjects
    const subjects = await Subject.find({ _id: { $in: subjectIds } });
    if (subjects.length !== subjectIds.length) {
      return res.status(404).json({ message: 'One or more subjects not found' });
    }

    // Update teacher's subjects
    teacher.subjects = [...new Set([...teacher.subjects.map(s => s.toString()), ...subjectIds])];
    await teacher.save();

    // Update class's subject-teacher assignments
    const updatedSubjects = classObj.subjects.map(s => {
      if (subjectIds.includes(s.subject.toString())) {
        return {
          ...s.toObject(),
          teacher: teacherId
        };
      }
      return s;
    });

    classObj.subjects = updatedSubjects;
    await classObj.save();

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
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
