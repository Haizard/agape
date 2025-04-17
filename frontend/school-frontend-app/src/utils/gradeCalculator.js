/**
 * Grade Calculator Utility
 * Provides functions for calculating grades and points for O-Level and A-Level results
 */

/**
 * O-Level Grade Calculator
 */
const oLevelGradeCalculator = {
  /**
   * Calculate grade based on marks
   * @param {number} marks - Marks obtained (0-100)
   * @returns {string} Grade (A, B, C, D, F)
   */
  calculateGrade: (marks) => {
    if (marks === null || marks === undefined || marks === '') return '';
    
    const numericMarks = Number(marks);
    
    if (isNaN(numericMarks)) return '';
    
    if (numericMarks >= 80) return 'A';
    if (numericMarks >= 65) return 'B';
    if (numericMarks >= 50) return 'C';
    if (numericMarks >= 40) return 'D';
    return 'F';
  },
  
  /**
   * Calculate points based on grade
   * @param {string} grade - Grade (A, B, C, D, F)
   * @returns {number} Points (1-5)
   */
  calculatePoints: (grade) => {
    if (!grade) return '';
    
    switch (grade.toUpperCase()) {
      case 'A': return 1;
      case 'B': return 2;
      case 'C': return 3;
      case 'D': return 4;
      case 'F': return 5;
      default: return '';
    }
  }
};

/**
 * A-Level Grade Calculator
 */
const aLevelGradeCalculator = {
  /**
   * Calculate grade based on marks
   * @param {number} marks - Marks obtained (0-100)
   * @returns {string} Grade (A, B, C, D, E, F, S)
   */
  calculateGrade: (marks) => {
    if (marks === null || marks === undefined || marks === '') return '';
    
    const numericMarks = Number(marks);
    
    if (isNaN(numericMarks)) return '';
    
    if (numericMarks >= 80) return 'A';
    if (numericMarks >= 70) return 'B';
    if (numericMarks >= 60) return 'C';
    if (numericMarks >= 50) return 'D';
    if (numericMarks >= 40) return 'E';
    if (numericMarks >= 35) return 'S';
    return 'F';
  },
  
  /**
   * Calculate points based on grade
   * @param {string} grade - Grade (A, B, C, D, E, F, S)
   * @returns {number} Points (1-7)
   */
  calculatePoints: (grade) => {
    if (!grade) return '';
    
    switch (grade.toUpperCase()) {
      case 'A': return 1;
      case 'B': return 2;
      case 'C': return 3;
      case 'D': return 4;
      case 'E': return 5;
      case 'S': return 6;
      case 'F': return 7;
      default: return '';
    }
  }
};

/**
 * Calculate division based on points
 * @param {number} totalPoints - Total points
 * @param {number} numberOfSubjects - Number of subjects
 * @returns {string} Division (I, II, III, IV, 0)
 */
const calculateDivision = (totalPoints, numberOfSubjects) => {
  if (!totalPoints || !numberOfSubjects) return '';
  
  const averagePoints = totalPoints / numberOfSubjects;
  
  if (averagePoints <= 1.4) return 'I';
  if (averagePoints <= 2.4) return 'II';
  if (averagePoints <= 3.4) return 'III';
  if (averagePoints <= 4.4) return 'IV';
  return '0';
};

export {
  oLevelGradeCalculator,
  aLevelGradeCalculator,
  calculateDivision
};
