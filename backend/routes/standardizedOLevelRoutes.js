/**
 * Standardized O-Level Routes
 *
 * This file consolidates all O-Level related routes into a single, standardized API.
 * It replaces the fragmented routes in oLevelResultRoutes.js, oLevelReportRoutes.js, and oLevelResultBatchRoutes.js.
 */
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { checkStudentEducationLevel, checkClassEducationLevel } = require('../middleware/educationLevelCheck');
const { checkTeacherAuthorization } = require('../middleware/teacherAuthorization');
const oLevelReportController = require('../controllers/oLevelReportController');
const OLevelResult = require('../models/OLevelResult');
const Student = require('../models/Student');
const oLevelGradeCalculator = require('../utils/oLevelGradeCalculator');
const logger = require('../utils/logger');

/**
 * @route   GET /api/o-level/test
 * @desc    Test endpoint to check if routes are working
 * @access  Public
 */
router.get('/test', (req, res) => {
  logger.info('Standardized O-Level routes test endpoint accessed');
  res.json({
    success: true,
    message: 'Standardized O-Level routes are working',
    version: '1.0.0'
  });
});

/**
 * @route   GET /api/o-level/marks-check-test
 * @desc    Test endpoint to check if marks/check route is working
 * @access  Public
 */
router.get('/marks-check-test', (req, res) => {
  logger.info('Marks check test endpoint accessed');
  console.log('Marks check test endpoint accessed');
  res.json({
    success: true,
    message: 'Marks check test endpoint is working',
    info: 'This confirms that the standardizedOLevelRoutes are properly registered',
    marksCheckEndpoint: '/api/o-level/marks/check'
  });
});

/**
 * @route   GET /api/o-level/reports/student/:studentId/:examId
 * @desc    Get student report with standardized schema
 * @access  Private
 */
router.get('/reports/student/:studentId/:examId',
  authenticateToken,
  checkStudentEducationLevel('O_LEVEL'),
  oLevelReportController.getStudentReport
);

/**
 * @route   GET /api/o-level/reports/class/:classId/:examId
 * @desc    Get class report with standardized schema
 * @access  Private (Admin, Teacher)
 */
router.get('/reports/class/:classId/:examId',
  authenticateToken,
  authorizeRole(['admin', 'teacher']),
  checkClassEducationLevel('O_LEVEL'),
  oLevelReportController.getClassReport
);

/**
 * @route   POST /api/o-level/marks/single
 * @desc    Enter marks for a single O-Level student
 * @access  Private (Admin, Teacher)
 */
