const mongoose = require('mongoose');
const Teacher = mongoose.model('Teacher');
const Class = mongoose.model('Class');
const Subject = mongoose.model('Subject');
const Student = mongoose.model('Student');

/**
 * Get classes assigned to the current teacher
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAssignedClasses = async (req, res) => {
  try {
    // Get teacher ID from authenticated user
    const teacherId = req.user.id;

    // Find the teacher
    const teacher = await Teacher.findById(teacherId)
      .populate('classes')
      .populate('subjects');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Get classes assigned to the teacher
    const assignedClasses = teacher.classes || [];

    // Return the classes
    res.json(assignedClasses);
  } catch (error) {
    console.error('Error fetching assigned classes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assigned classes',
      error: error.message
    });
  }
};

/**
 * Get a simplified list of classes assigned to the current teacher
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getSimpleAssignedClasses = async (req, res) => {
  try {
    // Get teacher ID from authenticated user
    const teacherId = req.user.id;

    // Find the teacher
    const teacher = await Teacher.findById(teacherId);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Get class IDs assigned to the teacher
    const classIds = teacher.classes || [];

    // Find the classes
    const classes = await Class.find({ _id: { $in: classIds } });

    // Return the classes
    res.json(classes);
  } catch (error) {
    console.error('Error fetching simple assigned classes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching simple assigned classes',
      error: error.message
    });
  }
};

/**
 * Get subjects assigned to the current teacher for a specific class
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAssignedSubjects = async (req, res) => {
  try {
    // Get teacher ID from authenticated user
    const teacherId = req.user.id;
    const { classId } = req.query;

    // Find the teacher
    const teacher = await Teacher.findById(teacherId)
      .populate('subjects');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Get subjects assigned to the teacher
    const assignedSubjectIds = teacher.subjects || [];

    // If classId is provided, filter subjects by class
    let subjects = [];
    if (classId) {
      // Find the class
      const classObj = await Class.findById(classId)
        .populate('subjects');

      if (!classObj) {
        return res.status(404).json({
          success: false,
          message: 'Class not found'
        });
      }

      // Get subjects in the class
      const classSubjectIds = classObj.subjects.map(subject => 
        typeof subject === 'object' ? subject._id.toString() : subject.toString()
      );

      // Find subjects that are both assigned to the teacher and in the class
      subjects = await Subject.find({
        _id: { 
          $in: assignedSubjectIds.filter(subjectId => 
            classSubjectIds.includes(subjectId.toString())
          )
        }
      });
    } else {
      // Get all subjects assigned to the teacher
      subjects = await Subject.find({
        _id: { $in: assignedSubjectIds }
      });
    }

    // Return the subjects
    res.json(subjects);
  } catch (error) {
    console.error('Error fetching assigned subjects:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assigned subjects',
      error: error.message
    });
  }
};

/**
 * Get students in a class assigned to the current teacher
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAssignedStudents = async (req, res) => {
  try {
    // Get teacher ID from authenticated user
    const teacherId = req.user.id;
    const { classId } = req.params;

    // Find the teacher
    const teacher = await Teacher.findById(teacherId);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Check if the teacher is assigned to the class
    const assignedClassIds = teacher.classes.map(cls => cls.toString());
    if (!assignedClassIds.includes(classId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access students in this class'
      });
    }

    // Find students in the class
    const students = await Student.find({ class: classId });

    // Return the students
    res.json(students);
  } catch (error) {
    console.error('Error fetching assigned students:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assigned students',
      error: error.message
    });
  }
};
