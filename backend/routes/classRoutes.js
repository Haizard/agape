const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const router = express.Router();
const Class = require('../models/Class');

// Get all classes
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('GET /api/classes - Fetching all classes');

    // Build query based on parameters
    const query = {};

    // Filter by academic year if provided
    if (req.query.academicYear) {
      query.academicYear = req.query.academicYear;
    }

    // Filter by education level if provided
    if (req.query.educationLevel) {
      query.educationLevel = req.query.educationLevel;
    }

    const classes = await Class.find(query)
      .populate('academicYear', 'name year')
      .populate('classTeacher', 'firstName lastName')
      .populate('subjectCombination', 'name code')
      .populate({
        path: 'subjects.subject',
        model: 'Subject',
        select: 'name code type educationLevel'
      })
      .populate({
        path: 'subjects.teacher',
        model: 'Teacher',
        select: 'firstName lastName'
      })
      .populate('students', 'firstName lastName rollNumber educationLevel');

    console.log(`GET /api/classes - Found ${classes.length} classes`);
    res.json(classes);
  } catch (error) {
    console.error('GET /api/classes - Error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get a specific class by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    console.log(`GET /api/classes/${req.params.id} - Fetching class details`);

    const classItem = await Class.findById(req.params.id)
      .populate('academicYear', 'name year')
      .populate('classTeacher', 'firstName lastName')
      .populate({
        path: 'subjects.subject',
        model: 'Subject',
        select: 'name code type description'
      })
      .populate({
        path: 'subjects.teacher',
        model: 'Teacher',
        select: 'firstName lastName'
      });

    if (!classItem) {
      console.log(`Class not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Class not found' });
    }

    console.log(`Found class: ${classItem.name} with ${classItem.subjects?.length || 0} subjects`);
    res.json(classItem);
  } catch (error) {
    console.error(`Error fetching class ${req.params.id}:`, error);
    res.status(500).json({ message: error.message });
  }
});

// Update subjects for a class
router.put('/:id/subjects', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    console.log(`PUT /api/classes/${req.params.id}/subjects - Updating subjects for class`);
    console.log('Request body:', req.body);

    // First check if the class exists
    const classItem = await Class.findById(req.params.id);
    if (!classItem) {
      console.log(`Class not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Class not found' });
    }

    // Get the current subjects to compare with new ones
    const currentSubjects = classItem.subjects || [];
    const newSubjects = req.body.subjects || [];

    // Update the subjects array
    classItem.subjects = newSubjects;

    // Save the updated class
    const updatedClass = await classItem.save();
    console.log(`Updated subjects for class ${req.params.id}`);

    // Now ensure that all teachers have these subjects in their profiles
    const Teacher = require('../models/Teacher');

    // Process each subject assignment
    for (const subjectAssignment of newSubjects) {
      if (!subjectAssignment.teacher || !subjectAssignment.subject) continue;

      // Get the teacher
      const teacher = await Teacher.findById(subjectAssignment.teacher);
      if (!teacher) continue;

      // Check if this subject is already in the teacher's subjects
      const subjectId = typeof subjectAssignment.subject === 'object' ?
        subjectAssignment.subject._id.toString() :
        subjectAssignment.subject.toString();

      const hasSubject = teacher.subjects.some(s => s.toString() === subjectId);

      // If not, add it
      if (!hasSubject) {
        teacher.subjects.push(subjectAssignment.subject);
        await teacher.save();
        console.log(`Added subject ${subjectId} to teacher ${teacher._id}`);
      }
    }

    // Return the updated class
    res.json(updatedClass);
  } catch (error) {
    console.error(`Error updating subjects for class ${req.params.id}:`, error);
    res.status(500).json({ message: error.message });
  }
});

