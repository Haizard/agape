/**
 * Utility functions for education level-specific calculations
 */

/**
 * Calculate grade based on marks and education level
 * @param {Number} marks - The marks obtained
 * @param {String} educationLevel - The education level ('O_LEVEL' or 'A_LEVEL')
 * @returns {String} - The grade
 */
const calculateGradeByLevel = (marks, educationLevel) => {
  if (marks === undefined || marks === null) return '-';
  
  if (educationLevel === 'O_LEVEL') {
    if (marks >= 75) return 'A';
    if (marks >= 65) return 'B';
    if (marks >= 50) return 'C';
    if (marks >= 30) return 'D';
    return 'F';
  } else if (educationLevel === 'A_LEVEL') {
    if (marks >= 80) return 'A';
    if (marks >= 70) return 'B';
    if (marks >= 60) return 'C';
    if (marks >= 50) return 'D';
    if (marks >= 40) return 'E';
    if (marks >= 35) return 'S';
    return 'F';
  }
  
  return '-';
};

/**
 * Calculate points based on grade and education level
 * @param {String} grade - The grade
 * @param {String} educationLevel - The education level ('O_LEVEL' or 'A_LEVEL')
 * @returns {Number} - The points
 */
const calculatePointsByLevel = (grade, educationLevel) => {
  if (educationLevel === 'O_LEVEL') {
    switch (grade) {
      case 'A': return 1;
      case 'B': return 2;
      case 'C': return 3;
      case 'D': return 4;
      case 'F': return 5;
      default: return 0;
    }
  } else if (educationLevel === 'A_LEVEL') {
    switch (grade) {
      case 'A': return 1;
      case 'B': return 2;
      case 'C': return 3;
      case 'D': return 4;
      case 'E': return 5;
      case 'S': return 6;
      case 'F': return 7;
      default: return 0;
    }
  }
  
  return 0;
};

/**
 * Calculate division based on points and education level
 * @param {Number} points - The total points
 * @param {String} educationLevel - The education level ('O_LEVEL' or 'A_LEVEL')
 * @returns {String} - The division
 */
const calculateDivisionByLevel = (points, educationLevel) => {
  if (educationLevel === 'O_LEVEL') {
    if (points >= 7 && points <= 14) return 'I';
    if (points >= 15 && points <= 21) return 'II';
    if (points >= 22 && points <= 25) return 'III';
    if (points >= 26 && points <= 32) return 'IV';
    if (points >= 33 && points <= 36) return '0';
  } else if (educationLevel === 'A_LEVEL') {
    if (points >= 3 && points <= 9) return 'I';
    if (points >= 10 && points <= 12) return 'II';
    if (points >= 13 && points <= 17) return 'III';
    if (points >= 18 && points <= 19) return 'IV';
    if (points >= 20 && points <= 21) return 'V';
  }
  
  return '-';
};

/**
 * Get remarks based on grade
 * @param {String} grade - The grade
 * @param {String} educationLevel - The education level ('O_LEVEL' or 'A_LEVEL')
 * @returns {String} - The remarks
 */
const getRemarksByLevel = (grade, educationLevel) => {
  if (educationLevel === 'O_LEVEL') {
    switch (grade) {
      case 'A': return 'Excellent';
      case 'B': return 'Very Good';
      case 'C': return 'Good';
      case 'D': return 'Satisfactory';
      case 'F': return 'Fail';
      default: return '-';
    }
  } else if (educationLevel === 'A_LEVEL') {
    switch (grade) {
      case 'A': return 'Excellent';
      case 'B': return 'Very Good';
      case 'C': return 'Good';
      case 'D': return 'Satisfactory';
      case 'E': return 'Pass';
      case 'S': return 'Subsidiary Pass';
      case 'F': return 'Fail';
      default: return '-';
    }
  }
  
  return '-';
};

/**
 * Calculate best subjects and division based on education level
 * @param {Array} results - Array of subject results
 * @param {String} educationLevel - The education level ('O_LEVEL' or 'A_LEVEL')
 * @returns {Object} - Object containing bestResults, bestPoints, and division
 */
const calculateBestSubjectsAndDivision = (results, educationLevel) => {
  // Ensure each result has points
  const resultsWithPoints = results.map(result => {
    if (result.points === undefined) {
      const grade = result.grade || calculateGradeByLevel(result.marksObtained, educationLevel);
      return {
        ...result,
        grade,
        points: calculatePointsByLevel(grade, educationLevel)
      };
    }
    return result;
  });

  // Filter out results with no marks or grades
  const validResults = resultsWithPoints.filter(result => {
    return (result.marksObtained > 0 || result.marks > 0 || result.grade !== '-');
  });

  // Sort by points (ascending, since lower points are better)
  const sortedResults = [...validResults].sort((a, b) => (a.points || 7) - (b.points || 7));

  // Take the best subjects based on education level
  const bestCount = educationLevel === 'O_LEVEL' ? 7 : 3;
  const bestResults = sortedResults.slice(0, Math.min(bestCount, sortedResults.length));

  // Calculate total points from best subjects
  const bestPoints = bestResults.reduce((sum, result) => sum + (result.points || 7), 0);

  // Calculate division based on total points and education level
  const division = calculateDivisionByLevel(bestPoints, educationLevel);

  return {
    bestResults,
    bestPoints,
    division
  };
};

module.exports = {
  calculateGradeByLevel,
  calculatePointsByLevel,
  calculateDivisionByLevel,
  getRemarksByLevel,
  calculateBestSubjectsAndDivision
};
