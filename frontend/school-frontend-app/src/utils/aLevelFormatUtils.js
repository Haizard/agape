/**
 * A-Level Formatting Utilities
 * 
 * These utilities help ensure consistent formatting of A-Level grades, points, and divisions
 * without changing existing component structure or logic.
 */

/**
 * Format A-Level grade consistently
 * @param {string} grade - Grade value (A, B, C, D, E, S, F)
 * @returns {string} - Formatted grade
 */
export const formatGrade = (grade) => {
  if (grade === null || grade === undefined || grade === '') {
    return '-';
  }
  
  const gradeStr = String(grade).trim().toUpperCase();
  const validGrades = ['A', 'B', 'C', 'D', 'E', 'S', 'F'];
  
  return validGrades.includes(gradeStr) ? gradeStr : '-';
};

/**
 * Format A-Level division consistently
 * @param {string|number} division - Division value
 * @param {boolean} includePrefix - Whether to include "Division" prefix
 * @returns {string} - Formatted division
 */
export const formatDivision = (division, includePrefix = true) => {
  if (division === null || division === undefined || division === '') {
    return includePrefix ? 'Division 0' : '0';
  }
  
  // If it's already in the format "Division X", extract the division value
  const divStr = String(division).trim();
  if (divStr.toLowerCase().startsWith('division')) {
    const divValue = divStr.split(' ')[1];
    return includePrefix ? `Division ${divValue}` : divValue;
  }
  
  return includePrefix ? `Division ${divStr}` : divStr;
};

/**
 * Get color for A-Level grade
 * @param {string} grade - Grade value
 * @returns {string} - MUI color name
 */
export const getGradeColor = (grade) => {
  const formattedGrade = formatGrade(grade);
  
  switch (formattedGrade) {
    case 'A': return 'success';
    case 'B': return 'primary';
    case 'C': return 'info';
    case 'D': return 'warning';
    case 'E': return 'secondary';
    case 'S': return 'default';
    case 'F': return 'error';
    default: return 'default';
  }
};

/**
 * Get color for A-Level division
 * @param {string|number} division - Division value
 * @returns {string} - MUI color name
 */
export const getDivisionColor = (division) => {
  const divStr = String(division).trim();
  const divValue = divStr.toLowerCase().startsWith('division') 
    ? divStr.split(' ')[1] 
    : divStr;
  
  switch (divValue) {
    case 'I':
    case '1': return 'success';
    case 'II':
    case '2': return 'primary';
    case 'III':
    case '3': return 'info';
    case 'IV':
    case '4': return 'warning';
    default: return 'error';
  }
};

/**
 * Get remarks for A-Level grade
 * @param {string} grade - Grade value
 * @returns {string} - Remarks
 */
export const getGradeRemarks = (grade) => {
  const formattedGrade = formatGrade(grade);
  
  switch (formattedGrade) {
    case 'A': return 'Excellent';
    case 'B': return 'Very Good';
    case 'C': return 'Good';
    case 'D': return 'Satisfactory';
    case 'E': return 'Pass';
    case 'S': return 'Subsidiary Pass';
    case 'F': return 'Fail';
    default: return 'Not Applicable';
  }
};

/**
 * Format A-Level marks consistently
 * @param {number|string} marks - Marks value
 * @returns {string} - Formatted marks
 */
export const formatMarks = (marks) => {
  if (marks === null || marks === undefined || marks === '') {
    return '-';
  }
  
  const numMarks = Number(marks);
  if (isNaN(numMarks)) {
    return '-';
  }
  
  return numMarks % 1 === 0 ? String(numMarks) : numMarks.toFixed(2);
};

/**
 * Format A-Level points consistently
 * @param {number|string} points - Points value
 * @returns {string} - Formatted points
 */
export const formatPoints = (points) => {
  if (points === null || points === undefined || points === '') {
    return '-';
  }
  
  const numPoints = Number(points);
  if (isNaN(numPoints)) {
    return '-';
  }
  
  return String(numPoints);
};

export default {
  formatGrade,
  formatDivision,
  getGradeColor,
  getDivisionColor,
  getGradeRemarks,
  formatMarks,
  formatPoints
};