// Add subjects to a class
router.post('/:id/subjects', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    console.log(`POST /api/classes/${req.params.id}/subjects - Adding subjects to class`);
    console.log('Request body:', req.body);

    // First check if the class exists
    const classItem = await Class.findById(req.params.id);
    if (!classItem) {
      console.log(`Class not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Class not found' });
    }

    // Get the subjects from the request
    const { subjects } = req.body;
    if (!subjects || !Array.isArray(subjects)) {
      console.log('Invalid subjects array in request');
      return res.status(400).json({ message: 'Invalid subjects array' });
    }

    // Validate that all subjects exist
    const Subject = require('../models/Subject');
    for (const subjectId of subjects) {
      const subject = await Subject.findById(subjectId);
      if (!subject) {
        console.log(`Subject not found with ID: ${subjectId}`);
        return res.status(404).json({ message: `Subject not found with ID: ${subjectId}` });
      }
    }

    // Add subjects to the class
    // First, get existing subject IDs to avoid duplicates
    const existingSubjectIds = classItem.subjects
      ? classItem.subjects.map(s => typeof s.subject === 'object' ? s.subject._id.toString() : s.subject.toString())
      : [];

    // Add new subjects
    for (const subjectId of subjects) {
      if (!existingSubjectIds.includes(subjectId.toString())) {
        classItem.subjects.push({
          subject: subjectId,
          teacher: null // No teacher assigned initially
        });
      }
    }

    // Save the updated class
    await classItem.save();
    console.log(`Added ${subjects.length} subjects to class ${classItem.name}`);

    // Return the updated class with populated subjects
    const updatedClass = await Class.findById(req.params.id)
      .populate({
        path: 'subjects.subject',
        model: 'Subject',
        select: 'name code type description'
      });

    res.json(updatedClass);
  } catch (error) {
    console.error(`Error adding subjects to class ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to add subjects to class' });
  }
});

// Get all subjects for a specific class
router.get('/:id/subjects', authenticateToken, async (req, res) => {
  try {
    console.log(`GET /api/classes/${req.params.id}/subjects - Fetching subjects for class`);

    // First check if the class exists
    const classItem = await Class.findById(req.params.id);
    if (!classItem) {
      console.log(`Class not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Class not found' });
    }

    // Find all teacher assignments for this class to get the subjects
    const TeacherAssignment = require('../models/TeacherAssignment');
    const assignments = await TeacherAssignment.find({ class: req.params.id })
      .populate('subject', 'name code description passMark');

    // Extract unique subjects
    const subjectMap = {};
    for (const assignment of assignments) {
      const subject = assignment.subject;
      if (subject && !subjectMap[subject._id]) {
        subjectMap[subject._id] = {
          _id: subject._id,
          name: subject.name,
          code: subject.code,
          description: subject.description,
          passMark: subject.passMark
        };
      }
    }

    const subjects = Object.values(subjectMap);
    console.log(`Found ${subjects.length} subjects for class ${req.params.id}`);
    res.json(subjects);
  } catch (error) {
    console.error(`Error fetching subjects for class ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to fetch subjects for this class' });
  }
});

// Create a new class
router.post('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const classItem = new Class(req.body);
    const newClass = await classItem.save();
    res.status(201).json(newClass);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a class
router.put('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const classItem = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('academicYear classTeacher');
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }
    res.json(classItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a class
router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const classItem = await Class.findByIdAndDelete(req.params.id);
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update class subjects (for assigning teachers to subjects)
router.put('/:id/subjects', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    console.log(`PUT /api/classes/${req.params.id}/subjects - Updating class subjects`);

    // First check if the class exists
    const classItem = await Class.findById(req.params.id);
    if (!classItem) {
      console.log(`Class not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Class not found' });
    }

    // Get the updated subjects array from the request body
    const { subjects } = req.body;
    if (!subjects || !Array.isArray(subjects)) {
      return res.status(400).json({ message: 'Subjects array is required' });
    }

    console.log(`Updating ${subjects.length} subject assignments for class ${classItem.name}`);

    // Update the class subjects
    classItem.subjects = subjects;
    await classItem.save();

    res.json({
      message: 'Class subjects updated successfully',
      class: classItem
    });
  } catch (error) {
    console.error(`Error updating subjects for class ${req.params.id}:`, error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
