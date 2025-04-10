const OLevelResult = require('../models/OLevelResult');
const ALevelResult = require('../models/ALevelResult');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Exam = require('../models/Exam');
const AcademicYear = require('../models/AcademicYear');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Setup logging
const logFile = path.join(logDir, `results_${new Date().toISOString().split('T')[0]}.log`);
const logToFile = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logFile, logMessage);
};

/**
 * Service to handle result operations with automatic model selection based on education level
 */
class ResultService {
  /**
   * Get the appropriate Result model based on education level
   * @param {String} educationLevel - The education level ('O_LEVEL' or 'A_LEVEL')
   * @returns {Model} - The appropriate Mongoose model
   */
  static getResultModel(educationLevel) {
    if (educationLevel === 'A_LEVEL') {
      return ALevelResult;
    }
    return OLevelResult; // Default to O_LEVEL
  }

  /**
   * Determine the education level for a student
   * @param {String} studentId - The student ID
   * @returns {Promise<String>} - The education level ('O_LEVEL' or 'A_LEVEL')
   */
  static async getStudentEducationLevel(studentId) {
    try {
      const student = await Student.findById(studentId);
      if (!student) {
        throw new Error(`Student not found with ID: ${studentId}`);
      }
      return student.educationLevel || 'O_LEVEL';
    } catch (error) {
      console.error(`Error getting student education level: ${error.message}`);
      throw error;
    }
  }

