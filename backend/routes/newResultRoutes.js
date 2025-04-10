const express = require('express');
const router = express.Router();
const ResultService = require('../services/resultService');
const ReportService = require('../services/reportService');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const OLevelResult = require('../models/OLevelResult');
const ALevelResult = require('../models/ALevelResult');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { validateResult, validateResultUpdate } = require('../middleware/resultValidation');
const { checkExistingMarks, preventDuplicateMarks } = require('../middleware/markEntryValidation');
const mongoose = require('mongoose');
const fs = require('node:fs');
const path = require('node:path');
const resultMonitor = require('../utils/resultMonitor');

// Setup logging
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logFile = path.join(logDir, `api_${new Date().toISOString().split('T')[0]}.log`);
const logToFile = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logFile, logMessage);
};

// Create a new result
router.post('/', authenticateToken, authorizeRole(['admin', 'teacher']), validateResult, async (req, res) => {
  try {
    const result = await ResultService.createResult(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: `Error creating result: ${error.message}` });
  }
});

// Enter marks for a student
router.post('/enter-marks', authenticateToken, authorizeRole(['admin', 'teacher']), checkExistingMarks, preventDuplicateMarks, async (req, res) => {
  try {
    const { studentId, examId, academicYearId, examTypeId, subjectId, marksObtained, grade, comment, educationLevel } = req.body;

    logToFile(`Enter marks request: Student=${studentId}, Exam=${examId}, Subject=${subjectId}, Marks=${marksObtained}`);

    // Validate required fields
    if (!studentId || !examId || !academicYearId || !subjectId || marksObtained === undefined) {
      const error = 'Missing required fields';
      logToFile(`Validation error: ${error}`);
      return res.status(400).json({ message: error });
    }

    // Validate marks range
    const marks = Number.parseFloat(marksObtained);
    if (Number.isNaN(marks) || marks < 0 || marks > 100) {
      const error = `Invalid marks: ${marksObtained}. Marks must be between 0 and 100.`;
      logToFile(`Validation error: ${error}`);
      return res.status(400).json({ message: error });
    }

    // Get student to determine education level if not provided
    let studentEducationLevel = educationLevel;
    if (!studentEducationLevel) {
      const student = await Student.findById(studentId);
      if (!student) {
        const error = `Student not found with ID: ${studentId}`;
        logToFile(`Validation error: ${error}`);
        return res.status(404).json({ message: error });
      }
      studentEducationLevel = student.educationLevel || 'O_LEVEL';
      logToFile(`Determined education level: ${studentEducationLevel} for student ${studentId}`);
    }

    // Calculate grade and points if not provided
    let resultGrade = grade;
    let resultPoints;

    if (!resultGrade) {
      if (studentEducationLevel === 'A_LEVEL') {
        // A-LEVEL grading
        if (marks >= 80) { resultGrade = 'A'; resultPoints = 1; }
        else if (marks >= 70) { resultGrade = 'B'; resultPoints = 2; }
        else if (marks >= 60) { resultGrade = 'C'; resultPoints = 3; }
        else if (marks >= 50) { resultGrade = 'D'; resultPoints = 4; }
        else if (marks >= 40) { resultGrade = 'E'; resultPoints = 5; }
        else if (marks >= 35) { resultGrade = 'S'; resultPoints = 6; }
        else { resultGrade = 'F'; resultPoints = 7; }
      } else {
        // O-LEVEL grading
        if (marks >= 75) { resultGrade = 'A'; resultPoints = 1; }
        else if (marks >= 65) { resultGrade = 'B'; resultPoints = 2; }
        else if (marks >= 50) { resultGrade = 'C'; resultPoints = 3; }
        else if (marks >= 30) { resultGrade = 'D'; resultPoints = 4; }
        else { resultGrade = 'F'; resultPoints = 5; }
      }

      logToFile(`Calculated grade: ${resultGrade}, points: ${resultPoints} for marks: ${marks}`);
    }

    // Create result using the appropriate model directly
    const ResultModel = studentEducationLevel === 'A_LEVEL' ? ALevelResult : OLevelResult;

    // Check if result already exists
    const existingResult = await ResultModel.findOne({
      studentId,
      examId,
      subjectId
    });

    let result;

    if (existingResult) {
      logToFile(`Updating existing result: ${existingResult._id}`);

      // Update existing result
      existingResult.marksObtained = marks;
      existingResult.grade = resultGrade;
      existingResult.points = resultPoints;
      existingResult.comment = comment;
      existingResult.updatedAt = new Date();

      result = await existingResult.save();
    } else {
      logToFile(`Creating new result for student ${studentId}`);

      // Create new result
      const newResult = new ResultModel({
        studentId,
        examId,
        academicYearId,
        examTypeId,
        subjectId,
        marksObtained: marks,
        grade: resultGrade,
        points: resultPoints,
        comment,
        educationLevel: studentEducationLevel
      });

      result = await newResult.save();
    }

    logToFile(`Successfully saved result: ${result._id}`);
    res.status(201).json(result);
  } catch (error) {
    logToFile(`Error entering marks: ${error.message}`);
    res.status(400).json({ message: `Error entering marks: ${error.message}` });
  }
});

