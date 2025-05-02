/**
 * Assessment Validation Utilities
 * 
 * Provides validation functions for assessment data
 */

/**
 * Validate assessment data
 * @param {Object} assessmentData - The assessment data to validate
 * @returns {Object} Validation result with isValid flag and errors
 */
const validateAssessmentData = (assessmentData) => {
  const errors = [];
  
  // Check required fields
  if (!assessmentData.name) {
    errors.push('Assessment name is required');
  }
  
  if (assessmentData.weightage === undefined || assessmentData.weightage === null) {
    errors.push('Weightage is required');
  } else if (isNaN(assessmentData.weightage) || assessmentData.weightage < 0 || assessmentData.weightage > 100) {
    errors.push('Weightage must be a number between 0 and 100');
  }
  
  if (assessmentData.maxMarks === undefined || assessmentData.maxMarks === null) {
    errors.push('Maximum marks is required');
  } else if (isNaN(assessmentData.maxMarks) || assessmentData.maxMarks <= 0) {
    errors.push('Maximum marks must be a positive number');
  }
  
  if (!assessmentData.term) {
    errors.push('Term is required');
  }
  
  if (!assessmentData.examDate) {
    errors.push('Exam date is required');
  }
  
  if (!assessmentData.createdBy) {
    errors.push('Creator ID is required');
  }
  
  // Validate status if provided
  if (assessmentData.status && !['draft', 'active', 'inactive'].includes(assessmentData.status)) {
    errors.push('Status must be one of: draft, active, inactive');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate total weightage of assessments
 * @param {Array} existingAssessments - Existing assessments
 * @param {Object} newAssessment - New assessment data
 * @param {String} excludeId - ID to exclude (for updates)
 * @returns {Object} Validation result
 */
const validateTotalWeightage = (existingAssessments, newAssessment, excludeId) => {
  // Calculate total weightage of existing assessments for the same term
  const termAssessments = existingAssessments.filter(a => 
    a.term === newAssessment.term && 
    a.status !== 'inactive' &&
    (!excludeId || a._id.toString() !== excludeId)
  );
  
  const existingWeightage = termAssessments.reduce((total, assessment) => {
    return total + (assessment.weightage || 0);
  }, 0);
  
  const totalWeightage = existingWeightage + (newAssessment.weightage || 0);
  
  if (totalWeightage > 100) {
    return {
      isValid: false,
      error: `Total weightage (${totalWeightage}%) exceeds 100%. Current term already has ${existingWeightage}% allocated.`
    };
  }
  
  return { isValid: true };
};

module.exports = {
  validateAssessmentData,
  validateTotalWeightage
};