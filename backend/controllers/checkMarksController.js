/**
 * Controller for checking if marks exist for a specific class, subject, and exam
 */

const mongoose = require('mongoose');
const ALevelResult = require('../models/ALevelResult');
const OLevelResult = require('../models/OLevelResult');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Exam = require('../models/Exam');

/**
 * Check if marks exist for a specific class, subject, and exam
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.checkExistingMarks = async (req, res) => {
  try {
    console.log('GET /api/check-marks/check-existing - Checking if marks exist');
    const { classId, subjectId, examId } = req.query;

    console.log(`Class ID: ${classId}, Subject ID: ${subjectId}, Exam ID: ${examId}`);

    if (!classId || !subjectId || !examId) {
      console.log('Missing required parameters');
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: classId, subjectId, and examId are required'
      });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(classId) || 
        !mongoose.Types.ObjectId.isValid(subjectId) || 
        !mongoose.Types.ObjectId.isValid(examId)) {
      console.log('Invalid ObjectId format');
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }

    // Get the class to determine education level
    const classObj = await Class.findById(classId);
    if (!classObj) {
      console.log(`Class ${classId} not found`);
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Determine which result model to use based on education level
    const ResultModel = classObj.educationLevel === 'A_LEVEL' ? ALevelResult : OLevelResult;
    console.log(`Using ${classObj.educationLevel} result model`);

    // Get all students in the class
    const students = await Student.find({ class: classId });
    if (students.length === 0) {
      console.log(`No students found in class ${classId}`);
      return res.json({
        success: true,
        hasExistingMarks: false,
        message: 'No students found in this class'
      });
    }

    console.log(`Found ${students.length} students in class ${classId}`);

    // Get student IDs
    const studentIds = students.map(student => student._id);

    // Check if any marks exist for these students, this subject, and this exam
    const existingMarks = await ResultModel.find({
      studentId: { $in: studentIds },
      subjectId: subjectId,
      examId: examId
    }).limit(1); // We only need to know if any exist, not all of them

    const hasExistingMarks = existingMarks.length > 0;
    console.log(`Existing marks found: ${hasExistingMarks}`);

    // If marks exist, get some details about them
    let marksDetails = null;
    if (hasExistingMarks) {
      // Count how many students have marks
      const marksCount = await ResultModel.countDocuments({
        studentId: { $in: studentIds },
        subjectId: subjectId,
        examId: examId
      });

      // Get the subject and exam names for the response
      const subject = await Subject.findById(subjectId);
      const exam = await Exam.findById(examId);

      marksDetails = {
        count: marksCount,
        totalStudents: students.length,
        percentage: Math.round((marksCount / students.length) * 100),
        subjectName: subject ? subject.name : 'Unknown Subject',
        examName: exam ? exam.name : 'Unknown Exam'
      };
    }

    return res.json({
      success: true,
      hasExistingMarks,
      marksDetails,
      message: hasExistingMarks 
        ? `Found existing marks for ${marksDetails.count} out of ${marksDetails.totalStudents} students (${marksDetails.percentage}%)` 
        : 'No existing marks found'
    });
  } catch (error) {
    console.error('Error checking existing marks:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking existing marks',
      error: error.message
    });
  }
};
