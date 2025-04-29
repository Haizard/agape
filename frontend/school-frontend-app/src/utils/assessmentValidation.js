/**
 * Assessment Validation Utilities
 * Provides validation functions for assessment-related operations
 */

/**
 * Validates assessment data
 * @param {Object} assessmentData - The assessment data to validate
 * @returns {Object} Validation result with errors if any
 */
export const validateAssessmentData = (assessmentData) => {
  const errors = {};

  // Validate name
  if (!assessmentData.name || assessmentData.name.trim() === '') {
    errors.name = 'Assessment name is required';
  }

  // Validate weightage
  const weightage = Number(assessmentData.weightage);
  if (isNaN(weightage) || weightage <= 0 || weightage > 100) {
    errors.weightage = 'Weightage must be between 1 and 100';
  }

  // Validate maxMarks
  const maxMarks = Number(assessmentData.maxMarks);
  if (isNaN(maxMarks) || maxMarks <= 0) {
    errors.maxMarks = 'Maximum marks must be greater than 0';
  }

  // Validate term
  if (!['1', '2', '3'].includes(assessmentData.term)) {
    errors.term = 'Invalid term selected';
  }

  // Validate examDate
  if (!assessmentData.examDate) {
    errors.examDate = 'Exam date is required';
  } else {
    const examDate = new Date(assessmentData.examDate);
    if (isNaN(examDate.getTime())) {
      errors.examDate = 'Invalid exam date';
    }
  }

  // Validate status
  if (!['active', 'inactive'].includes(assessmentData.status)) {
    errors.status = 'Invalid status';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validates total weightage of assessments
 * @param {Array} assessments - List of existing assessments
 * @param {Object} newAssessment - New assessment to validate
 * @param {string} excludeId - ID of assessment to exclude from total (for updates)
 * @returns {Object} Validation result
 */
export const validateTotalWeightage = (assessments, newAssessment, excludeId = null) => {
  const totalWeightage = assessments.reduce((sum, assessment) => {
    if (excludeId && assessment._id === excludeId) {
      return sum;
    }
    return sum + Number(assessment.weightage);
  }, Number(newAssessment.weightage));

  return {
    isValid: totalWeightage <= 100,
    totalWeightage,
    remaining: 100 - totalWeightage,
    error: totalWeightage > 100 ? `Total weightage (${totalWeightage}%) exceeds 100%` : null
  };
};

/**
 * Validates assessment marks
 * @param {number} marksObtained - Marks obtained by student
 * @param {number} maxMarks - Maximum marks for the assessment
 * @returns {Object} Validation result
 */
export const validateMarks = (marksObtained, maxMarks) => {
  const errors = {};

  // Convert to numbers
  const marks = Number(marksObtained);
  const maximum = Number(maxMarks);

  // Validate marks obtained
  if (isNaN(marks)) {
    errors.marksObtained = 'Marks must be a number';
  } else if (marks < 0) {
    errors.marksObtained = 'Marks cannot be negative';
  } else if (marks > maximum) {
    errors.marksObtained = `Marks cannot exceed maximum marks (${maximum})`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validates assessment date range
 * @param {string} examDate - The exam date to validate
 * @param {string} termStartDate - Term start date
 * @param {string} termEndDate - Term end date
 * @returns {Object} Validation result
 */
export const validateAssessmentDate = (examDate, termStartDate, termEndDate) => {
  const exam = new Date(examDate);
  const start = new Date(termStartDate);
  const end = new Date(termEndDate);

  const isValid = exam >= start && exam <= end;

  return {
    isValid,
    error: !isValid ? 'Exam date must be within the term dates' : null
  };
};

/**
 * Formats assessment data for API submission
 * @param {Object} formData - The form data to format
 * @returns {Object} Formatted assessment data
 */
export const formatAssessmentData = (formData) => {
  return {
    name: formData.name.trim(),
    weightage: Number(formData.weightage),
    maxMarks: Number(formData.maxMarks),
    term: formData.term,
    examDate: new Date(formData.examDate).toISOString(),
    status: formData.status
  };
};