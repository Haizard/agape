const express = require('express');
const router = express.Router();
const StudentAssignment = require('../models/StudentAssignment');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Create a new student assignment
router.post('/', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    console.log('POST /api/student-assignments - Creating assignment with data:', req.body);
    const { studentId, classId } = req.body;

    // Check if student already has an assignment
    const existingAssignment = await StudentAssignment.findOne({ studentId });
    if (existingAssignment) {
      console.log(`Student ${studentId} already assigned to class ${existingAssignment.classId}`);
      return res.status(400).json({
        message: 'Student is already assigned to a class. Please remove the existing assignment first.',
        existingAssignment
      });
    }

    const newAssignment = new StudentAssignment({ studentId, classId });
    await newAssignment.save();
    console.log('Assignment created successfully:', newAssignment);
    res.status(201).json(newAssignment);
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(400).json({
      message: error.message,
      code: error.code,
      name: error.name
    });
  }
});

// Update an existing student assignment
router.put('/', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    console.log('PUT /api/student-assignments - Updating assignment with data:', req.body);
    const { studentId, classId } = req.body;

    // Check if the assignment exists
    const existingAssignment = await StudentAssignment.findOne({ studentId });
    if (!existingAssignment) {
      console.log(`Assignment not found for student ${studentId}`);
      return res.status(404).json({ message: 'Assignment not found. The student is not assigned to any class.' });
    }

    // Update the assignment
    const updatedAssignment = await StudentAssignment.findOneAndUpdate(
      { studentId },
      { classId },
      { new: true }
    );

    console.log('Assignment updated successfully:', updatedAssignment);
    res.json(updatedAssignment);
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(400).json({
      message: error.message,
      code: error.code,
      name: error.name
    });
  }
});

// Delete a student assignment
router.delete('/', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    console.log('DELETE /api/student-assignments - Deleting assignment with data:', req.body);
    const { studentId, classId } = req.body;

    // Check if both studentId and classId are provided
    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required' });
    }

    // Find and delete the assignment
    const query = studentId ? { studentId } : { studentId, classId };
    const deletedAssignment = await StudentAssignment.findOneAndDelete(query);

    if (!deletedAssignment) {
      console.log(`Assignment not found for student ${studentId}`);
      return res.status(404).json({ message: 'Assignment not found. The student may not be assigned to any class.' });
    }

    console.log('Assignment deleted successfully:', deletedAssignment);
    res.json({
      message: 'Assignment deleted successfully',
      deletedAssignment
    });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(400).json({
      message: error.message,
      code: error.code,
      name: error.name
    });
  }
});

// Get all student assignments
router.get('/', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    console.log('GET /api/student-assignments - Fetching all assignments');
    const assignments = await StudentAssignment.find()
      .populate('studentId', 'firstName lastName rollNumber gender')
      .populate('classId', 'name section')
      .populate('academicYearId', 'year');

    console.log(`GET /api/student-assignments - Found ${assignments.length} assignments`);
    res.json(assignments);
  } catch (error) {
    console.error('GET /api/student-assignments - Error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
