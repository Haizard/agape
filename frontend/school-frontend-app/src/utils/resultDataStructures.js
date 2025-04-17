/**
 * Standard data structures for result reports
 * This file defines the standard data structures that should be used
 * across all components and endpoints for consistency
 */

/**
 * Standard A-Level subject result structure
 * @typedef {Object} ALevelSubjectResult
 * @property {string} subject - Subject name
 * @property {string} code - Subject code
 * @property {number} marksObtained - Marks obtained (0-100)
 * @property {string} grade - Grade (A, B, C, D, E, S, F)
 * @property {number} points - Points (1-7)
 * @property {string} remarks - Remarks based on grade
 * @property {boolean} isPrincipal - Whether this is a principal subject
 * @property {boolean} isCompulsory - Whether this is a compulsory subject
 */

/**
 * Standard A-Level result summary structure
 * @typedef {Object} ALevelResultSummary
 * @property {number} totalMarks - Total marks obtained
 * @property {number} averageMarks - Average marks
 * @property {number} totalPoints - Total points
 * @property {number} bestThreePoints - Points from best 3 principal subjects
 * @property {string} division - Division (I, II, III, IV, 0)
 * @property {number} rank - Student rank in class
 * @property {number} totalStudents - Total students in class
 * @property {Object} gradeDistribution - Distribution of grades
 */

/**
 * Standard A-Level student result report structure
 * @typedef {Object} ALevelStudentReport
 * @property {Object} studentDetails - Student details
 * @property {Array<ALevelSubjectResult>} subjectResults - Subject results
 * @property {ALevelResultSummary} summary - Result summary
 * @property {Object} characterAssessment - Character assessment
 * @property {Object} subjectCombination - Subject combination
 * @property {string} educationLevel - Education level (A_LEVEL)
 * @property {number} formLevel - Form level (5 or 6)
 */

/**
 * Standard A-Level class result report structure
 * @typedef {Object} ALevelClassReport
 * @property {string} className - Class name
 * @property {string} academicYear - Academic year
 * @property {string} examName - Exam name
 * @property {Array<Object>} students - Student results
 * @property {Object} divisionDistribution - Distribution of divisions
 * @property {Object} gradeDistribution - Distribution of grades
 * @property {Object} subjectStatistics - Statistics for each subject
 * @property {string} educationLevel - Education level (A_LEVEL)
 */

/**
 * Format A-Level division consistently
 * @param {string|number} division - Division value (I, II, III, IV, 0 or 1, 2, 3, 4, 0)
 * @param {boolean} useRoman - Whether to use Roman numerals (default: true)
 * @param {boolean} includePrefix - Whether to include "Division" prefix (default: true)
 * @returns {string} - Formatted division
 */
export const formatALevelDivision = (division, useRoman = true, includePrefix = true) => {
  // Handle null or undefined
  if (division === null || division === undefined) {
    return includePrefix ? 'Division 0' : '0';
  }

  // Convert to string
  const divStr = String(division).trim();

  // Handle empty string
  if (!divStr) {
    return includePrefix ? 'Division 0' : '0';
  }

  // If it's already in the format "Division X", extract the division value
  if (divStr.toLowerCase().startsWith('division')) {
    const divValue = divStr.split(' ')[1];
    return formatALevelDivision(divValue, useRoman, includePrefix);
  }

  // Convert numeric divisions to Roman if needed
  let romanDiv = divStr;
  if (useRoman) {
    if (divStr === '1') romanDiv = 'I';
    else if (divStr === '2') romanDiv = 'II';
    else if (divStr === '3') romanDiv = 'III';
    else if (divStr === '4') romanDiv = 'IV';
    else if (divStr === '5') romanDiv = 'V';
  } else {
    if (divStr === 'I') romanDiv = '1';
    else if (divStr === 'II') romanDiv = '2';
    else if (divStr === 'III') romanDiv = '3';
    else if (divStr === 'IV') romanDiv = '4';
    else if (divStr === 'V') romanDiv = '5';
  }

  // Add prefix if needed
  return includePrefix ? `Division ${romanDiv}` : romanDiv;
};

/**
 * Format A-Level grade consistently
 * @param {string} grade - Grade value (A, B, C, D, E, S, F)
 * @returns {string} - Formatted grade
 */
export const formatALevelGrade = (grade) => {
  // Handle null or undefined
  if (grade === null || grade === undefined) {
    return '-';
  }

  // Convert to string and uppercase
  const gradeStr = String(grade).trim().toUpperCase();

  // Handle empty string
  if (!gradeStr) {
    return '-';
  }

  // Valid A-Level grades
  const validGrades = ['A', 'B', 'C', 'D', 'E', 'S', 'F'];
  
  // Return the grade if valid, otherwise '-'
  return validGrades.includes(gradeStr) ? gradeStr : '-';
};

/**
 * Get A-Level grade remarks consistently
 * @param {string} grade - Grade value (A, B, C, D, E, S, F)
 * @returns {string} - Grade remarks
 */
export const getALevelGradeRemarks = (grade) => {
  const formattedGrade = formatALevelGrade(grade);
  
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

export default {
  formatALevelDivision,
  formatALevelGrade,
  getALevelGradeRemarks
};
