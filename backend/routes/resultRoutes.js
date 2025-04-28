const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const { authenticateToken, authorizeRole, authorizeTeacherForSubject, authorizeTeacherForClass, authorizeTeacherForReports } = require('../middleware/auth');
const { checkExistingMarks, preventDuplicateMarks } = require('../middleware/markEntryValidation');
const mongoose = require('mongoose');

// Create a new result
router.post('/', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const result = new Result(req.body);
    await result.save();
    res.status(201).json(result);
  } catch (error) {
    res.status(400).send(`Error creating result: ${error.message}`);
  }
});

// Enter marks for a student
router.post('/enter-marks', authenticateToken, authorizeRole(['teacher', 'admin']), authorizeTeacherForSubject, checkExistingMarks, preventDuplicateMarks, async (req, res) => {
  try {
    let { studentId, examId, academicYearId, examTypeId, subjectId, marksObtained, grade, comment, educationLevel } = req.body;

    // Authorization is now handled by the authorizeTeacherForSubject middleware
    // The middleware adds teacherId to the request if authorized

    // Get student to determine education level if not provided
    if (!educationLevel) {
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      educationLevel = student.educationLevel;
    }

    const result = new Result({
      studentId,
      examId,
      academicYearId,
      examTypeId,
      subjectId,
      marksObtained,
      grade,
      comment,
      educationLevel
    });
    await result.save();
    res.status(201).json(result);
  } catch (error) {
    res.status(400).send(`Error entering marks: ${error.message}`);
  }
});

// Enter marks for multiple students (DEPRECATED)
router.post('/enter-marks/batch', authenticateToken, authorizeRole(['teacher', 'admin']), async (req, res) => {
  console.log('POST /api/results/enter-marks/batch - Processing batch marks entry');
  logger.warn(`DEPRECATED ROUTE USED: ${req.method} ${req.originalUrl} - Use /api/o-level/marks/batch instead`);

  // Forward to the new standardized route
  return res.status(301).json({
    success: false,
    message: 'This route is deprecated. Please use /api/o-level/marks/batch instead.',
    redirectTo: '/api/o-level/marks/batch'
  });
});

// Get all results
router.get('/', authenticateToken, async (req, res) => {
  try {
    const results = await Result.find()
      .populate('studentId', 'firstName lastName rollNumber')
      .populate('subjectId', 'name code')
      .populate('examId', 'name type')
      .populate('examTypeId', 'name');
    res.json(results);
  } catch (error) {
    res.status(500).send(`Error fetching results: ${error.message}`);
  }
});

// Get results by subject ID
router.get('/subject/:subjectId', authenticateToken, authorizeTeacherForSubject, async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { classId, examId } = req.query;

    console.log(`GET /api/results/subject/${subjectId} - Fetching results for subject`);

    // Build query
    const query = { subjectId };
    if (classId) query.classId = classId;
    if (examId) query.examId = examId;

    // Get results for this subject
    const results = await Result.find(query)
      .populate('studentId', 'firstName lastName rollNumber gender')
      .populate('subjectId', 'name code')
      .populate('examId', 'name type')
      .populate('classId', 'name section stream');

    console.log(`Found ${results.length} results for subject ${subjectId}`);
    res.json(results);
  } catch (error) {
    console.error('Error fetching subject results:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get results by class ID
router.get('/class/:classId', authenticateToken, authorizeTeacherForReports, async (req, res) => {
  try {
    const { classId } = req.params;
    const { examId, examTypeId, academicYear, term } = req.query;

    // Get all students in the class
    const students = await Student.find({ class: classId });
    const studentIds = students.map(student => student._id);

    // Build query
    const query = { studentId: { $in: studentIds } };
    if (examId) query.examId = examId;
    if (examTypeId) query.examTypeId = examTypeId;
    if (academicYear) query.academicYearId = academicYear;
    if (term) query.term = term;

    // Get results for these students
    const results = await Result.find(query)
      .populate('studentId', 'firstName lastName rollNumber')
      .populate('subjectId', 'name code')
      .populate('examId', 'name type')
      .populate('examTypeId', 'name');

    res.json(results);
  } catch (error) {
    console.error('Error fetching class results:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get results by teacher ID (for subjects they teach)
router.get('/teacher/:teacherId', authenticateToken, async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { examId, examTypeId, classId } = req.query;

    // Get teacher's subjects
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Get classes where this teacher teaches
    const classes = await Class.find({
      'subjects.teacher': new mongoose.Types.ObjectId(teacherId)
    });

    const classIds = classes.map(cls => cls._id);
    const filteredClassIds = classId ? [new mongoose.Types.ObjectId(classId)] : classIds;

    // Get students in these classes
    const students = await Student.find({
      class: { $in: filteredClassIds }
    });

    const studentIds = students.map(student => student._id);

    // Build query
    const query = {
      studentId: { $in: studentIds },
      subjectId: { $in: teacher.subjects }
    };

    if (examId) query.examId = examId;
    if (examTypeId) query.examTypeId = examTypeId;

    // Get results
    const results = await Result.find(query)
      .populate('studentId', 'firstName lastName rollNumber')
      .populate('subjectId', 'name code')
      .populate('examId', 'name type')
      .populate('examTypeId', 'name');

    res.json(results);
  } catch (error) {
    console.error('Error fetching teacher results:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get a specific result
router.get('/:resultId', authenticateToken, async (req, res) => {
  try {
    const result = await Result.findById(req.params.resultId);
    if (!result) {
      return res.status(404).send('Result not found');
    }
    res.json(result);
  } catch (error) {
    res.status(500).send(`Error fetching result: ${error.message}`);
  }
});

// Update a result
router.put('/:resultId', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const result = await Result.findByIdAndUpdate(req.params.resultId, req.body, { new: true });
    if (!result) {
      return res.status(404).send('Result not found');
    }
    res.json(result);
  } catch (error) {
    res.status(400).send(`Error updating result: ${error.message}`);
  }
});

// Delete a result
router.delete('/:resultId', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const result = await Result.findByIdAndDelete(req.params.resultId);
    if (!result) {
      return res.status(404).send('Result not found');
    }
    res.json({ message: 'Result deleted successfully' });
  } catch (error) {
    res.status(500).send(`Error deleting result: ${error.message}`);
  }
});

module.exports = router;
