const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Student = require('../models/Student');
const { authenticateToken, authorizeRole, authorizeTeacherForClass } = require('../middleware/auth');
const { validateStudentData, validateSubjectAssignment } = require('../middleware/studentValidation');

// Debug middleware for this router
router.use((req, res, next) => {
  console.log('Student Route accessed:', req.method, req.path);
  next();
});

// Create a new student
router.post('/', authenticateToken, authorizeRole(['admin', 'teacher']), validateStudentData, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log('Creating student with data:', req.body);
    const student = new Student(req.body);
    const savedStudent = await student.save({ session });
    console.log('Student created:', savedStudent);

    // Automatically assign core subjects for O-Level students
    if (savedStudent.educationLevel === 'O_LEVEL') {
      console.log('Automatically assigning core subjects for O-Level student');
      const Subject = require('../models/Subject');

      // Find all core subjects for O-Level
      const coreSubjects = await Subject.find({
        type: 'CORE',
        educationLevel: { $in: ['O_LEVEL', 'BOTH'] }
      }).session(session);

      console.log(`Found ${coreSubjects.length} core subjects for O-Level`);

      // Assign core subjects to student
      if (coreSubjects.length > 0) {
        savedStudent.selectedSubjects = coreSubjects.map(subject => subject._id);
        await savedStudent.save({ session });
        console.log(`Assigned ${coreSubjects.length} core subjects to student ${savedStudent._id}`);
      }
    }

    // Validate A-Level students have a combination assigned
    if (savedStudent.educationLevel === 'A_LEVEL' && !savedStudent.subjectCombination) {
      console.log('Warning: A-Level student created without a subject combination');
      // We'll just log a warning for now, but we could enforce this requirement if needed
    }

    await session.commitTransaction();
    session.endSession();

    // Return the student with populated subjects
    const populatedStudent = await Student.findById(savedStudent._id)
      .populate('selectedSubjects', 'name code type description')
      .populate('subjectCombination');

    res.status(201).json(populatedStudent);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
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

// Get all students for the current teacher
router.get('/my-students', authenticateToken, authorizeRole(['teacher']), async (req, res) => {
  try {
    console.log('GET /api/students/my-students - Fetching students for current teacher');
    const userId = req.user.userId;

    if (!userId) {
      console.log('No userId found in token');
      return res.status(400).json({ message: 'Invalid user token' });
    }

    // Find the teacher profile
    const Teacher = require('../models/Teacher');
    const teacher = await Teacher.findOne({ userId });
    if (!teacher) {
      console.log('No teacher profile found for user:', userId);
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    console.log(`Found teacher profile: ${teacher._id}`);

    // Find all classes where this teacher is assigned to teach subjects
    const Class = require('../models/Class');
    const classes = await Class.find({
      'subjects.teacher': teacher._id
    });

    console.log(`Found ${classes.length} classes for teacher ${teacher._id}`);

    // Get students for each class
    const result = [];
    for (const classObj of classes) {
      const students = await Student.find({ class: classObj._id })
        .populate('userId', 'username email')
        .populate('class', 'name section stream')
        .sort({ firstName: 1, lastName: 1 });

      result.push({
        classInfo: {
          _id: classObj._id,
          name: classObj.name,
          section: classObj.section,
          stream: classObj.stream
        },
        students: students
      });
    }

    console.log(`Returning students from ${result.length} classes`);
    res.json(result);
  } catch (error) {
    console.error('Error fetching students for teacher:', error);
    res.status(500).json({ message: 'Failed to fetch students', error: error.message });
  }
});

// Get all students
router.get('/', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
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
router.put('/:id', authenticateToken, authorizeRole(['admin', 'teacher']), validateStudentData, async (req, res) => {
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
router.delete('/:id', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
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
router.get('/class/:classId', authenticateToken, authorizeTeacherForClass, async (req, res) => {
  try {
    console.log('Fetching students for class:', req.params.classId);

    // Authorization is now handled by the authorizeTeacherForClass middleware
    // The middleware adds teacherId and teacherSubjects to the request if authorized
    console.log('Teacher is authorized to view students in this class');
    if (req.teacherSubjects) {
      console.log(`Teacher is assigned to ${req.teacherSubjects.length} subjects in this class`);
    }

    // Fetch students for the class
    const students = await Student.find({ class: req.params.classId })
      .populate('userId', 'username email')
      .populate({
        path: 'subjectCombination',
        populate: {
          path: 'subjects compulsorySubjects',
          model: 'Subject',
          select: 'name code type description educationLevel isPrincipal isCompulsory'
        }
      })
      .sort({ rollNumber: 1 });

    // Check if any students are in Form 5 or 6 but not marked as A_LEVEL
    const formFiveOrSixStudents = students.filter(student =>
      (student.form === 5 || student.form === 6) && student.educationLevel !== 'A_LEVEL'
    );

    if (formFiveOrSixStudents.length > 0) {
      console.log(`Found ${formFiveOrSixStudents.length} students in Form 5 or 6 but not marked as A_LEVEL`);

      // Update these students to have educationLevel = 'A_LEVEL'
      for (const student of formFiveOrSixStudents) {
        console.log(`Updating student ${student._id} (${student.firstName} ${student.lastName}) from ${student.educationLevel} to A_LEVEL`);
        await Student.findByIdAndUpdate(student._id, { educationLevel: 'A_LEVEL' });

        // Update the student in the current array as well
        student.educationLevel = 'A_LEVEL';
      }
    }

    if (students.length === 0) {
      return res.status(200).json([]);
    }

    // Log A-Level students with their subject combinations for debugging
    const aLevelStudents = students.filter(student => student.educationLevel === 'A_LEVEL');
    console.log(`Found ${aLevelStudents.length} A-Level students in class ${req.params.classId}`);

    for (const student of aLevelStudents) {
      if (student.subjectCombination) {
        console.log(`Student ${student._id} has combination: ${student.subjectCombination.name || student.subjectCombination._id}`);

        // Log principal subjects
        if (student.subjectCombination.subjects && student.subjectCombination.subjects.length > 0) {
          console.log(`Principal subjects: ${student.subjectCombination.subjects.map(s => s.name || s.code).join(', ')}`);
        }

        // Log subsidiary subjects
        if (student.subjectCombination.compulsorySubjects && student.subjectCombination.compulsorySubjects.length > 0) {
          console.log(`Subsidiary subjects: ${student.subjectCombination.compulsorySubjects.map(s => s.name || s.code).join(', ')}`);
        }
      } else {
        console.log(`Student ${student._id} has no subject combination assigned`);
      }
    }

    res.json(students);
  } catch (error) {
    console.error('Error fetching students by class:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get A-Level student combinations by class ID
router.get('/a-level-combinations/class/:classId', authenticateToken, async (req, res) => {
  try {
    const classId = req.params.classId;
    console.log(`Fetching A-Level combinations for class: ${classId}`);

    // Find all students in the specified class
    const students = await Student.find({
      class: classId,
      educationLevel: 'A_LEVEL'
    }).populate('subjectCombination');

    console.log(`Found ${students.length} A-Level students in class ${classId}`);

    // Format the combinations for easier use in the frontend
    const formattedCombinations = [];

    for (const student of students) {
      console.log(`Processing student ${student._id} (${student.firstName} ${student.lastName})`);

      // Skip students without a combination
      if (!student.subjectCombination) {
        console.log(`Student ${student._id} has no subject combination`);
        continue;
      }

      const combination = student.subjectCombination;
      console.log(`Student has combination: ${combination.name || combination._id}`);

      // Get principal and subsidiary subjects
      const principalSubjects = [];
      const subsidiarySubjects = [];

      // Regular subjects are considered principal
      if (combination.subjects && Array.isArray(combination.subjects)) {
        for (const subject of combination.subjects) {
          principalSubjects.push(typeof subject === 'object' ? subject._id : subject);
        }
      }

      // Compulsory subjects are considered subsidiary
      if (combination.compulsorySubjects && Array.isArray(combination.compulsorySubjects)) {
        for (const subject of combination.compulsorySubjects) {
          subsidiarySubjects.push(typeof subject === 'object' ? subject._id : subject);
        }
      }

      console.log(`Found ${principalSubjects.length} principal subjects and ${subsidiarySubjects.length} subsidiary subjects`);

      // Create a subjects array with isPrincipal flag
      const subjects = [
        ...principalSubjects.map(subjectId => ({
          subjectId,
          isPrincipal: true
        })),
        ...subsidiarySubjects.map(subjectId => ({
          subjectId,
          isPrincipal: false
        }))
      ];

      formattedCombinations.push({
        student: {
          _id: student._id,
          firstName: student.firstName,
          lastName: student.lastName
        },
        combinationId: combination._id,
        name: combination.name,
        code: combination.code,
        subjects
      });
    }

    console.log(`Formatted ${formattedCombinations.length} A-Level combinations for class ${classId}`);
    res.json(formattedCombinations);
  } catch (error) {
    console.error('Error fetching A-Level combinations:', error);
    res.status(500).json({ message: 'Error fetching A-Level combinations', error: error.message });
  }
});

// Fallback endpoint for student combinations
router.get('/student-combinations/class/:classId', authenticateToken, async (req, res) => {
  try {
    const classId = req.params.classId;
    console.log(`Fetching student combinations for class: ${classId}`);

    // Find all students in the specified class
    const students = await Student.find({
      class: classId
    }).populate('subjectCombination');

    console.log(`Found ${students.length} students in class ${classId}`);

    // Format the combinations for easier use in the frontend
    const formattedCombinations = [];

    for (const student of students) {
      // Skip students without a combination
      if (!student.subjectCombination) {
        continue;
      }

      const combination = student.subjectCombination;

      // Get principal and subsidiary subjects
      const principalSubjects = [];
      const subsidiarySubjects = [];

      // Regular subjects are considered principal
      if (combination.subjects && Array.isArray(combination.subjects)) {
        for (const subject of combination.subjects) {
          principalSubjects.push(typeof subject === 'object' ? subject._id : subject);
        }
      }

      // Compulsory subjects are considered subsidiary
      if (combination.compulsorySubjects && Array.isArray(combination.compulsorySubjects)) {
        for (const subject of combination.compulsorySubjects) {
          subsidiarySubjects.push(typeof subject === 'object' ? subject._id : subject);
        }
      }

      // Create a subjects array with isPrincipal flag
      const subjects = [
        ...principalSubjects.map(subjectId => ({
          subjectId,
          isPrincipal: true
        })),
        ...subsidiarySubjects.map(subjectId => ({
          subjectId,
          isPrincipal: false
        }))
      ];

      formattedCombinations.push({
        student: {
          _id: student._id,
          firstName: student.firstName,
          lastName: student.lastName
        },
        combinationId: combination._id,
        name: combination.name,
        code: combination.code,
        subjects
      });
    }

    console.log(`Formatted ${formattedCombinations.length} student combinations for class ${classId}`);
    res.json(formattedCombinations);
  } catch (error) {
    console.error('Error fetching student combinations:', error);
    res.status(500).json({ message: 'Error fetching student combinations', error: error.message });
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
    .populate({
      path: 'subjectCombination',
      populate: {
        path: 'subjects compulsorySubjects',
        model: 'Subject',
        select: 'name code type description educationLevel isPrincipal isCompulsory'
      }
    })
    .sort({ rollNumber: 1 });

    console.log(`Found ${students.length} A-Level students in class ${req.params.classId}`);

    // Log each student with their subject combination for debugging
    for (const student of students) {
      console.log(`A-Level student: ${student.firstName} ${student.lastName}, ID: ${student._id}`);

      if (student.subjectCombination) {
        console.log(`  Combination: ${student.subjectCombination.name || student.subjectCombination._id}`);

        // Log principal subjects
        if (student.subjectCombination.subjects && student.subjectCombination.subjects.length > 0) {
          console.log(`  Principal subjects: ${student.subjectCombination.subjects.map(s => s.name || s.code).join(', ')}`);
        }

        // Log subsidiary subjects
        if (student.subjectCombination.compulsorySubjects && student.subjectCombination.compulsorySubjects.length > 0) {
          console.log(`  Subsidiary subjects: ${student.subjectCombination.compulsorySubjects.map(s => s.name || s.code).join(', ')}`);
        }
      } else {
        console.log(`  No subject combination assigned`);
      }
    }

    res.json(students);
  } catch (error) {
    console.error(`Error fetching A-Level students for class ${req.params.classId}:`, error);
    res.status(500).json({ message: error.message });
  }
});

// Add subjects to a student
router.post('/:id/subjects', authenticateToken, authorizeRole(['admin', 'teacher']), validateSubjectAssignment, async (req, res) => {
  try {
    console.log(`POST /api/students/${req.params.id}/subjects - Adding subjects to student`);
    console.log('Request body:', req.body);

    // First check if the student exists
    const student = await Student.findById(req.params.id).populate('class');
    if (!student) {
      console.log(`Student not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get the validated subjects from the middleware
    const validSubjects = req.validatedSubjects;
    console.log(`Using ${validSubjects.length} validated subjects from middleware`);

    // Initialize selectedSubjects if it doesn't exist
    if (!student.selectedSubjects) {
      student.selectedSubjects = [];
    }

    // First, get existing subject IDs to avoid duplicates
    const existingSubjectIds = student.selectedSubjects
      ? student.selectedSubjects.map(s => typeof s === 'object' ? s._id.toString() : s.toString())
      : [];

    // Add new subjects
    let addedCount = 0;
    for (const subjectId of validSubjects) {
      if (!existingSubjectIds.includes(subjectId.toString())) {
        student.selectedSubjects.push(subjectId);
        addedCount++;
      }
    }

    // Save the updated student
    await student.save();
    console.log(`Added ${addedCount} subjects to student ${student.firstName} ${student.lastName}`);

    // Return the updated student with populated subjects
    const updatedStudent = await Student.findById(req.params.id)
      .populate('selectedSubjects', 'name code type description');

    res.json({
      message: `Successfully added ${addedCount} subjects to student`,
      student: updatedStudent
    });
  } catch (error) {
    console.error(`Error adding subjects to student ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to add subjects to student. Please try again later.' });
  }
});

// Get subjects for a specific student
router.get('/:id/subjects', authenticateToken, async (req, res) => {
  try {
    console.log(`GET /api/students/${req.params.id}/subjects - Fetching subjects for student`);
    const studentId = req.params.id;

    // First check if the student exists
    const student = await Student.findById(studentId).populate('class');
    if (!student) {
      console.log(`Student not found with ID: ${studentId}`);
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get the class for this student
    const classId = student.class._id;
    if (!classId) {
      console.log(`Student ${studentId} is not assigned to any class`);
      return res.json([]);
    }

    // Get the class details
    const Class = require('../models/Class');
    const classDetails = await Class.findById(classId)
      .populate({
        path: 'subjects.subject',
        model: 'Subject',
        select: 'name code type description educationLevel isPrincipal isCompulsory'
      })
      .populate('subjectCombination')
      .populate('subjectCombinations');

    if (!classDetails) {
      console.log(`Class not found with ID: ${classId}`);
      return res.json([]);
    }

    // Initialize subjects array
    const subjects = [];

    // Helper function to process a subject combination
    const processSubjectCombination = async (combinationId) => {
      try {
        // Validate the subject combination ID
        if (!mongoose.Types.ObjectId.isValid(combinationId)) {
          console.error(`Invalid subject combination ID format: ${combinationId}`);
          return;
        }

        // Get the subject combination
        const SubjectCombination = require('../models/SubjectCombination');
        const combination = await SubjectCombination.findById(combinationId)
          .populate('subjects', 'name code type description educationLevel isPrincipal isCompulsory')
          .populate('compulsorySubjects', 'name code type description educationLevel isPrincipal isCompulsory');

        if (!combination) {
          console.log(`Subject combination not found with ID: ${combinationId}`);
          return;
        }

        console.log(`Processing subject combination: ${combination.name} (${combination.code})`);

        // Add principal subjects from combination
        if (combination.subjects && Array.isArray(combination.subjects)) {
          console.log(`Adding ${combination.subjects.length} principal subjects from combination`);
          for (const subject of combination.subjects) {
            // Add isPrincipal flag to the subject
            const principalSubject = {
              ...subject.toObject(),
              isPrincipal: true
            };

            // Check if subject is already in the list
            if (!subjects.some(s => s._id.toString() === subject._id.toString())) {
              subjects.push(principalSubject);
            }
          }
        }

        // Add subsidiary/compulsory subjects
        if (combination.compulsorySubjects && Array.isArray(combination.compulsorySubjects)) {
          console.log(`Adding ${combination.compulsorySubjects.length} subsidiary subjects from combination`);
          for (const subject of combination.compulsorySubjects) {
            // Add isPrincipal flag to the subject
            const subsidiarySubject = {
              ...subject.toObject(),
              isPrincipal: false
            };

            // Check if subject is already in the list
            if (!subjects.some(s => s._id.toString() === subject._id.toString())) {
              subjects.push(subsidiarySubject);
            }
          }
        }
      } catch (error) {
        console.error(`Error processing subject combination ${combinationId}:`, error);
        // Continue without the combination - don't fail the entire request
      }
    };

    // For A-Level students, prioritize subject combinations
    if (student.educationLevel === 'A_LEVEL' || student.form === 5 || student.form === 6) {
      console.log(`Student ${studentId} is A-Level, prioritizing subject combination`);

      // If student has a subject combination, process it
      if (student.subjectCombination) {
        console.log(`Student ${studentId} has subject combination: ${typeof student.subjectCombination === 'object' ?
          (student.subjectCombination.name || student.subjectCombination._id) : student.subjectCombination}`);

        // Get the combination ID
        const combinationId = typeof student.subjectCombination === 'object' ?
          student.subjectCombination._id : student.subjectCombination;

        // Process the subject combination
        await processSubjectCombination(combinationId);
      } else {
        console.log(`Student ${studentId} has no subject combination assigned`);
      }
    } else {
      // For O-Level students, get subjects from class
      console.log(`Student ${studentId} is O-Level, getting subjects from class`);

      // Add class subjects to the subjects array
      const classSubjects = classDetails.subjects
        .filter(subjectAssignment => subjectAssignment.subject) // Filter out null subjects
        .map(subjectAssignment => subjectAssignment.subject);

      subjects.push(...classSubjects);
    }

    // If no subjects found, try to get subjects from the class's subject combinations
    if (subjects.length === 0) {
      // Try the class's subject combinations
      if (classDetails.subjectCombination) {
        console.log(`Class ${classId} has a subject combination: ${classDetails.subjectCombination}`);
        // If it's already populated, use the _id, otherwise use it directly
        const combinationId = typeof classDetails.subjectCombination === 'object'
          ? classDetails.subjectCombination._id
          : classDetails.subjectCombination;
        await processSubjectCombination(combinationId);
      }

      // Process multiple subject combinations if available
      if (classDetails.subjectCombinations && Array.isArray(classDetails.subjectCombinations) && classDetails.subjectCombinations.length > 0) {
        console.log(`Class ${classId} has ${classDetails.subjectCombinations.length} subject combinations`);
        for (const combination of classDetails.subjectCombinations) {
          const combinationId = typeof combination === 'object' ? combination._id : combination;
          await processSubjectCombination(combinationId);
        }
      }
    }

    console.log(`Found ${subjects.length} subjects for student ${studentId}`);
    res.json(subjects);
  } catch (error) {
    console.error(`Error fetching subjects for student ${req.params.id}:`, error);
    // Log the error stack trace for better debugging
    console.error('Error stack:', error.stack);

    // Return a more detailed error message in development
    if (process.env.NODE_ENV === 'development') {
      res.status(500).json({
        message: 'Failed to fetch student subjects',
        error: error.message,
        stack: error.stack
      });
    } else {
      // In production, don't expose error details
      res.status(500).json({ message: 'Failed to fetch student subjects' });
    }
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

// Remove subjects from a student
router.delete('/:id/subjects', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    console.log(`DELETE /api/students/${req.params.id}/subjects - Removing subjects from student`);
    console.log('Request body:', req.body);

    // First check if the student exists
    const student = await Student.findById(req.params.id);
    if (!student) {
      console.log(`Student not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get the subjects from the request
    const { subjects } = req.body;
    if (!subjects || !Array.isArray(subjects)) {
      console.log('Invalid subjects array in request');
      return res.status(400).json({ message: 'Invalid subjects array' });
    }

    // Check if the student has selectedSubjects
    if (!student.selectedSubjects || !Array.isArray(student.selectedSubjects) || student.selectedSubjects.length === 0) {
      return res.status(400).json({ message: 'Student has no selected subjects' });
    }

    // Convert all subject IDs to strings for comparison
    const subjectIdsToRemove = subjects.map(id => id.toString());

    // Filter out the subjects to remove
    const originalCount = student.selectedSubjects.length;
    student.selectedSubjects = student.selectedSubjects.filter(subjectId => {
      const idStr = typeof subjectId === 'object' ? subjectId.toString() : subjectId.toString();
      return !subjectIdsToRemove.includes(idStr);
    });

    // Calculate how many subjects were removed
    const removedCount = originalCount - student.selectedSubjects.length;

    // Save the updated student
    await student.save();
    console.log(`Removed ${removedCount} subjects from student ${student.firstName} ${student.lastName}`);

    // Return the updated student with populated subjects
    const updatedStudent = await Student.findById(req.params.id)
      .populate('selectedSubjects', 'name code type description');

    res.json({
      message: `Successfully removed ${removedCount} subjects from student`,
      student: updatedStudent
    });
  } catch (error) {
    console.error(`Error removing subjects from student ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to remove subjects from student. Please try again later.' });
  }
});

module.exports = router;
