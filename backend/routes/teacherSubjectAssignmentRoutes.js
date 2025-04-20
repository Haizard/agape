/**
 * Teacher Subject Assignment Routes
 *
 * These routes handle the assignment of teachers to subjects in classes.
 */

const express = require('express');
const router = express.Router();
// Import from the correct middleware file
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const TeacherSubject = require('../models/TeacherSubject');
const TeacherAssignment = require('../models/TeacherAssignment');
const TeacherClass = require('../models/TeacherClass');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');

/**
 * @route GET /api/teacher-subject-assignments
 * @desc Get teacher-subject assignments
 * @access Private (Teacher, Admin)
 */
router.get('/',
  authenticateToken,
  (req, res, next) => {
    // Custom middleware to authorize multiple roles
    console.log('Authorizing roles: teacher, admin');
    console.log('User role:', req.user?.role);

    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({
        message: `Access denied. Required roles: teacher, admin. User role: ${req.user.role}`
      });
    }

    next();
  },
  async (req, res) => {
    console.log('\n\n[DEBUG] GET /api/teacher-subject-assignments - Request received');
    console.log('[DEBUG] Query params:', req.query);
    console.log('[DEBUG] User role:', req.user.role);
    console.log('[DEBUG] User ID:', req.user.userId);
    try {
      const { teacherId, classId, subjectId } = req.query;

      // Build query
      const query = {};
      if (teacherId) query.teacherId = teacherId;
      if (classId) query.classId = classId;
      if (subjectId) query.subjectId = subjectId;

      console.log(`GET /api/teacher-subject-assignments - Query:`, query);

      // Method 1: Check TeacherSubject model
      const teacherSubjectAssignments = await TeacherSubject.find(query)
        .populate('teacherId', 'firstName lastName')
        .populate('subjectId', 'name code type')
        .populate('classId', 'name section stream');

      console.log(`Found ${teacherSubjectAssignments.length} assignments in TeacherSubject model`);

      // Method 2: Check TeacherAssignment model
      const teacherAssignmentQuery = {};
      if (teacherId) teacherAssignmentQuery.teacher = teacherId;
      if (classId) teacherAssignmentQuery.class = classId;
      if (subjectId) teacherAssignmentQuery.subject = subjectId;

      let teacherAssignments = [];
      try {
        teacherAssignments = await TeacherAssignment.find(teacherAssignmentQuery)
          .populate('teacher', 'firstName lastName')
          .populate('subject', 'name code type')
          .populate('class', 'name section stream');

        console.log(`Found ${teacherAssignments.length} assignments in TeacherAssignment model`);
      } catch (err) {
        console.log('TeacherAssignment model might not exist:', err.message);
      }

      // Method 3: Check Class.subjects
      let classSubjectAssignments = [];
      if (classId) {
        const classObj = await Class.findById(classId)
          .populate('subjects.subject', 'name code type')
          .populate('subjects.teacher', 'firstName lastName');

        if (classObj && classObj.subjects && Array.isArray(classObj.subjects)) {
          classSubjectAssignments = classObj.subjects
            .filter(assignment => {
              // Filter by teacherId if provided
              if (teacherId && (!assignment.teacher || assignment.teacher._id.toString() !== teacherId.toString())) {
                return false;
              }

              // Filter by subjectId if provided
              if (subjectId && (!assignment.subject || assignment.subject._id.toString() !== subjectId.toString())) {
                return false;
              }

              return true;
            })
            .map(assignment => ({
              _id: `class-${classId}-subject-${assignment.subject?._id}-teacher-${assignment.teacher?._id}`,
              teacherId: assignment.teacher,
              subjectId: assignment.subject,
              classId: {
                _id: classObj._id,
                name: classObj.name,
                section: classObj.section,
                stream: classObj.stream
              },
              source: 'Class.subjects'
            }));
        }
      }

      console.log(`Found ${classSubjectAssignments.length} assignments in Class.subjects`);

      // Method 4: Check TeacherClass model
      let teacherClassAssignments = [];
      if (teacherId) {
        const teacherClasses = await TeacherClass.find({ teacherId })
          .populate('subjects');

        // Extract subject assignments from teacher classes
        teacherClasses.forEach(tc => {
          if (tc.subjects && tc.subjects.length > 0 && (!classId || tc.classId.toString() === classId)) {
            tc.subjects.forEach(subject => {
              if (!subjectId || subject._id.toString() === subjectId) {
                teacherClassAssignments.push({
                  _id: `teacher-class-${tc._id}-subject-${subject._id}`,
                  teacherId: {
                    _id: teacherId
                  },
                  subjectId: {
                    _id: subject._id,
                    name: subject.name,
                    code: subject.code
                  },
                  classId: {
                    _id: tc.classId
                  },
                  source: 'TeacherClass'
                });
              }
            });
          }
        });
      }

      console.log(`Found ${teacherClassAssignments.length} assignments in TeacherClass model`);

      // Combine all assignments
      const allAssignments = [
        ...teacherSubjectAssignments.map(a => ({
          ...a.toObject(),
          source: 'TeacherSubject'
        })),
        ...teacherAssignments.map(a => ({
          _id: a._id,
          teacherId: a.teacher,
          subjectId: a.subject,
          classId: a.class,
          source: 'TeacherAssignment'
        })),
        ...classSubjectAssignments,
        ...teacherClassAssignments
      ];

      console.log(`[DEBUG] Returning ${allAssignments.length} total assignments`);

      // Log the first few assignments for debugging
      if (allAssignments.length > 0) {
        console.log('[DEBUG] First assignment:', JSON.stringify(allAssignments[0], null, 2));
      }

      if (allAssignments.length === 0) {
        console.log('[DEBUG] WARNING: No assignments found for the given query parameters');
      }

      res.json(allAssignments);
    } catch (error) {
      console.error('Error fetching teacher-subject assignments:', error);
      res.status(500).json({
        message: 'Server error',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/teacher-subject-assignments
 * @desc Create a teacher-subject assignment
 * @access Private (Admin)
 */
router.post('/',
  authenticateToken,
  (req, res, next) => {
    // Custom middleware to authorize admin role
    console.log('Authorizing role: admin');
    console.log('User role:', req.user?.role);

    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: `Access denied. Required role: admin. User role: ${req.user.role}`
      });
    }

    next();
  },
  async (req, res) => {
    try {
      const { teacherId, subjectId, classId, assignmentType } = req.body;

      // Validate required fields
      if (!teacherId || !subjectId || !classId) {
        return res.status(400).json({
          message: 'Teacher ID, Subject ID, and Class ID are required'
        });
      }

      // Check if teacher, subject, and class exist
      const [teacher, subject, classObj] = await Promise.all([
        Teacher.findById(teacherId),
        Subject.findById(subjectId),
        Class.findById(classId)
      ]);

      if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found' });
      }

      if (!subject) {
        return res.status(404).json({ message: 'Subject not found' });
      }

      if (!classObj) {
        return res.status(404).json({ message: 'Class not found' });
      }

      // Determine which model to use based on assignmentType
      if (assignmentType === 'class') {
        // Update Class.subjects
        const subjectIndex = classObj.subjects.findIndex(s =>
          s.subject && s.subject.toString() === subjectId
        );

        if (subjectIndex >= 0) {
          // Update existing subject assignment
          classObj.subjects[subjectIndex].teacher = teacherId;
        } else {
          // Add new subject assignment
          classObj.subjects.push({
            subject: subjectId,
            teacher: teacherId
          });
        }

        await classObj.save();

        res.status(201).json({
          message: 'Teacher assigned to subject in class',
          assignment: {
            teacherId,
            subjectId,
            classId,
            source: 'Class.subjects'
          }
        });
      } else {
        // Use TeacherSubject model (default)
        // Check if assignment already exists
        const existingAssignment = await TeacherSubject.findOne({
          teacherId,
          subjectId,
          classId
        });

        if (existingAssignment) {
          // Update existing assignment
          existingAssignment.status = 'active';
          await existingAssignment.save();

          res.json({
            message: 'Teacher-subject assignment updated',
            assignment: existingAssignment
          });
        } else {
          // Create new assignment
          const newAssignment = new TeacherSubject({
            teacherId,
            subjectId,
            classId,
            status: 'active'
          });

          await newAssignment.save();

          res.status(201).json({
            message: 'Teacher-subject assignment created',
            assignment: newAssignment
          });
        }
      }
    } catch (error) {
      console.error('Error creating teacher-subject assignment:', error);
      res.status(500).json({
        message: 'Server error',
        error: error.message
      });
    }
  }
);

