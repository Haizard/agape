/**
 * Legacy A-Level Result Batch Routes
 * Handles API routes for A-Level batch marks entry using the old version's approach
 */
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ALevelResult = require('../models/ALevelResult');
const Student = require('../models/Student');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const aLevelGradeCalculator = require('../utils/aLevelGradeCalculator');
const logger = require('../utils/logger');

/**
 * @route   POST /api/legacy-a-level-results/batch
 * @desc    Enter batch marks for A-Level students using the old version's approach
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

    logger.info(`POST /api/legacy-a-level-results/batch - Processing A-Level batch marks entry`);

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
          isPrincipal,
          _id
        } = markData;

        // Validate required fields
        if (!studentId || !examId || !subjectId || !classId || marksObtained === undefined || marksObtained === '') {
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
        const calculatedGrade = grade || aLevelGradeCalculator.calculateGrade(Number(marksObtained));
        const calculatedPoints = points || aLevelGradeCalculator.calculatePoints(calculatedGrade);

        // Check if result already exists
        let result;
        if (_id) {
          // Update existing result
          result = await ALevelResult.findById(_id);

          if (!result) {
            errors.push({
              studentId,
              message: 'Result not found'
            });
            continue;
          }

          // Update result
          result.marksObtained = Number(marksObtained);
          result.grade = calculatedGrade;
          result.points = calculatedPoints;
          result.comment = comment || '';
          result.isPrincipal = isPrincipal === true;
          result.updatedAt = Date.now();

          // Save result
          await result.save({ session });

          logger.info(`Updated A-Level result: ${result._id}`);
        } else {
          // Create new result
          result = new ALevelResult({
            studentId,
            examId,
            academicYearId: academicYearId || examId, // Fallback to examId if academicYearId is not provided
            examTypeId: examTypeId || examId, // Fallback to examId if examTypeId is not provided
            subjectId,
            classId,
            marksObtained: Number(marksObtained),
            grade: calculatedGrade,
            points: calculatedPoints,
            comment: comment || '',
            isPrincipal: isPrincipal === true,
            createdBy: userId,
            createdAt: Date.now(),
            updatedAt: Date.now()
          });

          // Save result
          await result.save({ session });

          logger.info(`Created A-Level result: ${result._id}`);
        }

        results.push(result);
      } catch (error) {
        logger.error(`Error processing A-Level mark: ${error.message}`);
        errors.push({
          studentId: markData.studentId,
          message: error.message
        });
      }
    }

    await session.commitTransaction();
    session.endSession();

    logger.info(`Successfully processed ${results.length} A-Level results with ${errors.length} errors`);

    res.status(200).json({
      success: true,
      message: `Successfully processed ${results.length} results`,
      results,
      savedMarks: results,  // Include the saved marks with their IDs
      errors
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    logger.error(`Error processing A-Level batch marks: ${error.message}`);

    res.status(500).json({
      success: false,
      message: 'Error processing batch marks',
      error: error.message
    });
  }
});

module.exports = router;
