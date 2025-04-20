const express = require('express');
const router = express.Router();
const StudentSubjectSelection = require('../models/StudentSubjectSelection');
const Subject = require('../models/Subject');
const Student = require('../models/Student');
const Class = require('../models/Class');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Get all subject selections
router.get('/', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const selections = await StudentSubjectSelection.find()
      .populate('student', 'firstName lastName admissionNumber')
      .populate('selectionClass', 'name stream section')
      .populate('academicYear', 'name')
      .populate('coreSubjects', 'name code type')
      .populate('optionalSubjects', 'name code type')
      .populate('approvedBy', 'firstName lastName');

    res.json(selections);
  } catch (error) {
    console.error('Error fetching subject selections:', error);
    res.status(500).json({ message: 'Failed to fetch subject selections' });
  }
});

// Get available optional subjects for O-Level (for student selection)
router.get('/available-optional-subjects', authenticateToken, async (req, res) => {
  try {
    const optionalSubjects = await Subject.find({
      type: 'OPTIONAL',
      educationLevel: { $in: ['O_LEVEL', 'BOTH'] }
    }).sort('name');

    res.json(optionalSubjects);
  } catch (error) {
    console.error('Error fetching optional subjects:', error);
    res.status(500).json({ message: 'Failed to fetch optional subjects' });
  }
});

// Get all optional subjects (for management)
router.get('/optional-subjects', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const optionalSubjects = await Subject.find({
      type: 'OPTIONAL'
    }).sort('name');

    res.json(optionalSubjects);
  } catch (error) {
    console.error('Error fetching optional subjects:', error);
    res.status(500).json({ message: 'Failed to fetch optional subjects' });
  }
});

// Create a new optional subject
router.post('/optional-subjects', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { name, code, description, educationLevel, passMark } = req.body;

    // Validate required fields
    if (!name || !code) {
      return res.status(400).json({ message: 'Subject name and code are required' });
    }

    // Check if subject with same code already exists
    const existingSubject = await Subject.findOne({ code });
    if (existingSubject) {
      return res.status(400).json({ message: 'A subject with this code already exists' });
    }

    // Create new optional subject
    const newSubject = new Subject({
      name,
      code,
      description,
      type: 'OPTIONAL',
      educationLevel: educationLevel || 'O_LEVEL',
      passMark: passMark || 40,
      createdBy: req.user._id
    });

    await newSubject.save();
    res.status(201).json(newSubject);
  } catch (error) {
    console.error('Error creating optional subject:', error);
    res.status(500).json({ message: 'Failed to create optional subject' });
  }
});

// Update an optional subject
router.put('/optional-subjects/:id', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, educationLevel, passMark } = req.body;

    // Validate required fields
    if (!name || !code) {
      return res.status(400).json({ message: 'Subject name and code are required' });
    }

    // Check if subject exists and is an optional subject
    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    if (subject.type !== 'OPTIONAL') {
      return res.status(400).json({ message: 'This is not an optional subject' });
    }

    // Check if another subject with the same code exists (excluding this one)
    if (code !== subject.code) {
      const existingSubject = await Subject.findOne({ code, _id: { $ne: id } });
      if (existingSubject) {
        return res.status(400).json({ message: 'Another subject with this code already exists' });
      }
    }

    // Update the subject
    subject.name = name;
    subject.code = code;
    subject.description = description;
    subject.educationLevel = educationLevel || subject.educationLevel;
    subject.passMark = passMark || subject.passMark;

    await subject.save();
    res.json(subject);
  } catch (error) {
    console.error(`Error updating optional subject ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to update optional subject' });
  }
});

// Delete an optional subject
router.delete('/optional-subjects/:id', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if subject exists and is an optional subject
    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    if (subject.type !== 'OPTIONAL') {
      return res.status(400).json({ message: 'This is not an optional subject' });
    }

    // Check if subject is used in any selections
    const usedInSelections = await StudentSubjectSelection.findOne({
      optionalSubjects: id
    });

    if (usedInSelections) {
      return res.status(400).json({
        message: 'Cannot delete this optional subject as it is used in existing student selections',
        selectionId: usedInSelections._id
      });
    }

    // Delete the subject
    await Subject.deleteOne({ _id: id });

    res.json({ message: 'Optional subject deleted successfully' });
  } catch (error) {
    console.error(`Error deleting optional subject ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to delete optional subject' });
  }
});

