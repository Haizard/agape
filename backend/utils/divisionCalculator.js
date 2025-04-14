/**
 * Utility functions for calculating grades, points, and divisions
 * @deprecated Use gradeCalculator.js instead
 */
const gradeCalculator = require('./gradeCalculator');
const { EDUCATION_LEVELS } = require('../constants/apiEndpoints');
const logger = require('./logger');

/**
 * Calculate grade based on marks
 * @param {Number} marks - The marks obtained
 * @returns {String} - The grade (A, B, C, D, F)
 * @deprecated Use gradeCalculator.calculateGradeAndPoints instead
 */
const calculateGrade = (marks) => {
  // Use the centralized grade calculator
  const { grade } = gradeCalculator.calculateGradeAndPoints(marks, EDUCATION_LEVELS.O_LEVEL);
  return grade;
};

/**
 * Calculate points based on grade
 * @param {String} grade - The grade (A, B, C, D, F)
 * @returns {Number} - The points (1-5)
 * @deprecated Use gradeCalculator.calculateGradeAndPoints instead
 */
const calculatePoints = (grade) => {
  // For backward compatibility, we'll map the grade to points using O-LEVEL system
  switch (grade) {
    case 'A': return 1;
    case 'B': return 2;
    case 'C': return 3;
    case 'D': return 4;
    case 'F': return 5;
    default: return 0;
  }
};

/**
 * Calculate division based on points
 * @param {Number} points - The total points from best 7 subjects
 * @returns {String} - The division (I, II, III, IV, 0)
 * @deprecated Use gradeCalculator.calculateOLevelDivision instead
 */
const calculateDivision = (points) => {
  // Use the centralized grade calculator
  return gradeCalculator.calculateOLevelDivision(points);
};

/**
 * Get remarks based on grade
 * @param {String} grade - The grade (A, B, C, D, F)
 * @returns {String} - The remarks
 * @deprecated Use gradeCalculator.getRemarks instead
 */
const getRemarks = (grade) => {
  // Use the centralized grade calculator
  return gradeCalculator.getRemarks(grade);
};

/**
 * Calculate best seven subjects and division
 * @param {Array} results - Array of subject results
 * @returns {Object} - Object containing bestSevenResults, bestSevenPoints, and division
 * @deprecated Use gradeCalculator.calculateBestSevenAndDivision instead
 */
const calculateBestSevenAndDivision = (results) => {
  // Use the centralized grade calculator
  return gradeCalculator.calculateBestSevenAndDivision(results);
};

module.exports = {
  calculateGrade,
  calculatePoints,
  calculateDivision,
  getRemarks,
  calculateBestSevenAndDivision
};
