/**
 * A-Level Grade Calculation Utilities
 * 
 * These utilities help ensure consistent calculation of A-Level grades, points, and divisions
 * without changing existing component structure or logic.
 */

/**
 * Calculate A-Level grade based on marks
 * @param {number} marks - Marks obtained (0-100)
 * @returns {string} - Grade (A, B, C, D, E, S, F)
 */
export const calculateGrade = (marks) => {
  if (marks === null || marks === undefined || marks === '') {
    return '-';
  }
  
  const numMarks = Number(marks);
  if (isNaN(numMarks)) {
    return '-';
  }
  
  if (numMarks >= 80) return 'A';
  if (numMarks >= 70) return 'B';
  if (numMarks >= 60) return 'C';
  if (numMarks >= 50) return 'D';
  if (numMarks >= 40) return 'E';
  if (numMarks >= 35) return 'S';
  return 'F';
};

/**
 * Calculate A-Level points based on grade
 * @param {string} grade - Grade (A, B, C, D, E, S, F)
 * @returns {number} - Points (1-7)
 */
export const calculatePoints = (grade) => {
  switch (grade) {
    case 'A': return 1;
    case 'B': return 2;
    case 'C': return 3;
    case 'D': return 4;
    case 'E': return 5;
    case 'S': return 6;
    case 'F': return 7;
    default: return 7;
  }
};

/**
 * Calculate A-Level division based on points
 * @param {number} points - Points from best 3 principal subjects
 * @returns {string} - Division (I, II, III, IV, 0)
 */
export const calculateDivision = (points) => {
  if (points === null || points === undefined || points === '') {
    return '0';
  }
  
  const numPoints = Number(points);
  if (isNaN(numPoints)) {
    return '0';
  }
  
  if (numPoints >= 3 && numPoints <= 9) return 'I';
  if (numPoints >= 10 && numPoints <= 12) return 'II';
  if (numPoints >= 13 && numPoints <= 17) return 'III';
  if (numPoints >= 18 && numPoints <= 19) return 'IV';
  return '0';
};

/**
 * Calculate grade and points based on marks
 * @param {number} marks - Marks obtained (0-100)
 * @returns {Object} - Object with grade and points
 */
export const calculateGradeAndPoints = (marks) => {
  const grade = calculateGrade(marks);
  const points = calculatePoints(grade);
  return { grade, points };
};

/**
 * Calculate best three principal subjects and division
 * @param {Array} results - Array of subject results
 * @param {boolean} isPrincipalFn - Function to determine if a subject is principal
 * @returns {Object} - Object with bestThreePoints and division
 */
export const calculateBestThreeAndDivision = (results, isPrincipalFn = (r) => r.isPrincipal) => {
  // Filter principal subjects
  const principalResults = results.filter(isPrincipalFn);
  
  // Sort by points (ascending, since lower points are better)
  const sortedResults = [...principalResults].sort((a, b) => 
    (a.points || 7) - (b.points || 7)
  );
  
  // Take best 3 (or fewer if not enough)
  const bestThree = sortedResults.slice(0, Math.min(3, sortedResults.length));
  const bestThreePoints = bestThree.reduce((sum, r) => sum + (r.points || 7), 0);
  
  // Calculate division
  const division = calculateDivision(bestThreePoints);
  
  return { bestThree, bestThreePoints, division };
};

export default {
  calculateGrade,
  calculatePoints,
  calculateDivision,
  calculateGradeAndPoints,
  calculateBestThreeAndDivision
};
