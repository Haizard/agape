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
    const teacher = await Teacher.findOne({ userId });
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

    // Use the enhanced teacher subject service to get the teacher's subjects
    console.log(`[EnhancedTeacherController] Calling getTeacherSubjects with teacherId: ${teacher._id}, classId: ${classId}`);
    const subjects = await enhancedTeacherSubjectService.getTeacherSubjects(teacher._id, classId, false);

    // Return the subjects
    res.json(subjects);
  } catch (error) {
    console.error('[EnhancedTeacherController] Error fetching assigned subjects for marks entry:', error);

    // Provide more specific error messages based on the error type
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid class ID format',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error fetching assigned subjects',
      error: error.message,
      details: 'There was an error retrieving the subjects you are assigned to teach.'
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
    const teacher = await Teacher.findOne({ userId });
    if (!teacher) {
      console.log(`[EnhancedTeacherController] No teacher found with userId: ${userId}`);
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    // Use the enhanced teacher subject service to get the teacher's students
    const students = await enhancedTeacherSubjectService.getTeacherStudents(teacher._id, classId);

    // If no students found, return empty array with error message
    if (students.length === 0) {
      console.log(`[EnhancedTeacherController] No students found for teacher ${teacher._id} in class ${classId}, returning empty array`);
      return res.status(403).json({
        message: 'You are not assigned to teach any students in this class.',
        students: []
      });
    }

    // Return the students
    res.json(students);
  } catch (error) {
    console.error('[EnhancedTeacherController] Error fetching assigned students:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assigned students',
      error: error.message
    });
  }
};
