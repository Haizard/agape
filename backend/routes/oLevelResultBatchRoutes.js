/**
 * O-Level Result Batch Routes
 * Handles API routes for O-Level batch marks entry
 */
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const OLevelResult = require('../models/OLevelResult');
const Student = require('../models/Student');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { checkExistingMarks, preventDuplicateMarks } = require('../middleware/markEntryValidation');
const oLevelGradeCalculator = require('../utils/oLevelGradeCalculator');
const logger = require('../utils/logger');

/**
 * @route   POST /api/o-level-results/batch
 * @desc    Enter batch marks for O-Level students
 * @access  Private (Admin, Teacher)
 */
router.post('/', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Get user information for history tracking
    const userId = req.user.id;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    logger.info(`POST /api/o-level-results/batch - Processing O-Level batch marks entry`);

    // Validate request body
    if (!Array.isArray(req.body) || req.body.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request body. Expected an array of marks.'
      });
    }

    const results = [];
    const errors = [];

    // Process each mark in the batch
    for (const markData of req.body) {
      try {
        const {
          studentId,
          examId,
          academicYearId,
          examTypeId,
          subjectId,
          classId,
          marksObtained,
          grade,
          points,
          comment,
          _id
        } = markData;

        // Validate required fields
        if (!studentId || !examId || !academicYearId || !subjectId || !classId || marksObtained === '') {
          errors.push({
            studentId,
            message: 'Missing required fields'
          });
          continue;
        }

        // Validate marks
        if (isNaN(Number(marksObtained)) || Number(marksObtained) < 0 || Number(marksObtained) > 100) {
          errors.push({
            studentId,
            message: 'Marks must be a number between 0 and 100'
          });
          continue;
        }

        // Calculate grade and points if not provided
        const calculatedGrade = grade || oLevelGradeCalculator.calculateGrade(Number(marksObtained));
        const calculatedPoints = points || oLevelGradeCalculator.calculatePoints(calculatedGrade);

        // Check if result already exists
        let result;
        if (_id) {
          // Update existing result
          result = await OLevelResult.findById(_id);

          if (!result) {
            errors.push({
              studentId,
              message: 'Result not found'
            });
            continue;
          }

          // Store previous values for history tracking
          result.__previousValues = {
            marksObtained: result.marksObtained,
            grade: result.grade,
            points: result.points,
            comment: result.comment
          };

          // Store user information for history tracking
          result.__userId = userId;
          result.__ipAddress = ipAddress;
          result.__userAgent = userAgent;

          // Update result
          result.marksObtained = Number(marksObtained);
          result.grade = calculatedGrade;
          result.points = calculatedPoints;
          result.comment = comment;

          await result.save({ session });
          logger.info(`Updated O-Level result for student ${studentId}, subject ${subjectId}, exam ${examId}`);
        } else {
          // Check if result already exists
          const existingResult = await OLevelResult.findOne({
            studentId,
            examId,
            subjectId,
            academicYearId
          });

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
            existingResult.grade = calculatedGrade;
            existingResult.points = calculatedPoints;
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
              grade: calculatedGrade,
              points: calculatedPoints,
              comment,
              // Store user information for history tracking
              __userId: userId,
              __ipAddress: ipAddress,
              __userAgent: userAgent
            });

            result = await newResult.save({ session });
            logger.info(`Created new O-Level result for student ${studentId}, subject ${subjectId}, exam ${examId}`);
          }
        }

        results.push(result);
      } catch (error) {
        logger.error(`Error processing O-Level mark: ${error.message}`);
        errors.push({
          studentId: markData.studentId,
          message: error.message
        });
      }
    }

    await session.commitTransaction();
    session.endSession();

    logger.info(`Successfully processed ${results.length} O-Level results with ${errors.length} errors`);

    res.status(200).json({
      success: true,
      message: `Successfully processed ${results.length} results`,
      results,
      errors
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
});

module.exports = router;
