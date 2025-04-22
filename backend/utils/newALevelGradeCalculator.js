/**
 * New A-Level Grade Calculator
 *
 * This utility provides grade calculation functions specifically for A-Level (Form 5-6)
 * following Tanzania's ACSEE grading system.
 */
const logger = require('./logger');

/**
 * Calculate grade and points based on marks for A-Level
 * @param {Number} marks - The marks obtained (0-100)
 * @returns {Object} - Object containing grade and points
 */
const calculateGradeAndPoints = (marks) => {
  // Validate inputs
  if (marks === undefined || marks === null) {
    return { grade: '-', points: 0 };
  }

  // Convert to number if string
  const numMarks = Number(marks);

  // Check for NaN
  if (Number.isNaN(numMarks)) {
    logger.warn(`Invalid marks value for A-Level: ${marks}`);
    return { grade: '-', points: 0 };
  }

  // A-LEVEL grading based on Tanzania's ACSEE system
  let grade, points;

  if (numMarks >= 80) {
    grade = 'A';
    points = 1;
  } else if (numMarks >= 70) {
    grade = 'B';
    points = 2;
  } else if (numMarks >= 60) {
    grade = 'C';
    points = 3;
  } else if (numMarks >= 50) {
    grade = 'D';
    points = 4;
  } else if (numMarks >= 40) {
    grade = 'E';
    points = 5;
  } else if (numMarks >= 35) {
    grade = 'S';
    points = 6;
  } else {
    grade = 'F';
    points = 7;
  }

  return { grade, points };
};

/**
 * Calculate division based on points from best 3 principal subjects
 * @param {Number} totalPoints - Total points from best 3 principal subjects
 * @returns {String} - Division (I, II, III, IV, 0)
 */
const calculateDivision = (totalPoints) => {
  if (totalPoints === null || totalPoints === undefined) {
    return '0';
  }

  // Convert to number if string
  const numPoints = Number(totalPoints);

  // Check for NaN
  if (Number.isNaN(numPoints)) {
    logger.warn(`Invalid points value for A-Level division: ${totalPoints}`);
    return '0';
  }

  // A-LEVEL division calculation based on Tanzania's ACSEE system
  if (numPoints >= 3 && numPoints <= 9) return 'I';
  if (numPoints >= 10 && numPoints <= 12) return 'II';
  if (numPoints >= 13 && numPoints <= 17) return 'III';
  if (numPoints >= 18 && numPoints <= 19) return 'IV';
  return '0';
};

module.exports = {
  calculateGradeAndPoints,
  calculateDivision
};