// Enter batch marks
router.post('/enter-batch-marks', authenticateToken, authorizeRole(['admin', 'teacher']), checkExistingMarks, preventDuplicateMarks, async (req, res) => {
  try {
    const { marksData } = req.body;

    logToFile(`Enter batch marks request: ${marksData ? marksData.length : 0} items`);

    if (!marksData || !Array.isArray(marksData) || marksData.length === 0) {
      const error = 'Invalid marks data';
      logToFile(`Validation error: ${error}`);
      return res.status(400).json({ message: error });
    }

    // Validate each item in the batch
    const validatedData = [];
    const errors = [];

    for (let i = 0; i < marksData.length; i++) {
      const item = marksData[i];

      try {
        // Check required fields
        if (!item.studentId || !item.examId || !item.subjectId || item.marksObtained === undefined) {
          throw new Error(`Item ${i}: Missing required fields`);
        }

        // Validate marks range
        const marks = Number.parseFloat(item.marksObtained);
        if (Number.isNaN(marks) || marks < 0 || marks > 100) {
          throw new Error(`Item ${i}: Invalid marks: ${item.marksObtained}. Marks must be between 0 and 100.`);
        }

        // Get student to determine education level if not provided
        let studentEducationLevel = item.educationLevel;
        if (!studentEducationLevel) {
          const student = await Student.findById(item.studentId);
          if (!student) {
            throw new Error(`Item ${i}: Student not found with ID: ${item.studentId}`);
          }
          studentEducationLevel = student.educationLevel || 'O_LEVEL';
          logToFile(`Item ${i}: Using education level from student profile: ${studentEducationLevel}`);
        } else {
          logToFile(`Item ${i}: Using manually specified education level: ${studentEducationLevel}`);
        }

        // Calculate grade and points if not provided
        let resultGrade = item.grade;
        let resultPoints = item.points;

        if (!resultGrade) {
          if (studentEducationLevel === 'A_LEVEL') {
            // A-LEVEL grading
            if (marks >= 80) { resultGrade = 'A'; resultPoints = 1; }
            else if (marks >= 70) { resultGrade = 'B'; resultPoints = 2; }
            else if (marks >= 60) { resultGrade = 'C'; resultPoints = 3; }
            else if (marks >= 50) { resultGrade = 'D'; resultPoints = 4; }
            else if (marks >= 40) { resultGrade = 'E'; resultPoints = 5; }
            else if (marks >= 35) { resultGrade = 'S'; resultPoints = 6; }
            else { resultGrade = 'F'; resultPoints = 7; }
          } else {
            // O-LEVEL grading
            if (marks >= 75) { resultGrade = 'A'; resultPoints = 1; }
            else if (marks >= 65) { resultGrade = 'B'; resultPoints = 2; }
            else if (marks >= 50) { resultGrade = 'C'; resultPoints = 3; }
            else if (marks >= 30) { resultGrade = 'D'; resultPoints = 4; }
            else { resultGrade = 'F'; resultPoints = 5; }
          }
        }

        // Add validated item
        validatedData.push({
          ...item,
          marksObtained: marks,
          grade: resultGrade,
          points: resultPoints,
          educationLevel: studentEducationLevel
        });

      } catch (validationError) {
        errors.push(validationError.message);
        logToFile(`Validation error: ${validationError.message}`);
      }
    }

    if (validatedData.length === 0) {
      const error = 'No valid marks data to process';
      logToFile(`Error: ${error}`);
      return res.status(400).json({
        message: error,
        errors
      });
    }

    logToFile(`Processing ${validatedData.length} validated items`);

    // Process batch marks
    const results = [];
    const processErrors = [];

    // Group by education level
    const oLevelItems = validatedData.filter(item => item.educationLevel !== 'A_LEVEL');
    const aLevelItems = validatedData.filter(item => item.educationLevel === 'A_LEVEL');

    // Process O-LEVEL items
    if (oLevelItems.length > 0) {
      logToFile(`Processing ${oLevelItems.length} O-LEVEL items`);

      for (const item of oLevelItems) {
        try {
          // Check if result already exists
          const existingResult = await OLevelResult.findOne({
            studentId: item.studentId,
            examId: item.examId,
            subjectId: item.subjectId
          });

          if (existingResult) {
            // Update existing result
            existingResult.marksObtained = item.marksObtained;
            existingResult.grade = item.grade;
            existingResult.points = item.points;
            existingResult.comment = item.comment;
            existingResult.updatedAt = new Date();

            const savedResult = await existingResult.save();
            results.push(savedResult);
          } else {
            // Create new result
            const newResult = new OLevelResult(item);
            const savedResult = await newResult.save();
            results.push(savedResult);
          }
        } catch (error) {
          processErrors.push(`Error processing O-LEVEL item for student ${item.studentId}: ${error.message}`);
          logToFile(`Error: ${error.message}`);
        }
      }
    }

    // Process A-LEVEL items
    if (aLevelItems.length > 0) {
      logToFile(`Processing ${aLevelItems.length} A-LEVEL items`);

      for (const item of aLevelItems) {
        try {
          // Check if result already exists
          const existingResult = await ALevelResult.findOne({
            studentId: item.studentId,
            examId: item.examId,
            subjectId: item.subjectId
          });

          if (existingResult) {
            // Update existing result
            existingResult.marksObtained = item.marksObtained;
            existingResult.grade = item.grade;
            existingResult.points = item.points;
            existingResult.comment = item.comment;
            existingResult.updatedAt = new Date();

            const savedResult = await existingResult.save();
            results.push(savedResult);
          } else {
            // Create new result
            const newResult = new ALevelResult(item);
            const savedResult = await newResult.save();
            results.push(savedResult);
          }
        } catch (error) {
          processErrors.push(`Error processing A-LEVEL item for student ${item.studentId}: ${error.message}`);
          logToFile(`Error: ${error.message}`);
        }
      }
    }

    logToFile(`Successfully processed ${results.length} results with ${processErrors.length} errors`);

    res.status(201).json({
      message: `Successfully processed ${results.length} results`,
      results,
      errors: [...errors, ...processErrors]
    });
  } catch (error) {
    logToFile(`Error entering batch marks: ${error.message}`);
    res.status(400).json({ message: `Error entering batch marks: ${error.message}` });
  }
});