router.post('/marks/single',
  authenticateToken,
  authorizeRole(['admin', 'teacher']),
  checkTeacherAuthorization,
  async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get user information for history tracking
      const userId = req.user.id;
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];

      logger.info(`POST /api/o-level/marks/single - Processing O-Level single mark entry`);

      const {
        studentId,
        examId,
        academicYearId,
        examTypeId,
        subjectId,
        classId,
        marksObtained,
        comment
      } = req.body;

      // Validate required fields
      if (!studentId || !examId || !academicYearId || !subjectId || !classId || marksObtained === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Validate marks
      if (isNaN(Number(marksObtained)) || Number(marksObtained) < 0 || Number(marksObtained) > 100) {
        return res.status(400).json({
          success: false,
          message: 'Marks must be a number between 0 and 100'
        });
      }

      // Calculate grade and points
      const { grade, points } = oLevelGradeCalculator.calculateGradeAndPoints(Number(marksObtained));

      // Check if result already exists
      const existingResult = await OLevelResult.findOne({
        studentId,
        examId,
        subjectId,
        academicYearId
      });

      let result;
      if (existingResult) {
        // Store previous values for history tracking
        existingResult.__previousValues = {
          marksObtained: existingResult.marksObtained,
          grade: existingResult.grade,
          points: existingResult.points,
          comment: existingResult.comment
        };

        // Store user information for history tracking
        existingResult.__userId = userId;
        existingResult.__ipAddress = ipAddress;
        existingResult.__userAgent = userAgent;

        // Update existing result
        existingResult.marksObtained = Number(marksObtained);
        existingResult.grade = grade;
        existingResult.points = points;
        existingResult.comment = comment;

        result = await existingResult.save({ session });
        logger.info(`Updated existing O-Level result for student ${studentId}, subject ${subjectId}, exam ${examId}`);
      } else {
        // Create new result
        const newResult = new OLevelResult({
          studentId,
          examId,
          academicYearId,
          examTypeId,
          subjectId,
          classId,
          marksObtained: Number(marksObtained),
          grade,
          points,
          comment,
          // Store user information for history tracking
          __userId: userId,
          __ipAddress: ipAddress,
          __userAgent: userAgent
        });

        result = await newResult.save({ session });
        logger.info(`Created new O-Level result for student ${studentId}, subject ${subjectId}, exam ${examId}`);
      }

      await session.commitTransaction();
      session.endSession();

      res.status(200).json({
        success: true,
        message: 'O-Level mark saved successfully',
        data: result
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      logger.error(`Error saving O-Level mark: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error saving O-Level mark',
        error: error.message
      });
    }
  }
);

/**
 * @route   POST /api/o-level/marks/batch
 * @desc    Enter batch marks for O-Level students
 * @access  Private (Admin, Teacher)
 * @version 2.0.0 - Optimized with bulkWrite operations
 */
router.post('/marks/batch',
  authenticateToken,
  authorizeRole(['admin', 'teacher']),
  checkTeacherAuthorization,
  async (req, res) => {
    // Performance tracking
    const startTime = Date.now();
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get user information for history tracking
      const userId = req.user.id;
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];

      logger.info(`POST /api/o-level/marks/batch - Processing O-Level batch marks entry`);

      // Validate request body
      if (!Array.isArray(req.body) || req.body.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request body. Expected an array of marks.'
        });
      }

      // Batch validation
      const validationResults = validateBatchMarks(req.body);
      if (validationResults.errors.length > 0 && validationResults.validMarks.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'All marks entries contain validation errors',
          errors: validationResults.errors
        });
      }

      // Get all unique student IDs, subject IDs, and exam IDs for batch lookups
      const studentIds = [...new Set(validationResults.validMarks.map(mark => mark.studentId))];
      const subjectIds = [...new Set(validationResults.validMarks.map(mark => mark.subjectId))];
      const examIds = [...new Set(validationResults.validMarks.map(mark => mark.examId))];
      const academicYearIds = [...new Set(validationResults.validMarks.map(mark => mark.academicYearId))];

      // Batch lookup of students to verify education level
      const students = await Student.find({ _id: { $in: studentIds } });
      const studentMap = students.reduce((map, student) => {
        map[student._id.toString()] = student;
        return map;
      }, {});

      // Verify all students are O-Level
      const nonOLevelStudents = students.filter(student => student.educationLevel !== 'O_LEVEL');
      if (nonOLevelStudents.length > 0) {
        nonOLevelStudents.forEach(student => {
          validationResults.errors.push({
            studentId: student._id,
            message: `Student ${student.firstName} ${student.lastName} is not an O-Level student`
          });
        });

        // Filter out non-O-Level students from valid marks
        validationResults.validMarks = validationResults.validMarks.filter(mark => {
          const student = studentMap[mark.studentId];
          return student && student.educationLevel === 'O_LEVEL';
        });
      }

      // Batch lookup of existing results
      const existingResults = await OLevelResult.find({
        studentId: { $in: studentIds },
        subjectId: { $in: subjectIds },
        examId: { $in: examIds },
        academicYearId: { $in: academicYearIds }
      });

      // Create a map of existing results for quick lookup
      const existingResultsMap = {};
      existingResults.forEach(result => {
        const key = `${result.studentId}-${result.subjectId}-${result.examId}-${result.academicYearId}`;
        existingResultsMap[key] = result;
      });

      // Separate marks into updates and inserts
      const updates = [];
      const inserts = [];
      const processedResults = [];

      for (const markData of validationResults.validMarks) {
        const {
          studentId,
          examId,
          academicYearId,
          examTypeId,
          subjectId,
          classId,
          marksObtained,
          comment,
          _id
        } = markData;

        // Calculate grade and points using the centralized utility
        const { grade, points } = oLevelGradeCalculator.calculateGradeAndPoints(Number(marksObtained));

        // Check if this is an update by _id or by lookup
        if (_id) {
          // Update by _id
          const existingResult = existingResults.find(r => r._id.toString() === _id);
          if (existingResult) {
            updates.push({
              updateOne: {
                filter: { _id: existingResult._id },
                update: {
                  $set: {
                    marksObtained: Number(marksObtained),
                    grade,
                    points,
                    comment,
                    updatedAt: Date.now(),
                    __userId: userId,
                    __ipAddress: ipAddress,
                    __userAgent: userAgent,
                    __previousValues: {
                      marksObtained: existingResult.marksObtained,
                      grade: existingResult.grade,
                      points: existingResult.points,
                      comment: existingResult.comment
                    }
                  }
                }
              }
            });
            processedResults.push({
              ...existingResult.toObject(),
              marksObtained: Number(marksObtained),
              grade,
              points,
              comment,
              updatedAt: Date.now()
            });
          } else {
            validationResults.errors.push({
              studentId,
              message: `Result with ID ${_id} not found`
            });
          }
        } else {
          // Check if result already exists by composite key
          const key = `${studentId}-${subjectId}-${examId}-${academicYearId}`;
          const existingResult = existingResultsMap[key];

          if (existingResult) {
            // Update existing result
            updates.push({
              updateOne: {
                filter: { _id: existingResult._id },
                update: {
                  $set: {
                    marksObtained: Number(marksObtained),
                    grade,
                    points,
                    comment,
                    updatedAt: Date.now(),
                    __userId: userId,
                    __ipAddress: ipAddress,
                    __userAgent: userAgent,
                    __previousValues: {
                      marksObtained: existingResult.marksObtained,
                      grade: existingResult.grade,
                      points: existingResult.points,
                      comment: existingResult.comment
                    }
                  }
                }
              }
            });
            processedResults.push({
              ...existingResult.toObject(),
              marksObtained: Number(marksObtained),
              grade,
              points,
              comment,
              updatedAt: Date.now()
            });
          } else {
            // Create new result
            inserts.push({
              studentId,
              examId,
              academicYearId,
              examTypeId,
              subjectId,
              classId,
              marksObtained: Number(marksObtained),
              grade,
              points,
              comment,
              __userId: userId,
              __ipAddress: ipAddress,
              __userAgent: userAgent,
              createdAt: Date.now(),
              updatedAt: Date.now()
            });
          }
        }
      }

      // Execute bulk operations
      let bulkResults = [];

      // Process updates
      if (updates.length > 0) {
        logger.info(`Processing ${updates.length} updates with bulkWrite`);
        const updateResults = await OLevelResult.bulkWrite(updates, { session });
        logger.info(`Updated ${updateResults.modifiedCount} O-Level results`);
      }

      // Process inserts
      if (inserts.length > 0) {
        logger.info(`Processing ${inserts.length} inserts with insertMany`);
        const insertedResults = await OLevelResult.insertMany(inserts, { session });
        bulkResults = [...processedResults, ...insertedResults];
        logger.info(`Inserted ${insertedResults.length} new O-Level results`);
      } else {
        bulkResults = processedResults;
      }

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      // Calculate performance metrics
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      const successCount = bulkResults.length;
      const errorCount = validationResults.errors.length;

      logger.info(`Successfully processed ${successCount} O-Level results with ${errorCount} errors in ${processingTime}ms`);

      // Return response
      res.status(200).json({
        success: true,
        message: `Successfully processed ${successCount} results`,
        successCount,
        errorCount,
        processingTime,
        updateCount: updates.length,
        insertCount: inserts.length,
        errors: validationResults.errors
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      logger.error(`Error processing O-Level batch marks: ${error.message}`);

      res.status(500).json({
        success: false,
        message: 'Error processing batch marks',
        error: error.message
      });
    }
  }
);

/**
 * Validate batch marks data
 * @param {Array} marksData - Array of marks data objects
 * @returns {Object} - Object containing valid marks and errors
 */
function validateBatchMarks(marksData) {
  const validMarks = [];
  const errors = [];

  for (const markData of marksData) {
    const {
      studentId,
      examId,
      academicYearId,
      examTypeId,
      subjectId,
      classId,
      marksObtained
    } = markData;

    // Validate required fields
    if (!studentId || !examId || !academicYearId || !subjectId || !classId || marksObtained === undefined || marksObtained === '') {
      errors.push({
        studentId: studentId || 'unknown',
        message: 'Missing required fields',
        details: 'All of studentId, examId, academicYearId, subjectId, classId, and marksObtained are required'
      });
      continue;
    }

    // Validate studentId format
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      errors.push({
        studentId,
        message: 'Invalid studentId format',
        details: 'studentId must be a valid MongoDB ObjectId'
      });
      continue;
    }

    // Validate marks
    const numericMarks = Number(marksObtained);
    if (isNaN(numericMarks) || numericMarks < 0 || numericMarks > 100) {
      errors.push({
        studentId,
        message: 'Invalid marks value',
        details: 'Marks must be a number between 0 and 100'
      });
      continue;
    }

    // If all validations pass, add to valid marks
    validMarks.push({
      ...markData,
      marksObtained: numericMarks // Convert to number
    });
  }

  return { validMarks, errors };
}

/**
 * @route   GET /api/o-level/marks/check
 * @desc    Check existing marks for a class, subject, and exam
 * @access  Private (Admin, Teacher)
 */
router.get('/marks/check',
  authenticateToken,
  authorizeRole(['admin', 'teacher']),
  async (req, res) => {
    try {
      const { classId, subjectId, examId } = req.query;

      // Log the request for debugging
      logger.info(`GET /api/o-level/marks/check - Request received with params:`, { classId, subjectId, examId });
      console.log(`GET /api/o-level/marks/check - Request received with params:`, { classId, subjectId, examId });

      // Validate required parameters
      if (!classId || !subjectId || !examId) {
        logger.warn(`GET /api/o-level/marks/check - Missing required parameters`);
        return res.status(400).json({
          success: false,
          message: 'Missing required parameters: classId, subjectId, examId'
        });
      }

      logger.info(`GET /api/o-level/marks/check - Checking existing marks for class ${classId}, subject ${subjectId}, exam ${examId}`);

      // Get students in the class
      const students = await Student.find({
        class: classId,
        educationLevel: 'O_LEVEL'
      });

      logger.info(`GET /api/o-level/marks/check - Found ${students.length} O-Level students in class ${classId}`);
      console.log(`GET /api/o-level/marks/check - Found ${students.length} O-Level students in class ${classId}`);

      if (students.length === 0) {
        // Try to find students without the education level filter
        const allStudents = await Student.find({ class: classId });
        logger.info(`GET /api/o-level/marks/check - Found ${allStudents.length} total students in class ${classId}`);
        console.log(`GET /api/o-level/marks/check - Found ${allStudents.length} total students in class ${classId}`);

        if (allStudents.length > 0) {
          // If we found students without the filter, use them instead
          logger.info(`GET /api/o-level/marks/check - Using all students in class regardless of education level`);
          console.log(`GET /api/o-level/marks/check - Using all students in class regardless of education level`);
          students.push(...allStudents);
        } else {
          return res.status(404).json({
            success: false,
            message: 'No students found in this class'
          });
        }
      }

      // Get existing marks
      const results = await OLevelResult.find({
        classId,
        subjectId,
        examId
      });

      logger.info(`GET /api/o-level/marks/check - Found ${results.length} existing marks`);
      console.log(`GET /api/o-level/marks/check - Found ${results.length} existing marks`);

      // Map results to students
      const studentsWithMarks = students.map(student => {
        const result = results.find(r => r.studentId.toString() === student._id.toString());

        // Handle different student name formats
        let studentName = '';
        if (student.name) {
          studentName = student.name;
        } else if (student.firstName && student.lastName) {
          studentName = `${student.firstName} ${student.lastName}`;
        } else if (student.firstName) {
          studentName = student.firstName;
        } else if (student.lastName) {
          studentName = student.lastName;
        } else {
          studentName = `Student ${student._id}`;
        }

        return {
          studentId: student._id,
          studentName,
          name: studentName, // Add name for compatibility
          firstName: student.firstName || '', // Add firstName for compatibility
          lastName: student.lastName || '', // Add lastName for compatibility
          rollNumber: student.rollNumber,
          marksObtained: result ? result.marksObtained : '',
          grade: result ? result.grade : '',
          points: result ? result.points : '',
          comment: result ? result.comment : '',
          resultId: result ? result._id : null,
          _id: result ? result._id : null, // Add _id for compatibility
          hasExistingMarks: !!result
        };
      });

      logger.info(`GET /api/o-level/marks/check - Successfully mapped ${studentsWithMarks.length} students with marks`);
      console.log(`GET /api/o-level/marks/check - Successfully mapped ${studentsWithMarks.length} students with marks`);

      res.status(200).json({
        success: true,
        message: 'Successfully retrieved existing marks',
        studentsWithMarks,
        totalStudents: students.length,
        totalMarksEntered: results.length
      });
    } catch (error) {
      logger.error(`Error checking existing marks: ${error.message}`);
      console.error(`Error checking existing marks:`, error);
      res.status(500).json({
        success: false,
        message: 'Error checking existing marks',
        error: error.message
      });
    }
  }
);

/**
 * @route   GET /api/o-level/marks/student
 * @desc    Check existing marks for a specific student
 * @access  Private (Admin, Teacher)
 */
router.get('/marks/student',
  authenticateToken,
  authorizeRole(['admin', 'teacher']),
  async (req, res) => {
    try {
      const { studentId, subjectId, examId } = req.query;

      // Validate required parameters
      if (!studentId || !subjectId || !examId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required parameters: studentId, subjectId, examId'
        });
      }

      logger.info(`GET /api/o-level/marks/student - Checking existing marks for student ${studentId}, subject ${subjectId}, exam ${examId}`);

      // Get student details
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      // Verify this is an O-Level student
      if (student.educationLevel === 'A_LEVEL') {
        return res.status(400).json({
          success: false,
          message: 'This is not an O-Level student'
        });
      }

      // Check if student has existing marks
      const result = await OLevelResult.findOne({
        studentId,
        subjectId,
        examId
      });

      res.status(200).json({
        success: true,
        studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        hasExistingMarks: !!result,
        marksObtained: result ? result.marksObtained : '',
        grade: result ? result.grade : '',
        points: result ? result.points : '',
        comment: result ? result.comment : '',
        resultId: result ? result._id : null
      });
    } catch (error) {
      logger.error(`Error checking student marks: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error checking student marks',
        error: error.message
      });
    }
  }
);

module.exports = router;
