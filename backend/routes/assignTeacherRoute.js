const express = require('express');
const router = express.Router();
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const { authenticateToken } = require('../middleware/auth');

// Assign a teacher to a subject in a class
router.post('/assign-teacher', authenticateToken, async (req, res) => {
  try {
    console.log('POST /api/assign-teacher - Assigning teacher to subject');
    
    // Get the teacher ID and class ID from the request body
    const { teacherUserId, classId, subjectIndex } = req.body;
    
    if (!teacherUserId || !classId) {
      return res.status(400).json({ message: 'Teacher user ID and class ID are required' });
    }
    
    // Find the teacher by userId
    const teacher = await Teacher.findOne({ userId: teacherUserId });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    // Find the class
    const classObj = await Class.findById(classId);
    if (!classObj) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Check if the class has subjects
    if (!classObj.subjects || !Array.isArray(classObj.subjects) || classObj.subjects.length === 0) {
      return res.status(400).json({ message: 'No subjects found in class' });
    }
    
    // Determine which subject to assign the teacher to
    const index = subjectIndex || 0;
    if (index >= classObj.subjects.length) {
      return res.status(400).json({ message: 'Subject index out of range' });
    }
    
    // Assign the teacher to the subject
    classObj.subjects[index].teacher = teacher._id;
    
    // Save the class
    await classObj.save();
    
    res.json({ 
      message: 'Teacher assigned to subject successfully',
      teacher: {
        id: teacher._id,
        name: `${teacher.firstName} ${teacher.lastName}`
      },
      class: {
        id: classObj._id,
        name: classObj.name
      },
      subject: classObj.subjects[index].subject
    });
  } catch (error) {
    console.error('Error assigning teacher to subject:', error);
    res.status(500).json({ message: 'Failed to assign teacher to subject', error: error.message });
  }
});

module.exports = router;
