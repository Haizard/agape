/**
 * Grade Utilities
 * 
 * Utility functions for calculating grades and points based on marks.
 */

/**
 * Calculate grade based on marks
 * @param {number} marks - Student marks (0-100)
 * @returns {string} - Grade (A, B, C, D, E, F)
 */
function calculateGrade(marks) {
  if (marks === null || marks === undefined) {
    return 'N/A';
  }
  
  if (marks >= 81 && marks <= 100) {
    return 'A';
  } else if (marks >= 61 && marks <= 80) {
    return 'B';
  } else if (marks >= 41 && marks <= 60) {
    return 'C';
  } else if (marks >= 31 && marks <= 40) {
    return 'D';
  } else if (marks >= 21 && marks <= 30) {
    return 'E';
  } else if (marks >= 0 && marks <= 20) {
    return 'F';
  } else {
    return 'N/A';
  }
}

/**
 * Calculate points based on grade
 * @param {string} grade - Student grade (A, B, C, D, E, F)
 * @returns {number} - Points (1-9)
 */
function calculatePoints(grade) {
  switch (grade) {
    case 'A':
      return 1;
    case 'B':
      return 2;
    case 'C':
      return 3;
    case 'D':
      return 4;
    case 'E':
      return 5;
    case 'F':
      return 9;
    default:
      return 0;
  }
}

/**
 * Calculate division based on total points
 * @param {number} totalPoints - Total points from best 7 subjects
 * @returns {string} - Division (I, II, III, IV, 0)
 */
function calculateDivision(totalPoints) {
  if (totalPoints >= 7 && totalPoints <= 17) {
    return 'I';
  } else if (totalPoints >= 18 && totalPoints <= 21) {
    return 'II';
  } else if (totalPoints >= 22 && totalPoints <= 25) {
    return 'III';
  } else if (totalPoints >= 26 && totalPoints <= 33) {
    return 'IV';
  } else {
    return '0';
  }
}

module.exports = {
  calculateGrade,
  calculatePoints,
  calculateDivision
};
