/**
 * @fileoverview Utilities for handling education level specific operations
 * This file contains shared functions for both O-Level and A-Level components
 */

/**
 * Education levels in the system
 * @enum {string}
 */
export const EducationLevels = {
  O_LEVEL: 'O_LEVEL',
  A_LEVEL: 'A_LEVEL',
  BOTH: 'BOTH'
};

/**
 * Form levels for each education level
 * @type {Object}
 */
export const FormLevels = {
  [EducationLevels.O_LEVEL]: [1, 2, 3, 4],
  [EducationLevels.A_LEVEL]: [5, 6]
};

/**
 * Checks if a form belongs to a specific education level
 * @param {number|string} form - Form level (1-6)
 * @returns {string} Education level ('O_LEVEL' or 'A_LEVEL')
 */
export const getEducationLevelFromForm = (form) => {
  // Convert form to number if it's a string
  const formNumber = typeof form === 'string'
    ? parseInt(form.replace(/\D/g, ''), 10)
    : form;

  if (FormLevels[EducationLevels.A_LEVEL].includes(formNumber)) {
    return EducationLevels.A_LEVEL;
  }

  return EducationLevels.O_LEVEL;
};

/**
 * Gets the display name for an education level
 * @param {string} educationLevel - Education level ('O_LEVEL' or 'A_LEVEL')
 * @returns {string} Display name ('O-Level' or 'A-Level')
 */
export const getEducationLevelDisplayName = (educationLevel) => {
  switch (educationLevel) {
    case EducationLevels.O_LEVEL:
      return 'O-Level';
    case EducationLevels.A_LEVEL:
      return 'A-Level';
    case EducationLevels.BOTH:
      return 'Both Levels';
    default:
      return 'Unknown Level';
  }
};

/**
 * Gets the route path for a specific education level
 * @param {string} educationLevel - Education level ('O_LEVEL' or 'A_LEVEL')
 * @returns {string} Route path
 */
export const getRoutePathForEducationLevel = (educationLevel) => {
  switch (educationLevel) {
    case EducationLevels.O_LEVEL:
      return 'o-level';
    case EducationLevels.A_LEVEL:
      return 'a-level';
    default:
      return '';
  }
};

/**
 * Determines the appropriate report URL based on education level
 * @param {string} educationLevel - The education level (A_LEVEL or O_LEVEL)
 * @param {string} studentId - The student ID
 * @param {string} examId - The exam ID
 * @returns {string} - The appropriate URL for the report
 */
export const getReportUrlByEducationLevel = (educationLevel, studentId, examId) => {
  if (educationLevel === EducationLevels.A_LEVEL) {
    return `/results/a-level/student-clean/${studentId}/${examId}`;
  } else {
    return `/results/o-level/student-clean/${studentId}/${examId}`;
  }
};

/**
 * Determines the appropriate class report URL based on education level
 * @param {string} educationLevel - The education level (A_LEVEL or O_LEVEL)
 * @param {string} classId - The class ID
 * @param {string} examId - The exam ID
 * @param {string} formLevel - Optional form level for A-Level reports
 * @returns {string} - The appropriate URL for the class report
 */
export const getClassReportUrlByEducationLevel = (educationLevel, classId, examId, formLevel) => {
  if (educationLevel === EducationLevels.A_LEVEL) {
    return formLevel
      ? `/results/a-level/class/${classId}/${examId}/form/${formLevel}`
      : `/results/a-level/class/${classId}/${examId}`;
  } else {
    return `/results/o-level/class/${classId}/${examId}`;
  }
};

/**
 * Determines the appropriate API endpoint for fetching a report
 * @param {string} educationLevel - The education level (A_LEVEL or O_LEVEL)
 * @param {string} studentId - The student ID
 * @param {string} examId - The exam ID
 * @returns {string} - The appropriate API endpoint
 */
export const getReportApiEndpoint = (educationLevel, studentId, examId) => {
  if (educationLevel === EducationLevels.A_LEVEL) {
    return `/a-level-reports/student/${studentId}/${examId}`;
  } else {
    return `/o-level-reports/student/${studentId}/${examId}`;
  }
};

/**
 * Determines the appropriate API endpoint for fetching a class report
 * @param {string} educationLevel - The education level (A_LEVEL or O_LEVEL)
 * @param {string} classId - The class ID
 * @param {string} examId - The exam ID
 * @returns {string} - The appropriate API endpoint
 */
export const getClassReportApiEndpoint = (educationLevel, classId, examId) => {
  if (educationLevel === EducationLevels.A_LEVEL) {
    return `/a-level-reports/class/${classId}/${examId}`;
  } else {
    return `/o-level-reports/class/${classId}/${examId}`;
  }
};

/**
 * Filters an array of items by education level
 * @param {Array} items - Array of items with educationLevel property
 * @param {string} educationLevel - Education level to filter by
 * @returns {Array} Filtered array
 */
