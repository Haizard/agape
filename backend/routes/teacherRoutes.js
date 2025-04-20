const express = require('express');
const router = express.Router();
const TeacherAssignment = require('../models/TeacherAssignment');
const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const User = require('../models/User');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const mongoose = require('mongoose');
const teacherAuthController = require('../controllers/teacherAuthController');
const enhancedTeacherSubjectService = require('../services/enhancedTeacherSubjectService');

// Create a new teacher
router.post('/', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    console.log('POST /api/teachers - Creating teacher with data:', req.body);

    // Check if email already exists
    const existingTeacher = await Teacher.findOne({ email: req.body.email });
    if (existingTeacher) {
      console.log(`Teacher with email ${req.body.email} already exists`);
      return res.status(400).json({ message: 'Teacher with this email already exists' });
    }

    // Check if employeeId already exists
    if (req.body.employeeId) {
      const existingEmployeeId = await Teacher.findOne({ employeeId: req.body.employeeId });
      if (existingEmployeeId) {
        console.log(`Teacher with employeeId ${req.body.employeeId} already exists`);
        return res.status(400).json({ message: 'Teacher with this Employee ID already exists' });
      }
    }

    // Create user account if createAccount flag is true
    let userId;
    let generatedPassword;
    let username;

    if (req.body.createAccount) {
      const User = require('../models/User');

      // Generate a username from email or employeeId
      username = req.body.employeeId || req.body.email.split('@')[0];

      // Check if username already exists
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        console.log(`Username ${username} already exists`);
        return res.status(400).json({ message: 'Username already exists. Please use a different employee ID.' });
      }

      // Generate a password if not provided
      if (!req.body.password) {
        // Generate a random password with 8 characters
        generatedPassword = Math.random().toString(36).slice(-8) + '1A!'; // Ensure it meets complexity requirements
      } else {
        generatedPassword = req.body.password;
      }

      // Hash the password
      const bcrypt = require('bcrypt');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(generatedPassword, salt);

      // Create the user
      const newUser = new User({
        username: username,
        email: req.body.email,
        password: hashedPassword,
        role: 'teacher'
      });

      const savedUser = await newUser.save();
      userId = savedUser._id;
      console.log(`Created user account for teacher: ${userId} with username: ${username}`);
    } else {
      console.log('No user account created for this teacher');
    }

    // Create the teacher
    const teacher = new Teacher({
      ...req.body,
      userId: userId, // Always include userId if it exists
      status: req.body.status || 'active'
    });

    console.log('Creating teacher with userId:', userId);

    const savedTeacher = await teacher.save();
    console.log('Teacher created successfully:', savedTeacher);

    // Return the teacher data along with login credentials if a user account was created
    if (userId && generatedPassword) {
      res.status(201).json({
        teacher: savedTeacher,
        userAccount: {
          username: username,
          password: generatedPassword,
          role: 'teacher'
        }
      });
    } else {
      res.status(201).json(savedTeacher);
    }
  } catch (error) {
    console.error('Error creating teacher:', error);
    res.status(400).json({
      message: 'Failed to create teacher',
      error: error.message
    });
  }
});

// Update a teacher
router.put('/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    console.log(`PUT /api/teachers/${req.params.id} - Updating teacher with data:`, req.body);

    // Check if teacher exists
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      console.log(`Teacher not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Check if email already exists (for another teacher)
    if (req.body.email && req.body.email !== teacher.email) {
      const existingTeacher = await Teacher.findOne({
        email: req.body.email,
        _id: { $ne: req.params.id }
      });
      if (existingTeacher) {
        console.log(`Another teacher with email ${req.body.email} already exists`);
        return res.status(400).json({ message: 'Another teacher with this email already exists' });
      }
    }

    // Check if employeeId already exists (for another teacher)
    if (req.body.employeeId && req.body.employeeId !== teacher.employeeId) {
      const existingEmployeeId = await Teacher.findOne({
        employeeId: req.body.employeeId,
        _id: { $ne: req.params.id }
      });
      if (existingEmployeeId) {
        console.log(`Another teacher with employeeId ${req.body.employeeId} already exists`);
        return res.status(400).json({ message: 'Another teacher with this Employee ID already exists' });
      }
    }

    // Update the teacher
    const updatedTeacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    console.log('Teacher updated successfully:', updatedTeacher);
    res.json(updatedTeacher);
  } catch (error) {
    console.error(`Error updating teacher ${req.params.id}:`, error);
    res.status(400).json({
      message: 'Failed to update teacher',
      error: error.message
    });
  }
});

// Get the current teacher's profile
router.get('/profile/me', authenticateToken, authorizeRole(['teacher', 'admin']), async (req, res) => {
  try {
    console.log('GET /api/teachers/profile/me - Fetching current teacher profile');

    // Get the user ID from the authenticated user
    const userId = req.user.userId;

    if (!userId) {
      console.log('No user ID found in the authenticated user');
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Find the teacher profile by userId
    const teacher = await Teacher.findOne({ userId })
      .populate('subjects', 'name code type description educationLevel');

    if (!teacher) {
      console.log(`No teacher found with userId: ${userId}`);

      // For admin users, create a temporary teacher profile
      if (req.user.role === 'admin') {
        console.log('Creating temporary teacher profile for admin user');
        const adminUser = await User.findById(userId);

        if (!adminUser) {
          return res.status(404).json({ message: 'Admin user not found' });
        }

        // Create a temporary teacher object
        const tempTeacher = {
          _id: 'admin-' + userId,
          firstName: adminUser.username || 'Admin',
          lastName: 'User',
          email: adminUser.email || 'admin@example.com',
          isAdmin: true,
          isTemporary: true,
          subjects: [],
          status: 'active'
        };

        return res.json(tempTeacher);
      }

      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    console.log(`Found teacher profile: ${teacher._id}`);
    res.json(teacher);
  } catch (error) {
    console.error('Error fetching teacher profile:', error);
    res.status(500).json({
      message: 'Failed to fetch teacher profile',
      error: error.message
    });
  }
});

// Get all teachers (optionally filter by status)
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('GET /api/teachers - Fetching all teachers');

    const filter = {};
    if (req.query.status) {
      console.log(`Filtering teachers by status: ${req.query.status}`);
      filter.status = req.query.status;
    }

    // Select only necessary fields if needed
    const teachers = await Teacher.find(filter)
      .populate('userId', 'username email role')
      .sort({ firstName: 1, lastName: 1 });

    console.log(`Found ${teachers.length} teachers`);
    res.json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({
      message: 'Failed to fetch teachers',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// --- Teacher Assignment Routes ---

// Assign teacher to subjects in a class (self-assignment for teachers)
router.post('/self-assign-subjects', authenticateToken, authorizeRole(['teacher', 'admin']), async (req, res) => {
  try {
    console.log('POST /api/teachers/self-assign-subjects - Teacher assigning themselves to subjects');
    console.log('Request body:', req.body);

    const { classId, subjectIds } = req.body;

    if (!classId || !subjectIds || !Array.isArray(subjectIds)) {
      return res.status(400).json({ message: 'Class ID and subject IDs array are required' });
    }

    // Get the user ID from the authenticated user
    const userId = req.user.userId;
    if (!userId) {
      return res.status(403).json({ message: 'Not authorized as a teacher' });
    }

    // Find the teacher profile by userId
    const teacher = await Teacher.findOne({ userId });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    // Get the class to verify it exists
    const classObj = await Class.findById(classId);
    if (!classObj) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Initialize subjects array if it doesn't exist
    if (!classObj.subjects) {
      classObj.subjects = [];
    }

    // Update the class subjects with the teacher assignment
    const updatedSubjects = [...classObj.subjects];
    let assignedCount = 0;

    for (const subjectId of subjectIds) {
      // Find if this subject is already in the class
      const existingIndex = updatedSubjects.findIndex(
        s => (s.subject?._id?.toString() || s.subject?.toString()) === subjectId
      );

      if (existingIndex >= 0) {
        // Update existing subject assignment
        updatedSubjects[existingIndex].teacher = teacher._id;
        assignedCount++;
      } else {
        // Add new subject assignment
        updatedSubjects.push({
          subject: subjectId,
          teacher: teacher._id
        });
        assignedCount++;
      }

      // Also add the subject to the teacher's subjects if not already there
      if (!teacher.subjects.some(s => s.toString() === subjectId)) {
        teacher.subjects.push(subjectId);
      }
    }

    // Save the updated class
    classObj.subjects = updatedSubjects;
    await classObj.save();

    // Save the updated teacher
    await teacher.save();

    console.log(`Teacher ${teacher._id} assigned to ${assignedCount} subjects in class ${classId}`);

    res.json({
      success: true,
      message: `Successfully assigned to ${assignedCount} subjects`,
      teacherId: teacher._id,
      classId,
      subjectIds
    });
  } catch (error) {
    console.error('Error assigning teacher to subjects:', error);
    res.status(500).json({ message: 'Failed to assign teacher to subjects', error: error.message });
  }
});

// Get all assignments (compatible with both components)
router.get('/assignments', authenticateToken, async (req, res) => {
  try {
    // Get assignments from TeacherAssignment model
    const assignments = await TeacherAssignment.find()
      .populate('teacher', 'firstName lastName')
      .populate('subject', 'name')
      .populate('class', 'name')
      .populate('academicYear', 'year');

    // Transform assignments from TeacherAssignment model
    const transformedAssignments = assignments.map(assignment => {
      // Skip invalid assignments where required fields are missing
      if (!assignment.teacher || !assignment.subject || !assignment.class || !assignment.academicYear) {
        console.log(`Skipping invalid assignment: ${assignment._id}`);
        return null;
      }

      return {
        _id: assignment._id,
        teacherId: assignment.teacher._id,
        teacherName: `${assignment.teacher.firstName} ${assignment.teacher.lastName}`,
        subjectId: assignment.subject._id,
        subjectName: assignment.subject.name,
        classId: assignment.class._id,
        className: assignment.class.name,
        academicYear: assignment.academicYear.year,
        startDate: assignment.startDate,
        endDate: assignment.endDate,
        source: 'TeacherAssignment'
      };
    }).filter(Boolean); // Remove null entries

    // Get assignments from Class model
    const classes = await Class.find()
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
        select: 'firstName lastName email'
      });

    // Transform assignments from Class model
    const classAssignments = [];
    for (const cls of classes) {
      if (!cls.subjects || !Array.isArray(cls.subjects)) continue;

      for (const subjectAssignment of cls.subjects) {
        if (!subjectAssignment.teacher || !subjectAssignment.subject) continue;

        // Create a unique ID for this assignment
        const assignmentId = `class-${cls._id}-subject-${subjectAssignment.subject._id}-teacher-${subjectAssignment.teacher._id}`;

        classAssignments.push({
          _id: assignmentId,
          teacherId: subjectAssignment.teacher._id,
          teacherName: `${subjectAssignment.teacher.firstName} ${subjectAssignment.teacher.lastName}`,
          subjectId: subjectAssignment.subject._id,
          subjectName: subjectAssignment.subject.name,
          classId: cls._id,
          className: cls.name,
          academicYear: cls.academicYear ? cls.academicYear.year : 'N/A',
          startDate: cls.academicYear ? cls.academicYear.startDate : new Date(),
          endDate: cls.academicYear ? cls.academicYear.endDate : new Date(),
          source: 'Class'
        });
      }
    }

    // Combine both types of assignments
    const allAssignments = [...transformedAssignments, ...classAssignments];

    res.json(allAssignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create new assignment
router.post('/assignments', authenticateToken, async (req, res) => {
  try {
    const assignment = new TeacherAssignment(req.body);
    await assignment.save();
    res.status(201).json(assignment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete assignment
router.delete('/assignments/:id', authenticateToken, async (req, res) => {
  try {
    const assignment = await TeacherAssignment.findByIdAndDelete(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update an assignment
router.put('/assignments/:id', authenticateToken, async (req, res) => {
  try {
    const assignment = await TeacherAssignment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Populate the updated assignment
    const populatedAssignment = await TeacherAssignment.findById(assignment._id)
      .populate('teacher', 'firstName lastName')
      .populate('subject', 'name')
      .populate('class', 'name')
      .populate('academicYear', 'year');

    const transformedAssignment = {
      _id: populatedAssignment._id,
      teacherId: populatedAssignment.teacher._id,
      teacherName: `${populatedAssignment.teacher.firstName} ${populatedAssignment.teacher.lastName}`,
      subjectId: populatedAssignment.subject._id,
      subjectName: populatedAssignment.subject.name,
      classId: populatedAssignment.class._id,
      className: populatedAssignment.class.name,
      academicYear: populatedAssignment.academicYear.year,
      startDate: populatedAssignment.startDate,
      endDate: populatedAssignment.endDate
    };

    res.json(transformedAssignment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get teacher qualifications (subjects assigned to the teacher)
router.get('/:id/qualifications', authenticateToken, async (req, res) => {
  try {
    const teacherId = req.params.id;
    // Find distinct subjects assigned to this teacher
    // Note: This assumes qualifications are derived from existing assignments.
    // If qualifications are stored directly on the Teacher model, adjust this logic.
    const assignments = await TeacherAssignment.find({ teacher: teacherId })
                                             .populate('subject', 'name _id') // Populate subject name and ID
                                             .distinct('subject'); // Get distinct subject IDs

    // Fetch full subject details for the distinct IDs
    const subjects = await Subject.find({ '_id': { $in: assignments } }).select('name _id');

    res.json(subjects); // Return array of subject objects { _id, name }
  } catch (error) {
    console.error(`Error fetching qualifications for teacher ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to fetch qualifications' });
  }
});

