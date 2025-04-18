/**
 * Data Validator Utility
 *
 * This utility provides standardized data validation functions
 * to ensure consistency across the application.
 */
const logger = require('./logger');

/**
 * Validate A-Level result
 * @param {Object} result - A-Level result data
 * @returns {Object} - Validation result
 */
const validateALevelResult = (result) => {
  const errors = [];

  // Check required fields
  if (!result.studentId) errors.push('Student ID is required');
  if (!result.examId) errors.push('Exam ID is required');
  if (!result.subjectId) errors.push('Subject ID is required');
  if (result.marksObtained === undefined) errors.push('Marks are required');

  // Validate marks range
  if (result.marksObtained !== undefined) {
    const marks = Number(result.marksObtained);
    if (isNaN(marks)) {
      errors.push('Marks must be a number');
    } else if (marks < 0 || marks > 100) {
      errors.push('Marks must be between 0 and 100');
    }
  }

  // Validate isPrincipal flag (crucial for A-Level report generation)
  if (result.isPrincipal === undefined) {
    errors.push('isPrincipal flag is required for A-Level results');
  } else if (typeof result.isPrincipal !== 'boolean') {
    errors.push('isPrincipal must be a boolean value');
  }

  // Log validation errors
  if (errors.length > 0) {
    logger.warn(`A-Level result validation failed: ${errors.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate O-Level result
 * @param {Object} result - O-Level result data
 * @returns {Object} - Validation result
 */
const validateOLevelResult = (result) => {
  const errors = [];

  // Check required fields
  if (!result.studentId) errors.push('Student ID is required');
  if (!result.examId) errors.push('Exam ID is required');
  if (!result.subjectId) errors.push('Subject ID is required');
  if (result.marksObtained === undefined) errors.push('Marks are required');

  // Validate marks range
  if (result.marksObtained !== undefined) {
    const marks = Number(result.marksObtained);
    if (isNaN(marks)) {
      errors.push('Marks must be a number');
    } else if (marks < 0 || marks > 100) {
      errors.push('Marks must be between 0 and 100');
    }
  }

  // Log validation errors
  if (errors.length > 0) {
    logger.warn(`O-Level result validation failed: ${errors.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate student
 * @param {Object} student - Student data
 * @returns {Object} - Validation result
 */
const validateStudent = (student) => {
  const errors = [];

  // Check required fields
  if (!student.firstName) errors.push('First name is required');
  if (!student.lastName) errors.push('Last name is required');
  if (!student.class) errors.push('Class is required');
  if (!student.educationLevel) errors.push('Education level is required');

  // Validate education level
  if (student.educationLevel && !['O_LEVEL', 'A_LEVEL'].includes(student.educationLevel)) {
    errors.push(`Invalid education level: ${student.educationLevel}`);
  }

  // Validate form
  if (student.form) {
    const form = Number(student.form);
    if (isNaN(form)) {
      errors.push('Form must be a number');
    } else if (student.educationLevel === 'O_LEVEL' && (form < 1 || form > 4)) {
      errors.push('O-Level form must be between 1 and 4');
    } else if (student.educationLevel === 'A_LEVEL' && (form < 5 || form > 6)) {
      errors.push('A-Level form must be between 5 and 6');
    }
  }

  // Log validation errors
  if (errors.length > 0) {
    logger.warn(`Student validation failed: ${errors.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate class
 * @param {Object} classData - Class data
 * @returns {Object} - Validation result
 */
const validateClass = (classData) => {
  const errors = [];

  // Check required fields
  if (!classData.name) errors.push('Name is required');
  if (!classData.level) errors.push('Level is required');
  if (!classData.academicYear) errors.push('Academic year is required');

  // Validate level
  if (classData.level && !['O_LEVEL', 'A_LEVEL'].includes(classData.level)) {
    errors.push(`Invalid level: ${classData.level}`);
  }

  // Log validation errors
  if (errors.length > 0) {
    logger.warn(`Class validation failed: ${errors.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate exam
 * @param {Object} exam - Exam data
 * @returns {Object} - Validation result
 */
const validateExam = (exam) => {
  const errors = [];

  // Check required fields
  if (!exam.name) errors.push('Name is required');
  if (!exam.academicYear) errors.push('Academic year is required');
  if (!exam.startDate) errors.push('Start date is required');
  if (!exam.endDate) errors.push('End date is required');

  // Validate dates
  if (exam.startDate && exam.endDate) {
    const startDate = new Date(exam.startDate);
    const endDate = new Date(exam.endDate);

    if (isNaN(startDate.getTime())) {
      errors.push('Invalid start date');
    }

    if (isNaN(endDate.getTime())) {
      errors.push('Invalid end date');
    }

    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && startDate > endDate) {
      errors.push('Start date must be before end date');
    }
  }

  // Log validation errors
  if (errors.length > 0) {
    logger.warn(`Exam validation failed: ${errors.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate subject
 * @param {Object} subject - Subject data
 * @returns {Object} - Validation result
 */
const validateSubject = (subject) => {
  const errors = [];

  // Check required fields
  if (!subject.name) errors.push('Name is required');
  if (!subject.code) errors.push('Code is required');

  // Log validation errors
  if (errors.length > 0) {
    logger.warn(`Subject validation failed: ${errors.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Format validation errors for API response
 * @param {Object} validationResult - Validation result
 * @returns {Object} - Formatted error response
 */
const formatValidationErrors = (validationResult) => {
  if (validationResult.isValid) {
    return null;
  }

  return {
    success: false,
    message: 'Validation failed',
    errors: Array.isArray(validationResult.errors)
      ? validationResult.errors
      : Object.values(validationResult.errors)
  };
};

module.exports = {
  validateALevelResult,
  validateOLevelResult,
  validateStudent,
  validateClass,
  validateExam,
  validateSubject,
  formatValidationErrors
};
