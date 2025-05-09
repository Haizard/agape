/**
 * Enhanced Teacher Routes
 *
 * These routes use the enhanced teacher authentication middleware to provide
 * more robust handling of teacher-subject assignments.
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const enhancedTeacherAuth = require('../middleware/enhancedTeacherAuth');
const teacherAssignmentService = require('../services/teacherAssignmentService');
const enhancedTeacherSubjectService = require('../services/enhancedTeacherSubjectService');
const Teacher = require('../models/Teacher');

// Get all teachers (with optional status filter)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status; // Example: "active"
    }

    const teachers = await Teacher.find(filter);
    res.status(200).json(teachers);
  } catch (error) {
    console.error('Error in GET /api/teachers:', error);
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
});

// Check if a teacher is authorized to access a subject in a class
router.get('/check-subject-authorization',
  authenticateToken,
  authorizeRole(['teacher', 'admin']),
  enhancedTeacherAuth.ensureTeacherProfile,
  async (req, res) => {
    try {
      const { classId, subjectId } = req.query;
      const teacherId = req.teacher._id;

      if (!classId || !subjectId) {
        return res.status(400).json({
          success: false,
          message: 'Class ID and Subject ID are required',
          authorized: false
        });
      }

      // For admin users, always authorize
      if (req.user.role === 'admin') {
        return res.json({
          success: true,
          message: 'Admin user is authorized for all subjects',
          authorized: true
        });
      }

      // For all classes, use the strict check to ensure teachers only see subjects they're assigned to
      const isAuthorized = await enhancedTeacherSubjectService.isTeacherSpecificallyAssignedToSubject(
        teacherId,
        classId,
        subjectId,
        true // Enable strict assignment validation
      );

      console.log(`[EnhancedTeacherAuth] Authorization check for teacher ${teacherId}, class ${classId}, subject ${subjectId}: ${isAuthorized ? 'AUTHORIZED' : 'UNAUTHORIZED'}`);


      return res.json({
        success: true,
        message: isAuthorized ? 'Teacher is authorized for this subject' : 'Teacher is not authorized for this subject',
        authorized: isAuthorized
      });
    } catch (error) {
      console.error('Error checking subject authorization:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking subject authorization',
        error: error.message,
        authorized: false
      });
    }
  }
);

// Get the current teacher's profile
router.get('/profile',
  authenticateToken,
  authorizeRole(['teacher', 'admin']),
  enhancedTeacherAuth.ensureTeacherProfile,
  async (req, res) => {
    try {
      // The teacher profile is already attached to the request by the middleware
      res.json({
        success: true,
        teacher: {
          _id: req.teacher._id,
          firstName: req.teacher.firstName,
          lastName: req.teacher.lastName,
          email: req.teacher.email,
          employeeId: req.teacher.employeeId,
          subjects: req.teacher.subjects
        }
      });
    } catch (error) {
      console.error('Error fetching teacher profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch teacher profile',
        error: error.message
      });
    }
  }
);

// Get subjects for a specific class
router.get('/subjects/:classId',
  authenticateToken,
  authorizeRole(['teacher', 'admin']),
  enhancedTeacherAuth.ensureTeacherProfile,
  async (req, res) => {
    try {
      const { classId } = req.params;
      const teacherId = req.teacher._id;

      const subjects = await enhancedTeacherSubjectService.getAssignedSubjectsForClass(teacherId, classId);

      res.json({
        success: true,
        subjects
      });
    } catch (error) {
      console.error('Error fetching class subjects:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch class subjects',
        error: error.message
      });
    }
  });

// Get classes assigned to the current teacher
router.get('/classes',
  authenticateToken,
  authorizeRole(['teacher', 'admin']),
  enhancedTeacherAuth.ensureTeacherProfile,
  async (req, res) => {
    try {
      // The teacher profile is already attached to the request by the middleware
      const teacherId = req.teacher._id;

      // Find all classes where this teacher is assigned to teach subjects
      const Class = require('../models/Class');
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

      // For admin users, return all classes
      if (req.teacher.isAdmin && req.teacher.isTemporary) {
        console.log('Admin user, returning all classes');
        const allClassesForAdmin = await Class.find()
          .select('_id name section stream educationLevel')
          .sort({ name: 1 });

        res.json({
          success: true,
          classes: allClassesForAdmin
        });
        return;
      }

      console.log(`Returning ${allClasses.length} total classes for teacher ${teacherId}`);

      res.json({
        success: true,
        classes: allClasses
      });
    } catch (error) {
      console.error('Error fetching teacher classes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch teacher classes',
        error: error.message
      });
    }
  }
);

// Get subjects assigned to the current teacher in a specific class
router.get('/classes/:classId/subjects',
  authenticateToken,
  authorizeRole(['teacher', 'admin']),
  enhancedTeacherAuth.ensureTeacherProfile,
  enhancedTeacherAuth.getEnhancedTeacherSubjects, // Use the enhanced middleware
  async (req, res) => {
    try {
      // The teacher's subjects are already attached to the request by the middleware
      res.json({
        success: true,
        classId: req.params.classId,
        subjects: req.teacherSubjects
      });
    } catch (error) {
      console.error('Error fetching teacher subjects:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch teacher subjects',
        error: error.message
      });
    }
  }
);

// Get students in a class for a subject the teacher is assigned to
router.get('/classes/:classId/subjects/:subjectId/students',
  authenticateToken,
  authorizeRole(['teacher', 'admin']),
  enhancedTeacherAuth.ensureTeacherProfile,
  enhancedTeacherAuth.strictSubjectAccessControl,
  async (req, res) => {
    try {
      const { classId, subjectId } = req.params;
      const teacherId = req.teacher._id;

      console.log(`GET /api/enhanced-teachers/classes/${classId}/subjects/${subjectId}/students - Fetching students for teacher ${teacherId}`);

      // For admin users, return all students in the class
      if (req.teacher.isAdmin) {
        console.log(`Teacher ${teacherId} is an admin, returning all students in class ${classId}`);

        // Get all students in the class
        const Student = require('../models/Student');
        const students = await Student.find({ class: classId })
          .select('firstName lastName rollNumber gender educationLevel')
          .sort({ firstName: 1, lastName: 1 });

        console.log(`Found ${students.length} students in class ${classId} for admin user`);

        return res.json({
          success: true,
          classId,
          subjectId,
          students: students.map(student => ({
            _id: student._id,
            name: `${student.firstName} ${student.lastName}`,
            rollNumber: student.rollNumber,
            gender: student.gender,
            educationLevel: student.educationLevel
          }))
        });
      }

      // Get the class to check its education level
      const Class = require('../models/Class');
      const classObj = await Class.findById(classId);
      if (!classObj) {
        return res.status(404).json({
          success: false,
          message: 'Class not found'
        });
      }

      console.log(`Class ${classId} education level: ${classObj.educationLevel}`);

      // For O-Level classes, we'll be more permissive
      if (classObj.educationLevel === 'O_LEVEL') {
        console.log(`This is an O-Level class. Being more permissive with teacher assignments.`);

        // Check if the teacher is the class teacher
        if (classObj.classTeacher && classObj.classTeacher.toString() === teacherId.toString()) {
          console.log(`Teacher ${teacherId} is the class teacher for O-Level class ${classId}`);
        } else {
          console.log(`Teacher ${teacherId} is NOT the class teacher for O-Level class ${classId}`);
        }

        // Check if the teacher is assigned to any subject in the class
        let isAssignedToAnySubject = false;
        if (classObj.subjects && Array.isArray(classObj.subjects)) {
          for (const subjectAssignment of classObj.subjects) {
            if (subjectAssignment.teacher && subjectAssignment.teacher.toString() === teacherId.toString()) {
              isAssignedToAnySubject = true;
              console.log(`Teacher ${teacherId} is assigned to a subject in O-Level class ${classId}`);
              break;
            }
          }
        }

        if (!isAssignedToAnySubject) {
          console.log(`Teacher ${teacherId} is NOT assigned to any subject in O-Level class ${classId}`);
        }

        // For O-Level, we need to filter students based on subject selection
        const Student = require('../models/Student');
        const mongoose = require('mongoose');
        const Subject = mongoose.model('Subject');
        const StudentSubjectSelection = mongoose.model('StudentSubjectSelection');

        // Get all students in the class
        const students = await Student.find({ class: classId })
          .select('firstName lastName rollNumber gender educationLevel selectedSubjects')
          .sort({ firstName: 1, lastName: 1 });

        console.log(`Found ${students.length} students in O-Level class ${classId}`);

        // Check if this is a core subject
        const subject = await Subject.findById(subjectId);
        const isCoreSubject = subject && subject.type === 'CORE';

        let filteredStudents = [];

        if (isCoreSubject) {
          // If it's a core subject, all students take it
          console.log(`Subject ${subjectId} is a core subject, all students take it`);
          filteredStudents = students;
        } else {
          // If it's an optional subject, filter students who have selected it
          console.log(`Subject ${subjectId} is an optional subject, filtering students`);

          // Create a set of student IDs who take this subject
          const studentIdSet = new Set();

          // Method 1: Check the Student model's selectedSubjects field
          for (const student of students) {
            if (student.selectedSubjects && Array.isArray(student.selectedSubjects)) {
              const selectedSubjects = student.selectedSubjects.map(s => s.toString());
              if (selectedSubjects.includes(subjectId)) {
                studentIdSet.add(student._id.toString());
                console.log(`Student ${student._id} takes subject ${subjectId} (from Student model)`);
              }
            }
          }

          // Method 2: Check the StudentSubjectSelection model
          const studentIds = students.map(s => s._id);
          const selections = await StudentSubjectSelection.find({ student: { $in: studentIds } });

          for (const selection of selections) {
            const studentId = selection.student.toString();
            const coreSubjects = selection.coreSubjects.map(s => s.toString());
            const optionalSubjects = selection.optionalSubjects.map(s => s.toString());

            if (coreSubjects.includes(subjectId) || optionalSubjects.includes(subjectId)) {
              studentIdSet.add(studentId);
              console.log(`Student ${studentId} takes subject ${subjectId} (from StudentSubjectSelection model)`);
            }
          }

          // Filter students who take this subject
          filteredStudents = students.filter(student =>
            studentIdSet.has(student._id.toString()));
        }

        console.log(`Returning ${filteredStudents.length} students who take subject ${subjectId} in class ${classId}`);

        return res.json({
          success: true,
          classId,
          subjectId,
          students: filteredStudents.map(student => ({
            _id: student._id,
            name: `${student.firstName} ${student.lastName}`,
            rollNumber: student.rollNumber,
            gender: student.gender,
            educationLevel: student.educationLevel
          }))
        });
      }

      // For A-Level classes, check if the teacher is assigned to this specific subject
      const isAssigned = await enhancedTeacherSubjectService.isTeacherAssignedToSubject(
        teacherId,
        classId,
        subjectId
      );

      if (!isAssigned) {
        console.log(`Teacher ${teacherId} is not assigned to subject ${subjectId} in class ${classId}`);
        return res.status(403).json({
          success: false,
          message: 'You are not assigned to this subject in this class'
        });
      }

      console.log(`Teacher ${teacherId} is assigned to subject ${subjectId} in class ${classId}`);

      // Get students in this class
      const Student = require('../models/Student');
      console.log(`Querying students with class ID: ${classId}`);

      // Log the class ID format for debugging
      console.log(`Class ID type: ${typeof classId}, value: ${classId}`);

      // Count total students in the system
      const totalStudents = await Student.countDocuments();
      console.log(`Total students in the system: ${totalStudents}`);

      // Count students in this class
      const classStudentCount = await Student.countDocuments({ class: classId });
      console.log(`Students with class ID ${classId}: ${classStudentCount}`);

      // Get students in this class
      const students = await Student.find({ class: classId })
        .select('firstName lastName rollNumber gender educationLevel')
        .sort({ firstName: 1, lastName: 1 });

      console.log(`Found ${students.length} students in class ${classId}`);

      res.json({
        success: true,
        classId,
        subjectId,
        students: students.map(student => ({
          _id: student._id,
          name: `${student.firstName} ${student.lastName}`,
          rollNumber: student.rollNumber,
          gender: student.gender,
          educationLevel: student.educationLevel
        }))
      });
    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch students',
        error: error.message
      });
    }
  }
);

// Enter marks for a subject the teacher is assigned to
router.post('/classes/:classId/subjects/:subjectId/marks',
  authenticateToken,
  authorizeRole(['teacher', 'admin']),
  enhancedTeacherAuth.ensureTeacherProfile,
  enhancedTeacherAuth.strictSubjectAccessControl,
  async (req, res) => {
    try {
      const { classId, subjectId } = req.params;
      const { examId, marks } = req.body;
      const teacherId = req.teacher._id;

      // Check if the teacher is assigned to this subject in this class
      const isAssigned = await enhancedTeacherSubjectService.isTeacherAssignedToSubject(
        teacherId,
        classId,
        subjectId
      );

      if (!isAssigned && !req.teacher.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'You are not assigned to this subject in this class'
        });
      }

      if (!examId || !Array.isArray(marks)) {
        return res.status(400).json({
          success: false,
          message: 'Exam ID and marks array are required'
        });
      }

      // Get the exam
      const Exam = require('../models/Exam');
      const exam = await Exam.findById(examId);
      if (!exam) {
        return res.status(404).json({
          success: false,
          message: 'Exam not found'
        });
      }

      // Process marks
      const Result = require('../models/Result');
      const Student = require('../models/Student');
      const mongoose = require('mongoose');
      const Subject = mongoose.model('Subject');
      const StudentSubjectSelection = mongoose.model('StudentSubjectSelection');
      const savedResults = [];
      const skippedStudents = [];

      // Get the class to check if it's O-Level or A-Level
      const Class = require('../models/Class');
      const classObj = await Class.findById(classId);
      const isOLevelClass = classObj && classObj.educationLevel === 'O_LEVEL';

      // Get the subject to check if it's a core subject
      const subject = await Subject.findById(subjectId);
      const isCoreSubject = subject && subject.type === 'CORE';

      for (const mark of marks) {
        if (!mark.studentId || mark.marksObtained === undefined) {
          continue; // Skip invalid entries
        }

        // For O-Level classes with optional subjects, check if the student takes this subject
        if (isOLevelClass && !isCoreSubject) {
          // Get the student
          const student = await Student.findById(mark.studentId).select('selectedSubjects');

          // Check if student takes this subject
          let studentTakesSubject = false;

          // Method 1: Check the Student model's selectedSubjects field
          if (student && student.selectedSubjects && Array.isArray(student.selectedSubjects)) {
            const selectedSubjects = student.selectedSubjects.map(s => s.toString());
            if (selectedSubjects.includes(subjectId)) {
              studentTakesSubject = true;
              console.log(`Student ${mark.studentId} takes subject ${subjectId} (from Student model)`);
            }
          }

          // Method 2: Check the StudentSubjectSelection model
          if (!studentTakesSubject) {
            const selection = await StudentSubjectSelection.findOne({ student: mark.studentId });
            if (selection) {
              const coreSubjects = selection.coreSubjects.map(s => s.toString());
              const optionalSubjects = selection.optionalSubjects.map(s => s.toString());

              if (coreSubjects.includes(subjectId) || optionalSubjects.includes(subjectId)) {
                studentTakesSubject = true;
                console.log(`Student ${mark.studentId} takes subject ${subjectId} (from StudentSubjectSelection model)`);
              }
            }
          }

          // Skip this student if they don't take this subject
          if (!studentTakesSubject) {
            console.log(`Skipping marks entry for student ${mark.studentId} who doesn't take subject ${subjectId}`);
            skippedStudents.push({
              studentId: mark.studentId,
              reason: 'Student does not take this subject'
            });
            continue;
          }
        }

        // Calculate grade and points
        const grade = calculateGrade(Number(mark.marksObtained));
        const points = calculatePoints(grade);

        // Create or update result
        const result = await Result.findOneAndUpdate(
          {
            student: mark.studentId,
            exam: examId,
            subject: subjectId,
            class: classId
          },
          {
            marksObtained: Number(mark.marksObtained),
            grade,
            points,
            comment: mark.comment || '',
            educationLevel: mark.educationLevel || (isOLevelClass ? 'O_LEVEL' : 'A_LEVEL')
          },
          { upsert: true, new: true }
        );

        savedResults.push(result);
      }

      res.json({
        success: true,
        message: `Saved ${savedResults.length} results${skippedStudents.length > 0 ? `, skipped ${skippedStudents.length} students` : ''}`,
        results: savedResults,
        skippedStudents: skippedStudents.length > 0 ? skippedStudents : undefined
      });
    } catch (error) {
      console.error('Error saving marks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save marks',
        error: error.message
      });
    }
  }
);

// Helper function to calculate grade
function calculateGrade(marks) {
  if (marks >= 75) return 'A';
  if (marks >= 65) return 'B';
  if (marks >= 50) return 'C';
  if (marks >= 30) return 'D';
  return 'F';
}

// Helper function to calculate points
function calculatePoints(grade) {
  switch (grade) {
    case 'A': return 1;
    case 'B': return 2;
    case 'C': return 3;
    case 'D': return 4;
    case 'F': return 5;
    default: return 5;
  }
}

// New route specifically for O-Level marks entry
router.get('/o-level/classes/:classId/subjects',
  authenticateToken,
  authorizeRole(['teacher', 'admin']),
  enhancedTeacherAuth.ensureTeacherProfile,
  async (req, res) => {
    try {
      const { classId } = req.params;
      const { studentId } = req.query;

      console.log(`GET /api/enhanced-teachers/o-level/classes/${classId}/subjects - Getting subjects for class`);

      // Get the class to verify it exists and is O-Level
      const Class = require('../models/Class');
      const classObj = await Class.findById(classId);
      if (!classObj) {
        return res.status(404).json({
          success: false,
          message: 'Class not found'
        });
      }

      // Verify this is an O-Level class
      if (classObj.educationLevel !== 'O_LEVEL') {
        console.log(`Class ${classId} is not an O-Level class (${classObj.educationLevel})`);
        return res.status(400).json({
          success: false,
          message: 'This endpoint is only for O-Level classes'
        });
      }

      console.log(`Class ${classId} confirmed as O-Level class`);

      // For admin users, return all subjects in the class
      if (req.user.role === 'admin') {
        console.log(`User is admin, returning all subjects for class ${classId}`);

        const subjects = [];

        if (classObj.subjects && Array.isArray(classObj.subjects)) {
          for (const subjectAssignment of classObj.subjects) {
            if (subjectAssignment.subject) {
              // Get the subject details
              const Subject = require('../models/Subject');
              const subject = await Subject.findById(subjectAssignment.subject);

              if (subject) {
                subjects.push({
                  _id: subject._id,
                  name: subject.name,
                  code: subject.code,
                  type: subject.type,
                  description: subject.description,
                  educationLevel: subject.educationLevel || 'O_LEVEL',
                  isPrincipal: subject.isPrincipal || false,
                  isCompulsory: subject.isCompulsory || false
                });
              }
            }
          }
        }

        console.log(`Admin found ${subjects.length} subjects in O-Level class ${classId}`);

        return res.json({
          success: true,
          classId,
          subjects
        });
      }

      // For teachers, only return subjects they are assigned to teach
      console.log(`User is teacher, returning only assigned subjects for class ${classId}`);

      // Get the teacher ID from the authenticated user
      const teacherId = req.teacher._id;

      // Use the enhanced teacher subject service to get subjects
      const enhancedTeacherSubjectService = require('../services/enhancedTeacherSubjectService');
      const subjects = await enhancedTeacherSubjectService.getTeacherSubjects(
        teacherId,
        classId,
        false // Don't use cache
      );

      console.log(`Found ${subjects.length} subjects assigned to teacher ${teacherId} in class ${classId}`);

      // If studentId is provided, filter subjects to only those the student takes
      if (studentId) {
        console.log(`Filtering subjects for student ${studentId}`);

        // Get the student to verify they exist and are in this class
        const Student = require('../models/Student');
        const student = await Student.findOne({ _id: studentId, class: classId });
        if (!student) {
          return res.status(404).json({
            success: false,
            message: 'Student not found in this class'
          });
        }

        // For O-Level, we need to check which subjects the student takes
        const mongoose = require('mongoose');
        const Subject = mongoose.model('Subject');
        const StudentSubjectSelection = mongoose.model('StudentSubjectSelection');

        // Create a set of subject IDs the student takes
        const studentSubjectIds = new Set();

        // Method 1: Check the Student model's selectedSubjects field
        if (student.selectedSubjects && Array.isArray(student.selectedSubjects)) {
          for (const subjectId of student.selectedSubjects) {
            studentSubjectIds.add(subjectId.toString());
          }
        }

        // Method 2: Check the StudentSubjectSelection model
        const selection = await StudentSubjectSelection.findOne({ student: studentId });
        if (selection) {
          if (selection.coreSubjects && Array.isArray(selection.coreSubjects)) {
            for (const subjectId of selection.coreSubjects) {
              studentSubjectIds.add(subjectId.toString());
            }
          }
          if (selection.optionalSubjects && Array.isArray(selection.optionalSubjects)) {
            for (const subjectId of selection.optionalSubjects) {
              studentSubjectIds.add(subjectId.toString());
            }
          }
        }

        // Method 3: Add all core subjects
        for (const subject of subjects) {
          if (subject.type === 'CORE') {
            studentSubjectIds.add(subject._id.toString());
          }
        }

        // Filter subjects to only those the student takes
        const filteredSubjects = subjects.filter(subject =>
          studentSubjectIds.has(subject._id.toString()));

        console.log(`Found ${filteredSubjects.length} subjects for student ${studentId} out of ${subjects.length} assigned to teacher ${teacherId}`);

        return res.json({
          success: true,
          classId,
          studentId,
          subjects: filteredSubjects
        });
      }

      return res.json({
        success: true,
        classId,
        subjects
      });
    } catch (error) {
      console.error('Error getting subjects for class:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting subjects for class',
        error: error.message
      });
    }
  }
);

// Get students who take a specific subject in a class (for O-Level)
router.get('/o-level/classes/:classId/subject/:subjectId/students',
  authenticateToken,
  authorizeRole(['teacher', 'admin']),
  enhancedTeacherAuth.ensureTeacherProfile,
  enhancedTeacherAuth.strictSubjectAccessControl,
  async (req, res) => {
    try {
      const { classId, subjectId } = req.params;
      const teacherId = req.teacher._id;

      console.log(`[EnhancedTeacherRoutes] Getting students for teacher ${teacherId} in class ${classId} for subject ${subjectId}`);

      // Get all students in the class
      const Class = require('../models/Class');
      const Student = require('../models/Student');

      // Get students in this class
      const students = await Student.find({ class: classId })
        .select('_id firstName lastName rollNumber gender educationLevel selectedSubjects')
        .sort({ firstName: 1, lastName: 1 });

      if (!students || students.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No students found in this class'
        });
      }

      // Filter students who take this subject
      const mongoose = require('mongoose');
      const StudentSubjectSelection = mongoose.model('StudentSubjectSelection');
      const Subject = mongoose.model('Subject');

      // Check if this is a core subject
      const subject = await Subject.findById(subjectId);
      const isCoreSubject = subject && subject.type === 'CORE';

      let studentsWhoTakeSubject = [];

      if (isCoreSubject) {
        // If it's a core subject, all students take it
        console.log(`[EnhancedTeacherRoutes] Subject ${subjectId} is a core subject, all students take it`);
        studentsWhoTakeSubject = students;
      } else {
        // If it's an optional subject, filter students who have selected it
        console.log(`[EnhancedTeacherRoutes] Subject ${subjectId} is an optional subject, filtering students`);

        // Create a set of student IDs who take this subject
        const studentIdSet = new Set();

        // Method 1: Check the Student model's selectedSubjects field
        for (const student of students) {
          if (student.selectedSubjects && Array.isArray(student.selectedSubjects)) {
            const selectedSubjects = student.selectedSubjects.map(s => s.toString());
            if (selectedSubjects.includes(subjectId)) {
              studentIdSet.add(student._id.toString());
              console.log(`[EnhancedTeacherRoutes] Student ${student._id} takes subject ${subjectId} (from Student model)`);
            }
          }
        }

        // Method 2: Check the StudentSubjectSelection model
        // Get all student subject selections for this class
        const studentIds = students.map(s => s._id);
        const selections = await StudentSubjectSelection.find({ student: { $in: studentIds } });

        for (const selection of selections) {
          const studentId = selection.student.toString();
          const coreSubjects = selection.coreSubjects.map(s => s.toString());
          const optionalSubjects = selection.optionalSubjects.map(s => s.toString());

          if (coreSubjects.includes(subjectId) || optionalSubjects.includes(subjectId)) {
            studentIdSet.add(studentId);
            console.log(`[EnhancedTeacherRoutes] Student ${studentId} takes subject ${subjectId} (from StudentSubjectSelection model)`);
          }
        }

        // Filter students who take this subject
        studentsWhoTakeSubject = students.filter(student =>
          studentIdSet.has(student._id.toString()));

        console.log(`[EnhancedTeacherRoutes] Found ${studentsWhoTakeSubject.length} students who take subject ${subjectId}`);
      }

      // Return the filtered students
      return res.json({
        success: true,
        students: studentsWhoTakeSubject.map(student => ({
          _id: student._id,
          name: `${student.firstName} ${student.lastName}`,
          rollNumber: student.rollNumber,
          gender: student.gender,
          educationLevel: student.educationLevel
        }))
      });
    } catch (error) {
      console.error('[EnhancedTeacherRoutes] Error getting students:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get students',
        error: error.message
      });
    }
  }
);

// Direct endpoint to assign students to a class (for debugging)
router.post('/assign-students-to-class',
  authenticateToken,
  authorizeRole(['admin']),
  async (req, res) => {
    try {
      const { classId } = req.body;
      console.log(`POST /api/enhanced-teachers/assign-students-to-class - Assigning students to class ${classId}`);

      if (!classId) {
        return res.status(400).json({
          success: false,
          message: 'Class ID is required'
        });
      }

      // Get the class to verify it exists
      const Class = require('../models/Class');
      const classObj = await Class.findById(classId);
      if (!classObj) {
        return res.status(404).json({
          success: false,
          message: 'Class not found'
        });
      }

      console.log(`Class ${classId} found: ${classObj.name}, education level: ${classObj.educationLevel}`);

      // Get all unassigned students
      const Student = require('../models/Student');
      const unassignedStudents = await Student.find({ class: { $exists: false } });

      console.log(`Found ${unassignedStudents.length} unassigned students`);

      if (unassignedStudents.length === 0) {
        // If no unassigned students, get students with null class
        const nullClassStudents = await Student.find({ class: null });
        console.log(`Found ${nullClassStudents.length} students with null class`);

        // Assign these students to the class
        for (const student of nullClassStudents) {
          student.class = classId;
          await student.save();
        }

        return res.json({
          success: true,
          message: `Assigned ${nullClassStudents.length} students with null class to class ${classObj.name}`,
          students: nullClassStudents.map(s => ({ id: s._id, name: `${s.firstName} ${s.lastName}` }))
        });
      }

      // Assign unassigned students to the class
      for (const student of unassignedStudents) {
        student.class = classId;
        await student.save();
      }

      res.json({
        success: true,
        message: `Assigned ${unassignedStudents.length} unassigned students to class ${classObj.name}`,
        students: unassignedStudents.map(s => ({ id: s._id, name: `${s.firstName} ${s.lastName}` }))
      });
    } catch (error) {
      console.error('Error assigning students to class:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign students to class',
        error: error.message
      });
    }
  }
);

// Direct endpoint to check student-class assignments (for debugging)
router.get('/check-student-assignments',
  authenticateToken,
  authorizeRole(['teacher', 'admin']),
  async (req, res) => {
    try {
      console.log('GET /api/enhanced-teachers/check-student-assignments - Checking student-class assignments');

      // Get all classes
      const Class = require('../models/Class');
      const classes = await Class.find().select('_id name educationLevel');

      console.log(`Found ${classes.length} classes`);

      // Get all students
      const Student = require('../models/Student');
      const students = await Student.find().select('_id firstName lastName class');

      console.log(`Found ${students.length} students`);

      // Count students per class
      const studentsByClass = {};
      for (const student of students) {
        const classId = student.class ? student.class.toString() : 'unassigned';
        if (!studentsByClass[classId]) {
          studentsByClass[classId] = [];
        }
        studentsByClass[classId].push({
          _id: student._id,
          name: `${student.firstName} ${student.lastName}`
        });
      }

      // Prepare result
      const result = [];
      for (const classObj of classes) {
        const classId = classObj._id.toString();
        const classStudents = studentsByClass[classId] || [];
        result.push({
          classId,
          className: classObj.name,
          educationLevel: classObj.educationLevel,
          studentCount: classStudents.length,
          students: classStudents.slice(0, 5) // Just show the first 5 students
        });
      }

      // Add unassigned students
      if (studentsByClass['unassigned']) {
        result.push({
          classId: 'unassigned',
          className: 'Unassigned',
          educationLevel: 'N/A',
          studentCount: studentsByClass['unassigned'].length,
          students: studentsByClass['unassigned'].slice(0, 5) // Just show the first 5 students
        });
      }

      res.json({
        success: true,
        totalClasses: classes.length,
        totalStudents: students.length,
        classSummary: result
      });
    } catch (error) {
      console.error('Error checking student assignments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check student assignments',
        error: error.message
      });
    }
  }
);

// Direct endpoint for O-Level student retrieval with any subject
router.get('/o-level/classes/:classId/subjects/any/students',
  authenticateToken,
  authorizeRole(['teacher', 'admin']),
  enhancedTeacherAuth.ensureTeacherProfile,
  async (req, res) => {
    try {
      const { classId } = req.params;
      const teacherId = req.teacher._id;

      console.log(`GET /api/enhanced-teachers/o-level/classes/${classId}/subjects/any/students - O-Level specific endpoint for any subject`);

      // Get the class to verify it exists and is O-Level
      const Class = require('../models/Class');
      const classObj = await Class.findById(classId);
      if (!classObj) {
        return res.status(404).json({
          success: false,
          message: 'Class not found'
        });
      }

      // Verify this is an O-Level class
      if (classObj.educationLevel !== 'O_LEVEL') {
        console.log(`Class ${classId} is not an O-Level class (${classObj.educationLevel})`);
        return res.status(400).json({
          success: false,
          message: 'This endpoint is only for O-Level classes'
        });
      }

      console.log(`Class ${classId} confirmed as O-Level class`);

      // Get all students in the class - for O-Level we don't check subject assignments
      const Student = require('../models/Student');
      const students = await Student.find({ class: classId })
        .select('firstName lastName rollNumber gender educationLevel')
        .sort({ firstName: 1, lastName: 1 });

      console.log(`Found ${students.length} students in O-Level class ${classId} using direct O-Level endpoint for any subject`);

      res.json({
        success: true,
        classId,
        students: students.map(student => ({
          _id: student._id,
          name: `${student.firstName} ${student.lastName}`,
          firstName: student.firstName, // Add firstName for compatibility
          lastName: student.lastName, // Add lastName for compatibility
          studentName: `${student.firstName} ${student.lastName}`, // Add studentName for compatibility
          rollNumber: student.rollNumber,
          gender: student.gender,
          educationLevel: student.educationLevel
        }))
      });
    } catch (error) {
      console.error('Error fetching O-Level students:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch O-Level students',
        error: error.message
      });
    }
  }
);

// Direct endpoint for O-Level student retrieval
router.get('/o-level/classes/:classId/subjects/:subjectId/students',
  authenticateToken,
  authorizeRole(['teacher', 'admin']),
  enhancedTeacherAuth.ensureTeacherProfile,
  enhancedTeacherAuth.strictSubjectAccessControl,
  enhancedTeacherAuth.filterStudentsBySubjectSelection, // Add the middleware for filtering students
  async (req, res) => {
    try {
      const { classId, subjectId } = req.params;
      const teacherId = req.teacher._id;

      console.log(`GET /api/enhanced-teachers/o-level/classes/${classId}/subjects/${subjectId}/students - O-Level specific endpoint`);

      // Get the class to verify it exists and is O-Level
      const Class = require('../models/Class');
      const classObj = await Class.findById(classId);
      if (!classObj) {
        return res.status(404).json({
          success: false,
          message: 'Class not found'
        });
      }

      // Verify this is an O-Level class
      if (classObj.educationLevel !== 'O_LEVEL') {
        console.log(`Class ${classId} is not an O-Level class (${classObj.educationLevel})`);
        return res.status(400).json({
          success: false,
          message: 'This endpoint is only for O-Level classes'
        });
      }

      console.log(`Class ${classId} confirmed as O-Level class`);

      // Get all students in the class
      const Student = require('../models/Student');
      const students = await Student.find({ class: classId })
        .select('firstName lastName rollNumber gender educationLevel selectedSubjects')
        .sort({ firstName: 1, lastName: 1 });

      console.log(`Found ${students.length} students in O-Level class ${classId}`);

      // If we have filtered student IDs from the middleware, use them
      let filteredStudents = students;
      if (req.filteredStudentIds && Array.isArray(req.filteredStudentIds)) {
        console.log(`Using filtered student IDs from middleware: ${req.filteredStudentIds.length} students`);
        filteredStudents = students.filter(student =>
          req.filteredStudentIds.includes(student._id.toString()));
      }

      console.log(`Returning ${filteredStudents.length} students who take subject ${subjectId} in class ${classId}`);

      return res.json({
        success: true,
        classId,
        subjectId,
        students: filteredStudents.map(student => ({
          _id: student._id,
          name: `${student.firstName} ${student.lastName}`,
          firstName: student.firstName, // Add firstName for compatibility
          lastName: student.lastName, // Add lastName for compatibility
          studentName: `${student.firstName} ${student.lastName}`, // Add studentName for compatibility
          rollNumber: student.rollNumber,
          gender: student.gender || 'unknown',
          educationLevel: student.educationLevel || 'O_LEVEL'
        }))
      });
    } catch (error) {
      console.error('Error fetching O-Level students:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch O-Level students',
        error: error.message
      });
    }
  }
);

// Direct endpoint to get all students in a class (for debugging)
router.get('/class-students/:classId',
  authenticateToken,
  authorizeRole(['teacher', 'admin']),
  async (req, res) => {
    try {
      const { classId } = req.params;
      console.log(`GET /api/enhanced-teachers/class-students/${classId} - Direct endpoint to get all students in class`);

      // Get the class to verify it exists
      const Class = require('../models/Class');
      const classObj = await Class.findById(classId);
      if (!classObj) {
        return res.status(404).json({
          success: false,
          message: 'Class not found'
        });
      }

      console.log(`Class ${classId} found: ${classObj.name}, education level: ${classObj.educationLevel}`);

      // Get all students in the class
      const Student = require('../models/Student');
      const students = await Student.find({ class: classId })
        .select('firstName lastName rollNumber gender educationLevel')
        .sort({ firstName: 1, lastName: 1 });

      console.log(`Found ${students.length} students in class ${classId} using direct endpoint`);

      res.json({
        success: true,
        classId,
        className: classObj.name,
        educationLevel: classObj.educationLevel,
        studentCount: students.length,
        students: students.map(student => ({
          _id: student._id,
          name: `${student.firstName} ${student.lastName}`,
          firstName: student.firstName, // Add firstName for compatibility
          lastName: student.lastName, // Add lastName for compatibility
          studentName: `${student.firstName} ${student.lastName}`, // Add studentName for compatibility
          rollNumber: student.rollNumber,
          gender: student.gender,
          educationLevel: student.educationLevel
        }))
      });
    } catch (error) {
      console.error('Error fetching students directly:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch students directly',
        error: error.message
      });
    }
  }
);

// Diagnose and fix teacher assignments
router.post('/diagnose-and-fix',
  authenticateToken,
  authorizeRole(['teacher', 'admin']),
  enhancedTeacherAuth.ensureTeacherProfile,
  async (req, res) => {
    try {
      console.log('POST /api/enhanced-teachers/diagnose-and-fix - Diagnosing and fixing teacher assignments');

      // Get the teacher ID from the request
      const teacherId = req.teacher._id;
      const { classId } = req.body;

      if (!classId) {
        return res.status(400).json({
          success: false,
          message: 'Class ID is required'
        });
      }

      // Use the teacher assignment service to diagnose and fix assignments
      const teacherAssignmentService = require('../services/teacherAssignmentService');
      const result = await teacherAssignmentService.diagnoseAndFixTeacherAssignments(teacherId, classId);

      res.json(result);
    } catch (error) {
      console.error('Error diagnosing teacher assignments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to diagnose teacher assignments',
        error: error.message
      });
    }
  }
);

// Diagnostic endpoint to check student subject selections
router.get('/diagnose-student-subjects/:classId',
  authenticateToken,
  authorizeRole(['admin']),
  async (req, res) => {
    try {
      const { classId } = req.params;
      const { subjectId } = req.query;

      console.log(`GET /api/enhanced-teachers/diagnose-student-subjects/${classId} - Diagnosing student subject selections`);

      // Get the class
      const Class = require('../models/Class');
      const classObj = await Class.findById(classId);
      if (!classObj) {
        return res.status(404).json({
          success: false,
          message: 'Class not found'
        });
      }

      // Get all students in the class
      const Student = require('../models/Student');
      const students = await Student.find({ class: classId })
        .select('_id firstName lastName rollNumber gender educationLevel selectedSubjects')
        .sort({ firstName: 1, lastName: 1 });

      console.log(`Found ${students.length} students in class ${classId}`);

      // Get all subjects in the class
      const subjects = [];
      if (classObj.subjects && Array.isArray(classObj.subjects)) {
        for (const subjectAssignment of classObj.subjects) {
          if (subjectAssignment.subject) {
            const Subject = require('../models/Subject');
            const subject = await Subject.findById(subjectAssignment.subject);
            if (subject) {
              subjects.push({
                _id: subject._id,
                name: subject.name,
                code: subject.code,
                type: subject.type
              });
            }
          }
        }
      }

      console.log(`Found ${subjects.length} subjects in class ${classId}`);

      // Get student subject selections
      const mongoose = require('mongoose');
      const StudentSubjectSelection = mongoose.model('StudentSubjectSelection');
      const studentIds = students.map(s => s._id);
      const selections = await StudentSubjectSelection.find({ student: { $in: studentIds } });

      console.log(`Found ${selections.length} StudentSubjectSelection records`);

      // Create a map of student selections
      const studentSelections = {};
      for (const selection of selections) {
        const studentId = selection.student.toString();
        studentSelections[studentId] = {
          coreSubjects: selection.coreSubjects ? selection.coreSubjects.map(s => s.toString()) : [],
          optionalSubjects: selection.optionalSubjects ? selection.optionalSubjects.map(s => s.toString()) : []
        };
      }

      // Create a map of subject names
      const subjectNames = {};
      for (const subject of subjects) {
        subjectNames[subject._id.toString()] = `${subject.name} (${subject.code}) - ${subject.type}`;
      }

      // Create a detailed report
      const studentReport = [];
      for (const student of students) {
        const studentId = student._id.toString();
        const selection = studentSelections[studentId] || { coreSubjects: [], optionalSubjects: [] };

        // Get selected subjects from Student model
        const selectedSubjectsFromModel = student.selectedSubjects ?
          student.selectedSubjects.map(s => s.toString()) : [];

        // Check if this student takes the specified subject
        let takesSpecificSubject = false;
        if (subjectId) {
          const coreSubjects = selection.coreSubjects || [];
          const optionalSubjects = selection.optionalSubjects || [];
          takesSpecificSubject =
            coreSubjects.includes(subjectId) ||
            optionalSubjects.includes(subjectId) ||
            selectedSubjectsFromModel.includes(subjectId);
        }

        studentReport.push({
          _id: student._id,
          name: `${student.firstName} ${student.lastName}`,
          rollNumber: student.rollNumber,
          gender: student.gender,
          educationLevel: student.educationLevel,
          selectedSubjectsInModel: selectedSubjectsFromModel.map(s => subjectNames[s] || s),
          coreSubjects: selection.coreSubjects.map(s => subjectNames[s] || s),
          optionalSubjects: selection.optionalSubjects.map(s => subjectNames[s] || s),
          hasSelectionRecord: !!studentSelections[studentId],
          takesSpecificSubject: subjectId ? takesSpecificSubject : undefined
        });
      }

      // Return the report
      res.json({
        success: true,
        classId,
        className: classObj.name,
        educationLevel: classObj.educationLevel,
        studentCount: students.length,
        subjectCount: subjects.length,
        selectionRecordCount: selections.length,
        subjects: subjects.map(s => ({
          _id: s._id,
          name: s.name,
          code: s.code,
          type: s.type
        })),
        students: studentReport
      });
    } catch (error) {
      console.error('Error diagnosing student subject selections:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to diagnose student subject selections',
        error: error.message
      });
    }
  }
);

// Endpoint to assign a subject to students
router.post('/assign-subject-to-students',
  authenticateToken,
  authorizeRole(['admin']),
  async (req, res) => {
    try {
      const { classId, subjectId, studentIds } = req.body;

      console.log(`POST /api/enhanced-teachers/assign-subject-to-students - Assigning subject ${subjectId} to students in class ${classId}`);

      if (!classId || !subjectId || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Class ID, subject ID, and student IDs array are required'
        });
      }

      // Get the class
      const Class = require('../models/Class');
      const classObj = await Class.findById(classId);
      if (!classObj) {
        return res.status(404).json({
          success: false,
          message: 'Class not found'
        });
      }

      // Get the subject
      const Subject = require('../models/Subject');
      const subject = await Subject.findById(subjectId);
      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
      }

      console.log(`Assigning subject ${subject.name} (${subject.code}) to ${studentIds.length} students`);

      // Get the students
      const Student = require('../models/Student');
      const students = await Student.find({ _id: { $in: studentIds }, class: classId });

      if (students.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No matching students found in the specified class'
        });
      }

      console.log(`Found ${students.length} matching students in class ${classId}`);

      // Get the StudentSubjectSelection model
      const mongoose = require('mongoose');
      const StudentSubjectSelection = mongoose.model('StudentSubjectSelection');

      // Process each student
      const results = [];
      for (const student of students) {
        // Update the Student model's selectedSubjects field
        if (!student.selectedSubjects) {
          student.selectedSubjects = [];
        }

        // Check if the subject is already in the selectedSubjects array
        const selectedSubjects = student.selectedSubjects.map(s => s.toString());
        if (!selectedSubjects.includes(subjectId)) {
          student.selectedSubjects.push(subjectId);
          await student.save();
          console.log(`Added subject ${subjectId} to Student ${student._id} (${student.firstName} ${student.lastName}) selectedSubjects`);
        }

        // Update or create a StudentSubjectSelection record
        let selection = await StudentSubjectSelection.findOne({ student: student._id });

        if (!selection) {
          // Create a new selection record
          selection = new StudentSubjectSelection({
            student: student._id,
            coreSubjects: subject.type === 'CORE' ? [subjectId] : [],
            optionalSubjects: subject.type !== 'CORE' ? [subjectId] : []
          });
          await selection.save();
          console.log(`Created new StudentSubjectSelection for Student ${student._id} (${student.firstName} ${student.lastName})`);
        } else {
          // Update the existing selection record
          if (subject.type === 'CORE') {
            // Add to core subjects if not already there
            const coreSubjects = selection.coreSubjects.map(s => s.toString());
            if (!coreSubjects.includes(subjectId)) {
              selection.coreSubjects.push(subjectId);
              await selection.save();
              console.log(`Added subject ${subjectId} to Student ${student._id} (${student.firstName} ${student.lastName}) coreSubjects`);
            }
          } else {
            // Add to optional subjects if not already there
            const optionalSubjects = selection.optionalSubjects.map(s => s.toString());
            if (!optionalSubjects.includes(subjectId)) {
              selection.optionalSubjects.push(subjectId);
              await selection.save();
              console.log(`Added subject ${subjectId} to Student ${student._id} (${student.firstName} ${student.lastName}) optionalSubjects`);
            }
          }
        }

        results.push({
          _id: student._id,
          name: `${student.firstName} ${student.lastName}`,
          success: true
        });
      }

      res.json({
        success: true,
        message: `Assigned subject ${subject.name} (${subject.code}) to ${results.length} students`,
        classId,
        subjectId,
        subjectName: subject.name,
        subjectCode: subject.code,
        subjectType: subject.type,
        studentsProcessed: results
      });
    } catch (error) {
      console.error('Error assigning subject to students:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign subject to students',
        error: error.message
      });
    }
  }
);

module.exports = router;