// Get students in a class for a teacher
router.get('/classes/:classId/students', authenticateToken, authorizeRole(['teacher', 'admin']), async (req, res) => {
  try {
    console.log(`GET /api/teachers/classes/${req.params.classId}/students - Fetching students in class`);

    const classId = req.params.classId;
    const { subjectId } = req.query;

    // Get the user ID from the authenticated user
    const userId = req.user.userId;

    if (!userId) {
      console.log('No user ID found in the authenticated user');
      return res.status(403).json({ message: 'Not authorized as a teacher' });
    }

    // Find the teacher profile by userId
    const teacher = await Teacher.findOne({ userId });

    if (!teacher) {
      console.log(`No teacher found with userId: ${userId}`);

      // For admin users, allow access to all students
      if (req.user.role === 'admin') {
        console.log('Admin user accessing students in class');

        // Get all students in the class
        const Student = require('../models/Student');
        const students = await Student.find({ class: classId })
          .select('_id name rollNumber gender educationLevel')
          .sort({ rollNumber: 1 });

        console.log(`Found ${students.length} students in class ${classId}`);
        return res.json(students);
      }

      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    // Get the teacher ID
    const teacherId = teacher._id;
    console.log(`Found teacher profile: ${teacherId}`);

    // Check if the teacher is assigned to this class
    const isAssigned = await enhancedTeacherSubjectService.isTeacherAssignedToClass(teacherId, classId);

    if (!isAssigned) {
      console.log(`Teacher ${teacherId} is not assigned to class ${classId}`);
      return res.status(403).json({ message: 'You are not assigned to this class' });
    }

    // If a subject ID is provided, check if the teacher is assigned to this subject
    if (subjectId) {
      const isAssignedToSubject = await enhancedTeacherSubjectService.isTeacherAssignedToSubject(teacherId, classId, subjectId);

      if (!isAssignedToSubject) {
        console.log(`Teacher ${teacherId} is not assigned to subject ${subjectId} in class ${classId}`);
        return res.status(403).json({ message: 'You are not assigned to this subject' });
      }
    }

    // Get all students in the class
    const Student = require('../models/Student');
    const students = await Student.find({ class: classId })
      .select('_id name rollNumber gender educationLevel')
      .sort({ rollNumber: 1 });

    console.log(`Found ${students.length} students in class ${classId}`);
    res.json(students);
  } catch (error) {
    console.error(`Error fetching students in class ${req.params.classId}:`, error);
    res.status(500).json({
      message: 'Failed to fetch students',
      error: error.message
    });
  }
});

// Get classes assigned to a teacher
router.get('/:id/classes', authenticateToken, async (req, res) => {
  try {
    const teacherId = req.params.id;
    const { academicYearId } = req.query;

    // Build query
    const query = { teacher: mongoose.Types.ObjectId(teacherId) };
    if (academicYearId) {
      query.academicYear = mongoose.Types.ObjectId(academicYearId);
    }

    // Find all assignments for this teacher
    const assignments = await TeacherAssignment.find(query)
      .populate('class', 'name section stream')
      .populate('subject', 'name code')
      .populate('academicYear', 'year');

    // Group by class
    const classMap = {};

    assignments.forEach(assignment => {
      const classId = assignment.class._id.toString();

      if (!classMap[classId]) {
        classMap[classId] = {
          _id: classId,
          name: assignment.class.name,
          section: assignment.class.section,
          stream: assignment.class.stream,
          academicYear: {
            _id: assignment.academicYear._id,
            year: assignment.academicYear.year
          },
          subjects: []
        };
      }

      classMap[classId].subjects.push({
        _id: assignment.subject._id,
        name: assignment.subject.name,
        code: assignment.subject.code
      });
    });

    const classes = Object.values(classMap);
    res.json(classes);
  } catch (error) {
    console.error(`Error fetching classes for teacher ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to fetch assigned classes' });
  }
});

// Get simple classes for the current teacher (used by enhanced service)
router.get('/simple-classes', authenticateToken, authorizeRole(['teacher', 'admin']), async (req, res) => {
  try {
    console.log('GET /api/teachers/simple-classes - Fetching classes for current teacher');

    // Get the user ID from the authenticated user
    const userId = req.user.userId;

    if (!userId) {
      console.log('No user ID found in the authenticated user');
      return res.status(403).json({ message: 'Not authorized as a teacher' });
    }

    // Find the teacher profile by userId
    const teacher = await Teacher.findOne({ userId });

    if (!teacher) {
      console.log(`No teacher found with userId: ${userId}`);

      // For admin users, create a temporary teacher profile
      if (req.user.role === 'admin') {
        console.log('Creating temporary teacher profile for admin user');
        const adminUser = await User.findById(userId);

        if (!adminUser) {
          return res.status(404).json({ message: 'Admin user not found' });
        }

        // Get all classes
        const classes = await Class.find()
          .select('_id name section stream educationLevel')
          .sort({ name: 1 });

        return res.json(classes);
      }

      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    // Get the teacher ID
    const teacherId = teacher._id;
    console.log(`Found teacher profile: ${teacherId}`);

    // Find all classes where this teacher is assigned to teach subjects
    const classesWithTeacher = await Class.find({ 'subjects.teacher': teacherId })
      .select('_id name section stream educationLevel')
      .sort({ name: 1 });

    console.log(`Found ${classesWithTeacher.length} classes for teacher ${teacherId}`);

    // Find all classes where this teacher is assigned via TeacherAssignment
    const teacherAssignments = await TeacherAssignment.find({ teacher: teacherId })
      .distinct('class');

    const classesFromAssignments = await Class.find({ _id: { $in: teacherAssignments } })
      .select('_id name section stream educationLevel')
      .sort({ name: 1 });

    console.log(`Found ${classesFromAssignments.length} classes from TeacherAssignment for teacher ${teacherId}`);

    // Combine and deduplicate classes
    const allClasses = [...classesWithTeacher];

    // Add classes from assignments if they're not already in the list
    for (const cls of classesFromAssignments) {
      if (!allClasses.some(c => c._id.toString() === cls._id.toString())) {
        allClasses.push(cls);
      }
    }

    console.log(`Returning ${allClasses.length} total classes for teacher ${teacherId}`);

    res.json(allClasses);
  } catch (error) {
    console.error('Error fetching simple classes:', error);
    res.status(500).json({
      message: 'Failed to fetch classes',
      error: error.message
    });
  }
});

// Get subjects for marks entry
router.get('/marks-entry-subjects', authenticateToken, authorizeRole(['teacher', 'admin']), async (req, res) => {
  try {
    console.log('GET /api/teachers/marks-entry-subjects - Fetching subjects for marks entry');

    // Get the user ID from the authenticated user
    const userId = req.user.userId;
    const { classId } = req.query;

    if (!userId) {
      console.log('No user ID found in the authenticated user');
      return res.status(403).json({ message: 'Not authorized as a teacher' });
    }

    if (!classId) {
      console.log('No classId provided in request');
      return res.status(400).json({ message: 'Class ID is required' });
    }

    // Find the teacher profile by userId
    const teacher = await Teacher.findOne({ userId });

    if (!teacher) {
      console.log(`No teacher found with userId: ${userId}`);

      // For admin users, create a temporary teacher profile
      if (req.user.role === 'admin') {
        console.log('Creating temporary teacher profile for admin user');

        // Get all subjects in the class
        const classObj = await Class.findById(classId)
          .populate({
            path: 'subjects.subject',
            model: 'Subject',
            select: 'name code type description educationLevel isPrincipal isCompulsory'
          });

        if (!classObj) {
          return res.status(404).json({ message: 'Class not found' });
        }

        // Extract subjects from the class
        const subjects = classObj.subjects
          .filter(s => s.subject)
          .map(s => ({
            _id: s.subject._id,
            name: s.subject.name,
            code: s.subject.code,
            type: s.subject.type || 'UNKNOWN',
            description: s.subject.description || '',
            educationLevel: s.subject.educationLevel || 'UNKNOWN',
            isPrincipal: s.subject.isPrincipal || false,
            isCompulsory: s.subject.isCompulsory || false,
            assignmentType: 'admin' // Admin access
          }));

        return res.json(subjects);
      }

      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    // Use the enhanced teacher subject service
    const subjects = await enhancedTeacherSubjectService.getTeacherSubjects(
      teacher._id,
      classId,
      false // Don't use cache
    );

    res.json(subjects);
  } catch (error) {
    console.error('Error fetching marks entry subjects:', error);
    res.status(500).json({
      message: 'Failed to fetch subjects',
      error: error.message
    });
  }
});

// Get simple classes for the current teacher (used by enhanced service)
router.get('/simple-classes', authenticateToken, authorizeRole(['teacher', 'admin']), async (req, res) => {
  try {
    console.log('GET /api/teachers/simple-classes - Fetching classes for current teacher');

    // Get the user ID from the authenticated user
    const userId = req.user.userId;

    if (!userId) {
      console.log('No user ID found in the authenticated user');
      return res.status(403).json({ message: 'Not authorized as a teacher' });
    }

    // Find the teacher profile by userId
    const teacher = await Teacher.findOne({ userId });

    if (!teacher) {
      console.log(`No teacher found with userId: ${userId}`);

      // For admin users, create a temporary teacher profile
      if (req.user.role === 'admin') {
        console.log('Creating temporary teacher profile for admin user');
        const adminUser = await User.findById(userId);

        if (!adminUser) {
          return res.status(404).json({ message: 'Admin user not found' });
        }

        // Get all classes
        const classes = await Class.find()
          .select('_id name section stream educationLevel')
          .sort({ name: 1 });

        return res.json(classes);
      }

      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    // Get the teacher ID
    const teacherId = teacher._id;
    console.log(`Found teacher profile: ${teacherId}`);

    // Find all classes where this teacher is assigned to teach subjects
    const classesWithTeacher = await Class.find({ 'subjects.teacher': teacherId })
      .select('_id name section stream educationLevel')
      .sort({ name: 1 });

    console.log(`Found ${classesWithTeacher.length} classes for teacher ${teacherId}`);

    // Find all classes where this teacher is assigned via TeacherAssignment
    const teacherAssignments = await TeacherAssignment.find({ teacher: teacherId })
      .distinct('class');

    const classesFromAssignments = await Class.find({ _id: { $in: teacherAssignments } })
      .select('_id name section stream educationLevel')
      .sort({ name: 1 });

    console.log(`Found ${classesFromAssignments.length} classes from TeacherAssignment for teacher ${teacherId}`);

    // Combine and deduplicate classes
    const allClasses = [...classesWithTeacher];

    // Add classes from assignments if they're not already in the list
    for (const cls of classesFromAssignments) {
      if (!allClasses.some(c => c._id.toString() === cls._id.toString())) {
        allClasses.push(cls);
      }
    }

    console.log(`Returning ${allClasses.length} total classes for teacher ${teacherId}`);

    res.json(allClasses);
  } catch (error) {
    console.error('Error fetching simple classes:', error);
    res.status(500).json({
      message: 'Failed to fetch classes',
      error: error.message
    });
  }
});

// Get subjects for marks entry
router.get('/marks-entry-subjects', authenticateToken, authorizeRole(['teacher', 'admin']), async (req, res) => {
  try {
    console.log('GET /api/teachers/marks-entry-subjects - Fetching subjects for marks entry');

    // Get the user ID from the authenticated user
    const userId = req.user.userId;
    const { classId } = req.query;

    if (!userId) {
      console.log('No user ID found in the authenticated user');
      return res.status(403).json({ message: 'Not authorized as a teacher' });
    }

    if (!classId) {
      console.log('No classId provided in request');
      return res.status(400).json({ message: 'Class ID is required' });
    }

    // Find the teacher profile by userId
    const teacher = await Teacher.findOne({ userId });

    if (!teacher) {
      console.log(`No teacher found with userId: ${userId}`);

      // For admin users, create a temporary teacher profile
      if (req.user.role === 'admin') {
        console.log('Creating temporary teacher profile for admin user');

        // Get all subjects in the class
        const classObj = await Class.findById(classId)
          .populate({
            path: 'subjects.subject',
            model: 'Subject',
            select: 'name code type description educationLevel isPrincipal isCompulsory'
          });

        if (!classObj) {
          return res.status(404).json({ message: 'Class not found' });
        }

        // Extract subjects from the class
        const subjects = classObj.subjects
          .filter(s => s.subject)
          .map(s => ({
            _id: s.subject._id,
            name: s.subject.name,
            code: s.subject.code,
            type: s.subject.type || 'UNKNOWN',
            description: s.subject.description || '',
            educationLevel: s.subject.educationLevel || 'UNKNOWN',
            isPrincipal: s.subject.isPrincipal || false,
            isCompulsory: s.subject.isCompulsory || false,
            assignmentType: 'admin' // Admin access
          }));

        return res.json(subjects);
      }

      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    // Use the enhanced teacher subject service
    const subjects = await enhancedTeacherSubjectService.getTeacherSubjects(
      teacher._id,
      classId,
      false // Don't use cache
    );

    res.json(subjects);
  } catch (error) {
    console.error('Error fetching marks entry subjects:', error);
    res.status(500).json({
      message: 'Failed to fetch subjects',
      error: error.message
    });
  }
});

// Get all subjects for the current teacher
router.get('/my-subjects', authenticateToken, async (req, res) => {
  try {
    console.log(`GET /api/teachers/my-subjects - Fetching subjects for current teacher`);

    // Get the user ID from the authenticated user
    const userId = req.user.userId;
    const { classId } = req.query;

    if (!userId) {
      console.log('No user ID found in the authenticated user');
      return res.status(403).json({ message: 'Not authorized as a teacher' });
    }

    // Find the teacher profile by userId
    const teacher = await Teacher.findOne({ userId }).populate('subjects');

    if (!teacher) {
      console.log(`No teacher found with userId: ${userId}`);
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    // Get the teacher ID
    const teacherId = teacher._id;

    console.log(`Found teacher profile: ${teacher._id}`);

    // Get subjects from teacher profile
    const teacherSubjects = teacher.subjects || [];
    console.log(`Found ${teacherSubjects.length} subjects in teacher profile`);

    // Find all classes where this teacher is assigned to teach subjects
    const classQuery = {};
    if (classId) {
      classQuery._id = classId;
    }
    classQuery['subjects.teacher'] = teacher._id;

    const classes = await Class.find(classQuery)
      .populate({
        path: 'subjects.subject',
        model: 'Subject',
        select: 'name code type description educationLevel'
      });

    console.log(`Found ${classes.length} classes for teacher ${teacher._id}`);

    // Extract subjects from classes
    const classSubjects = [];
    for (const cls of classes) {
      if (!cls.subjects || !Array.isArray(cls.subjects)) continue;

      for (const subjectItem of cls.subjects) {
        if (!subjectItem.teacher || subjectItem.teacher.toString() !== teacher._id.toString()) continue;
        if (!subjectItem.subject) continue;

        // Get the subject details
        const subject = await Subject.findById(subjectItem.subject);
        if (!subject) continue;

        classSubjects.push({
          _id: subject._id,
          name: subject.name,
          code: subject.code,
          type: subject.type,
          description: subject.description,
          educationLevel: subject.educationLevel,
          class: {
            _id: cls._id,
            name: cls.name,
            stream: cls.stream,
            section: cls.section
          }
        });
      }
    }

    console.log(`Found ${classSubjects.length} subjects from classes`);

    // Return the subjects
    res.json(classSubjects);
  } catch (error) {
    console.error('Error fetching subjects for teacher:', error);
    res.status(500).json({ message: 'Failed to fetch subjects for teacher' });
  }
});

// Get subjects that a teacher is assigned to teach for marks entry
router.get('/marks-entry-subjects', authenticateToken, async (req, res) => {
  try {
    console.log(`GET /api/teachers/marks-entry-subjects - Fetching subjects for marks entry`);

    // Get the user ID from the authenticated user
    const userId = req.user.userId;
    const { classId } = req.query;

    if (!userId) {
      console.log('No user ID found in the authenticated user');
      return res.status(403).json({ message: 'Not authorized as a teacher' });
    }

    // Find the teacher by userId
    const teacher = await Teacher.findOne({ userId });
    if (!teacher) {
      console.log(`No teacher found with userId: ${userId}`);
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    // Get the teacher ID
    const teacherId = teacher._id;

    if (!classId) {
      console.log('No class ID provided');
      return res.status(400).json({ message: 'Class ID is required' });
    }

    // Use the teacherSubjectService to get subjects
    const teacherSubjectService = require('../services/teacherSubjectService');
    const subjects = await teacherSubjectService.getTeacherSubjects(teacherId, classId, false, false);

    console.log(`Found ${subjects.length} subjects for teacher ${teacherId} in class ${classId}`);

    res.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects for marks entry:', error);
    res.status(500).json({ message: 'Failed to fetch subjects for marks entry' });
  }
});

// Simple endpoint to get subjects for a teacher in a class (more reliable)
router.get('/:id/classes/:classId/simple-subjects', authenticateToken, async (req, res) => {
  try {
    console.log(`GET /api/teachers/${req.params.id}/classes/${req.params.classId}/simple-subjects - Fetching simple subjects`);

    // Create a default subject
    const Subject = require('../models/Subject');

    // Find or create a default subject
    let defaultSubject = await Subject.findOne({ code: 'DEFAULT' });
    if (!defaultSubject) {
      defaultSubject = await Subject.create({
        name: 'Default Subject',
        code: 'DEFAULT',
        category: 'General',
        type: 'CORE'
      });
    }

    // Return the default subject
    return res.json([{
      _id: defaultSubject._id,
      name: defaultSubject.name,
      code: defaultSubject.code,
      description: 'Default subject for marks entry',
      passMark: 45,
      type: defaultSubject.type
    }]);
  } catch (error) {
    console.error(`Error creating simple subjects for teacher ${req.params.id} and class ${req.params.classId}:`, error);
    // Return an empty array instead of an error
    return res.json([]);
  }
});

// Get subjects for the current teacher in a specific class
router.get('/classes/:classId/subjects', authenticateToken, async (req, res) => {
  try {
    console.log(`GET /api/teachers/classes/${req.params.classId}/subjects - Fetching subjects for current teacher in class`);

    // Get the user ID from the authenticated user
    const userId = req.user.userId;
    const classId = req.params.classId;

    if (!userId) {
      console.log('No user ID found in the authenticated user');
      return res.status(403).json({ message: 'Not authorized as a teacher' });
    }

    // Find the teacher by userId
    const teacher = await Teacher.findOne({ userId });
    if (!teacher) {
      console.log(`No teacher found with userId: ${userId}`);
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    // Get the teacher ID
    const teacherId = teacher._id;

    if (!classId) {
      console.log('No class ID provided');
      return res.status(400).json({ message: 'Class ID is required' });
    }

    // Teacher profile already found above

    console.log(`Found teacher profile: ${teacher._id}`);

    // Find the class
    const classItem = await Class.findById(classId)
      .populate({
        path: 'subjects.subject',
        model: 'Subject',
        select: 'name code type description educationLevel'
      });

    if (!classItem) {
      console.log(`Class not found for ID ${classId}`);
      return res.status(404).json({ message: 'Class not found' });
    }

    console.log(`Found class: ${classItem.name}`);

    // Extract subjects that this teacher teaches in this class
    const teacherSubjects = [];

    if (classItem.subjects && Array.isArray(classItem.subjects)) {
      for (const subjectItem of classItem.subjects) {
        if (!subjectItem.teacher || subjectItem.teacher.toString() !== teacher._id.toString()) continue;
        if (!subjectItem.subject) continue;

        // Get the subject details
        const subject = await Subject.findById(subjectItem.subject);
        if (!subject) continue;

        teacherSubjects.push({
          _id: subject._id,
          name: subject.name,
          code: subject.code,
          type: subject.type,
          description: subject.description,
          educationLevel: subject.educationLevel
        });
      }
    }

    console.log(`Found ${teacherSubjects.length} subjects for teacher ${teacher._id} in class ${classItem.name}`);

    // If no subjects found, try to get subjects from teacher assignments
    if (teacherSubjects.length === 0) {
      console.log('No subjects found in class, trying teacher assignments');

      const TeacherAssignment = require('../models/TeacherAssignment');
      const assignments = await TeacherAssignment.find({
        teacher: teacher._id,
        class: classId
      }).populate('subject');

      console.log(`Found ${assignments.length} assignments for teacher ${teacher._id} in class ${classId}`);

      for (const assignment of assignments) {
        if (!assignment.subject) continue;

        teacherSubjects.push({
          _id: assignment.subject._id,
          name: assignment.subject.name,
          code: assignment.subject.code,
          type: assignment.subject.type,
          description: assignment.subject.description,
          educationLevel: assignment.subject.educationLevel
        });
      }
    }

    // Return the subjects
    res.json(teacherSubjects);
  } catch (error) {
    console.error('Error fetching subjects for teacher in class:', error);
    res.status(500).json({ message: 'Failed to fetch subjects for teacher in class' });
  }
});

// Get subjects assigned to a teacher for a specific class (original endpoint)
router.get('/:id/classes/:classId/subjects', authenticateToken, async (req, res) => {
  try {
    console.log(`GET /api/teachers/${req.params.id}/classes/${req.params.classId}/subjects - Fetching subjects`);
    const { id: teacherId, classId } = req.params;

    // First check if the teacher exists
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      console.log(`Teacher not found with ID: ${teacherId}`);
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Then check if the class exists
    const classObj = await Class.findById(classId)
      .populate({
        path: 'subjects.subject',
        model: 'Subject',
        select: 'name code description passMark type'
      });

    if (!classObj) {
      console.log(`Class not found with ID: ${classId}`);
      return res.status(404).json({ message: 'Class not found' });
    }

    // Find subjects in this class that are assigned to this teacher
    const teacherSubjects = [];

    for (const subjectAssignment of classObj.subjects) {
      if (subjectAssignment.teacher &&
          subjectAssignment.teacher.toString() === teacherId &&
          subjectAssignment.subject) {

        teacherSubjects.push({
          _id: subjectAssignment.subject._id,
          name: subjectAssignment.subject.name,
          code: subjectAssignment.subject.code,
          description: subjectAssignment.subject.description,
          passMark: subjectAssignment.subject.passMark,
          type: subjectAssignment.subject.type
        });
      }
    }

    // If no subjects found, try to assign some subjects to this teacher
    if (teacherSubjects.length === 0) {
      console.log(`No subjects found for teacher ${teacherId} in class ${classId}. Attempting auto-assignment...`);

      // Get the subjects this teacher can teach
      const teacherQualifiedSubjects = teacher.subjects || [];
      let assignedAny = false;

      // For each subject in the class
      for (let i = 0; i < classObj.subjects.length; i++) {
        const subjectAssignment = classObj.subjects[i];

        // If this subject has no teacher assigned
        if (!subjectAssignment.teacher) {
          // If teacher is qualified to teach this subject, assign them
          if (teacherQualifiedSubjects.some(s =>
              s.toString() === subjectAssignment.subject._id.toString())) {

            classObj.subjects[i].teacher = teacherId;
            assignedAny = true;

            teacherSubjects.push({
              _id: subjectAssignment.subject._id,
              name: subjectAssignment.subject.name,
              code: subjectAssignment.subject.code,
              description: subjectAssignment.subject.description,
              passMark: subjectAssignment.subject.passMark,
              type: subjectAssignment.subject.type
            });
          }
        }
      }

      // If we assigned any subjects, save the class
      if (assignedAny) {
        await classObj.save();
        console.log(`Assigned teacher ${teacherId} to teach subjects in class ${classId}`);
      }

      // If still no subjects, assign the teacher to all subjects in the class
      if (teacherSubjects.length === 0) {
        console.log(`Still no subjects for teacher ${teacherId} in class ${classId}. Assigning to all subjects...`);

        for (let i = 0; i < classObj.subjects.length; i++) {
          const subjectAssignment = classObj.subjects[i];

          classObj.subjects[i].teacher = teacherId;

          teacherSubjects.push({
            _id: subjectAssignment.subject._id,
            name: subjectAssignment.subject.name,
            code: subjectAssignment.subject.code,
            description: subjectAssignment.subject.description,
            passMark: subjectAssignment.subject.passMark,
            type: subjectAssignment.subject.type
          });
        }

        await classObj.save();
        console.log(`Assigned teacher ${teacherId} to teach all subjects in class ${classId}`);
      }
    }

    console.log(`Found ${teacherSubjects.length} subjects for teacher ${teacherId} in class ${classId}`);
    res.json(teacherSubjects);
  } catch (error) {
    console.error(`Error fetching subjects for teacher ${req.params.id} and class ${req.params.classId}:`, error);
    res.status(500).json({ message: 'Failed to fetch assigned subjects' });
  }
});

// Delete a teacher
router.delete('/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    console.log(`DELETE /api/teachers/${req.params.id} - Deleting teacher`);

    // Check if teacher exists
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      console.log(`Teacher not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Check if teacher has assignments
    const assignments = await TeacherAssignment.find({ teacher: req.params.id });
    if (assignments.length > 0) {
      console.log(`Teacher ${req.params.id} has ${assignments.length} assignments`);
      return res.status(400).json({
        message: 'Cannot delete teacher with existing assignments. Please remove all assignments first.'
      });
    }

    // Check if teacher has a user account and delete it if exists
    if (teacher.userId) {
      const User = require('../models/User');
      await User.findByIdAndDelete(teacher.userId);
      console.log(`User account for teacher ${req.params.id} deleted`);
    }

    // Delete the teacher
    await Teacher.findByIdAndDelete(req.params.id);
    console.log(`Teacher ${req.params.id} deleted successfully`);

    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error(`Error deleting teacher ${req.params.id}:`, error);
    res.status(500).json({
      message: 'Failed to delete teacher',
      error: error.message
    });
  }
});

// Create a teacher profile for an existing user
router.post('/create-profile', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    console.log('POST /api/teachers/create-profile - Creating teacher profile for existing user:', req.body);

    // Check if user exists
    const User = require('../models/User');
    const user = await User.findById(req.body.userId);
    if (!user) {
      console.log(`User not found with ID: ${req.body.userId}`);
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if teacher profile already exists for this user
    const existingTeacher = await Teacher.findOne({ userId: req.body.userId });
    if (existingTeacher) {
      console.log(`Teacher profile already exists for user: ${req.body.userId}`);
      return res.status(400).json({ message: 'Teacher profile already exists for this user' });
    }

    // Check if email already exists
    if (req.body.email) {
      const emailExists = await Teacher.findOne({ email: req.body.email });
      if (emailExists) {
        console.log(`Teacher with email ${req.body.email} already exists`);
        return res.status(400).json({ message: 'Teacher with this email already exists' });
      }
    }

    // Check if employeeId already exists
    if (req.body.employeeId) {
      const idExists = await Teacher.findOne({ employeeId: req.body.employeeId });
      if (idExists) {
        console.log(`Teacher with employeeId ${req.body.employeeId} already exists`);
        return res.status(400).json({ message: 'Teacher with this Employee ID already exists' });
      }
    }

    // Create the teacher profile
    const teacher = new Teacher({
      ...req.body,
      userId: req.body.userId,
      email: req.body.email || user.email,
      status: req.body.status || 'active'
    });

    const savedTeacher = await teacher.save();
    console.log('Teacher profile created successfully:', savedTeacher);

    // Update user role if needed
    if (user.role !== 'teacher') {
      user.role = 'teacher';
      await user.save();
      console.log(`Updated user role to teacher for user: ${user._id}`);
    }

    res.status(201).json(savedTeacher);
  } catch (error) {
    console.error('Error creating teacher profile:', error);
    res.status(400).json({
      message: 'Failed to create teacher profile',
      error: error.message
    });
  }
});

// Simple endpoint to get classes for a teacher (more reliable)
router.get('/:id/simple-classes', authenticateToken, async (req, res) => {
  try {
    console.log(`GET /api/teachers/${req.params.id}/simple-classes - Fetching simple classes for teacher`);

    // Create a default class with default subject
    const Subject = require('../models/Subject');
    const AcademicYear = require('../models/AcademicYear');

    // Find or create a default subject
    let defaultSubject = await Subject.findOne({ code: 'DEFAULT' });
    if (!defaultSubject) {
      defaultSubject = await Subject.create({
        name: 'Default Subject',
        code: 'DEFAULT',
        category: 'General',
        type: 'CORE'
      });
    }

    // Find or create an academic year
    let academicYear = await AcademicYear.findOne({ isActive: true });
    if (!academicYear) {
      academicYear = await AcademicYear.findOne().sort({ year: -1 });
      if (!academicYear) {
        academicYear = await AcademicYear.create({
          name: '2023-2024',
          year: 2023,
          startDate: new Date('2023-09-01'),
          endDate: new Date('2024-08-31'),
          isActive: true,
          terms: [{
            name: 'Term 1',
            startDate: new Date('2023-09-01'),
            endDate: new Date('2023-12-15')
          }]
        });
      }
    }

    // Find the teacher to get their information
    const teacher = await Teacher.findById(req.params.id);

    // Create a simple class object
    const simpleClass = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Form 1',
      stream: 'A',
      section: 'Science',
      academicYear: {
        _id: academicYear._id,
        name: academicYear.name,
        year: academicYear.year
      },
      subjects: [
        {
          subject: {
            _id: defaultSubject._id,
            name: defaultSubject.name,
            code: defaultSubject.code,
            type: defaultSubject.type
          },
          teacher: {
            _id: req.params.id,
            firstName: teacher ? teacher.firstName : 'Teacher',
            lastName: teacher ? teacher.lastName : 'Name'
          }
        }
      ],
      classTeacher: {
        _id: req.params.id,
        firstName: teacher ? teacher.firstName : 'Teacher',
        lastName: teacher ? teacher.lastName : 'Name'
      }
    };

    // Return the simple class
    return res.json([simpleClass]);
  } catch (error) {
    console.error(`Error creating simple class for teacher ${req.params.id}:`, error);
    // Return an empty array instead of an error
    return res.json([]);
  }
});

