const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Update a student's education level
router.put('/:studentId/education-level', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { studentId } = req.params;
    const { educationLevel } = req.body;

    // Validate education level
    if (!educationLevel || !['A_LEVEL', 'O_LEVEL'].includes(educationLevel)) {
      return res.status(400).json({ message: 'Invalid education level. Must be A_LEVEL or O_LEVEL' });
    }

    // Find and update the student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Update the education level
    student.educationLevel = educationLevel;
    await student.save();

    // Return success
    res.json({
      success: true,
      message: `Student education level updated to ${educationLevel}`,
      student: {
        id: student._id,
        name: `${student.firstName} ${student.lastName}`,
        educationLevel: student.educationLevel
      }
    });
  } catch (error) {
    console.error('Error updating student education level:', error);
    res.status(500).json({ message: 'Error updating student education level' });
  }
});

// Update a class's education level
router.put('/class/:classId/education-level', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { classId } = req.params;
    const { educationLevel } = req.body;

    // Validate education level
    if (!educationLevel || !['A_LEVEL', 'O_LEVEL'].includes(educationLevel)) {
      return res.status(400).json({ message: 'Invalid education level. Must be A_LEVEL or O_LEVEL' });
    }

    // Find all students in the class
    const students = await Student.find({ class: classId });
    if (!students || students.length === 0) {
      return res.status(404).json({ message: 'No students found in class' });
    }

    // Update all students' education level
    const updatePromises = students.map(student => {
      student.educationLevel = educationLevel;
      return student.save();
    });

    await Promise.all(updatePromises);

    // Return success
    res.json({
      success: true,
      message: `Education level updated to ${educationLevel} for ${students.length} students in class`,
      updatedCount: students.length
    });
  } catch (error) {
    console.error('Error updating class education level:', error);
    res.status(500).json({ message: 'Error updating class education level' });
  }
});

module.exports = router;
