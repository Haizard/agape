/**
 * Marks History Service
 * Handles operations related to marks history tracking
 */
const mongoose = require('mongoose');
const MarksHistory = require('../models/MarksHistory');
const OLevelResult = require('../models/OLevelResult');
const ALevelResult = require('../models/ALevelResult');
const logger = require('../utils/logger');

/**
 * Get marks history for a specific result
 * @param {string} resultId - The ID of the result
 * @param {string} resultModel - The model type (OLevelResult or ALevelResult)
 * @returns {Promise<Array>} - Array of history entries
 */
const getHistoryForResult = async (resultId, resultModel) => {
  try {
    // Validate model type
    if (!['OLevelResult', 'ALevelResult'].includes(resultModel)) {
      throw new Error('Invalid result model type');
    }

    // Get history entries for the result
    const history = await MarksHistory.find({ resultId, resultModel })
      .sort({ timestamp: -1 }) // Sort by timestamp in descending order
      .populate('userId', 'name email role') // Populate user details
      .populate('subjectId', 'name code') // Populate subject details
      .populate('examId', 'name startDate endDate') // Populate exam details
      .lean();

    return history;
  } catch (error) {
    logger.error(`Error getting history for result ${resultId}: ${error.message}`);
    throw error;
  }
};

/**
 * Get marks history for a specific student
 * @param {string} studentId - The ID of the student
 * @param {Object} filters - Optional filters (examId, subjectId, etc.)
 * @returns {Promise<Array>} - Array of history entries
 */
const getHistoryForStudent = async (studentId, filters = {}) => {
  try {
    // Build query
    const query = { studentId };

    // Add optional filters
    if (filters.examId) query.examId = filters.examId;
    if (filters.subjectId) query.subjectId = filters.subjectId;
    if (filters.academicYearId) query.academicYearId = filters.academicYearId;
    if (filters.changeType) query.changeType = filters.changeType;
    if (filters.educationLevel) query.educationLevel = filters.educationLevel;

    // Get history entries for the student
    const history = await MarksHistory.find(query)
      .sort({ timestamp: -1 }) // Sort by timestamp in descending order
      .populate('userId', 'name email role') // Populate user details
      .populate('subjectId', 'name code') // Populate subject details
      .populate('examId', 'name startDate endDate') // Populate exam details
      .populate('resultId') // Populate result details
      .lean();

    return history;
  } catch (error) {
    logger.error(`Error getting history for student ${studentId}: ${error.message}`);
    throw error;
  }
};

/**
 * Get marks history for a specific subject
 * @param {string} subjectId - The ID of the subject
 * @param {Object} filters - Optional filters (examId, classId, etc.)
 * @returns {Promise<Array>} - Array of history entries
 */
const getHistoryForSubject = async (subjectId, filters = {}) => {
  try {
    // Build query
    const query = { subjectId };

    // Add optional filters
    if (filters.examId) query.examId = filters.examId;
    if (filters.classId) query.classId = filters.classId;
    if (filters.academicYearId) query.academicYearId = filters.academicYearId;
    if (filters.changeType) query.changeType = filters.changeType;
    if (filters.educationLevel) query.educationLevel = filters.educationLevel;

    // Get history entries for the subject
    const history = await MarksHistory.find(query)
      .sort({ timestamp: -1 }) // Sort by timestamp in descending order
      .populate('userId', 'name email role') // Populate user details
      .populate('studentId', 'firstName lastName rollNumber') // Populate student details
      .populate('examId', 'name startDate endDate') // Populate exam details
      .populate('resultId') // Populate result details
      .lean();

    return history;
  } catch (error) {
    logger.error(`Error getting history for subject ${subjectId}: ${error.message}`);
    throw error;
  }
};

/**
 * Get marks history for a specific exam
 * @param {string} examId - The ID of the exam
 * @param {Object} filters - Optional filters (classId, subjectId, etc.)
 * @returns {Promise<Array>} - Array of history entries
 */
const getHistoryForExam = async (examId, filters = {}) => {
  try {
    // Build query
    const query = { examId };

    // Add optional filters
    if (filters.classId) query.classId = filters.classId;
    if (filters.subjectId) query.subjectId = filters.subjectId;
    if (filters.academicYearId) query.academicYearId = filters.academicYearId;
    if (filters.changeType) query.changeType = filters.changeType;
    if (filters.educationLevel) query.educationLevel = filters.educationLevel;

    // Get history entries for the exam
    const history = await MarksHistory.find(query)
      .sort({ timestamp: -1 }) // Sort by timestamp in descending order
      .populate('userId', 'name email role') // Populate user details
      .populate('studentId', 'firstName lastName rollNumber') // Populate student details
      .populate('subjectId', 'name code') // Populate subject details
      .populate('resultId') // Populate result details
      .lean();

    return history;
  } catch (error) {
    logger.error(`Error getting history for exam ${examId}: ${error.message}`);
    throw error;
  }
};

