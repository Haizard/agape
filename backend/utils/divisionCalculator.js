/**
 * Utility functions for calculating grades, points, and divisions
 */

/**
 * Calculate grade based on marks
 * @param {Number} marks - The marks obtained
 * @returns {String} - The grade (A, B, C, D, F)
 */
const calculateGrade = (marks) => {
  if (marks === undefined || marks === null) return '-';
  if (marks >= 75) return 'A';
  if (marks >= 65) return 'B';
  if (marks >= 50) return 'C';
  if (marks >= 30) return 'D';
  return 'F';
};

/**
 * Calculate points based on grade
 * @param {String} grade - The grade (A, B, C, D, F)
 * @returns {Number} - The points (1-5)
 */
const calculatePoints = (grade) => {
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
 */
const calculateDivision = (points) => {
  if (points >= 7 && points <= 14) return 'I';
  if (points >= 15 && points <= 21) return 'II';
  if (points >= 22 && points <= 25) return 'III';
  if (points >= 26 && points <= 32) return 'IV';
  if (points >= 33 && points <= 36) return '0';
  return '-';
};

/**
 * Get remarks based on grade
 * @param {String} grade - The grade (A, B, C, D, F)
 * @returns {String} - The remarks
 */
const getRemarks = (grade) => {
  switch (grade) {
    case 'A': return 'Excellent';
    case 'B': return 'Very Good';
    case 'C': return 'Good';
    case 'D': return 'Satisfactory';
    case 'F': return 'Fail';
    default: return '-';
  }
};

/**
 * Calculate best seven subjects and division
 * @param {Array} results - Array of subject results
 * @returns {Object} - Object containing bestSevenResults, bestSevenPoints, and division
 */
const calculateBestSevenAndDivision = (results) => {
  // Ensure each result has points
  const resultsWithPoints = results.map(result => {
    if (result.points === undefined) {
      const grade = result.grade || calculateGrade(result.marksObtained);
      return {
        ...result,
        grade,
        points: calculatePoints(grade)
      };
    }
    return result;
  });

  // Filter out results with no marks or grades
  const validResults = resultsWithPoints.filter(result => {
    // Check if the result has valid marks or grade
    return (result.marksObtained > 0 || result.marks > 0 || result.grade !== '-');
  });

  // Sort by points (ascending, since lower points are better)
  const sortedResults = [...validResults].sort((a, b) => (a.points || 5) - (b.points || 5));

  // Take the best 7 subjects (or all if less than 7)
  const bestSevenResults = sortedResults.slice(0, Math.min(7, sortedResults.length));

  // Calculate total points from best subjects
  const bestSevenPoints = bestSevenResults.reduce((sum, result) => sum + (result.points || 5), 0);

  // Log for debugging
  console.log('Division calculation:', {
    totalResults: resultsWithPoints.length,
    validResults: validResults.length,
    bestSevenResults: bestSevenResults.map(r => ({ name: r.name || r.subject, marks: r.marksObtained || r.marks, grade: r.grade, points: r.points })),
    bestSevenPoints
  });

  // Calculate division based on total points
  const division = calculateDivision(bestSevenPoints);

  return {
    bestSevenResults,
    bestSevenPoints,
    division
  };
};

module.exports = {
  calculateGrade,
  calculatePoints,
  calculateDivision,
  getRemarks,
  calculateBestSevenAndDivision
};