// Add default optional subjects (admin only)
router.post('/add-optional-subjects', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    // Define default optional subjects
    const defaultOptionalSubjects = [
      {
        name: 'BIOLOGY',
        code: 'BIO',
        type: 'OPTIONAL',
        educationLevel: 'O_LEVEL',
        description: 'Biology for O-Level students',
        passMark: 40
      },
      {
        name: 'COMPUTER SCIENCE',
        code: 'CS',
        type: 'OPTIONAL',
        educationLevel: 'O_LEVEL',
        description: 'Computer Science for O-Level students',
        passMark: 40
      },
      {
        name: 'BOOKKEEPING',
        code: 'BK',
        type: 'OPTIONAL',
        educationLevel: 'O_LEVEL',
        description: 'Bookkeeping for O-Level students',
        passMark: 40
      },
      {
        name: 'AGRICULTURE',
        code: 'AGRI',
        type: 'OPTIONAL',
        educationLevel: 'O_LEVEL',
        description: 'Agriculture for O-Level students',
        passMark: 40
      }
    ];

    // Add each subject if it doesn't already exist
    const results = [];
    for (const subjectData of defaultOptionalSubjects) {
      // Check if subject already exists
      const existingSubject = await Subject.findOne({ code: subjectData.code });

      if (existingSubject) {
        // Update the existing subject to be optional if it's not already
        if (existingSubject.type !== 'OPTIONAL') {
          existingSubject.type = 'OPTIONAL';
          await existingSubject.save();
          results.push({ status: 'updated', subject: existingSubject });
        } else {
          results.push({ status: 'exists', subject: existingSubject });
        }
      } else {
        // Create new subject
        const newSubject = new Subject(subjectData);
        await newSubject.save();
        results.push({ status: 'created', subject: newSubject });
      }
    }

    res.json({
      message: 'Optional subjects processed successfully',
      results
    });
  } catch (error) {
    console.error('Error adding optional subjects:', error);
    res.status(500).json({ message: 'Failed to add optional subjects' });
  }
});

// Get core subjects for O-Level
router.get('/core-subjects', authenticateToken, async (req, res) => {
  try {
    const coreSubjects = await Subject.find({
      type: 'CORE',
      educationLevel: { $in: ['O_LEVEL', 'BOTH'] }
    }).sort('name');

    res.json(coreSubjects);
  } catch (error) {
    console.error('Error fetching core subjects:', error);
    res.status(500).json({ message: 'Failed to fetch core subjects' });
  }
});

// Create a new core subject
router.post('/core-subjects', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { name, code, description } = req.body;

    // Validate required fields
    if (!name || !code) {
      return res.status(400).json({ message: 'Subject name and code are required' });
    }

    // Check if subject with same code already exists
    const existingSubject = await Subject.findOne({ code });
    if (existingSubject) {
      return res.status(400).json({ message: 'A subject with this code already exists' });
    }

    // Create new core subject
    const newSubject = new Subject({
      name,
      code,
      description,
      type: 'CORE',
      educationLevel: 'O_LEVEL',
      createdBy: req.user._id
    });

    await newSubject.save();

    res.status(201).json(newSubject);
  } catch (error) {
    console.error('Error creating core subject:', error);
    res.status(500).json({ message: 'Failed to create core subject' });
  }
});

