/**
 * Result Service
 *
 * This service handles all result-related operations, including:
 * - Creating and retrieving results
 * - Entering marks
 * - Calculating grades and points
 *
 * It supports both O-Level and A-Level results through a unified interface.
 */

const Result = require('../models/Result');
const OLevelResult = require('../models/OLevelResult');
const ALevelResult = require('../models/ALevelResult');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Exam = require('../models/Exam');
const AcademicYear = require('../models/AcademicYear');
const mongoose = require('mongoose');
const { EDUCATION_LEVELS } = require('../constants/apiEndpoints');
const logger = require('../utils/logger');
const gradeCalculator = require('../utils/gradeCalculator');

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
    if (educationLevel === EDUCATION_LEVELS.A_LEVEL) {
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
      return student.educationLevel || EDUCATION_LEVELS.O_LEVEL;
    } catch (error) {
      logger.error(`Error getting student education level: ${error.message}`);
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
      return classObj.educationLevel || EDUCATION_LEVELS.O_LEVEL;
    } catch (error) {
      logger.error(`Error getting class education level: ${error.message}`);
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
        logger.error(`Validation error: ${error.message}`);
        throw error;
      }
    }

    // Validate student exists
    let student;
    if (resultData.studentId) {
      student = await Student.findById(resultData.studentId);
      if (!student) {
        const error = new Error(`Student not found with ID: ${resultData.studentId}`);
        logger.error(`Validation error: ${error.message}`);
        throw error;
      }
    }

    // Validate exam exists
    if (resultData.examId) {
      const exam = await Exam.findById(resultData.examId);
      if (!exam) {
        const error = new Error(`Exam not found with ID: ${resultData.examId}`);
        logger.error(`Validation error: ${error.message}`);
        throw error;
      }
    }

    // Validate subject exists
    let subject;
    if (resultData.subjectId) {
      subject = await Subject.findById(resultData.subjectId);
      if (!subject) {
        const error = new Error(`Subject not found with ID: ${resultData.subjectId}`);
        logger.error(`Validation error: ${error.message}`);
        throw error;
      }
    }

    // Validate marks range
    if (resultData.marksObtained !== undefined) {
      const marks = Number.parseFloat(resultData.marksObtained);
      if (Number.isNaN(marks) || marks < 0 || marks > 100) {
        const error = new Error(`Invalid marks: ${resultData.marksObtained}. Marks must be between 0 and 100.`);
        logger.error(`Validation error: ${error.message}`);
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

    // Handle isPrincipal flag for A-Level results
    if (resultData.educationLevel === EDUCATION_LEVELS.A_LEVEL) {
      // If isPrincipal is not explicitly set, check the subject's isPrincipal flag
      if (resultData.isPrincipal === undefined && subject) {
        resultData.isPrincipal = subject.isPrincipal === true;
        logger.info(`Using subject's isPrincipal flag for ${subject.name}: ${resultData.isPrincipal}`);
      }

      // Ensure isPrincipal is a boolean
      resultData.isPrincipal = resultData.isPrincipal === true;

      // Log the isPrincipal flag
      logger.info(`Subject ${resultData.subjectId} is ${resultData.isPrincipal ? 'a principal' : 'a subsidiary'} subject for student ${resultData.studentId}`);
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
    // Use the centralized grade calculator
    return gradeCalculator.calculateGradeAndPoints(marks, educationLevel);
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
      logger.info(`Created result: ${result._id} for student ${validatedData.studentId}, subject ${validatedData.subjectId}, exam ${validatedData.examId}`);

      return result;
    } catch (error) {
      logger.error(`Error creating result: ${error.message}`);
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
        (resultData.studentId ? await ResultService.getStudentEducationLevel(resultData.studentId) : EDUCATION_LEVELS.O_LEVEL);

      // Get the appropriate model
      const ResultModel = ResultService.getResultModel(effectiveEducationLevel);

      // Check if result exists
      const existingResult = await ResultModel.findById(resultId);
      if (!existingResult) {
        const error = new Error(`Result not found with ID: ${resultId}`);
        logger.error(`Error updating result: ${error.message}`);
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
      logger.info(`Updated result: ${result._id} for student ${validatedData.studentId}, subject ${validatedData.subjectId}, exam ${validatedData.examId}`);

      return result;
    } catch (error) {
      logger.error(`Error updating result: ${error.message}`);
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
        logger.error(`Error getting student results: ${error.message}`);
        throw error;
      }

      // Check if student exists
      const student = await Student.findById(studentId);
      if (!student) {
        const error = new Error(`Student not found with ID: ${studentId}`);
        logger.error(`Error getting student results: ${error.message}`);
        throw error;
      }

      // Determine education level
      const educationLevel = student.educationLevel || EDUCATION_LEVELS.O_LEVEL;

      // Get the appropriate model
      const ResultModel = ResultService.getResultModel(educationLevel);

      // Build query
      const query = { studentId, ...filters };

      // Log the query
      logger.info(`Fetching results for student ${studentId} with filters: ${JSON.stringify(filters)}`);

      // Get results
      const results = await ResultModel.find(query)
        .populate('studentId', 'firstName lastName rollNumber')
        .populate('subjectId', 'name code isPrincipal')
        .populate('examId', 'name type')
        .populate('examTypeId', 'name')
        .populate('classId', 'name section stream');

      // Log the results count
      logger.info(`Found ${results.length} results for student ${studentId}`);

      return results;
    } catch (error) {
      logger.error(`Error getting student results: ${error.message}`);
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
        logger.error(`Error getting class results: ${error.message}`);
        throw error;
      }

      // Check if class exists
      const classObj = await Class.findById(classId);
      if (!classObj) {
        const error = new Error(`Class not found with ID: ${classId}`);
        logger.error(`Error getting class results: ${error.message}`);
        throw error;
      }

      // Determine education level
      const educationLevel = classObj.educationLevel || EDUCATION_LEVELS.O_LEVEL;

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
      logger.info(`Fetching results for class ${classId} with filters: ${JSON.stringify(filters)}`);

      // Get results
      const results = await ResultModel.find(query)
        .populate('studentId', 'firstName lastName rollNumber')
        .populate('subjectId', 'name code isPrincipal')
        .populate('examId', 'name type')
        .populate('examTypeId', 'name')
        .populate('classId', 'name section stream');

      // Log the results count
      logger.info(`Found ${results.length} results for class ${classId}`);

      return results;
    } catch (error) {
      logger.error(`Error getting class results: ${error.message}`);
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
        logger.error(`Error deleting result: ${error.message}`);
        throw error;
      }

      // Validate education level
      if (!educationLevel) {
        const error = new Error('Education level is required');
        logger.error(`Error deleting result: ${error.message}`);
        throw error;
      }

      // Get the appropriate model
      const ResultModel = ResultService.getResultModel(educationLevel);

      // Log the deletion attempt
      logger.info(`Attempting to delete result ${resultId} from ${educationLevel} model`);

      // Delete the result
      const result = await ResultModel.findByIdAndDelete(resultId);

      if (!result) {
        const error = new Error(`Result not found with ID: ${resultId}`);
        logger.error(`Error deleting result: ${error.message}`);
        throw error;
      }

      // Log the successful deletion
      logger.info(`Successfully deleted result ${resultId} from ${educationLevel} model`);

      return true;
    } catch (error) {
      logger.error(`Error deleting result: ${error.message}`);
      throw error;
    }
  }

  /**
   * Enter marks for a student
   * @param {Object} marksData - The marks data
   * @returns {Promise<Object>} - The created result
   */
  static async enterMarks(marksData) {
    try {
      // Validate marks data
      const validatedData = await ResultService.validateResultData(marksData);

      // Get the appropriate model
      const ResultModel = ResultService.getResultModel(validatedData.educationLevel);

      // Check if a result already exists for this student, exam, and subject
      const existingResult = await ResultModel.findOne({
        studentId: validatedData.studentId,
        examId: validatedData.examId,
        subjectId: validatedData.subjectId
      });

      if (existingResult) {
        // Update existing result
        logger.info(`Updating existing result: ${existingResult._id}`);
        return await ResultService.updateResult(
          existingResult._id,
          validatedData,
          validatedData.educationLevel
        );
      } else {
        // Create new result
        logger.info(`Creating new result for student ${validatedData.studentId}, subject ${validatedData.subjectId}, exam ${validatedData.examId}`);
        return await ResultService.createResult(validatedData);
      }
    } catch (error) {
      logger.error(`Error entering marks: ${error.message}`);
      throw error;
    }
  }

  /**
   * Enter batch marks for multiple students
   * @param {Array} marksData - Array of marks data objects
   * @returns {Promise<Array>} - The created/updated results
   */
  static async enterBatchMarks(marksData) {
    try {
      // Validate input
      if (!marksData || !Array.isArray(marksData) || marksData.length === 0) {
        const error = new Error('Invalid or empty marks data');
        logger.error(`Error entering batch marks: ${error.message}`);
        throw error;
      }

      // Log the batch operation
      logger.info(`Starting batch marks entry for ${marksData.length} students`);

      const results = [];

      // Process each mark entry
      for (const markData of marksData) {
        try {
          const result = await ResultService.enterMarks(markData);
          results.push(result);
        } catch (error) {
          logger.warn(`Error entering marks for student ${markData.studentId}, subject ${markData.subjectId}: ${error.message}`);
          // Continue processing other marks
        }
      }

      // Log the summary
      logger.info(`Batch marks entry completed: ${results.length} results processed out of ${marksData.length} requested`);

      return results;
    } catch (error) {
      logger.error(`Error entering batch marks: ${error.message}`);
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
        logger.error(`Error creating batch results: ${error.message}`);
        throw error;
      }

      // Log the batch operation
      logger.info(`Starting batch creation of ${resultsData.length} results`);

      const createdResults = [];
      const validatedResults = [];

      // Validate each result and determine education level
      for (const resultData of resultsData) {
        try {
          // Validate the result data
          const validatedData = await ResultService.validateResultData(resultData);
          validatedResults.push(validatedData);
        } catch (validationError) {
          logger.warn(`Skipping invalid result: ${validationError.message}`);
          // No need for continue as it's the last statement in the loop
        }
      }

      // Group results by education level
      const oLevelResults = validatedResults.filter(result => result.educationLevel !== EDUCATION_LEVELS.A_LEVEL);
      const aLevelResults = validatedResults.filter(result => result.educationLevel === EDUCATION_LEVELS.A_LEVEL);

      // Process O-LEVEL results
      if (oLevelResults.length > 0) {
        logger.info(`Creating ${oLevelResults.length} O-LEVEL results`);
        const oLevelCreated = await OLevelResult.insertMany(oLevelResults);
        createdResults.push(...oLevelCreated);
        logger.info(`Successfully created ${oLevelCreated.length} O-LEVEL results`);
      }

      // Process A-LEVEL results
      if (aLevelResults.length > 0) {
        logger.info(`Creating ${aLevelResults.length} A-LEVEL results`);
        const aLevelCreated = await ALevelResult.insertMany(aLevelResults);
        createdResults.push(...aLevelCreated);
        logger.info(`Successfully created ${aLevelCreated.length} A-LEVEL results`);
      }

      // Log the summary
      logger.info(`Batch creation completed: ${createdResults.length} results created out of ${resultsData.length} requested`);

      return createdResults;
    } catch (error) {
      logger.error(`Error creating batch results: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ResultService;