  /**
   * Determine the education level for a class
   * @param {String} classId - The class ID
   * @returns {Promise<String>} - The education level ('O_LEVEL' or 'A_LEVEL')
   */
  static async getClassEducationLevel(classId) {
    try {
      const classObj = await Class.findById(classId);
      if (!classObj) {
        throw new Error(`Class not found with ID: ${classId}`);
      }
      return classObj.educationLevel || 'O_LEVEL';
    } catch (error) {
      console.error(`Error getting class education level: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate result data
   * @param {Object} resultData - The result data to validate
   * @returns {Promise<Object>} - The validated result data
   * @throws {Error} - If validation fails
   */
  static async validateResultData(resultData) {
    // Check required fields
    const requiredFields = ['studentId', 'examId', 'subjectId', 'marksObtained'];
    for (const field of requiredFields) {
      if (!resultData[field]) {
        const error = new Error(`Missing required field: ${field}`);
        logToFile(`Validation error: ${error.message}`);
        throw error;
      }
    }

    // Validate student exists
    if (resultData.studentId) {
      const student = await Student.findById(resultData.studentId);
      if (!student) {
        const error = new Error(`Student not found with ID: ${resultData.studentId}`);
        logToFile(`Validation error: ${error.message}`);
        throw error;
      }
    }

    // Validate exam exists
    if (resultData.examId) {
      const exam = await Exam.findById(resultData.examId);
      if (!exam) {
        const error = new Error(`Exam not found with ID: ${resultData.examId}`);
        logToFile(`Validation error: ${error.message}`);
        throw error;
      }
    }

    // Validate subject exists
    if (resultData.subjectId) {
      const subject = await Subject.findById(resultData.subjectId);
      if (!subject) {
        const error = new Error(`Subject not found with ID: ${resultData.subjectId}`);
        logToFile(`Validation error: ${error.message}`);
        throw error;
      }
    }

    // Validate marks range
    if (resultData.marksObtained !== undefined) {
      const marks = parseFloat(resultData.marksObtained);
      if (isNaN(marks) || marks < 0 || marks > 100) {
        const error = new Error(`Invalid marks: ${resultData.marksObtained}. Marks must be between 0 and 100.`);
        logToFile(`Validation error: ${error.message}`);
        throw error;
      }
      // Ensure marks is a number
      resultData.marksObtained = marks;
    }

    // Determine education level if not provided
    if (!resultData.educationLevel) {
      resultData.educationLevel = await ResultService.getStudentEducationLevel(resultData.studentId);
    }

    // Calculate grade and points if not provided
    if (!resultData.grade || !resultData.points) {
      const { grade, points } = ResultService.calculateGradeAndPoints(resultData.marksObtained, resultData.educationLevel);
      resultData.grade = grade;
      resultData.points = points;
    }

    return resultData;
  }

  /**
   * Calculate grade and points based on marks and education level
   * @param {Number} marks - The marks obtained
   * @param {String} educationLevel - The education level ('O_LEVEL' or 'A_LEVEL')
   * @returns {Object} - The grade and points
   */
  static calculateGradeAndPoints(marks, educationLevel) {
    let grade, points;

    if (educationLevel === 'A_LEVEL') {
      // A-LEVEL grading
      if (marks >= 80) { grade = 'A'; points = 1; }
      else if (marks >= 70) { grade = 'B'; points = 2; }
      else if (marks >= 60) { grade = 'C'; points = 3; }
      else if (marks >= 50) { grade = 'D'; points = 4; }
      else if (marks >= 40) { grade = 'E'; points = 5; }
      else if (marks >= 35) { grade = 'S'; points = 6; }
      else { grade = 'F'; points = 7; }
    } else {
      // O-LEVEL grading
      if (marks >= 75) { grade = 'A'; points = 1; }
      else if (marks >= 65) { grade = 'B'; points = 2; }
      else if (marks >= 50) { grade = 'C'; points = 3; }
      else if (marks >= 30) { grade = 'D'; points = 4; }
      else { grade = 'F'; points = 5; }
    }

    return { grade, points };
  }

  /**
   * Create a new result
   * @param {Object} resultData - The result data
   * @returns {Promise<Object>} - The created result
   */
  static async createResult(resultData) {
    try {
      // Validate result data
      const validatedData = await ResultService.validateResultData(resultData);

      // Get the appropriate model
      const ResultModel = ResultService.getResultModel(validatedData.educationLevel);

      // Create and save the result
      const result = new ResultModel(validatedData);
      await result.save();

      // Log the creation
      logToFile(`Created result: ${result._id} for student ${validatedData.studentId}, subject ${validatedData.subjectId}, exam ${validatedData.examId}`);

      return result;
    } catch (error) {
      console.error(`Error creating result: ${error.message}`);
      logToFile(`Error creating result: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update an existing result
   * @param {String} resultId - The result ID
   * @param {Object} resultData - The updated result data
   * @param {String} educationLevel - The education level ('O_LEVEL' or 'A_LEVEL')
   * @returns {Promise<Object>} - The updated result
   */
  static async updateResult(resultId, resultData, educationLevel) {
    try {
      // Determine education level if not provided
      const effectiveEducationLevel = educationLevel ||
        (resultData.studentId ? await ResultService.getStudentEducationLevel(resultData.studentId) : 'O_LEVEL');

      // Get the appropriate model
      const ResultModel = ResultService.getResultModel(effectiveEducationLevel);

      // Check if result exists
      const existingResult = await ResultModel.findById(resultId);
      if (!existingResult) {
        const error = new Error(`Result not found with ID: ${resultId}`);
        logToFile(`Error updating result: ${error.message}`);
        throw error;
      }

      // Merge existing data with updates
      const mergedData = { ...existingResult.toObject(), ...resultData };

      // Validate the merged data
      const validatedData = await ResultService.validateResultData(mergedData);

      // Update the result
      const result = await ResultModel.findByIdAndUpdate(
        resultId,
        validatedData,
        { new: true, runValidators: true }
      );

      // Log the update
      logToFile(`Updated result: ${result._id} for student ${validatedData.studentId}, subject ${validatedData.subjectId}, exam ${validatedData.examId}`);

      return result;
    } catch (error) {
      console.error(`Error updating result: ${error.message}`);
      logToFile(`Error updating result: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get results for a student
   * @param {String} studentId - The student ID
   * @param {Object} filters - Additional filters (examId, academicYearId, etc.)
   * @returns {Promise<Array>} - The student's results
   */
  static async getStudentResults(studentId, filters = {}) {
    try {
      // Validate student ID
      if (!studentId) {
        const error = new Error('Student ID is required');
        logToFile(`Error getting student results: ${error.message}`);
        throw error;
      }

      // Check if student exists
      const student = await Student.findById(studentId);
      if (!student) {
        const error = new Error(`Student not found with ID: ${studentId}`);
        logToFile(`Error getting student results: ${error.message}`);
        throw error;
      }

      // Determine education level
      const educationLevel = student.educationLevel || 'O_LEVEL';

      // Get the appropriate model
      const ResultModel = ResultService.getResultModel(educationLevel);

      // Build query
      const query = { studentId, ...filters };

      // Log the query
      logToFile(`Fetching results for student ${studentId} with filters: ${JSON.stringify(filters)}`);

      // Get results
      const results = await ResultModel.find(query)
        .populate('studentId', 'firstName lastName rollNumber')
        .populate('subjectId', 'name code isPrincipal')
        .populate('examId', 'name type')
        .populate('examTypeId', 'name')
        .populate('classId', 'name section stream');

      // Log the results count
      logToFile(`Found ${results.length} results for student ${studentId}`);

      return results;
    } catch (error) {
      console.error(`Error getting student results: ${error.message}`);
      logToFile(`Error getting student results: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get results for a class
   * @param {String} classId - The class ID
   * @param {Object} filters - Additional filters (examId, academicYearId, etc.)
   * @returns {Promise<Array>} - The class results
   */
  static async getClassResults(classId, filters = {}) {
    try {
      // Validate class ID
      if (!classId) {
        const error = new Error('Class ID is required');
        logToFile(`Error getting class results: ${error.message}`);
        throw error;
      }

      // Check if class exists
      const classObj = await Class.findById(classId);
      if (!classObj) {
        const error = new Error(`Class not found with ID: ${classId}`);
        logToFile(`Error getting class results: ${error.message}`);
        throw error;
      }

      // Determine education level
      const educationLevel = classObj.educationLevel || 'O_LEVEL';

      // Get the appropriate model
      const ResultModel = ResultService.getResultModel(educationLevel);

      // Get all students in the class
      const students = await Student.find({ class: classId });
      const studentIds = students.map(student => student._id);

      // Build query
      const query = {
        studentId: { $in: studentIds },
        ...filters
      };

      // Log the query
      logToFile(`Fetching results for class ${classId} with filters: ${JSON.stringify(filters)}`);

      // Get results
      const results = await ResultModel.find(query)
        .populate('studentId', 'firstName lastName rollNumber')
        .populate('subjectId', 'name code isPrincipal')
        .populate('examId', 'name type')
        .populate('examTypeId', 'name')
        .populate('classId', 'name section stream');

      // Log the results count
      logToFile(`Found ${results.length} results for class ${classId}`);

      return results;
    } catch (error) {
      console.error(`Error getting class results: ${error.message}`);
      logToFile(`Error getting class results: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a result
   * @param {String} resultId - The result ID
   * @param {String} educationLevel - The education level ('O_LEVEL' or 'A_LEVEL')
   * @returns {Promise<Boolean>} - True if deleted successfully
   */
  static async deleteResult(resultId, educationLevel) {
    try {
      // Validate result ID
      if (!resultId) {
        const error = new Error('Result ID is required');
        logToFile(`Error deleting result: ${error.message}`);
        throw error;
      }

      // Validate education level
      if (!educationLevel) {
        const error = new Error('Education level is required');
        logToFile(`Error deleting result: ${error.message}`);
        throw error;
      }

      // Get the appropriate model
      const ResultModel = ResultService.getResultModel(educationLevel);

      // Log the deletion attempt
      logToFile(`Attempting to delete result ${resultId} from ${educationLevel} model`);

      // Delete the result
      const result = await ResultModel.findByIdAndDelete(resultId);

      if (!result) {
        const error = new Error(`Result not found with ID: ${resultId}`);
        logToFile(`Error deleting result: ${error.message}`);
        throw error;
      }

      // Log the successful deletion
      logToFile(`Successfully deleted result ${resultId} from ${educationLevel} model`);

      return true;
    } catch (error) {
      console.error(`Error deleting result: ${error.message}`);
      logToFile(`Error deleting result: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create multiple results in a batch
   * @param {Array} resultsData - Array of result data objects
   * @returns {Promise<Array>} - The created results
   */
  static async createBatchResults(resultsData) {
    try {
      // Validate input
      if (!resultsData || !Array.isArray(resultsData) || resultsData.length === 0) {
        const error = new Error('Invalid or empty results data');
        logToFile(`Error creating batch results: ${error.message}`);
        throw error;
      }

      // Log the batch operation
      logToFile(`Starting batch creation of ${resultsData.length} results`);

      const createdResults = [];
      const validatedResults = [];

      // Validate each result and determine education level
      for (const resultData of resultsData) {
        try {
          // Validate the result data
          const validatedData = await ResultService.validateResultData(resultData);
          validatedResults.push(validatedData);
        } catch (validationError) {
          logToFile(`Skipping invalid result: ${validationError.message}`);
          // Continue with other results instead of failing the whole batch
          continue;
        }
      }

      // Group results by education level
      const oLevelResults = validatedResults.filter(result => result.educationLevel !== 'A_LEVEL');
      const aLevelResults = validatedResults.filter(result => result.educationLevel === 'A_LEVEL');

      // Process O-LEVEL results
      if (oLevelResults.length > 0) {
        logToFile(`Creating ${oLevelResults.length} O-LEVEL results`);
        const oLevelCreated = await OLevelResult.insertMany(oLevelResults);
        createdResults.push(...oLevelCreated);
        logToFile(`Successfully created ${oLevelCreated.length} O-LEVEL results`);
      }

      // Process A-LEVEL results
      if (aLevelResults.length > 0) {
        logToFile(`Creating ${aLevelResults.length} A-LEVEL results`);
        const aLevelCreated = await ALevelResult.insertMany(aLevelResults);
        createdResults.push(...aLevelCreated);
        logToFile(`Successfully created ${aLevelCreated.length} A-LEVEL results`);
      }

      // Log the summary
      logToFile(`Batch creation completed: ${createdResults.length} results created out of ${resultsData.length} requested`);

      return createdResults;
    } catch (error) {
      console.error(`Error creating batch results: ${error.message}`);
      logToFile(`Error creating batch results: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ResultService;
