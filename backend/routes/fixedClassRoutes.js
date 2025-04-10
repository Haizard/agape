const express = require('express');
const router = express.Router();
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Get all classes
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('GET /api/classes - Fetching all classes');
    const classes = await Class.find()
      .populate('academicYear', 'year')
      .populate('classTeacher', 'firstName lastName');
    
    console.log(`Found ${classes.length} classes`);
    res.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create a new class
router.post('/', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    console.log('POST /api/classes - Creating new class');
    console.log('Request body:', req.body);
    
    const newClass = new Class(req.body);
    const savedClass = await newClass.save();
    
    console.log(`Created new class: ${savedClass.name} (${savedClass._id})`);
    res.status(201).json(savedClass);
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get a specific class
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    console.log(`GET /api/classes/${req.params.id} - Fetching class details`);
    
    const classItem = await Class.findById(req.params.id)
      .populate('academicYear', 'year')
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
    
    // Log the subjects for debugging
    console.log('Current subjects:', JSON.stringify(currentSubjects));
    console.log('New subjects:', JSON.stringify(newSubjects));
    
    // Update the subjects array
    classItem.subjects = newSubjects;
    
    // Save the updated class
    const updatedClass = await classItem.save();
    console.log(`Updated subjects for class ${req.params.id}`);
    
    // Now ensure that all teachers have these subjects in their profiles
    // Process each subject assignment that has a teacher
    for (const subjectAssignment of newSubjects) {
      // Skip if no subject
      if (!subjectAssignment.subject) {
        console.log('Skipping assignment with no subject');
        continue;
      }
      
      // Log the subject assignment for debugging
      console.log('Processing subject assignment:', JSON.stringify(subjectAssignment));
      
      // Skip if no teacher assigned
      if (!subjectAssignment.teacher) {
        console.log(`No teacher assigned to subject ${subjectAssignment.subject}`);
        continue;
      }
      
      // Get the teacher
      const teacher = await Teacher.findById(subjectAssignment.teacher);
      if (!teacher) {
        console.log(`Teacher not found with ID: ${subjectAssignment.teacher}`);
        continue;
      }
      
      // Check if this subject is already in the teacher's subjects
      const subjectId = typeof subjectAssignment.subject === 'object' ?
        subjectAssignment.subject._id.toString() :
        subjectAssignment.subject.toString();
      
      const hasSubject = teacher.subjects.some(s => 
        s.toString() === subjectId || 
        (s._id && s._id.toString() === subjectId)
      );
      
      // If not, add it
      if (!hasSubject) {
        teacher.subjects.push(subjectAssignment.subject);
        await teacher.save();
        console.log(`Added subject ${subjectId} to teacher ${teacher._id}`);
      } else {
        console.log(`Teacher ${teacher._id} already has subject ${subjectId}`);
      }
    }
    
    // Return the updated class with populated fields
    const populatedClass = await Class.findById(req.params.id)
      .populate('academicYear', 'year')
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
    
    res.json(populatedClass);
  } catch (error) {
    console.error(`Error updating subjects for class ${req.params.id}:`, error);
    res.status(500).json({ message: error.message });
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
    assignments.forEach(assignment => {
      if (assignment.subject) {
        subjectMap[assignment.subject._id] = assignment.subject;
      }
    });
    
    // Also include subjects directly from the class model
    if (classItem.subjects && classItem.subjects.length > 0) {
      for (const subjectItem of classItem.subjects) {
        if (subjectItem.subject) {
          const subjectId = typeof subjectItem.subject === 'object' ?
            subjectItem.subject._id.toString() :
            subjectItem.subject.toString();
          
          if (!subjectMap[subjectId]) {
            // Fetch the subject details if not already in the map
            const Subject = require('../models/Subject');
            const subject = await Subject.findById(subjectId);
            if (subject) {
              subjectMap[subjectId] = subject;
            }
          }
        }
      }
    }
    
    const subjects = Object.values(subjectMap);
    console.log(`Found ${subjects.length} subjects for class ${req.params.id}`);
    
    res.json(subjects);
  } catch (error) {
    console.error(`Error fetching subjects for class ${req.params.id}:`, error);
    res.status(500).json({ message: error.message });
  }
});

// Update a class
router.put('/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    console.log(`PUT /api/classes/${req.params.id} - Updating class`);
    console.log('Request body:', req.body);
    
    const updatedClass = await Class.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedClass) {
      console.log(`Class not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Class not found' });
    }
    
    console.log(`Updated class: ${updatedClass.name}`);
    res.json(updatedClass);
  } catch (error) {
    console.error(`Error updating class ${req.params.id}:`, error);
    res.status(400).json({ message: error.message });
  }
});

// Delete a class
router.delete('/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    console.log(`DELETE /api/classes/${req.params.id} - Deleting class`);
    
    const deletedClass = await Class.findByIdAndDelete(req.params.id);
    
    if (!deletedClass) {
      console.log(`Class not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Class not found' });
    }
    
    console.log(`Deleted class: ${deletedClass.name}`);
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error(`Error deleting class ${req.params.id}:`, error);
    res.status(500).json({ message: error.message });
  }
});

// Add a student to a class
router.post('/:id/students', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    console.log(`POST /api/classes/${req.params.id}/students - Adding student to class`);
    console.log('Request body:', req.body);
    
    const { studentId } = req.body;
    
    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required' });
    }
    
    // Check if the class exists
    const classItem = await Class.findById(req.params.id);
    if (!classItem) {
      console.log(`Class not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Check if the student exists
    const student = await Student.findById(studentId);
    if (!student) {
      console.log(`Student not found with ID: ${studentId}`);
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Check if the student is already in the class
    if (classItem.students.includes(studentId)) {
      console.log(`Student ${studentId} is already in class ${req.params.id}`);
      return res.status(400).json({ message: 'Student is already in this class' });
    }
    
    // Add the student to the class
    classItem.students.push(studentId);
    await classItem.save();
    
    // Update the student's class
    student.class = req.params.id;
    await student.save();
    
    console.log(`Added student ${studentId} to class ${req.params.id}`);
    res.json({ message: 'Student added to class successfully' });
  } catch (error) {
    console.error(`Error adding student to class ${req.params.id}:`, error);
    res.status(500).json({ message: error.message });
  }
});

// Remove a student from a class
router.delete('/:id/students/:studentId', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    console.log(`DELETE /api/classes/${req.params.id}/students/${req.params.studentId} - Removing student from class`);
    
    // Check if the class exists
    const classItem = await Class.findById(req.params.id);
    if (!classItem) {
      console.log(`Class not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Check if the student exists
    const student = await Student.findById(req.params.studentId);
    if (!student) {
      console.log(`Student not found with ID: ${req.params.studentId}`);
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Check if the student is in the class
    if (!classItem.students.includes(req.params.studentId)) {
      console.log(`Student ${req.params.studentId} is not in class ${req.params.id}`);
      return res.status(400).json({ message: 'Student is not in this class' });
    }
    
    // Remove the student from the class
    classItem.students = classItem.students.filter(
      id => id.toString() !== req.params.studentId
    );
    await classItem.save();
    
    // Update the student's class
    if (student.class && student.class.toString() === req.params.id) {
      student.class = null;
      await student.save();
    }
    
    console.log(`Removed student ${req.params.studentId} from class ${req.params.id}`);
    res.json({ message: 'Student removed from class successfully' });
  } catch (error) {
    console.error(`Error removing student from class ${req.params.id}:`, error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
