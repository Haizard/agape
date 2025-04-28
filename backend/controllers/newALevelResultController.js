/**
 * New A-Level Result Controller
 *
 * This controller handles all operations related to A-Level results
 * with improved error handling and validation.
 */
const mongoose = require('mongoose');
const NewALevelResult = require('../models/NewALevelResult');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const Exam = require('../models/Exam');
const logger = require('../utils/logger');

/**
 * Create a new A-Level result
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createResult = async (req, res) => {
  try {
    const {
      studentId,
      examId,
      academicYearId,
      examTypeId,
      subjectId,
      classId,
      marksObtained,
      comment,
      isPrincipal,
      isInCombination
    } = req.body;

    // Validate required fields
    if (!studentId || !examId || !subjectId || !classId || marksObtained === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        requiredFields: ['studentId', 'examId', 'subjectId', 'classId', 'marksObtained']
      });
    }

    // Validate student is A-Level
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (student.educationLevel !== 'A_LEVEL') {
      return res.status(400).json({
        success: false,
        message: 'Student is not an A-Level student',
        educationLevel: student.educationLevel
      });
    }

    // Create a new result
    const result = new NewALevelResult({
      studentId,
      examId,
      academicYearId,
      examTypeId,
      subjectId,
      classId,
      marksObtained,
      comment,
      isPrincipal: isPrincipal || false,
      isInCombination: isInCombination !== undefined ? isInCombination : true,
      createdBy: req.user ? req.user.id : null
    });

    // Save the result
    await result.save();

    // Return success response
    res.status(201).json({
      success: true,
      message: 'A-Level result created successfully',
      data: result
    });
  } catch (error) {
    // Check for duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Result already exists for this student, exam, and subject',
        error: 'Duplicate entry'
      });
    }

    logger.error(`Error creating A-Level result: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error creating A-Level result',
      error: error.message
    });
  }
};

/**
 * Get all A-Level results
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAllResults = async (req, res) => {
  try {
    const results = await NewALevelResult.find()
      .populate('studentId', 'firstName lastName')
      .populate('examId', 'name')
      .populate('subjectId', 'name')
      .populate('classId', 'name');

    res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    logger.error(`Error fetching A-Level results: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error fetching A-Level results',
      error: error.message
    });
  }
};

/**
 * Get A-Level results by student ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getResultsByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const results = await NewALevelResult.find({ studentId })
      .populate('examId', 'name')
      .populate('subjectId', 'name')
      .populate('classId', 'name');

    res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    logger.error(`Error fetching A-Level results by student: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error fetching A-Level results by student',
      error: error.message
    });
  }
};

/**
 * Get A-Level results by exam ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getResultsByExam = async (req, res) => {
  try {
    const { examId } = req.params;

    const results = await NewALevelResult.find({ examId })
      .populate('studentId', 'firstName lastName')
      .populate('subjectId', 'name')
      .populate('classId', 'name');

    res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    logger.error(`Error fetching A-Level results by exam: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error fetching A-Level results by exam',
      error: error.message
    });
  }
};

/**
 * Get A-Level results by student ID and exam ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getResultsByStudentAndExam = async (req, res) => {
  try {
    const { studentId, examId } = req.params;

    // Log the query parameters
    console.log('[DEBUG] getResultsByStudentAndExam query:', { studentId, examId });

    const results = await NewALevelResult.findByStudentAndExam(studentId, examId);

    // Log the results found
    console.log('[DEBUG] getResultsByStudentAndExam results:', results);

    // Calculate total points and division
    const { totalPoints, division } = await NewALevelResult.calculateTotalPoints(studentId, examId);

    res.status(200).json({
      success: true,
      count: results.length,
      totalPoints,
      division,
      data: results
    });
  } catch (error) {
    logger.error(`Error fetching A-Level results by student and exam: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error fetching A-Level results by student and exam',
      error: error.message
    });
  }
};

/**
 * Update an A-Level result
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateResult = async (req, res) => {
  try {
    const { id } = req.params;
    const { marksObtained, comment, isPrincipal } = req.body;

    // Find the result
    const result = await NewALevelResult.findById(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'A-Level result not found'
      });
    }

    // Update fields
    if (marksObtained !== undefined) result.marksObtained = marksObtained;
    if (comment !== undefined) result.comment = comment;
    if (isPrincipal !== undefined) result.isPrincipal = isPrincipal;

    // Set updated by
    if (req.user) result.updatedBy = req.user.id;

    // Save the result
    await result.save();

    res.status(200).json({
      success: true,
      message: 'A-Level result updated successfully',
      data: result
    });
  } catch (error) {
    logger.error(`Error updating A-Level result: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error updating A-Level result',
      error: error.message
    });
  }
};

/**
 * Delete an A-Level result
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteResult = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await NewALevelResult.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'A-Level result not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'A-Level result deleted successfully'
    });
  } catch (error) {
    logger.error(`Error deleting A-Level result: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error deleting A-Level result',
      error: error.message
    });
  }
};

/**
 * Batch create A-Level results
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.batchCreateResults = async (req, res) => {
  // Track performance
  const startTime = Date.now();
  const results = [];
  const errors = [];

  // Log the incoming payload for debugging
  console.log('[DEBUG] Incoming batchCreateResults payload:', JSON.stringify(req.body, null, 2));

  try {
    for (const [i, mark] of req.body.entries()) {
      try {
        // Log each mark before processing
        console.log(`[DEBUG] Processing mark #${i + 1}:`, mark);

        // Validate required fields
        if (!mark.studentId || !mark.examId || !mark.subjectId || !mark.classId || mark.marksObtained === undefined) {
          const errorMsg = `[ERROR] Missing required fields for mark #${i + 1}: ${JSON.stringify(mark)}`;
          console.error(errorMsg);
          errors.push({ mark, error: errorMsg });
          continue;
        }

        // Convert all string IDs to ObjectId
        const studentId = new mongoose.Types.ObjectId(mark.studentId);
        const examId = new mongoose.Types.ObjectId(mark.examId);
        const subjectId = new mongoose.Types.ObjectId(mark.subjectId);
        const classId = new mongoose.Types.ObjectId(mark.classId);
        const academicYearId = mark.academicYearId ? new mongoose.Types.ObjectId(mark.academicYearId) : undefined;
        const examTypeId = mark.examTypeId ? new mongoose.Types.ObjectId(mark.examTypeId) : undefined;

        // Validate student is A-Level
        const student = await Student.findById(studentId);
        if (!student) {
          const errorMsg = `[ERROR] Student not found for mark #${i + 1}: ${mark.studentId}`;
          console.error(errorMsg);
          errors.push({ mark, error: errorMsg });
          continue;
        }
        if (student.educationLevel !== 'A_LEVEL') {
          const errorMsg = `[ERROR] Student is not A-Level for mark #${i + 1}: ${mark.studentId}`;
          console.error(errorMsg);
          errors.push({ mark, error: errorMsg });
          continue;
        }

        // Upsert (update if exists, otherwise create)
        const upsertData = {
          studentId,
          examId,
          academicYearId,
          examTypeId,
          subjectId,
          classId,
          marksObtained: mark.marksObtained,
          comment: mark.comment,
          isPrincipal: mark.isPrincipal || false,
          isInCombination: mark.isInCombination !== undefined ? mark.isInCombination : true,
          updatedAt: new Date(),
          updatedBy: req.user ? req.user.id : null
        };
        const savedResult = await NewALevelResult.findOneAndUpdate(
          { studentId, examId, subjectId },
          { $set: upsertData, $setOnInsert: { createdBy: req.user ? req.user.id : null, createdAt: new Date() } },
          { new: true, upsert: true }
        );
        console.log('[DEBUG] Upserted result:', savedResult);
        results.push(savedResult);
      } catch (error) {
        // Check for duplicate key error
        if (error.code === 11000) {
          const errorMsg = `[ERROR] Duplicate entry for mark #${i + 1}: ${JSON.stringify(mark)}`;
          console.error(errorMsg);
          errors.push({ mark, error: 'Duplicate entry', message: errorMsg });
        } else {
          const errorMsg = `[ERROR] Exception for mark #${i + 1}: ${error.message}`;
          console.error(errorMsg);
          errors.push({ mark, error: error.message, message: errorMsg });
        }
      }
    }

    // Calculate performance metrics
    const endTime = Date.now();
    const processingTime = endTime - startTime;

    // Log the final results and errors
    console.log(`[DEBUG] Batch create finished. Saved: ${results.length}, Errors: ${errors.length}`);
    if (errors.length > 0) {
      console.log('[DEBUG] Errors:', JSON.stringify(errors, null, 2));
    }

    // Return response
    res.status(201).json({
      success: true,
      message: `Processed ${req.body.length} marks, saved ${results.length} successfully`,
      savedCount: results.length,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      results,
      performance: {
        totalTime: processingTime,
        marksPerSecond: (results.length / processingTime) * 1000
      }
    });
  } catch (error) {
    console.error(`[ERROR] Error in batch creating A-Level results: ${error.message}`);
    logger.error(`Error in batch creating A-Level results: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error in batch creating A-Level results',
      error: error.message
    });
  }
};
