const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Debug middleware for this router
router.use((req, res, next) => {
  console.log('Student Route accessed:', req.method, req.path);
  next();
});

// Create a new student
router.post('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    console.log('Creating student with data:', req.body);
    const student = new Student(req.body);
    const savedStudent = await student.save();
    console.log('Student created:', savedStudent);
    res.status(201).json(savedStudent);
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(400).json({ message: error.message });
  }
});

// Search students
router.get('/search', authenticateToken, authorizeRole(['admin', 'finance', 'teacher']), async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Create a regex for case-insensitive search
    const searchRegex = new RegExp(query, 'i');

    // Search by name, admission number, or parent phone
    const students = await Student.find({
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { admissionNumber: searchRegex },
        { 'parent.phone': searchRegex },
        { 'parent.email': searchRegex }
      ],
      status: 'active' // Only search for active students
    })
    .populate('class', 'name section stream')
    .limit(20); // Limit results to prevent performance issues

    res.json(students);
  } catch (error) {
    console.error('Error searching students:', error);
    res.status(500).json({ message: 'Error searching students' });
  }
});

// Get all students
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('GET /api/students - Fetching all students');
    const students = await Student.find().populate('class', 'name section');
    console.log(`GET /api/students - Found ${students.length} students`);
    res.json(students);
  } catch (error) {
    console.error('GET /api/students - Error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get student profile by user ID
router.get('/profile/:userId', authenticateToken, async (req, res) => {
  try {
    console.log(`GET /api/students/profile/${req.params.userId} - Fetching student profile by user ID`);

    const student = await Student.findOne({ userId: req.params.userId })
      .populate('class', 'name section stream');

    if (!student) {
      console.log(`Student not found with user ID: ${req.params.userId}`);
      return res.status(404).json({ message: 'Student profile not found' });
    }

    console.log(`Found student profile for user ID: ${req.params.userId}`);
    res.json(student);
  } catch (error) {
    console.error(`Error fetching student profile for user ID ${req.params.userId}:`, error);
    res.status(500).json({ message: error.message });
  }
});

// Get a single student
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (student) {
      res.json(student);
    } else {
      res.status(404).json({ message: 'Student not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a student
router.put('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const updatedStudent = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedStudent) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(updatedStudent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a student
router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const deletedStudent = await Student.findByIdAndDelete(req.params.id);
    if (deletedStudent) {
      res.json({ message: 'Student deleted successfully' });
    } else {
      res.status(404).json({ message: 'Student not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get students by class ID with teacher authorization check
router.get('/class/:classId', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching students for class:', req.params.classId);

    // If user is a teacher, check if they are assigned to this class
    if (req.user.role === 'teacher') {
      const Teacher = require('../models/Teacher');
      const Class = require('../models/Class');

      // Find the teacher profile
      const teacher = await Teacher.findOne({ userId: req.user.userId });
      if (!teacher) {
        return res.status(403).json({ message: 'Teacher profile not found' });
      }

      // Find the class and check if this teacher teaches any subject in it
      const classItem = await Class.findById(req.params.classId);
      if (!classItem) {
        return res.status(404).json({ message: 'Class not found' });
      }

      // Check if teacher is assigned to this class
      const isAssigned = classItem.subjects.some(subject =>
        subject.teacher && subject.teacher.toString() === teacher._id.toString()
      );

      // If teacher is not assigned to this class, return forbidden
      if (!isAssigned) {
        return res.status(403).json({
          message: 'You are not authorized to view students in this class'
        });
      }
    }

    // Fetch students for the class
    const students = await Student.find({ class: req.params.classId })
      .populate('userId', 'username email')
      .sort({ rollNumber: 1 });

    if (students.length === 0) {
      return res.status(200).json([]);
    }

    res.json(students);
  } catch (error) {
    console.error('Error fetching students by class:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get A-Level students by class ID
router.get('/a-level/class/:classId', authenticateToken, async (req, res) => {
  try {
    console.log(`GET /api/students/a-level/class/${req.params.classId} - Fetching A-Level students for class`);

    // Fetch students for the class with education level A_LEVEL
    const students = await Student.find({
      class: req.params.classId,
      educationLevel: 'A_LEVEL'
    })
    .populate('userId', 'username email')
    .sort({ rollNumber: 1 });

    console.log(`Found ${students.length} A-Level students in class ${req.params.classId}`);

    // Log each student for debugging
    for (const student of students) {
      console.log(`A-Level student: ${student.firstName} ${student.lastName}, ID: ${student._id}`);
    }

    res.json(students);
  } catch (error) {
    console.error(`Error fetching A-Level students for class ${req.params.classId}:`, error);
    res.status(500).json({ message: error.message });
  }
});

// Get all students assigned to classes where the teacher teaches
router.get('/my-students', authenticateToken, authorizeRole('teacher'), async (req, res) => {
  try {
    console.log('Fetching students for teacher:', req.user.userId);

    // Find the teacher profile
    const Teacher = require('../models/Teacher');
    const Class = require('../models/Class');

    const teacher = await Teacher.findOne({ userId: req.user.userId });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    // Find all classes where this teacher teaches any subject
    const classes = await Class.find({
      'subjects.teacher': teacher._id
    });

    if (classes.length === 0) {
      return res.status(200).json([]);
    }

    // Get the class IDs
    const classIds = classes.map(cls => cls._id);

    // Find all students in these classes
    const students = await Student.find({ class: { $in: classIds } })
      .populate('class', 'name section stream')
      .sort({ lastName: 1, firstName: 1 });

    // Group students by class
    const studentsByClass = {};

    for (const student of students) {
      const classId = student.class._id.toString();
      if (!studentsByClass[classId]) {
        studentsByClass[classId] = {
          classInfo: {
            _id: student.class._id,
            name: student.class.name,
            section: student.class.section,
            stream: student.class.stream
          },
          students: []
        };
      }

      studentsByClass[classId].students.push({
        _id: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        rollNumber: student.rollNumber,
        gender: student.gender
      });
    }

    // Convert to array for easier consumption by frontend
    const result = Object.values(studentsByClass);

    res.json(result);
  } catch (error) {
    console.error('Error fetching students for teacher:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