// Update a core subject
router.put('/core-subjects/:id', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description } = req.body;

    // Validate required fields
    if (!name || !code) {
      return res.status(400).json({ message: 'Subject name and code are required' });
    }

    // Check if subject exists and is a core subject
    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    if (subject.type !== 'CORE') {
      return res.status(400).json({ message: 'This is not a core subject' });
    }

    // Check if another subject with the same code exists (excluding this one)
    if (code !== subject.code) {
      const existingSubject = await Subject.findOne({ code, _id: { $ne: id } });
      if (existingSubject) {
        return res.status(400).json({ message: 'Another subject with this code already exists' });
      }
    }

    // Update the subject
    subject.name = name;
    subject.code = code;
    subject.description = description;
    subject.updatedBy = req.user._id;
    subject.updatedAt = Date.now();

    await subject.save();

    res.json(subject);
  } catch (error) {
    console.error(`Error updating core subject ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to update core subject' });
  }
});

// Delete a core subject
router.delete('/core-subjects/:id', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if subject exists and is a core subject
    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    if (subject.type !== 'CORE') {
      return res.status(400).json({ message: 'This is not a core subject' });
    }

    // Check if subject is used in any selections
    const usedInSelections = await StudentSubjectSelection.findOne({
      coreSubjects: id
    });

    if (usedInSelections) {
      return res.status(400).json({
        message: 'Cannot delete this core subject as it is used in existing student selections',
        selectionId: usedInSelections._id
      });
    }

    // Delete the subject
    await Subject.deleteOne({ _id: id });

    res.json({ message: 'Core subject deleted successfully' });
  } catch (error) {
    console.error(`Error deleting core subject ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to delete core subject' });
  }
});

// Get subject selection rules (min/max optional subjects)
router.get('/selection-rules', authenticateToken, async (req, res) => {
  // This could be stored in a database, but for simplicity we'll hardcode it
  const rules = {
    O_LEVEL: {
      minOptionalSubjects: 2,
      maxOptionalSubjects: 4,
      requiredCoreSubjects: 'ALL'
    }
  };

  res.json(rules);
});

// Get subject selections for a specific class
router.get('/class/:classId', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { classId } = req.params;

    console.log(`Fetching subject selections for class ${classId}`);

    // Find the class to verify it exists
    const classObj = await Class.findById(classId);
    if (!classObj) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Find all students in this class
    const students = await Student.find({ class: classId });
    const studentIds = students.map(student => student._id);

    console.log(`Found ${studentIds.length} students in class ${classId}`);

    // Find selections for these students
    const selections = await StudentSubjectSelection.find({
      student: { $in: studentIds }
    })
      .populate('student', 'firstName lastName admissionNumber')
      .populate('selectionClass', 'name stream section')
      .populate('academicYear', 'name')
      .populate('coreSubjects', 'name code type')
      .populate('optionalSubjects', 'name code type')
      .populate('approvedBy', 'firstName lastName');

    console.log(`Found ${selections.length} subject selections for class ${classId}`);

    res.json(selections);
  } catch (error) {
    console.error(`Error fetching subject selections for class ${req.params.classId}:`, error);
    res.status(500).json({ message: 'Failed to fetch subject selections for class' });
  }
});

// Get subject selections for a specific student
router.get('/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;

    // Check if user is authorized (admin or the student's parent/guardian)
    if (req.user.role !== 'admin') {
      // For non-admin users, check if they are related to the student
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      const isParent = student.parents.some(parent =>
        parent.toString() === req.user._id.toString()
      );

      if (!isParent) {
        return res.status(403).json({ message: 'Not authorized to view this student\'s subject selection' });
      }
    }

    const selections = await StudentSubjectSelection.find({ student: studentId })
      .populate('student', 'firstName lastName admissionNumber')
      .populate('selectionClass', 'name stream section')
      .populate('academicYear', 'name')
      .populate('coreSubjects', 'name code type')
      .populate('optionalSubjects', 'name code type')
      .populate('approvedBy', 'firstName lastName');

    res.json(selections);
  } catch (error) {
    console.error(`Error fetching subject selections for student ${req.params.studentId}:`, error);
    res.status(500).json({ message: 'Failed to fetch subject selections' });
  }
});

