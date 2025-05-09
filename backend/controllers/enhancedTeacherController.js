/**
 * Enhanced Teacher Controller
 * 
 * This controller extends the original teacherAuthController with improved handling
 * for O-Level classes, ensuring they work the same way as A-Level classes.
 */

const mongoose = require('mongoose');
const Teacher = mongoose.model('Teacher');
const Class = mongoose.model('Class');
const Subject = mongoose.model('Subject');
const Student = mongoose.model('Student');
const TeacherSubject = mongoose.model('TeacherSubject');
const TeacherAssignment = mongoose.model('TeacherAssignment');

// Import the enhanced teacher subject service
const enhancedTeacherSubjectService = require('../services/enhancedTeacherSubjectService');

/**
 * Get subjects assigned to the current teacher for marks entry
 * Enhanced version that treats O-Level classes the same as A-Level classes
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAssignedSubjects = async (req, res) => {
  try {
    console.log('[EnhancedTeacherController] GET /api/enhanced-teachers/subjects - Fetching subjects for marks entry');
    const userId = req.user.userId;
    const { classId } = req.query;

    console.log(`[EnhancedTeacherController] User ID: ${userId}, Class ID: ${classId || 'not provided'}`);

    if (!userId) {
      console.log('[EnhancedTeacherController] No userId found in token');
      return res.status(400).json({ message: 'Invalid user token' });
    }

    // If user is admin, return all subjects
    if (req.user.role === 'admin') {
      console.log('[EnhancedTeacherController] User is admin, fetching all subjects');
      const subjects = await Subject.find().select('name code type description educationLevel');
      return res.json(subjects);
    }

    // Find the teacher by userId
    const teacher = await Teacher.findOne({ userId }).select('_id firstName lastName email');
    if (!teacher) {
      console.log(`[EnhancedTeacherController] No teacher found with userId: ${userId}`);
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    // If no classId provided, return all subjects the teacher is assigned to teach
    if (!classId) {
      console.log(`[EnhancedTeacherController] No classId provided, returning all subjects for teacher ${teacher._id}`);
      const allSubjects = await enhancedTeacherSubjectService.getTeacherSubjects(teacher._id, null, false);
      return res.json(allSubjects);
    }

    // First check if the class exists and get its education level
    const classObj = await Class.findById(classId).select('educationLevel');
    if (!classObj) {
      console.log(`[EnhancedTeacherController] Class not found: ${classId}`);
      return res.status(404).json({ message: 'Class not found' });
    }

    // Use the enhanced teacher subject service to get the teacher's subjects
    // with proper population limits and error handling
    try {
      console.log(`[EnhancedTeacherController] Fetching subjects for teacher ${teacher._id} in class ${classId}`);
      const subjects = await TeacherSubject.find({
        teacherId: teacher._id,
        classId: classId,
        status: 'active'
      })
      .populate({
        path: 'subjectId',
        select: 'name code type description educationLevel',
        match: { _id: { $exists: true } }
      })
      .lean()
      .then(results => results.filter(ts => ts.subjectId)); // Filter out null populated subjects

      // If no subjects found through TeacherSubject, check TeacherAssignment
      if (subjects.length === 0) {
        const assignments = await TeacherAssignment.find({
          teacher: teacher._id,
          class: classId
        })
        .populate({
          path: 'subject',
          select: 'name code type description educationLevel',
          match: { _id: { $exists: true } }
        })
        .lean()
        .then(results => results.filter(a => a.subject)); // Filter out invalid assignments

        // Map assignments to subject format
        const subjectsFromAssignments = assignments.map(assignment => ({
          _id: assignment.subject._id,
          name: assignment.subject.name,
          code: assignment.subject.code,
          type: assignment.subject.type,
          description: assignment.subject.description,
          educationLevel: assignment.subject.educationLevel
        }));

        return res.json(subjectsFromAssignments);
      }

      // Map TeacherSubject results to subject format
      const mappedSubjects = subjects.map(ts => ({
        _id: ts.subjectId._id,
        name: ts.subjectId.name,
        code: ts.subjectId.code,
        type: ts.subjectId.type,
        description: ts.subjectId.description,
        educationLevel: ts.subjectId.educationLevel
      }));

      return res.json(mappedSubjects);
    } catch (error) {
      console.error('[EnhancedTeacherController] Error fetching teacher subjects:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching teacher subjects',
        error: error.message
      });
    }
  } catch (error) {
    console.error('[EnhancedTeacherController] Error in getAssignedSubjects:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assigned subjects',
      error: error.message
    });
  }
};

/**
 * Get students assigned to the current teacher for a specific class
 * Enhanced version that treats O-Level classes the same as A-Level classes
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAssignedStudents = async (req, res) => {
  try {
    console.log('[EnhancedTeacherController] GET /api/enhanced-teachers/classes/:classId/students - Fetching students for teacher');
    const userId = req.user.userId;
    const { classId } = req.params;

    console.log(`[EnhancedTeacherController] User ID: ${userId}, Class ID: ${classId}`);

    if (!userId) {
      console.log('[EnhancedTeacherController] No userId found in token');
      return res.status(400).json({ message: 'Invalid user token' });
    }

    // If user is admin, return all students in the class
    if (req.user.role === 'admin') {
      console.log('[EnhancedTeacherController] User is admin, fetching all students in class');
      const students = await Student.find({ class: classId })
        .select('_id firstName lastName rollNumber admissionNumber gender form');
      return res.json(students);
    }

    // Find the teacher by userId
    const teacher = await Teacher.findOne({ userId }).select('_id');
    if (!teacher) {
      console.log(`[EnhancedTeacherController] No teacher found with userId: ${userId}`);
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    // Use the enhanced teacher subject service to get the teacher's students
    // with proper error handling and no circular population
    try {
      const students = await Student.find({ class: classId })
        .select('_id firstName lastName rollNumber admissionNumber gender form')
        .lean();

      // Get the subjects this teacher teaches in this class
      const teacherSubjects = await TeacherSubject.find({
        teacherId: teacher._id,
        classId: classId,
        status: 'active'
      }).select('subjectId');

      const teacherSubjectIds = teacherSubjects.map(ts => ts.subjectId.toString());

      // Filter students who are taking the teacher's subjects
      const filteredStudents = students.filter(student => {
        // For now, return all students since subject selection data model needs to be implemented
        return true;
      });

      return res.json(filteredStudents);
    } catch (error) {
      console.error('[EnhancedTeacherController] Error fetching students:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching students',
        error: error.message
      });
    }
  } catch (error) {
    console.error('[EnhancedTeacherController] Error in getAssignedStudents:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assigned students',
      error: error.message
    });
  }
};
