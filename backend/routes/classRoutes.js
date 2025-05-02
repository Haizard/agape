const express = require('express');
const mongoose = require('mongoose');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const enhancedTeacherAuth = require('../middleware/enhancedTeacherAuth');
const router = express.Router();
const Class = require('../models/Class');
const unifiedTeacherAssignmentService = require('../services/unifiedTeacherAssignmentService');

// Get all classes
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('GET /api/classes - Fetching all classes');
    console.log('Query parameters:', req.query);

    // Build query based on parameters
    const query = {};

    // Filter by academic year if provided
    if (req.query.academicYear) {
      query.academicYear = req.query.academicYear;
      console.log(`Filtering by academic year: ${req.query.academicYear}`);
    }

    // Filter by education level if provided
    if (req.query.educationLevel) {
      query.educationLevel = req.query.educationLevel;
      console.log(`Filtering by education level: ${req.query.educationLevel}`);
    }

    console.log('MongoDB query:', JSON.stringify(query));

    // Set timeout for the database query
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database query timed out')), 20000);
    });

    // Execute the query with a timeout
    const queryPromise = Class.find(query)
      .populate('academicYear', 'name year')
      .populate('classTeacher', 'firstName lastName')
      .populate('subjectCombination', 'name code')
      .populate('subjectCombinations', 'name code')
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
      .populate('students', 'firstName lastName rollNumber educationLevel form subjectCombination');

    // Race the query against the timeout
    const classes = await Promise.race([queryPromise, timeoutPromise]);

    console.log(`GET /api/classes - Found ${classes.length} classes`);

    // Add cache control headers
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Expires', '-1');
    res.set('Pragma', 'no-cache');

    res.json(classes);
  } catch (error) {
    console.error('GET /api/classes - Error:', error);

    // Provide more specific error messages based on the error type
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      return res.status(503).json({ message: 'Database service is currently unavailable. Please try again later.' });
    } else if (error.message === 'Database query timed out') {
      return res.status(504).json({ message: 'Request timed out. The database is taking too long to respond.' });
    } else if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid query parameters.' });
    }

    res.status(500).json({ message: error.message || 'An unexpected error occurred while fetching classes.' });
  }
});

// Get a specific class by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    console.log(`GET /api/classes/${req.params.id} - Fetching class details`);

    const classItem = await Class.findById(req.params.id)
      .populate('academicYear', 'name year')
      .populate('classTeacher', 'firstName lastName')
      .populate('subjectCombination', 'name code description')
      .populate('subjectCombinations', 'name code description')
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

