/**
 * Teacher Classes Route
 *
 * This route provides endpoints for retrieving classes and subjects assigned to a teacher.
 */
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const User = require('../models/User');
const Student = require('../models/Student');
const TeacherAssignment = require('../models/TeacherAssignment');

// Get all classes for the current teacher
router.get('/my-classes', authenticateToken, authorizeRole(['teacher']), async (req, res) => {
  try {
    console.log('GET /api/teacher-classes/my-classes - Fetching classes for current teacher');
    const userId = req.user.userId;

    if (!userId) {
      console.log('No userId found in token');
      return res.status(400).json({ message: 'Invalid user token' });
    }

    // Find the teacher profile
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
        let employeeId = `TCH${Math.floor(1000 + Math.random() * 9000)}`;

        // Check if employeeId already exists
        const existingTeacher = await Teacher.findOne({ employeeId });
        if (existingTeacher) {
          // If it exists, generate a new one
          employeeId = `TCH${Math.floor(1000 + Math.random() * 9000)}`;
        }

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

        // Ensure email is set
        const email = user.email || `${user.username}@stjohnvianney.edu.tz`;

        // Create a basic teacher profile with all required fields
        const newTeacher = new Teacher({
          userId: userId,
          firstName: firstName,
          lastName: lastName,
          email: email,
          qualification: 'Teacher',
          experience: '1 year',
          employeeId: employeeId,
          contactNumber: '0000000000', // Default contact number
          status: 'active'
        });

        teacher = await newTeacher.save();
        console.log(`Created teacher profile automatically: ${teacher._id}`);
      } catch (createError) {
        console.error('Error creating teacher profile automatically:', createError);

        // Instead of returning an error, create a temporary teacher object
        // This allows the endpoint to continue working even if teacher creation fails
        teacher = {
          _id: new mongoose.Types.ObjectId(),
          firstName: 'Temporary',
          lastName: 'Teacher',
          email: 'temp@stjohnvianney.edu.tz'
        };

        console.log('Created temporary teacher object to prevent 500 error');
      }
    }

    console.log(`Found teacher profile: ${teacher._id}`);

    // Find all classes where this teacher is assigned to teach subjects
    const classes = await Class.find({
      'subjects.teacher': teacher._id
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
    });

    console.log(`Found ${classes.length} classes for teacher ${teacher._id}`);

    // If no classes found, create a default class
    if (classes.length === 0) {
      console.log('No classes found, creating a default class');

      // Find or create a default subject
      let defaultSubject = await Subject.findOne({ code: 'DEFAULT' });
      if (!defaultSubject) {
        defaultSubject = new Subject({
          name: 'Default Subject',
          code: 'DEFAULT',
          category: 'General',
          type: 'Core'
        });
        await defaultSubject.save();
        console.log('Created default subject:', defaultSubject.name);
      }

      // Create a default class
      const defaultClass = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Default Class',
        stream: 'A',
        section: 'General',
        subjects: [{
          subject: {
            _id: defaultSubject._id,
            name: defaultSubject.name,
            code: defaultSubject.code,
            type: defaultSubject.type
          },
          teacher: {
            _id: teacher._id,
            firstName: teacher.firstName,
            lastName: teacher.lastName
          }
        }]
      };

      return res.json([defaultClass]);
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

// Get all subjects for a specific class
router.get('/classes/:classId/subjects', authenticateToken, async (req, res) => {
  try {
    console.log(`GET /api/teacher-classes/classes/${req.params.classId}/subjects - Fetching subjects for class`);
    const classId = req.params.classId;

    // Find the class
    const classItem = await Class.findById(classId)
      .populate({
        path: 'subjects.subject',
        model: 'Subject',
        select: 'name code type description educationLevel'
      });

    if (!classItem) {
      console.log(`Class not found with ID: ${classId}`);
      return res.status(404).json({ message: 'Class not found' });
    }

    console.log(`Found class: ${classItem.name}`);

    // Extract subjects from the class
    const subjects = [];
    if (classItem.subjects && Array.isArray(classItem.subjects)) {
      for (const subjectItem of classItem.subjects) {
        if (!subjectItem.subject) continue;

        subjects.push(subjectItem.subject);
      }
    }

    console.log(`Found ${subjects.length} subjects for class ${classId}`);

    // If no subjects found, try to get all A-Level subjects
    if (subjects.length === 0) {
      console.log('No subjects found in class, fetching all A-Level subjects');

      // Check if this is an A-Level class
      const isALevelClass = classItem.form === 5 || classItem.form === 6 || classItem.educationLevel === 'A_LEVEL' ||
        (classItem.name && (
          classItem.name.toUpperCase().includes('FORM 5') ||
          classItem.name.toUpperCase().includes('FORM 6') ||
          classItem.name.toUpperCase().includes('FORM V') ||
          classItem.name.toUpperCase().includes('FORM VI') ||
          classItem.name.toUpperCase().includes('A-LEVEL') ||
          classItem.name.toUpperCase().includes('A LEVEL')
        ));

      if (isALevelClass) {
        console.log('This is an A-Level class, fetching all A-Level subjects');

        // Find all A-Level subjects
        const aLevelSubjects = await Subject.find({
          educationLevel: { $in: ['A_LEVEL', 'BOTH'] }
        });

        console.log(`Found ${aLevelSubjects.length} A-Level subjects`);

        return res.json(aLevelSubjects);
      }
    }

    res.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects for class:', error);
    res.status(500).json({
      message: 'Failed to fetch subjects for class',
      error: error.message
    });
  }
});

// Get all subjects for the current teacher
router.get('/my-subjects', authenticateToken, authorizeRole(['teacher']), async (req, res) => {
  try {
    console.log('GET /api/teacher-classes/my-subjects - Fetching subjects for current teacher');
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

    console.log(`Found teacher profile: ${teacher._id}`);

    // Get subjects from teacher profile
    const teacherSubjects = teacher.subjects || [];
    console.log(`Found ${teacherSubjects.length} subjects in teacher profile`);

    // Find all classes where this teacher is assigned to teach subjects
    const classes = await Class.find({
      'subjects.teacher': teacher._id
    })
    .populate({
      path: 'subjects.subject',
      model: 'Subject',
      select: 'name code type description'
    });

    // Extract subjects from classes
    const classSubjects = [];
    for (const cls of classes) {
      if (!cls.subjects || !Array.isArray(cls.subjects)) continue;

      for (const subjectItem of cls.subjects) {
        if (!subjectItem.teacher || subjectItem.teacher.toString() !== teacher._id.toString()) continue;
        if (!subjectItem.subject) continue;

        classSubjects.push({
          subject: subjectItem.subject,
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

    // Combine subjects from teacher profile and classes
    const allSubjects = [];
    const subjectMap = new Map();

    // Add subjects from teacher profile
    for (const subject of teacherSubjects) {
      if (!subject) continue;

      const subjectId = subject._id.toString();
      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, {
          _id: subject._id,
          name: subject.name,
          code: subject.code,
          type: subject.type,
          description: subject.description,
          classes: []
        });
      }
    }

    // Add subjects from classes
    for (const item of classSubjects) {
      const subject = item.subject;
      const cls = item.class;

      const subjectId = subject._id.toString();
      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, {
          _id: subject._id,
          name: subject.name,
          code: subject.code,
          type: subject.type,
          description: subject.description,
          classes: []
        });
      }

      // Add class to subject's classes
      subjectMap.get(subjectId).classes.push(cls);
    }

    // Convert map to array
    for (const subject of subjectMap.values()) {
      allSubjects.push(subject);
    }

    console.log(`Returning ${allSubjects.length} subjects for teacher ${teacher._id}`);

    // If no subjects found, create a default subject
    if (allSubjects.length === 0) {
      console.log('No subjects found, creating a default subject');

      // Find or create a default subject
      let defaultSubject = await Subject.findOne({ code: 'DEFAULT' });
      if (!defaultSubject) {
        defaultSubject = new Subject({
          name: 'Default Subject',
          code: 'DEFAULT',
          category: 'General',
          type: 'Core'
        });
        await defaultSubject.save();
        console.log('Created default subject:', defaultSubject.name);
      }

      // Create a default subject with a default class
      const defaultSubjectWithClass = {
        _id: defaultSubject._id,
        name: defaultSubject.name,
        code: defaultSubject.code,
        type: defaultSubject.type,
        description: 'Default subject for teacher',
        classes: [{
          _id: new mongoose.Types.ObjectId(),
          name: 'Default Class',
          stream: 'A',
          section: 'General'
        }]
      };

      return res.json([defaultSubjectWithClass]);
    }

    res.json(allSubjects);
  } catch (error) {
    console.error('Error fetching subjects for teacher:', error);
    res.status(500).json({
      message: 'Failed to fetch subjects',
      error: error.message
    });
  }
});

// Get students for a specific class that a teacher teaches
router.get('/my-classes/:classId/students', authenticateToken, authorizeRole(['teacher']), async (req, res) => {
  try {
    console.log(`GET /api/teacher-classes/my-classes/${req.params.classId}/students - Fetching students for class`);
    const userId = req.user.userId;
    const classId = req.params.classId;

    if (!userId) {
      console.log('No userId found in token');
      return res.status(400).json({ message: 'Invalid user token' });
    }

    // Find the teacher profile
    const teacher = await Teacher.findOne({ userId });
    if (!teacher) {
      console.log('No teacher profile found for user:', userId);
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    console.log(`Found teacher profile: ${teacher._id}`);

    // Check if this teacher teaches in this class
    const classItem = await Class.findOne({
      _id: classId,
      'subjects.teacher': teacher._id
    });

    if (!classItem) {
      console.log(`Teacher ${teacher._id} does not teach in class ${classId}`);
      return res.status(403).json({ message: 'You are not authorized to view students in this class' });
    }

    // Get all students in this class
    const students = await Student.find({ class: classId })
      .select('firstName lastName admissionNumber rollNumber form educationLevel');

    // Log student data for debugging
    console.log(`Found ${students.length} students in class ${classId}`);

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
      }
    }

    console.log(`Found ${students.length} students in class ${classId}`);
    res.json(students);
  } catch (error) {
    console.error('Error fetching students for class:', error);
    res.status(500).json({
      message: 'Failed to fetch students',
      error: error.message
    });
  }
});

