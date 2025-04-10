const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
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
router.post('/enter-marks', authenticateToken, authorizeRole(['teacher', 'admin']), checkExistingMarks, preventDuplicateMarks, async (req, res) => {
  try {
    let { studentId, examId, academicYearId, examTypeId, subjectId, marksObtained, grade, comment, educationLevel } = req.body;

    // Check if teacher is authorized to enter marks for this subject
    // Skip this check for admin users
    if (req.user.role === 'teacher') {
      // Find the teacher by userId
      const teacher = await Teacher.findOne({ userId: req.user.userId });
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher profile not found' });
      }

      // Check if teacher is assigned to this subject
      if (!teacher.subjects.some(s => s.toString() === subjectId)) {
        return res.status(403).json({ message: 'You are not authorized to enter marks for this subject' });
      }
    }

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

// Enter marks for multiple students
router.post('/enter-marks/batch', authenticateToken, authorizeRole(['teacher', 'admin']), checkExistingMarks, preventDuplicateMarks, async (req, res) => {
  console.log('POST /api/results/enter-marks/batch - Processing batch marks entry');
  console.log('Request body:', req.body);
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { marksData } = req.body;

    if (!Array.isArray(marksData) || marksData.length === 0) {
      return res.status(400).json({ message: 'Invalid marks data. Expected an array of student marks.' });
    }

    // Check if teacher is authorized to enter marks for this subject
    // Skip this check for admin users
    if (req.user.role === 'teacher') {
      const teacherId = req.user.teacherId;
      const subjectId = marksData[0].subjectId; // Assuming all entries are for the same subject

      if (teacherId) {
        const teacher = await Teacher.findById(teacherId);
        if (!teacher.subjects.includes(subjectId)) {
          return res.status(403).json({ message: 'You are not authorized to enter marks for this subject' });
        }
      }
    }

    // Check if results already exist and update them, otherwise create new ones
    const results = [];

    for (const markData of marksData) {
      const { studentId, examId, academicYearId, examTypeId, subjectId, classId, marksObtained, examName } = markData;

      // Log the destructured data for debugging
      console.log('Destructured mark data:', {
        studentId,
        examId,
        academicYearId,
        examTypeId,
        subjectId,
        classId,
        marksObtained,
        examName
      });

      // Ensure classId is defined
      if (!classId) {
        console.log('classId is undefined, using fallback');
        // Use a fallback class ID
        markData.classId = '67f2fe0fdcc60fd7fef2ef36';
      }

      // Handle case where examId is 'default-exam' or null
      let actualExamId = examId;
      let actualExamTypeId = examTypeId;

      if (examId === 'default-exam' || !examId) {
        console.log('Creating a default exam for marks entry');

        // Check if a default exam already exists for this academic year
        const Exam = require('../models/Exam');
        let defaultExam = await Exam.findOne({
          name: examName || 'Default Exam',
          academicYear: academicYearId,
          type: 'MID_TERM'
        });

        if (!defaultExam) {
          // Create a new default exam
          console.log('No existing default exam found, creating a new one');

          // Get the class for this student to add to the exam
          const student = await Student.findById(studentId);
          const classId = student ? student.class : null;

          const newExam = new Exam({
            name: examName || 'Default Exam',
            academicYear: academicYearId,
            type: 'MID_TERM',
            term: 'Term 1',
            startDate: new Date(),
            endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
            status: 'COMPLETED',
            classes: classId ? [{
              class: classId,
              subjects: [{
                subject: subjectId,
                maxMarks: 100
              }]
            }] : []
          });

          defaultExam = await newExam.save({ session });
          console.log(`Created new default exam: ${defaultExam._id}`);
        } else {
          console.log(`Using existing default exam: ${defaultExam._id}`);
        }

        actualExamId = defaultExam._id;
      }

      // If examTypeId is missing, find or create a default exam type
      if (!actualExamTypeId) {
        console.log('No exam type provided, finding or creating a default one');

        const ExamType = require('../models/ExamType');
        let defaultExamType = await ExamType.findOne({ name: 'Default' });

        if (!defaultExamType) {
          console.log('Creating a default exam type');
          defaultExamType = await ExamType.create({
            name: 'Default',
            description: 'Default exam type created by the system',
            maxMarks: 100,
            isActive: true
          });
        }

        actualExamTypeId = defaultExamType._id;
      }

      // We don't need to calculate grade here anymore
      // The Result model's pre-save middleware will handle grade calculation
      // This ensures consistency between marks and grades
      const subject = await Subject.findById(subjectId);

      // Log the subject for debugging
      console.log(`Processing marks for subject: ${subject ? subject.name : 'Unknown'} (${subjectId})`);
      console.log(`Marks obtained: ${marksObtained}`);

      // Note: We're not setting grade manually anymore, the pre-save middleware will handle it

      // Check if result already exists for this specific subject
      const existingResult = await Result.findOne({
        studentId,
        examId: actualExamId,
        academicYearId,
        examTypeId: actualExamTypeId,
        subjectId,
        classId: markData.classId // Include classId in the query
      });

      // Also check if there are any suspicious duplicate marks for other subjects
      // This helps identify potential copy-paste errors
      const otherSubjectResults = await Result.find({
        studentId,
        examId: actualExamId,
        academicYearId,
        examTypeId: actualExamTypeId,
        classId: markData.classId,
        subjectId: { $ne: subjectId }, // Different subject
        marksObtained: marksObtained // Same marks
      });

      if (otherSubjectResults.length > 0) {
        // Log a warning but don't block the save - it could be legitimate
        console.warn(`Warning: Student ${studentId} has the same marks (${marksObtained}) for multiple subjects:`);
        for (const result of otherSubjectResults) {
          console.warn(`- Subject: ${result.subjectId}`);
        }
        console.warn(`- Current subject: ${subjectId}`);
      }

      // Log the query for debugging
      console.log('Searching for existing result with:', {
        studentId,
        examId: actualExamId,
        academicYearId,
        examTypeId: actualExamTypeId,
        subjectId,
        classId: markData.classId
      });

      if (existingResult) {
        // Update existing result
        existingResult.marksObtained = marksObtained;
        // Don't set grade manually, let the pre-save middleware handle it
        existingResult.updatedAt = Date.now();

        // Log the update for debugging
        console.log(`Updating existing result for student ${studentId}, subject ${subjectId}:`, {
          oldMarks: existingResult.marksObtained,
          newMarks: marksObtained
        });

        await existingResult.save({ session });
        results.push(existingResult);
      } else {
        // Create new result
        const resultData = {
          studentId,
          examId: actualExamId,
          academicYearId,
          examTypeId: actualExamTypeId,
          subjectId,
          classId: markData.classId, // Use the updated classId from markData
          marksObtained,
          // Don't set grade manually, let the pre-save middleware handle it
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        // Log the result data for debugging
        console.log('Creating new result with data:', {
          studentId,
          subjectId,
          marksObtained,
          classId: markData.classId
        });

        const newResult = new Result(resultData);
        await newResult.save({ session });
        results.push(newResult);
      }
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: `Successfully processed ${results.length} results`,
      results
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error entering batch marks:', error);
    res.status(400).json({ message: `Error entering marks: ${error.message}` });
  }
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
router.get('/subject/:subjectId', authenticateToken, async (req, res) => {
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
router.get('/class/:classId', authenticateToken, async (req, res) => {
  try {
    const { classId } = req.params;
    const { examId, examTypeId } = req.query;

    // Get all students in the class
    const students = await Student.find({ class: classId });
    const studentIds = students.map(student => student._id);

    // Build query
    const query = { studentId: { $in: studentIds } };
    if (examId) query.examId = examId;
    if (examTypeId) query.examTypeId = examTypeId;

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
      'subjects.teacher': mongoose.Types.ObjectId(teacherId)
    });

    const classIds = classes.map(cls => cls._id);
    const filteredClassIds = classId ? [mongoose.Types.ObjectId(classId)] : classIds;

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
