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

        // For O-Level, we'll return all students regardless of specific subject assignment
        // This matches how A-Level works in practice
        const Student = require('../models/Student');
        const students = await Student.find({ class: classId })
          .select('firstName lastName rollNumber gender educationLevel')
          .sort({ firstName: 1, lastName: 1 });

        console.log(`Found ${students.length} students in O-Level class ${classId}`);

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
      const savedResults = [];

      for (const mark of marks) {
        if (!mark.studentId || mark.marksObtained === undefined) {
          continue; // Skip invalid entries
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
            educationLevel: mark.educationLevel || 'O_LEVEL'
          },
          { upsert: true, new: true }
        );

        savedResults.push(result);
      }

      res.json({
        success: true,
        message: `Saved ${savedResults.length} results`,
        results: savedResults
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
  enhancedTeacherAuth.getEnhancedTeacherSubjects, // Use the enhanced middleware
  async (req, res) => {
    try {
      // The teacher's subjects are already attached to the request by the middleware
      res.json({
        success: true,
        classId: req.params.classId,
        subjects: req.teacherSubjects,
        educationLevel: 'O_LEVEL'
      });
    } catch (error) {
      console.error('Error fetching O-Level teacher subjects:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch O-Level teacher subjects',
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

      // Get all students in the class - for O-Level we don't check subject assignments
      const Student = require('../models/Student');
      const students = await Student.find({ class: classId })
        .select('firstName lastName rollNumber gender educationLevel')
        .sort({ firstName: 1, lastName: 1 });

      console.log(`Found ${students.length} students in O-Level class ${classId} using direct O-Level endpoint`);

      res.json({
        success: true,
        classId,
        subjectId,
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

module.exports = router;