// Get results by student ID
router.get('/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { examId, academicYearId, examTypeId } = req.query;

    logToFile(`Get student results request: Student=${studentId}, Exam=${examId || 'all'}`);

    // Validate student ID
    if (!studentId) {
      const error = 'Student ID is required';
      logToFile(`Validation error: ${error}`);
      return res.status(400).json({ message: error });
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      const error = `Student not found with ID: ${studentId}`;
      logToFile(`Validation error: ${error}`);
      return res.status(404).json({ message: error });
    }

    // Determine education level
    const educationLevel = student.educationLevel || 'O_LEVEL';
    logToFile(`Student education level: ${educationLevel}`);

    // Build filters
    const filters = { studentId };
    if (examId) filters.examId = examId;
    if (academicYearId) filters.academicYearId = academicYearId;
    if (examTypeId) filters.examTypeId = examTypeId;

    // Get results using the appropriate model
    const ResultModel = educationLevel === 'A_LEVEL' ? ALevelResult : OLevelResult;

    logToFile(`Fetching results with filters: ${JSON.stringify(filters)}`);

    const results = await ResultModel.find(filters)
      .populate('studentId', 'firstName lastName rollNumber')
      .populate('subjectId', 'name code isPrincipal')
      .populate('examId', 'name type')
      .populate('examTypeId', 'name')
      .populate('classId', 'name section stream');

    logToFile(`Found ${results.length} results for student ${studentId}`);
    res.json(results);
  } catch (error) {
    logToFile(`Error fetching student results: ${error.message}`);
    res.status(500).json({ message: `Error fetching student results: ${error.message}` });
  }
});

