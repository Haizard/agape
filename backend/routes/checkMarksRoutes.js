const express = require('express');
const router = express.Router();
const OLevelResult = require('../models/OLevelResult');
const ALevelResult = require('../models/ALevelResult');
const Result = require('../models/Result');
const Student = require('../models/Student');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

/**
 * Check if marks exist for a specific subject, class, exam, and academic year
 * Returns a list of students with existing marks
 */
router.get('/check-existing', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { classId, subjectId, examId, academicYearId } = req.query;

    // Validate required parameters
    if (!classId || !subjectId || !examId || !academicYearId) {
      return res.status(400).json({
        message: 'Missing required parameters. Please provide classId, subjectId, examId, and academicYearId.'
      });
    }

    // Get all students in the class
    const students = await Student.find({ class: classId }).select('_id firstName lastName rollNumber educationLevel');

    // Initialize results
    const results = {
      hasExistingMarks: false,
      studentsWithMarks: [],
      totalStudents: students.length,
      marksEntryAllowed: true,
      message: 'No existing marks found. You can enter new marks.'
    };

    // Check for existing marks for each student
    for (const student of students) {
      // Determine which model to use based on education level
      const ResultModel = student.educationLevel === 'A_LEVEL' ? ALevelResult : OLevelResult;

      // Check if marks exist
      const existingResult = await ResultModel.findOne({
        studentId: student._id,
        subjectId,
        examId,
        academicYearId
      });

      // If marks exist, add to the list
      if (existingResult) {
        results.hasExistingMarks = true;
        results.studentsWithMarks.push({
          studentId: student._id,
          studentName: `${student.firstName} ${student.lastName}`,
          rollNumber: student.rollNumber,
          marksObtained: existingResult.marksObtained,
          grade: existingResult.grade,
          points: existingResult.points,
          resultId: existingResult._id
        });
      }
    }

    // If marks exist, update the message
    if (results.hasExistingMarks) {
      results.message = 'Marks already exist for this subject, class, exam, and academic year. You can only edit existing marks.';
      results.marksEntryAllowed = false;
    }

    res.json(results);
  } catch (error) {
    console.error('Error checking existing marks:', error);
    res.status(500).json({ message: `Error checking existing marks: ${error.message}` });
  }
});

/**
 * Check if marks exist for a specific student, subject, exam, and academic year
 */
router.get('/check-student-marks', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { studentId, subjectId, examId, academicYearId } = req.query;

    // Validate required parameters
    if (!studentId || !subjectId || !examId || !academicYearId) {
      return res.status(400).json({
        message: 'Missing required parameters. Please provide studentId, subjectId, examId, and academicYearId.'
      });
    }

    // Get student to determine education level
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Determine which model to use based on education level
    const ResultModel = student.educationLevel === 'A_LEVEL' ? ALevelResult : OLevelResult;

    // Check if marks exist
    const existingResult = await ResultModel.findOne({
      studentId,
      subjectId,
      examId,
      academicYearId
    });

    if (existingResult) {
      res.json({
        hasExistingMarks: true,
        marksObtained: existingResult.marksObtained,
        grade: existingResult.grade,
        points: existingResult.points,
        resultId: existingResult._id,
        message: 'Marks already exist for this student, subject, exam, and academic year. You can only edit existing marks.'
      });
    } else {
      res.json({
        hasExistingMarks: false,
        message: 'No existing marks found. You can enter new marks.'
      });
    }
  } catch (error) {
    console.error('Error checking student marks:', error);
    res.status(500).json({ message: `Error checking student marks: ${error.message}` });
  }
});

module.exports = router;