export const filterByEducationLevel = (items, educationLevel) => {
  if (!items || !Array.isArray(items)) return [];

  return items.filter(item => {
    // Items with BOTH education level should be included in both O_LEVEL and A_LEVEL
    if (item.educationLevel === EducationLevels.BOTH) return true;

    return item.educationLevel === educationLevel;
  });
};

/**
 * Calculates grade based on marks and education level
 * @param {number} marks - Marks obtained
 * @param {string} educationLevel - Education level ('O_LEVEL' or 'A_LEVEL')
 * @returns {string} Grade (A, B, C, etc.)
 */
export const calculateGrade = (marks, educationLevel) => {
  if (typeof marks !== 'number') return 'N/A';

  if (educationLevel === EducationLevels.A_LEVEL) {
    if (marks >= 80) return 'A';
    if (marks >= 70) return 'B';
    if (marks >= 60) return 'C';
    if (marks >= 50) return 'D';
    if (marks >= 40) return 'E';
    if (marks >= 35) return 'S';
    return 'F';
  } else {
    // O_LEVEL grading using the standardized NECTA CSEE system
    if (marks >= 75) return 'A';
    if (marks >= 65) return 'B';
    if (marks >= 45) return 'C';
    if (marks >= 30) return 'D';
    return 'F';
  }
};

/**
 * Calculates points based on grade and education level
 * @param {string} grade - Grade (A, B, C, etc.)
 * @param {string} educationLevel - Education level ('O_LEVEL' or 'A_LEVEL')
 * @returns {number} Points
 */
export const calculatePoints = (grade, educationLevel) => {
  if (!grade) return 0;

  if (educationLevel === EducationLevels.A_LEVEL) {
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
  } else {
    // O_LEVEL points
    switch (grade) {
      case 'A': return 1;
      case 'B': return 2;
      case 'C': return 3;
      case 'D': return 4;
      case 'F': return 5;
      default: return 0;
    }
  }
};

/**
 * Calculates division based on points and education level
 * @param {number} points - Total points
 * @param {string} educationLevel - Education level ('O_LEVEL' or 'A_LEVEL')
 * @returns {string} Division (I, II, III, IV, 0)
 */
export const calculateDivision = (points, educationLevel) => {
  if (typeof points !== 'number') return 'N/A';

  if (educationLevel === EducationLevels.A_LEVEL) {
    // A_LEVEL division calculation (based on best 3 principal subjects)
    if (points <= 9) return 'I';
    if (points <= 12) return 'II';
    if (points <= 17) return 'III';
    if (points <= 19) return 'IV';
    return '0';
  } else {
    // O_LEVEL division calculation
    if (points <= 16) return 'I';
    if (points <= 24) return 'II';
    if (points <= 32) return 'III';
    if (points <= 40) return 'IV';
    return '0';
  }
};

/**
 * Gets the best N subjects based on points
 * @param {Array} subjects - Array of subjects with points
 * @param {number} count - Number of subjects to select
 * @returns {Array} Best N subjects
 */
export const getBestSubjects = (subjects, count) => {
  if (!subjects || !Array.isArray(subjects)) return [];

  // Sort subjects by points (ascending, since lower points are better)
  return [...subjects]
    .sort((a, b) => (a.points || 0) - (b.points || 0))
    .slice(0, count);
};

/**
 * Separates subjects into principal and subsidiary
 * @param {Array} subjects - Array of subjects
 * @returns {Object} Object with principal and subsidiary subjects
 */
export const separatePrincipalAndSubsidiarySubjects = (subjects) => {
  if (!subjects || !Array.isArray(subjects)) {
    return { principal: [], subsidiary: [] };
  }

  return {
    principal: subjects.filter(subject => subject.isPrincipal),
    subsidiary: subjects.filter(subject => !subject.isPrincipal)
  };
};

/**
 * Calculates total and average marks for subjects
 * @param {Array} subjects - Array of subjects with marks
 * @returns {Object} Object with total and average marks
 */
export const calculateTotalAndAverageMarks = (subjects) => {
  if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
    return { total: 0, average: 0 };
  }

  const total = subjects.reduce((sum, subject) => sum + (subject.marks || 0), 0);
  const average = total / subjects.length;

  return { total, average };
};

/**
 * Calculates total points for subjects
 * @param {Array} subjects - Array of subjects with points
 * @returns {number} Total points
 */
export const calculateTotalPoints = (subjects) => {
  if (!subjects || !Array.isArray(subjects)) return 0;

  return subjects.reduce((sum, subject) => sum + (subject.points || 0), 0);
};

/**
 * Calculates best three principal subjects points (for A-Level)
 * @param {Array} subjects - Array of subjects
 * @returns {number} Best three points
 */
export const calculateBestThreePrincipalPoints = (subjects) => {
  if (!subjects || !Array.isArray(subjects)) return 0;

  const principalSubjects = subjects.filter(subject => subject.isPrincipal);
  const bestThree = getBestSubjects(principalSubjects, 3);

  return calculateTotalPoints(bestThree);
};