// Get results by subject ID
router.get('/subject/:subjectId', authenticateToken, async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { classId, examId, academicYearId, examTypeId } = req.query;

    logToFile(`Get subject results request: Subject=${subjectId}, Class=${classId || 'all'}, Exam=${examId || 'all'}`);

    // Validate subject ID
    if (!subjectId) {
      const error = 'Subject ID is required';
      logToFile(`Validation error: ${error}`);
      return res.status(400).json({ message: error });
    }

    // Check if subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      const error = `Subject not found with ID: ${subjectId}`;
      logToFile(`Validation error: ${error}`);
      return res.status(404).json({ message: error });
    }

    // Build filters
    const filters = { subjectId };
    if (classId) filters.classId = classId;
    if (examId) filters.examId = examId;
    if (academicYearId) filters.academicYearId = academicYearId;
    if (examTypeId) filters.examTypeId = examTypeId;

    logToFile(`Fetching results with filters: ${JSON.stringify(filters)}`);

    // Determine education level based on class if provided
    let educationLevel = 'O_LEVEL'; // Default to O_LEVEL
    if (classId) {
      const classObj = await Class.findById(classId);
      if (classObj) {
        // Try to determine education level from the class
        // If class has students, check the first student's education level
        if (classObj.students && classObj.students.length > 0) {
          const student = await Student.findById(classObj.students[0]);
          if (student?.educationLevel) {
            educationLevel = student.educationLevel;
          }
        }
      }
    }

    // Get results using the appropriate model
    const ResultModel = educationLevel === 'A_LEVEL' ? ALevelResult : OLevelResult;

    const results = await ResultModel.find(filters)
      .populate('studentId', 'firstName lastName rollNumber gender')
      .populate('subjectId', 'name code isPrincipal')
      .populate('examId', 'name type')
      .populate('examTypeId', 'name')
      .populate('classId', 'name section stream');

    logToFile(`Found ${results.length} results for subject ${subjectId}`);
    res.json(results);
  } catch (error) {
    logToFile(`Error fetching subject results: ${error.message}`);
    res.status(500).json({ message: `Error fetching subject results: ${error.message}` });
  }
});