// Update subjects for a class (admin only)
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

    // Get the subjects from the request body
    const newSubjects = req.body.subjects || [];

    // Format the assignments for the unified service
    const assignments = newSubjects.map(subjectAssignment => {
      const subjectId = typeof subjectAssignment.subject === 'object' ?
        subjectAssignment.subject._id.toString() :
        subjectAssignment.subject.toString();

      // Ensure teacherId is properly extracted and not undefined
      let teacherId = null;
      if (subjectAssignment.teacher) {
        teacherId = typeof subjectAssignment.teacher === 'object' ?
          subjectAssignment.teacher._id.toString() :
          subjectAssignment.teacher.toString();
      }

      // Log the assignment for debugging
      console.log(`Assignment for subject ${subjectId}: teacher=${teacherId || 'null'}`);

      // Validate that teacherId is not empty string (which could be interpreted as falsy)
      if (teacherId === '') {
        console.warn(`Empty string teacherId detected for subject ${subjectId}, setting to null`);
        teacherId = null;
      }

      return {
        subjectId,
        teacherId
      };
    });

    // Use the unified service to update all assignments
    const result = await unifiedTeacherAssignmentService.updateClassSubjectAssignments({
      classId: req.params.id,
      assignments,
      assignedBy: req.user.userId,
      allowAdminFallback: false, // Never allow admin fallback
      updateAllModels: true // Update all related models
    });

    if (!result.success) {
      console.error(`Error updating class subjects: ${result.message}`);
      return res.status(400).json({
        message: 'Failed to update class subjects',
        error: result.message,
        details: result.results
      });
    }

    // Return the updated class with populated data
    const updatedClass = await Class.findById(req.params.id)
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

    // Validate class ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log(`Invalid class ID format: ${req.params.id}`);
      return res.status(400).json({ message: 'Invalid class ID format' });
    }

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
    const validSubjects = [];

    for (const subjectId of subjects) {
      try {
        if (!mongoose.Types.ObjectId.isValid(subjectId)) {
          console.log(`Invalid subject ID format: ${subjectId}`);
          continue; // Skip invalid IDs instead of failing
        }

        const subject = await Subject.findById(subjectId);
        if (subject) {
          validSubjects.push(subjectId);
        } else {
          console.log(`Subject not found with ID: ${subjectId}`);
          // Continue instead of failing
        }
      } catch (err) {
        console.error(`Error validating subject ${subjectId}:`, err);
        // Continue instead of failing
      }
    }

    if (validSubjects.length === 0) {
      return res.status(400).json({ message: 'No valid subjects found in the provided list' });
    }

    // Initialize subjects array if it doesn't exist
    if (!classItem.subjects) {
      classItem.subjects = [];
    }

    // First, get existing subject IDs to avoid duplicates
    const existingSubjectIds = classItem.subjects
      ? classItem.subjects.map(s => typeof s.subject === 'object' ? s.subject._id.toString() : s.subject.toString())
      : [];

    // Add new subjects
    let addedCount = 0;
    for (const subjectId of validSubjects) {
      if (!existingSubjectIds.includes(subjectId.toString())) {
        classItem.subjects.push({
          subject: subjectId,
          teacher: null // No teacher assigned initially
        });
        addedCount++;
      }
    }

    // Save the updated class
    await classItem.save();
    console.log(`Added ${addedCount} subjects to class ${classItem.name}`);

    // Return the updated class with populated subjects
    const updatedClass = await Class.findById(req.params.id)
      .populate({
        path: 'subjects.subject',
        model: 'Subject',
        select: 'name code type description'
      });

    res.json({
      message: `Successfully added ${addedCount} subjects to class`,
      class: updatedClass
    });
  } catch (error) {
    console.error(`Error adding subjects to class ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to add subjects to class. Please try again later.' });
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
    console.log('POST /api/classes - Creating new class');
    console.log('Request body:', req.body);

    const classData = { ...req.body };

    // Handle A-Level class with multiple subject combinations
    if (classData.educationLevel === 'A_LEVEL') {
      // If single subjectCombination is provided, add it to subjectCombinations array
      if (classData.subjectCombination && !classData.subjectCombinations) {
        classData.subjectCombinations = [classData.subjectCombination];
      }

      // If subjectCombinations is provided as a string or single ID, convert to array
      if (classData.subjectCombinations && !Array.isArray(classData.subjectCombinations)) {
        classData.subjectCombinations = [classData.subjectCombinations];
      }

      console.log(`Creating A-Level class with ${classData.subjectCombinations?.length || 0} subject combinations`);
    }

    const classItem = new Class(classData);
    const newClass = await classItem.save();

    // Populate the new class with related data
    const populatedClass = await Class.findById(newClass._id)
      .populate('academicYear', 'name year')
      .populate('classTeacher', 'firstName lastName')
      .populate('subjectCombination', 'name code')
      .populate('subjectCombinations', 'name code');

    console.log(`Created new class: ${newClass.name} (${newClass._id})`);
    res.status(201).json(populatedClass);
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update a class
router.put('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    console.log(`PUT /api/classes/${req.params.id} - Updating class`);
    console.log('Request body:', req.body);

    const classData = { ...req.body };

    // Handle A-Level class with multiple subject combinations
    if (classData.educationLevel === 'A_LEVEL') {
      // If single subjectCombination is provided, add it to subjectCombinations array
      if (classData.subjectCombination && !classData.subjectCombinations) {
        classData.subjectCombinations = [classData.subjectCombination];
      }

      // If subjectCombinations is provided as a string or single ID, convert to array
      if (classData.subjectCombinations && !Array.isArray(classData.subjectCombinations)) {
        classData.subjectCombinations = [classData.subjectCombinations];
      }

      console.log(`Updating A-Level class with ${classData.subjectCombinations?.length || 0} subject combinations`);
    }

    const classItem = await Class.findByIdAndUpdate(
      req.params.id,
      classData,
      { new: true, runValidators: true }
    )
    .populate('academicYear', 'name year')
    .populate('classTeacher', 'firstName lastName')
    .populate('subjectCombination', 'name code')
    .populate('subjectCombinations', 'name code');

    if (!classItem) {
      console.log(`Class not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Class not found' });
    }

    console.log(`Updated class: ${classItem.name}`);
    res.json(classItem);
  } catch (error) {
    console.error(`Error updating class ${req.params.id}:`, error);
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

// This route is now handled by the first PUT /:id/subjects route above

// Get classes assigned to the current teacher
router.get('/teacher/me',
  authenticateToken,
  authorizeRole(['teacher', 'admin']),
  enhancedTeacherAuth.ensureTeacherProfile,
  async (req, res) => {
    try {
      console.log('GET /api/classes/teacher/me - Fetching classes for current teacher');

      // The teacher profile is already attached to the request by the middleware
      const teacherId = req.teacher._id;

      console.log(`Teacher ID: ${teacherId}`);

      // Find all classes where this teacher is assigned to teach subjects
      const TeacherAssignment = require('../models/TeacherAssignment');

      // Method 1: Find classes where the teacher is assigned to subjects
      const classesWithTeacher = await Class.find({ 'subjects.teacher': teacherId })
        .select('_id name section stream educationLevel')
        .sort({ name: 1 });

      console.log(`Found ${classesWithTeacher.length} classes for teacher ${teacherId} via Class model`);

      // Method 2: Find classes where the teacher is assigned via TeacherAssignment
      const teacherAssignments = await TeacherAssignment.find({ teacher: teacherId })
        .distinct('class');

      const classesFromAssignments = await Class.find({ _id: { $in: teacherAssignments } })
        .select('_id name section stream educationLevel')
        .sort({ name: 1 });

      console.log(`Found ${classesFromAssignments.length} classes for teacher ${teacherId} via TeacherAssignment`);

      // Method 3: Find classes where the teacher is the class teacher
      const classesAsClassTeacher = await Class.find({ classTeacher: teacherId })
        .select('_id name section stream educationLevel')
        .sort({ name: 1 });

      console.log(`Found ${classesAsClassTeacher.length} classes for teacher ${teacherId} as class teacher`);

      // Combine and deduplicate classes
      const allClasses = [...classesWithTeacher];

      // Add classes from assignments if they're not already in the list
      for (const cls of classesFromAssignments) {
        if (!allClasses.some(c => c._id.toString() === cls._id.toString())) {
          allClasses.push(cls);
        }
      }

      // Add classes where the teacher is the class teacher if they're not already in the list
      for (const cls of classesAsClassTeacher) {
        if (!allClasses.some(c => c._id.toString() === cls._id.toString())) {
          allClasses.push(cls);
        }
      }

      // For admin users, return all classes if requested
      if (req.user.role === 'admin' && req.query.all === 'true') {
        console.log('Admin user requesting all classes');
        const allClassesForAdmin = await Class.find()
          .select('_id name section stream educationLevel')
          .sort({ name: 1 });

        console.log(`Returning ${allClassesForAdmin.length} total classes for admin user`);
        return res.json(allClassesForAdmin);
      }

      console.log(`Returning ${allClasses.length} total classes for teacher ${teacherId}`);
      res.json(allClasses);
    } catch (error) {
      console.error('Error fetching teacher classes:', error);
      res.status(500).json({
        message: 'Failed to fetch teacher classes',
        error: error.message
      });
    }
  }
);

module.exports = router;