/**
 * @route DELETE /api/teacher-subject-assignments/:id
 * @desc Delete a teacher-subject assignment
 * @access Private (Admin)
 */
router.delete('/:id',
  authenticateToken,
  (req, res, next) => {
    // Custom middleware to authorize admin role
    console.log('Authorizing role: admin');
    console.log('User role:', req.user?.role);

    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: `Access denied. Required role: admin. User role: ${req.user.role}`
      });
    }

    next();
  },
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check if this is a Class.subjects assignment
      if (id.startsWith('class-')) {
        // Parse the ID to get classId, subjectId, and teacherId
        const parts = id.split('-');
        const classId = parts[1];
        const subjectId = parts[3];

        // Update the class to remove the teacher from this subject
        const classObj = await Class.findById(classId);

        if (!classObj) {
          return res.status(404).json({ message: 'Class not found' });
        }

        const subjectIndex = classObj.subjects.findIndex(s =>
          s.subject && s.subject.toString() === subjectId
        );

        if (subjectIndex >= 0) {
          // Remove teacher from this subject
          classObj.subjects[subjectIndex].teacher = null;
          await classObj.save();

          res.json({
            message: 'Teacher removed from subject in class',
            assignment: {
              classId,
              subjectId,
              source: 'Class.subjects'
            }
          });
        } else {
          res.status(404).json({ message: 'Subject not found in class' });
        }
      } else if (id.startsWith('teacher-class-')) {
        // Handle TeacherClass assignments
        const parts = id.split('-');
        const teacherClassId = parts[2];
        const subjectId = parts[4];

        const teacherClass = await TeacherClass.findById(teacherClassId);

        if (!teacherClass) {
          return res.status(404).json({ message: 'Teacher class not found' });
        }

        // Remove the subject from the teacher's subjects
        teacherClass.subjects = teacherClass.subjects.filter(s =>
          s.toString() !== subjectId
        );

        await teacherClass.save();

        res.json({
          message: 'Subject removed from teacher class',
          assignment: {
            teacherClassId,
            subjectId,
            source: 'TeacherClass'
          }
        });
      } else {
        // Try to find in TeacherSubject model
        const assignment = await TeacherSubject.findById(id);

        if (assignment) {
          // Soft delete by setting status to 'inactive'
          assignment.status = 'inactive';
          await assignment.save();

          res.json({
            message: 'Teacher-subject assignment deleted',
            assignment
          });
        } else {
          // Try to find in TeacherAssignment model
          try {
            const teacherAssignment = await TeacherAssignment.findById(id);

            if (teacherAssignment) {
              await teacherAssignment.remove();

              res.json({
                message: 'Teacher assignment deleted',
                assignment: teacherAssignment
              });
            } else {
              res.status(404).json({ message: 'Assignment not found' });
            }
          } catch (err) {
            res.status(404).json({ message: 'Assignment not found' });
          }
        }
      }
    } catch (error) {
      console.error('Error deleting teacher-subject assignment:', error);
      res.status(500).json({
        message: 'Server error',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/teacher-subject-assignments/direct
 * @desc Create a teacher-subject assignment directly (for debugging)
 * @access Private (Admin)
 */
router.post('/direct',
  authenticateToken,
  (req, res, next) => {
    // Custom middleware to authorize admin role
    console.log('Authorizing role: admin');
    console.log('User role:', req.user?.role);

    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: `Access denied. Required role: admin. User role: ${req.user.role}`
      });
    }

    next();
  },
  async (req, res) => {
    try {
      const { teacherId, subjectId, classId } = req.body;

      // Validate required fields
      if (!teacherId || !subjectId || !classId) {
        return res.status(400).json({
          message: 'Teacher ID, Subject ID, and Class ID are required'
        });
      }

      console.log(`Creating direct TeacherSubject assignment: teacherId=${teacherId}, subjectId=${subjectId}, classId=${classId}`);

      // Create new assignment directly in TeacherSubject model
      const newAssignment = new TeacherSubject({
        teacherId,
        subjectId,
        classId,
        status: 'active'
      });

      await newAssignment.save();

      res.status(201).json({
        message: 'Teacher-subject assignment created directly',
        assignment: newAssignment
      });
    } catch (error) {
      console.error('Error creating direct teacher-subject assignment:', error);
      res.status(500).json({
        message: 'Server error',
        error: error.message
      });
    }
  }
);

module.exports = router;