// Get results by class ID
router.get('/class/:classId', authenticateToken, async (req, res) => {
  try {
    const { classId } = req.params;
    const { examId, academicYearId, examTypeId } = req.query;

    logToFile(`Get class results request: Class=${classId}, Exam=${examId || 'all'}`);

    // Validate class ID
    if (!classId) {
      const error = 'Class ID is required';
      logToFile(`Validation error: ${error}`);
      return res.status(400).json({ message: error });
    }

    // Check if class exists
    const classObj = await Class.findById(classId);
    if (!classObj) {
      const error = `Class not found with ID: ${classId}`;
      logToFile(`Validation error: ${error}`);
      return res.status(404).json({ message: error });
    }

    // Determine education level
    const educationLevel = classObj.educationLevel || 'O_LEVEL';
    logToFile(`Class education level: ${educationLevel}`);

    // Get all students in the class
    const students = await Student.find({ class: classId });
    if (!students || students.length === 0) {
      const message = `No students found in class with ID: ${classId}`;
      logToFile(message);
      return res.json([]);
    }

    const studentIds = students.map(student => student._id);
    logToFile(`Found ${studentIds.length} students in class ${classId}`);

    // Build filters
    const filters = { studentId: { $in: studentIds } };
    if (examId) filters.examId = examId;
    if (academicYearId) filters.academicYearId = academicYearId;
    if (examTypeId) filters.examTypeId = examTypeId;

    // Get results using the appropriate model
    const ResultModel = educationLevel === 'A_LEVEL' ? ALevelResult : OLevelResult;

    logToFile(`Fetching results with filters: ${JSON.stringify(filters)}`);

    const results = await ResultModel.find(filters)
      .populate('studentId', 'firstName lastName rollNumber')
      .populate('subjectId', 'name code isPrincipal')
      .populate('examId', 'name type')
      .populate('examTypeId', 'name')
      .populate('classId', 'name section stream');

    logToFile(`Found ${results.length} results for class ${classId}`);
    res.json(results);
  } catch (error) {
    logToFile(`Error fetching class results: ${error.message}`);
    res.status(500).json({ message: `Error fetching class results: ${error.message}` });
  }
});

// Monitor and fix result consistency
router.post('/monitor/check-duplicates', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { studentId, examId, subjectId } = req.body;

    logToFile(`Check duplicates request: Student=${studentId}, Exam=${examId}, Subject=${subjectId}`);

    // Validate required fields
    if (!studentId || !examId || !subjectId) {
      const error = 'Missing required fields';
      logToFile(`Validation error: ${error}`);
      return res.status(400).json({ message: error });
    }

    // Check for duplicates
    const result = await resultMonitor.checkForDuplicates(studentId, examId, subjectId);

    logToFile(`Check duplicates result: ${result.message}`);
    res.json(result);
  } catch (error) {
    logToFile(`Error checking duplicates: ${error.message}`);
    res.status(500).json({ message: `Error checking duplicates: ${error.message}` });
  }
});

// Fix duplicate results
router.post('/monitor/fix-duplicates', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { studentId, examId, subjectId } = req.body;

    logToFile(`Fix duplicates request: Student=${studentId}, Exam=${examId}, Subject=${subjectId}`);

    // Validate required fields
    if (!studentId || !examId || !subjectId) {
      const error = 'Missing required fields';
      logToFile(`Validation error: ${error}`);
      return res.status(400).json({ message: error });
    }

    // Fix duplicates
    const result = await resultMonitor.fixDuplicates(studentId, examId, subjectId);

    logToFile(`Fix duplicates result: ${result.message}`);
    res.json(result);
  } catch (error) {
    logToFile(`Error fixing duplicates: ${error.message}`);
    res.status(500).json({ message: `Error fixing duplicates: ${error.message}` });
  }
});

