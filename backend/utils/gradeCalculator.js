/**
 * Centralized utility for all grade, point, and division calculations
 * This acts as a facade that delegates to the appropriate level-specific calculator
 */
const { EDUCATION_LEVELS } = require('../constants/apiEndpoints');
const logger = require('./logger');
const oLevelGradeCalculator = require('./oLevelGradeCalculator');
const aLevelGradeCalculator = require('./aLevelGradeCalculator');

/**
 * Calculate grade and points based on marks and education level
 * @param {Number} marks - The marks obtained (0-100)
 * @param {String} educationLevel - The education level (O_LEVEL or A_LEVEL)
 * @returns {Object} - Object containing grade and points
 */
const calculateGradeAndPoints = (marks, educationLevel) => {
  // Delegate to the appropriate level-specific calculator
  if (educationLevel === EDUCATION_LEVELS.A_LEVEL) {
    return aLevelGradeCalculator.calculateGradeAndPoints(marks);
  } else {
    return oLevelGradeCalculator.calculateGradeAndPoints(marks);
  }
};

/**
 * Calculate O-Level division based on points from best 7 subjects
 * @param {Number} points - Total points from best 7 subjects
 * @returns {String} - Division (I, II, III, IV, 0)
 */
const calculateOLevelDivision = (points) => {
  // Delegate to the O-Level calculator
  return oLevelGradeCalculator.calculateDivision(points);
};

/**
 * Calculate A-Level division based on points from best 3 principal subjects
 * @param {Number} points - Total points from best 3 principal subjects
 * @returns {String} - Division (I, II, III, IV, 0)
 */
const calculateALevelDivision = (points) => {
  // Delegate to the A-Level calculator
  return aLevelGradeCalculator.calculateDivision(points);
};

/**
 * Calculate division based on points and education level
 * @param {Number} points - The total points
 * @param {String} educationLevel - The education level (O_LEVEL or A_LEVEL)
 * @returns {String} - The division (I, II, III, IV, 0)
 */
const calculateDivision = (points, educationLevel) => {
  if (educationLevel === EDUCATION_LEVELS.A_LEVEL) {
    return calculateALevelDivision(points);
  }
  return calculateOLevelDivision(points);
};

/**
 * Get remarks based on grade and education level
 * @param {String} grade - The grade (A, B, C, D, E, S, F)
 * @param {String} educationLevel - The education level (O_LEVEL or A_LEVEL)
 * @returns {String} - The remarks
 */
const getRemarks = (grade, educationLevel) => {
  // Delegate to the appropriate level-specific calculator
  if (educationLevel === EDUCATION_LEVELS.A_LEVEL) {
    return aLevelGradeCalculator.getRemarks(grade);
  }
  return oLevelGradeCalculator.getRemarks(grade);
};

/**
 * Calculate best seven subjects and division for O-Level
 * @param {Array} results - Array of subject results
 * @returns {Object} - Object containing bestSevenResults, bestSevenPoints, and division
 */
const calculateBestSevenAndDivision = (results) => {
  // Delegate to the O-Level calculator
  return oLevelGradeCalculator.calculateBestSevenAndDivision(results);
};

/**
 * Calculate best three principal subjects and division for A-Level
 * @param {Array} results - Array of subject results
 * @param {Array} principalSubjectIds - Array of principal subject IDs (optional)
 * @returns {Object} - Object containing bestThreeResults, bestThreePoints, and division
 */
const calculateBestThreeAndDivision = (results, principalSubjectIds) => {
  // Delegate to the A-Level calculator
  return aLevelGradeCalculator.calculateBestThreeAndDivision(results, principalSubjectIds);
};

/**
 * Calculate class statistics for a set of results
 * @param {Array} results - Array of results with marks
 * @param {String} educationLevel - The education level (O_LEVEL or A_LEVEL)
 * @returns {Object} - Object containing mean, median, mode, and standardDeviation
 */
const calculateClassStatistics = (results, educationLevel) => {
  // Delegate to the appropriate level-specific calculator
  if (educationLevel === EDUCATION_LEVELS.A_LEVEL) {
    return aLevelGradeCalculator.calculateClassStatistics(results);
  }
  return oLevelGradeCalculator.calculateClassStatistics(results);
};

/**
 * Calculate student rankings based on average marks or points
 * @param {Array} students - Array of students with results
 * @param {String} educationLevel - The education level (O_LEVEL or A_LEVEL)
 * @param {String} rankBy - Field to rank by ('averageMarks' or 'totalPoints')
 * @returns {Array} - Array of students with rank property added
 */
const calculateStudentRankings = (students, educationLevel, rankBy = 'averageMarks') => {
  // Delegate to the appropriate level-specific calculator
  if (educationLevel === EDUCATION_LEVELS.A_LEVEL) {
    return aLevelGradeCalculator.calculateStudentRankings(students, rankBy);
  }
  return oLevelGradeCalculator.calculateStudentRankings(students, rankBy);
};

/**
 * Calculate subject positions for students in a class
 * @param {Array} results - Array of results for a specific subject
 * @param {String} educationLevel - The education level (O_LEVEL or A_LEVEL)
 * @returns {Array} - Array of results with subjectPosition property added
 */
const calculateSubjectPositions = (results, educationLevel) => {
  // Delegate to the appropriate level-specific calculator
  if (educationLevel === EDUCATION_LEVELS.A_LEVEL) {
    return aLevelGradeCalculator.calculateSubjectPositions(results);
  }
  return oLevelGradeCalculator.calculateSubjectPositions(results);
};

module.exports = {
  calculateGradeAndPoints,
  calculateOLevelDivision,
  calculateALevelDivision,
  calculateDivision,
  getRemarks,
  calculateBestSevenAndDivision,
  calculateBestThreeAndDivision,
  calculateClassStatistics,
  calculateStudentRankings,
  calculateSubjectPositions
};