// Create a new subject selection
router.post('/', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const {
      student,
      selectionClass,
      academicYear,
      optionalSubjects,
      notes
    } = req.body;

    // Validate required fields
    if (!student || !selectionClass || !academicYear || !optionalSubjects) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if student already has a selection for this academic year
    const existingSelection = await StudentSubjectSelection.findOne({
      student,
      academicYear
    });

    if (existingSelection) {
      return res.status(400).json({
        message: 'Student already has a subject selection for this academic year',
        existingSelection
      });
    }

    // Get all core subjects for the education level (O_LEVEL)
    const coreSubjects = await Subject.find({
      type: 'CORE',
      educationLevel: { $in: ['O_LEVEL', 'BOTH'] }
    });

    // Create the selection
    const selection = new StudentSubjectSelection({
      student,
      selectionClass,
      academicYear,
      coreSubjects: coreSubjects.map(subject => subject._id),
      optionalSubjects,
      approvedBy: req.user._id,
      status: 'APPROVED', // Auto-approve when created by admin
      notes
    });

    await selection.save();

    // Update the student's selectedSubjects field to include both core and optional subjects
    try {
      const Student = require('../models/Student');
      const student = await Student.findById(selection.student);

      if (student) {
        // Combine core and optional subjects
        const allSubjects = [...selection.coreSubjects, ...selection.optionalSubjects];

        // Update the student's selectedSubjects field
        student.selectedSubjects = allSubjects;
        await student.save();

        console.log(`Updated student ${student._id} with ${allSubjects.length} selected subjects`);
      }
    } catch (updateError) {
      console.error('Error updating student selected subjects:', updateError);
      // Continue even if this fails - we'll log the error but not fail the request
    }

    // Populate the selection for the response
    const populatedSelection = await StudentSubjectSelection.findById(selection._id)
      .populate('student', 'firstName lastName admissionNumber')
      .populate('selectionClass', 'name stream section')
      .populate('academicYear', 'name')
      .populate('coreSubjects', 'name code type')
      .populate('optionalSubjects', 'name code type')
      .populate('approvedBy', 'firstName lastName');

    res.status(201).json(populatedSelection);
  } catch (error) {
    console.error('Error creating subject selection:', error);
    res.status(500).json({ message: 'Failed to create subject selection' });
  }
});

// Update a subject selection
router.put('/:id', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      optionalSubjects,
      status,
      notes
    } = req.body;

    // Find the selection
    const selection = await StudentSubjectSelection.findById(id);
    if (!selection) {
      return res.status(404).json({ message: 'Subject selection not found' });
    }

    // Update fields
    if (optionalSubjects) selection.optionalSubjects = optionalSubjects;
    if (status) selection.status = status;
    if (notes) selection.notes = notes;

    // Set who approved/updated it
    selection.approvedBy = req.user._id;

    await selection.save();

    // Update the student's selectedSubjects field to include both core and optional subjects
    try {
      const Student = require('../models/Student');
      const student = await Student.findById(selection.student);

      if (student) {
        // Combine core and optional subjects
        const allSubjects = [...selection.coreSubjects, ...selection.optionalSubjects];

        // Update the student's selectedSubjects field
        student.selectedSubjects = allSubjects;
        await student.save();

        console.log(`Updated student ${student._id} with ${allSubjects.length} selected subjects after modification`);
      }
    } catch (updateError) {
      console.error('Error updating student selected subjects after modification:', updateError);
      // Continue even if this fails - we'll log the error but not fail the request
    }

    // Populate the selection for the response
    const populatedSelection = await StudentSubjectSelection.findById(selection._id)
      .populate('student', 'firstName lastName admissionNumber')
      .populate('selectionClass', 'name stream section')
      .populate('academicYear', 'name')
      .populate('coreSubjects', 'name code type')
      .populate('optionalSubjects', 'name code type')
      .populate('approvedBy', 'firstName lastName');

    res.json(populatedSelection);
  } catch (error) {
    console.error(`Error updating subject selection ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to update subject selection' });
  }
});

// Delete a subject selection
router.delete('/:id', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { id } = req.params;

    const selection = await StudentSubjectSelection.findById(id);
    if (!selection) {
      return res.status(404).json({ message: 'Subject selection not found' });
    }

    await StudentSubjectSelection.deleteOne({ _id: id });

    res.json({ message: 'Subject selection deleted successfully' });
  } catch (error) {
    console.error(`Error deleting subject selection ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to delete subject selection' });
  }
});

module.exports = router;