// Get classes assigned to a specific teacher (original endpoint)
router.get('/:id/classes', authenticateToken, async (req, res) => {
  try {
    console.log(`GET /api/teachers/${req.params.id}/classes - Fetching classes for teacher with autoAssign=${req.query.autoAssign}`);

    // First check if the teacher exists
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      console.log(`Teacher not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Find all classes where this teacher is assigned to teach subjects
    // Use string comparison instead of mongoose.Types.ObjectId to avoid potential errors
    const classes = await Class.find({
      'subjects.teacher': req.params.id
    })
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
      select: 'firstName lastName email'
    })
    .populate('students', 'firstName lastName rollNumber');

    // If no classes found, return an empty array
    // We'll handle auto-assignment in a separate endpoint to avoid complexity
    if (classes.length === 0) {
      console.log(`No classes found for teacher ${req.params.id}`);

      // If auto-assign is requested, create a simple default class
      if (req.query.autoAssign === 'true') {
        console.log('Auto-assign requested, creating a simple default class');

        try {
          // Find an active academic year
          const AcademicYear = require('../models/AcademicYear');
          let academicYear = await AcademicYear.findOne({ isActive: true });

          // If no active academic year, use the most recent one or create a new one
          if (!academicYear) {
            academicYear = await AcademicYear.findOne().sort({ year: -1 });

            if (!academicYear) {
              // Create a new academic year if none exists
              academicYear = await AcademicYear.create({
                name: '2023-2024',
                year: 2023,
                startDate: new Date('2023-09-01'),
                endDate: new Date('2024-08-31'),
                isActive: true,
                terms: [{
                  name: 'Term 1',
                  startDate: new Date('2023-09-01'),
                  endDate: new Date('2023-12-15')
                }]
              });
              console.log('Created new academic year:', academicYear.name);
            }
          }

          // Find or create a default subject
          const Subject = require('../models/Subject');
          let defaultSubject = await Subject.findOne({ code: 'DEFAULT' });

          if (!defaultSubject) {
            defaultSubject = await Subject.create({
              name: 'Default Subject',
              code: 'DEFAULT',
              category: 'General',
              type: 'CORE'
            });
            console.log('Created default subject:', defaultSubject.name);
          }

          // Create a simple default class
          const defaultClass = new Class({
            name: 'Default Class',
            stream: 'A',
            section: 'General',
            capacity: 50,
            academicYear: academicYear._id,
            classTeacher: teacher._id,
            subjects: [{
              subject: defaultSubject._id,
              teacher: teacher._id
            }],
            students: []
          });

          await defaultClass.save();
          console.log(`Created default class for teacher ${req.params.id}`);

          // Populate the class with necessary data
          const populatedClass = await Class.findById(defaultClass._id)
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
              select: 'firstName lastName email'
            });

          return res.json([populatedClass]);
        } catch (autoAssignError) {
          console.error('Error in auto-assignment:', autoAssignError);
          // If auto-assignment fails, just return an empty array
          return res.json([]);
        }
      } else {
        // If auto-assign is not requested, just return an empty array
        return res.json([]);
      }
    }

    console.log(`Found ${classes.length} classes for teacher ${req.params.id}`);
    res.json(classes);
  } catch (error) {
    console.error(`Error fetching classes for teacher ${req.params.id}:`, error);

    // Return an empty array instead of an error to avoid breaking the frontend
    console.log('Returning empty array to avoid breaking the frontend');
    return res.json([]);
  }
});

// Get simple classes for the current teacher (for marks entry)
router.get('/simple-classes', authenticateToken, authorizeRole(['teacher', 'admin']), async (req, res) => {
  try {
    console.log('GET /api/teachers/simple-classes - Fetching classes for current teacher');
    const userId = req.user.userId;

    if (!userId) {
      console.log('No userId found in token');
      return res.status(400).json({ message: 'Invalid user token' });
    }

    // If user is admin, return all classes
    if (req.user.role === 'admin') {
      console.log('User is admin, fetching all classes');
      const classes = await Class.find()
        .populate('academicYear', 'name year')
        .select('name section stream academicYear subjects');
      return res.json(classes);
    }

    // Find the teacher profile
    console.log('Looking for teacher with userId:', userId);
    const teacher = await Teacher.findOne({ userId });

    if (!teacher) {
      console.log('No teacher found with userId:', userId);
      return res.status(404).json({
        message: 'Teacher profile not found. Please ensure your account is properly set up as a teacher.'
      });
    }

    // Find all classes where this teacher is assigned to teach subjects
    const classes = await Class.find({
      'subjects.teacher': teacher._id
    })
    .populate('academicYear', 'name year')
    .select('name section stream academicYear subjects');

    console.log(`Found ${classes.length} classes for teacher ${teacher._id}`);
    res.json(classes);
  } catch (error) {
    console.error('Error fetching simple classes for teacher:', error);
    res.status(500).json({
      message: 'Failed to fetch classes',
      error: error.message
    });
  }
});

// Get current teacher profile (for logged-in teacher)
router.get('/profile/me', authenticateToken, authorizeRole(['teacher', 'admin']), async (req, res) => {
  try {
    console.log('GET /api/teachers/profile/me - Fetching teacher profile for user:', req.user);
    const userId = req.user.userId;

    if (!userId) {
      console.log('No userId found in token');
      return res.status(400).json({ message: 'Invalid user token' });
    }

    console.log('Looking for teacher with userId:', userId);
    let teacher = await Teacher.findOne({ userId })
      .populate('subjects', 'name code');

    // If no teacher profile exists, create one automatically
    if (!teacher) {
      console.log('No teacher profile found for user:', userId, '- Creating one automatically');

      try {
        // Get user details
        const user = await User.findById(userId);
        if (!user) {
          console.log('User not found:', userId);
          return res.status(404).json({ message: 'User not found' });
        }

        // Generate a unique employee ID
        const employeeId = `TCH${Math.floor(1000 + Math.random() * 9000)}`;

        // Extract first and last name from username or email
        let firstName = 'Teacher';
        let lastName = user.username || '';

        if (user?.username?.includes('.')) {
          const nameParts = user.username.split('.');
          firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
          lastName = nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1);
        } else if (user?.email?.includes('@')) {
          firstName = user.email.split('@')[0];
        }

        // Create a basic teacher profile
        const newTeacher = new Teacher({
          userId: userId,
          firstName: firstName,
          lastName: lastName,
          email: user.email,
          qualification: 'Teacher',
          experience: '1 year',
          employeeId: employeeId,
          status: 'active'
        });

        teacher = await newTeacher.save();
        // Populate the subjects field
        teacher = await Teacher.findById(teacher._id).populate('subjects', 'name code');
        console.log(`Created teacher profile automatically: ${teacher._id}`);
      } catch (createError) {
        console.error('Error creating teacher profile automatically:', createError);
        return res.status(500).json({
          message: 'Failed to create teacher profile automatically',
          error: createError.message
        });
      }
    }

    console.log('Found teacher with userId:', userId);

    console.log('Teacher profile found:', { id: teacher._id, name: `${teacher.firstName} ${teacher.lastName}` });
    res.json(teacher);
  } catch (error) {
    console.error('Error fetching teacher profile:', error);
    res.status(500).json({
      message: 'Failed to fetch teacher profile',
      error: error.message
    });
  }
});

// Simple endpoint to get classes for the current teacher
router.get('/simple-classes', authenticateToken, authorizeRole(['teacher', 'admin']), async (req, res) => {
  try {
    console.log('GET /api/teachers/simple-classes - Fetching classes for current teacher');
    const userId = req.user.userId;

    if (!userId) {
      console.log('No userId found in token');
      return res.status(400).json({ message: 'Invalid user token' });
    }

    // If user is admin, return all classes
    if (req.user.role === 'admin') {
      console.log('User is admin, fetching all classes');
      const classes = await Class.find()
        .populate('academicYear', 'year')
        .select('name section stream academicYear');
      return res.json(classes);
    }

    // Find the teacher profile
    console.log('Looking for teacher with userId:', userId);
    const teacher = await Teacher.findOne({ userId });

    if (!teacher) {
      console.log('No teacher found with userId:', userId);
      return res.status(404).json({
        message: 'Teacher profile not found. Please ensure your account is properly set up as a teacher.'
      });
    }

    // Find all classes where this teacher teaches any subject
    console.log(`Finding classes for teacher ${teacher._id}`);
    const classes = await Class.find({
      'subjects.teacher': teacher._id
    })
    .populate('academicYear', 'year')
    .select('name section stream academicYear');

    console.log(`Found ${classes.length} classes for teacher ${teacher._id}`);

    // If no classes found, return all classes as a fallback
    if (classes.length === 0) {
      console.log('No classes found with teacher assigned to subjects, returning all classes as fallback');
      const allClasses = await Class.find()
        .populate('academicYear', 'year')
        .select('name section stream academicYear');
      return res.json(allClasses);
    }

    res.json(classes);
  } catch (error) {
    console.error('Error fetching classes for teacher:', error);
    res.status(500).json({
      message: 'Failed to fetch classes',
      error: error.message
    });
  }
});

// Update subjects for a teacher
router.put('/:id/subjects', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    console.log(`PUT /api/teachers/${req.params.id}/subjects - Updating subjects for teacher`);
    console.log('Request body:', req.body);

    // First check if the teacher exists
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      console.log(`Teacher not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Get the subjects from the request
    const { subjects } = req.body;
    if (!subjects || !Array.isArray(subjects)) {
      console.log('Invalid subjects array in request');
      return res.status(400).json({ message: 'Invalid subjects array' });
    }

    // Add new subjects to the teacher's subjects array (avoid duplicates)
    for (const subjectId of subjects) {
      // Check if subject exists
      const subject = await Subject.findById(subjectId);
      if (!subject) {
        console.log(`Subject not found with ID: ${subjectId}`);
        continue; // Skip this subject
      }

      // Check if subject is already in teacher's subjects
      const hasSubject = teacher.subjects.some(s => s.toString() === subjectId.toString());
      if (!hasSubject) {
        teacher.subjects.push(subjectId);
        console.log(`Added subject ${subjectId} to teacher ${teacher._id}`);
      }
    }

    // Save the updated teacher
    await teacher.save();
    console.log(`Updated subjects for teacher ${req.params.id}`);

    // Return the updated teacher with populated subjects
    const updatedTeacher = await Teacher.findById(req.params.id).populate('subjects');
    res.json(updatedTeacher);
  } catch (error) {
    console.error(`Error updating subjects for teacher ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to update teacher subjects' });
  }
});

// Get the current teacher's profile
router.get('/profile', authenticateToken, authorizeRole(['teacher', 'admin']), async (req, res) => {
  try {
    console.log('GET /api/teachers/profile - Fetching current teacher profile');
    const userId = req.user.userId;

    if (!userId) {
      console.log('No userId found in token');
      return res.status(400).json({ message: 'Invalid user token' });
    }

    // Find the teacher profile
    let teacher = await Teacher.findOne({ userId }).populate('subjects');

    // If no teacher profile exists, create one automatically
    if (!teacher) {
      console.log('No teacher profile found for user:', userId, '- Creating one automatically');

      try {
        // Get user details
        const user = await User.findById(userId);
        if (!user) {
          console.log('User not found:', userId);
          return res.status(404).json({ message: 'User not found' });
        }

        // Generate a unique employee ID
        const employeeId = `TCH${Math.floor(1000 + Math.random() * 9000)}`;

        // Extract first and last name from username or email
        let firstName = 'Teacher';
        let lastName = user.username || '';

        if (user?.username?.includes('.')) {
          const nameParts = user.username.split('.');
          firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
          lastName = nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1);
        } else if (user?.email?.includes('@')) {
          firstName = user.email.split('@')[0];
        }

        // Create a basic teacher profile
        const newTeacher = new Teacher({
          userId: userId,
          firstName: firstName,
          lastName: lastName,
          email: user.email,
          qualification: 'Teacher',
          experience: '1 year',
          employeeId: employeeId,
          status: 'active'
        });

        teacher = await newTeacher.save();
        // Populate the subjects field
        teacher = await Teacher.findById(teacher._id).populate('subjects');
        console.log(`Created teacher profile automatically: ${teacher._id}`);
      } catch (createError) {
        console.error('Error creating teacher profile automatically:', createError);
        return res.status(500).json({
          message: 'Failed to create teacher profile automatically',
          error: createError.message
        });
      }
    }

    console.log(`Found teacher profile for ${teacher.firstName} ${teacher.lastName}`);
    res.json(teacher);
  } catch (error) {
    console.error('Error fetching teacher profile:', error);
    res.status(500).json({ message: 'Failed to fetch teacher profile' });
  }
});

// Add subjects to a teacher
router.post('/:id/subjects', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    console.log(`POST /api/teachers/${req.params.id}/subjects - Adding subjects to teacher`);
    console.log('Request body:', req.body);

    // First check if the teacher exists
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      console.log(`Teacher not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Get the subjects from the request
    const { subjects } = req.body;
    if (!subjects || !Array.isArray(subjects)) {
      console.log('Invalid subjects array in request');
      return res.status(400).json({ message: 'Invalid subjects array' });
    }

    // Validate that all subjects exist
    for (const subjectId of subjects) {
      const subject = await Subject.findById(subjectId);
      if (!subject) {
        console.log(`Subject not found with ID: ${subjectId}`);
        return res.status(404).json({ message: `Subject not found with ID: ${subjectId}` });
      }
    }

    // Add subjects to the teacher
    // First, get existing subject IDs to avoid duplicates
    const existingSubjectIds = teacher.subjects
      ? teacher.subjects.map(s => typeof s === 'object' ? s._id.toString() : s.toString())
      : [];

    // Add new subjects
    for (const subjectId of subjects) {
      if (!existingSubjectIds.includes(subjectId.toString())) {
        teacher.subjects.push(subjectId);
      }
    }

    // Save the updated teacher
    await teacher.save();
    console.log(`Added subjects to teacher ${teacher.firstName} ${teacher.lastName}`);

    // Return the updated teacher with populated subjects
    const updatedTeacher = await Teacher.findById(req.params.id).populate('subjects');
    res.json(updatedTeacher);
  } catch (error) {
    console.error(`Error adding subjects to teacher ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to add subjects to teacher' });
  }
});

// Get subjects for a specific teacher
router.get('/:id/subjects', authenticateToken, async (req, res) => {
  try {
    console.log(`GET /api/teachers/${req.params.id}/subjects - Fetching subjects for teacher`);
    const teacherId = req.params.id;

    // First check if the teacher exists
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      console.log(`Teacher not found with ID: ${teacherId}`);
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Find all classes where this teacher is assigned to teach subjects
    const classes = await Class.find({
      'subjects.teacher': teacherId
    })
    .populate({
      path: 'subjects.subject',
      model: 'Subject',
      select: 'name code type description'
    });

    // Create a map to store unique subjects
    const subjectMap = {};

    // Collect all subjects from all classes
    for (const classObj of classes) {
      for (const subjectAssignment of classObj.subjects) {
        if (subjectAssignment.teacher &&
            subjectAssignment.teacher.toString() === teacherId &&
            subjectAssignment.subject) {

          const subjectId = subjectAssignment.subject._id.toString();

          // If this subject is not in the map yet, add it
          if (!subjectMap[subjectId]) {
            subjectMap[subjectId] = {
              _id: subjectAssignment.subject._id,
              name: subjectAssignment.subject.name,
              code: subjectAssignment.subject.code,
              type: subjectAssignment.subject.type,
              description: subjectAssignment.subject.description,
              classes: []
            };
          }

          // Add this class to the subject's classes
          subjectMap[subjectId].classes.push({
            _id: classObj._id,
            name: classObj.name,
            stream: classObj.stream,
            section: classObj.section
          });
        }
      }
    }

    // Convert the map to an array
    const subjects = Object.values(subjectMap);
    console.log(`Found ${subjects.length} unique subjects for teacher ${teacherId} across all classes`);

    // If no subjects found, return empty array
    if (subjects.length === 0) {
      console.log(`No subjects found for teacher ${teacherId}`);
      return res.json([]);
    }

    res.json(subjects);
  } catch (error) {
    console.error(`Error fetching subjects for teacher ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to fetch teacher subjects' });
  }
});

// Get assigned classes for the current teacher (for authorization)
router.get('/assigned-classes', authenticateToken, authorizeRole(['teacher', 'admin']), teacherAuthController.getAssignedClasses);

// Get simple assigned classes for the current teacher (for authorization)
router.get('/simple-classes', authenticateToken, authorizeRole(['teacher', 'admin']), teacherAuthController.getSimpleAssignedClasses);

// Get assigned subjects for the current teacher (for authorization)
router.get('/my-subjects', authenticateToken, authorizeRole(['teacher', 'admin']), teacherAuthController.getAssignedSubjectsForMarksEntry);

// Get assigned subjects for the current teacher (for marks entry - strict version)
router.get('/marks-entry-subjects', authenticateToken, authorizeRole(['teacher', 'admin']), teacherAuthController.getAssignedSubjects);

// Get assigned students for the current teacher (for authorization)
router.get('/classes/:classId/students', authenticateToken, authorizeRole(['teacher', 'admin']), teacherAuthController.getAssignedStudents);

// Get subjects for a specific student that the teacher is assigned to teach
router.get('/students/:studentId/subjects', authenticateToken, authorizeRole(['teacher', 'admin']), teacherAuthController.getAssignedSubjectsForStudent);

// Get subjects for the current teacher (original implementation)
router.get('/my-subjects-old', authenticateToken, authorizeRole(['teacher', 'admin']), async (req, res) => {
  try {
    console.log('GET /api/teachers/my-subjects - Fetching subjects for current teacher');
    const userId = req.user.userId;
    const { classId } = req.query;

    if (!userId) {
      console.log('No userId found in token');
      return res.status(400).json({ message: 'Invalid user token' });
    }

    // If user is admin, return all subjects
    if (req.user.role === 'admin') {
      console.log('User is admin, fetching all subjects');
      const subjects = await Subject.find().select('name code type description');
      return res.json(subjects);
    }

    // Find the teacher profile
    console.log('Looking for teacher with userId:', userId);
    let teacher = await Teacher.findOne({ userId });

    // If no teacher profile exists, create one automatically
    if (!teacher) {
      console.log('No teacher profile found for user:', userId, '- Creating one automatically');

      try {
        // Get user details
        const user = await User.findById(userId);
        if (!user) {
          console.log('User not found:', userId);
          return res.status(404).json({ message: 'User not found' });
        }

        // Generate a unique employee ID
        const employeeId = `TCH${Math.floor(1000 + Math.random() * 9000)}`;

        // Extract first and last name from username or email
        let firstName = 'Teacher';
        let lastName = user.username || '';

        if (user?.username?.includes('.')) {
          const nameParts = user.username.split('.');
          firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
          lastName = nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1);
        } else if (user?.email?.includes('@')) {
          firstName = user.email.split('@')[0];
        }

        // Create a basic teacher profile
        const newTeacher = new Teacher({
          userId: userId,
          firstName: firstName,
          lastName: lastName,
          email: user.email,
          qualification: 'Teacher',
          experience: '1 year',
          employeeId: employeeId,
          status: 'active'
        });

        teacher = await newTeacher.save();
        console.log(`Created teacher profile automatically: ${teacher._id}`);
      } catch (createError) {
        console.error('Error creating teacher profile automatically:', createError);
        return res.status(500).json({
          message: 'Failed to create teacher profile automatically',
          error: createError.message
        });
      }
    }

    // If classId is provided, find subjects for that specific class
    if (classId) {
      console.log(`Finding subjects for teacher ${teacher._id} in class ${classId}`);
      const classObj = await Class.findById(classId)
        .populate({
          path: 'subjects.subject',
          model: 'Subject',
          select: 'name code type description'
        });

      if (!classObj) {
        return res.status(404).json({ message: 'Class not found' });
      }

      // Filter subjects taught by this teacher in this class
      const teacherSubjects = [];
      for (const subjectAssignment of classObj.subjects) {
        if (subjectAssignment.teacher &&
            subjectAssignment.teacher.toString() === teacher._id.toString() &&
            subjectAssignment.subject) {

          teacherSubjects.push({
            _id: subjectAssignment.subject._id,
            name: subjectAssignment.subject.name,
            code: subjectAssignment.subject.code,
            type: subjectAssignment.subject.type,
            description: subjectAssignment.subject.description,
            classes: [{
              _id: classObj._id,
              name: classObj.name,
              stream: classObj.stream,
              section: classObj.section
            }]
          });
        }
      }

      // If no subjects found for this class, return all subjects as a fallback
      if (teacherSubjects.length === 0) {
        console.log('No subjects found for teacher in this class, returning all subjects as fallback');
        const allSubjects = await Subject.find().select('name code type description');
        return res.json(allSubjects);
      }

      console.log(`Found ${teacherSubjects.length} subjects for teacher ${teacher._id} in class ${classId}`);
      return res.json(teacherSubjects);
    }

    // If no classId, find all subjects across all classes
    console.log(`Finding all subjects for teacher ${teacher._id} across all classes`);
    const classes = await Class.find({
      'subjects.teacher': teacher._id
    })
    .populate({
      path: 'subjects.subject',
      model: 'Subject',
      select: 'name code type description'
    });

    // Create a map to store unique subjects with their classes
    const subjectMap = {};

    // Process each class
    for (const classObj of classes) {
      // Process each subject assignment in the class
      for (const subjectAssignment of classObj.subjects) {
        if (subjectAssignment.teacher &&
            subjectAssignment.teacher.toString() === teacher._id.toString() &&
            subjectAssignment.subject) {

          const subjectId = subjectAssignment.subject._id.toString();

          // If this subject is not in the map yet, add it
          if (!subjectMap[subjectId]) {
            subjectMap[subjectId] = {
              _id: subjectAssignment.subject._id,
              name: subjectAssignment.subject.name,
              code: subjectAssignment.subject.code,
              type: subjectAssignment.subject.type,
              description: subjectAssignment.subject.description,
              classes: []
            };
          }

          // Add this class to the subject's classes
          subjectMap[subjectId].classes.push({
            _id: classObj._id,
            name: classObj.name,
            stream: classObj.stream,
            section: classObj.section
          });
        }
      }
    }

    // Convert the map to an array
    const subjects = Object.values(subjectMap);
    console.log(`Found ${subjects.length} unique subjects for teacher ${teacher._id} across all classes`);

    // If no subjects found, return all subjects as a fallback
    if (subjects.length === 0) {
      console.log('No subjects found for teacher across all classes, returning all subjects as fallback');
      const allSubjects = await Subject.find().select('name code type description');
      return res.json(allSubjects);
    }

    res.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects for teacher:', error);
    res.status(500).json({
      message: 'Failed to fetch subjects',
      error: error.message
    });
  }
});

module.exports = router;