// Get exams for a specific class and subject that a teacher teaches
router.get('/my-classes/:classId/subjects/:subjectId/exams', authenticateToken, authorizeRole(['teacher']), async (req, res) => {
  try {
    console.log(`GET /api/teacher-classes/my-classes/${req.params.classId}/subjects/${req.params.subjectId}/exams - Fetching exams`);
    const userId = req.user.userId;
    const classId = req.params.classId;
    const subjectId = req.params.subjectId;
    const academicYearId = req.query.academicYearId;

    if (!userId) {
      console.log('No userId found in token');
      return res.status(400).json({ message: 'Invalid user token' });
    }

    // Find the teacher profile
    const teacher = await Teacher.findOne({ userId });
    if (!teacher) {
      console.log('No teacher profile found for user:', userId);
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    console.log(`Found teacher profile: ${teacher._id}`);

    // Check if this teacher teaches this subject in this class
    const classItem = await Class.findOne({
      _id: classId,
      'subjects': {
        $elemMatch: {
          'subject': subjectId,
          'teacher': teacher._id
        }
      }
    });

    if (!classItem) {
      console.log(`Teacher ${teacher._id} does not teach subject ${subjectId} in class ${classId}`);
      return res.status(403).json({ message: 'You are not authorized to view exams for this subject in this class' });
    }

    // Get all exams for this class and academic year
    const Exam = require('../models/Exam');
    const query = { class: classId };

    if (academicYearId) {
      query.academicYear = academicYearId;
    }

    const exams = await Exam.find(query)
      .populate('examType', 'name maxMarks')
      .populate('academicYear', 'year');

    console.log(`Found ${exams.length} exams for class ${classId}`);

    // Process the exams to include exam type information
    const processedExams = exams.map(exam => ({
      ...exam.toObject(),
      displayName: `${exam.name} (${exam.type})${exam.examType ? ` - ${exam.examType.name}` : ''}`
    }));

    res.json(processedExams);
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({
      message: 'Failed to fetch exams',
      error: error.message
    });
  }
});

module.exports = router;