// Check grade and points
router.post('/monitor/check-grade', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { resultId, educationLevel } = req.body;

    logToFile(`Check grade request: Result=${resultId}, Education Level=${educationLevel}`);

    // Validate required fields
    if (!resultId || !educationLevel) {
      const error = 'Missing required fields';
      logToFile(`Validation error: ${error}`);
      return res.status(400).json({ message: error });
    }

    // Check grade and points
    const result = await resultMonitor.checkGradeAndPoints(resultId, educationLevel);

    logToFile(`Check grade result: ${result.message}`);
    res.json(result);
  } catch (error) {
    logToFile(`Error checking grade: ${error.message}`);
    res.status(500).json({ message: `Error checking grade: ${error.message}` });
  }
});

// Fix grade and points
router.post('/monitor/fix-grade', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { resultId, educationLevel } = req.body;

    logToFile(`Fix grade request: Result=${resultId}, Education Level=${educationLevel}`);

    // Validate required fields
    if (!resultId || !educationLevel) {
      const error = 'Missing required fields';
      logToFile(`Validation error: ${error}`);
      return res.status(400).json({ message: error });
    }

    // Fix grade and points
    const result = await resultMonitor.fixGradeAndPoints(resultId, educationLevel);

    logToFile(`Fix grade result: ${result.message}`);
    res.json(result);
  } catch (error) {
    logToFile(`Error fixing grade: ${error.message}`);
    res.status(500).json({ message: `Error fixing grade: ${error.message}` });
  }
});

// Get student result report
router.get('/report/student/:studentId/:examId', authenticateToken, async (req, res) => {
  try {
    const { studentId, examId } = req.params;
    const { educationLevel } = req.query;

    console.log(`GET /api/v2/results/report/student/${studentId}/${examId} - Generating student result report`);
    console.log(`Education level from query: ${educationLevel}`);

    // Find the student to determine education level if not provided
    const student = await Student.findById(studentId);
    if (!student) {
      console.log(`Student not found with ID: ${studentId}`);
      return res.status(404).json({ message: 'Student not found' });
    }

    // Use provided education level or get from student
    const level = educationLevel || student.educationLevel || 'O_LEVEL';
    console.log(`Using education level: ${level}`);

    // Generate report using the service
    await ReportService.generateStudentReport(studentId, examId, res, level);
  } catch (error) {
    console.error(`Error generating student report: ${error.message}`);
    res.status(500).json({ message: `Error generating student report: ${error.message}` });
  }
});

// Get class result report
router.get('/report/class/:classId/:examId', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { classId, examId } = req.params;
    const { educationLevel } = req.query;

    console.log(`GET /api/v2/results/report/class/${classId}/${examId} - Generating class result report`);
    console.log(`Education level from query: ${educationLevel}`);

    // Find the class to determine education level if not provided
    const classObj = await Class.findById(classId);
    if (!classObj) {
      console.log(`Class not found with ID: ${classId}`);
      return res.status(404).json({ message: 'Class not found' });
    }

    // Use provided education level or get from class
    const level = educationLevel || classObj.educationLevel || 'O_LEVEL';
    console.log(`Using education level: ${level}`);

    // Generate report using the service
    await ReportService.generateClassReport(classId, examId, res, level);
  } catch (error) {
    console.error(`Error generating class report: ${error.message}`);
    res.status(500).json({ message: `Error generating class report: ${error.message}` });
  }
});

// Update a result
router.put('/:resultId', authenticateToken, authorizeRole(['admin', 'teacher']), validateResultUpdate, async (req, res) => {
  try {
    const { resultId } = req.params;
    const { educationLevel } = req.body;

    // Update result using the service
    const result = await ResultService.updateResult(resultId, req.body, educationLevel);

    res.json(result);
  } catch (error) {
    res.status(400).json({ message: `Error updating result: ${error.message}` });
  }
});

// Delete a result
router.delete('/:resultId', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { resultId } = req.params;
    const { educationLevel } = req.query;

    // Delete result using the service
    await ResultService.deleteResult(resultId, educationLevel);

    res.json({ message: 'Result deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: `Error deleting result: ${error.message}` });
  }
});

module.exports = router;