/**
 * Revert a result to a previous state
 * @param {string} historyId - The ID of the history entry to revert to
 * @param {Object} userData - User data for tracking the revert action
 * @returns {Promise<Object>} - The updated result
 */
const revertToHistoryEntry = async (historyId, userData) => {
  try {
    // Get the history entry
    const historyEntry = await MarksHistory.findById(historyId);
    if (!historyEntry) {
      throw new Error('History entry not found');
    }

    // Determine which model to use
    const ResultModel = historyEntry.resultModel === 'OLevelResult' ? OLevelResult : ALevelResult;

    // Get the current result
    const currentResult = await ResultModel.findById(historyEntry.resultId);
    if (!currentResult) {
      throw new Error('Result not found');
    }

    // Store previous values for history tracking
    const previousValues = {
      marksObtained: currentResult.marksObtained,
      grade: currentResult.grade,
      points: currentResult.points,
      comment: currentResult.comment
    };

    // If it's an A-Level result, also store isPrincipal
    if (historyEntry.resultModel === 'ALevelResult') {
      previousValues.isPrincipal = currentResult.isPrincipal;
    }

    // Set metadata for history tracking
    currentResult.__previousValues = previousValues;
    currentResult.__userId = userData.userId;
    currentResult.__ipAddress = userData.ipAddress;
    currentResult.__userAgent = userData.userAgent;

    // Update the result with values from the history entry
    if (historyEntry.changeType === 'CREATE' || historyEntry.changeType === 'UPDATE') {
      // Use the newValues from the history entry
      currentResult.marksObtained = historyEntry.newValues.marksObtained;
      currentResult.grade = historyEntry.newValues.grade;
      currentResult.points = historyEntry.newValues.points;
      currentResult.comment = historyEntry.newValues.comment;

      // If it's an A-Level result, also update isPrincipal
      if (historyEntry.resultModel === 'ALevelResult' && historyEntry.newValues.isPrincipal !== undefined) {
        currentResult.isPrincipal = historyEntry.newValues.isPrincipal;
      }
    } else if (historyEntry.changeType === 'DELETE') {
      // Use the previousValues from the history entry
      currentResult.marksObtained = historyEntry.previousValues.marksObtained;
      currentResult.grade = historyEntry.previousValues.grade;
      currentResult.points = historyEntry.previousValues.points;
      currentResult.comment = historyEntry.previousValues.comment;

      // If it's an A-Level result, also update isPrincipal
      if (historyEntry.resultModel === 'ALevelResult' && historyEntry.previousValues.isPrincipal !== undefined) {
        currentResult.isPrincipal = historyEntry.previousValues.isPrincipal;
      }
    }

    // Save the updated result
    await currentResult.save();

    // Create a new history entry for the revert action
    const revertHistoryEntry = new MarksHistory({
      resultId: currentResult._id,
      resultModel: historyEntry.resultModel,
      studentId: currentResult.studentId,
      subjectId: currentResult.subjectId,
      examId: currentResult.examId,
      academicYearId: currentResult.academicYearId,
      classId: currentResult.classId,
      userId: userData.userId,
      changeType: 'UPDATE',
      previousValues,
      newValues: historyEntry.resultModel === 'ALevelResult' ? {
        marksObtained: currentResult.marksObtained,
        grade: currentResult.grade,
        points: currentResult.points,
        comment: currentResult.comment,
        isPrincipal: currentResult.isPrincipal
      } : {
        marksObtained: currentResult.marksObtained,
        grade: currentResult.grade,
        points: currentResult.points,
        comment: currentResult.comment
      },
      educationLevel: historyEntry.educationLevel,
      ipAddress: userData.ipAddress,
      userAgent: userData.userAgent
    });

    await revertHistoryEntry.save();
    logger.info(`Reverted result ${currentResult._id} to history entry ${historyId}`);

    return currentResult;
  } catch (error) {
    logger.error(`Error reverting to history entry ${historyId}: ${error.message}`);
    throw error;
  }
};

module.exports = {
  getHistoryForResult,
  getHistoryForStudent,
  getHistoryForSubject,
  getHistoryForExam,
  revertToHistoryEntry
};
