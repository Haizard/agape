/**
 * Form Level Utilities
 *
 * This utility provides standardized functions for determining and validating
 * student form levels, especially for A-Level students (Form 5 and Form 6).
 */
const logger = require('./logger');

/**
 * Determine a student's form level based on various data sources
 * @param {Object} student - The student object
 * @param {Object} classObj - The class object (optional)
 * @returns {Number|null} - The determined form level (5 or 6) or null if cannot be determined
 */
const determineFormLevel = (student, classObj = null) => {
  // Method 1: Use explicit form field if available
  if (student.form === 5 || student.form === 6 || student.form === 1 || student.form === 2) {
    logger.debug(`Determined form level from student.form: ${student.form}`);
    // Map form 1 to 5 and form 2 to 6 for A-Level students
    if (student.educationLevel === 'A_LEVEL') {
      if (student.form === 1) {
        logger.debug(`Mapping form 1 to form 5 for A-Level student`);
        return 5;
      }
      if (student.form === 2) {
        logger.debug(`Mapping form 2 to form 6 for A-Level student`);
        return 6;
      }
    }
    return student.form;
  }

  // Method 2: Check class name if class object is provided
  if (classObj && classObj.name) {
    if (classObj.name.includes('5') ||
        classObj.name.toLowerCase().includes('form 5') ||
        classObj.name.toLowerCase().includes('form v')) {
      logger.debug(`Determined form level from class name as Form 5: ${classObj.name}`);
      return 5;
    }

    if (classObj.name.includes('6') ||
        classObj.name.toLowerCase().includes('form 6') ||
        classObj.name.toLowerCase().includes('form vi')) {
      logger.debug(`Determined form level from class name as Form 6: ${classObj.name}`);
      return 6;
    }
  }

  // Method 3: Check student's class name if available
  if (student.class && typeof student.class === 'object' && student.class.name) {
    if (student.class.name.includes('5') ||
        student.class.name.toLowerCase().includes('form 5') ||
        student.class.name.toLowerCase().includes('form v')) {
      logger.debug(`Determined form level from student.class.name as Form 5: ${student.class.name}`);
      return 5;
    }

    if (student.class.name.includes('6') ||
        student.class.name.toLowerCase().includes('form 6') ||
        student.class.name.toLowerCase().includes('form vi')) {
      logger.debug(`Determined form level from student.class.name as Form 6: ${student.class.name}`);
      return 6;
    }
  }

  // Method 4: Check admission number if available
  if (student.admissionNumber) {
    if (student.admissionNumber.includes('F5-') ||
        student.admissionNumber.startsWith('5')) {
      logger.debug(`Determined form level from admission number as Form 5: ${student.admissionNumber}`);
      return 5;
    }

    if (student.admissionNumber.includes('F6-') ||
        student.admissionNumber.startsWith('6')) {
      logger.debug(`Determined form level from admission number as Form 6: ${student.admissionNumber}`);
      return 6;
    }
  }

  // Method 5: Default to Form 5 for A-Level students without form level
  if (student.educationLevel === 'A_LEVEL') {
    logger.debug(`Defaulting A-Level student to Form 5 as no specific form level could be determined`);
    return 5;
  }

  // Could not determine form level
  logger.debug(`Could not determine form level for student ${student._id}`);
  return null;
};

/**
 * Filter A-Level students by form level
 * @param {Array} students - Array of student objects
 * @param {Number} formLevel - The form level to filter by (5 or 6)
 * @param {Object} classObj - The class object (optional)
 * @returns {Array} - Filtered array of students
 */
const filterStudentsByFormLevel = (students, formLevel, classObj = null) => {
  if (!Array.isArray(students)) {
    logger.warn('filterStudentsByFormLevel called with non-array students parameter');
    return [];
  }

  if (formLevel !== 5 && formLevel !== 6) {
    logger.warn(`filterStudentsByFormLevel called with invalid formLevel: ${formLevel}`);
    return students; // Return all students if formLevel is invalid
  }

  return students.filter(student => {
    const studentFormLevel = determineFormLevel(student, classObj);
    return studentFormLevel === formLevel;
  });
};

/**
 * Validate that a student is in the specified form level
 * @param {Object} student - The student object
 * @param {Number} formLevel - The expected form level (5 or 6)
 * @param {Object} classObj - The class object (optional)
 * @returns {Boolean} - Whether the student is in the specified form level
 */
const validateStudentFormLevel = (student, formLevel, classObj = null) => {
  if (!student) {
    logger.warn('validateStudentFormLevel called with null student');
    return false;
  }

  if (formLevel !== 5 && formLevel !== 6) {
    logger.warn(`validateStudentFormLevel called with invalid formLevel: ${formLevel}`);
    return false;
  }

  const studentFormLevel = determineFormLevel(student, classObj);
  return studentFormLevel === formLevel;
};

/**
 * Determine a class's form level based on various data sources
 * @param {Object} classObj - The class object
 * @returns {Number|null} - The determined form level (5 or 6) or null if cannot be determined
 */
const determineClassFormLevel = (classObj) => {
  if (!classObj) {
    logger.warn('determineClassFormLevel called with null class object');
    return null;
  }

  // Method 1: Use explicit form field if available
  if (classObj.form === 5 || classObj.form === 6) {
    logger.debug(`Determined form level from class.form: ${classObj.form}`);
    return classObj.form;
  }

  // Method 2: Check class name
  if (classObj.name) {
    if (classObj.name.includes('5') ||
        classObj.name.toLowerCase().includes('form 5') ||
        classObj.name.toLowerCase().includes('form v')) {
      logger.debug(`Determined form level from class name as Form 5: ${classObj.name}`);
      return 5;
    }

    if (classObj.name.includes('6') ||
        classObj.name.toLowerCase().includes('form 6') ||
        classObj.name.toLowerCase().includes('form vi')) {
      logger.debug(`Determined form level from class name as Form 6: ${classObj.name}`);
      return 6;
    }
  }

  // Method 3: Check education level and default to Form 5
  if (classObj.educationLevel === 'A_LEVEL') {
    logger.debug(`Defaulting A-Level class to Form 5 as no specific form level could be determined`);
    return 5;
  }

  // Could not determine form level
  logger.warn(`Could not determine form level for class: ${classObj._id}`);
  return null;
};

module.exports = {
  determineFormLevel,
  filterStudentsByFormLevel,
  validateStudentFormLevel,
  determineClassFormLevel
};
