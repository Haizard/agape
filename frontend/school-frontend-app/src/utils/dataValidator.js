/**
 * Data Validator Utility
 * 
 * This utility provides standardized data validation functions
 * to ensure consistency across the application.
 */

/**
 * Validate student result data
 * @param {Object} data - Student result data
 * @returns {Object} - Validation result
 */
export const validateStudentResultData = (data) => {
  const errors = [];
  
  // Check required fields
  if (!data) {
    return { isValid: false, errors: ['No data provided'] };
  }
  
  // Check student details
  if (!data.studentDetails) {
    errors.push('No student details provided');
  } else {
    if (!data.studentDetails.name) errors.push('Student name is missing');
    if (!data.studentDetails.form) errors.push('Student form is missing');
  }
  
  // Check subject results
  if (!data.subjectResults || !Array.isArray(data.subjectResults)) {
    errors.push('No subject results provided');
  } else if (data.subjectResults.length === 0) {
    errors.push('Subject results array is empty');
  } else {
    // Check each subject result
    data.subjectResults.forEach((result, index) => {
      if (!result.subject) errors.push(`Subject name is missing for result #${index + 1}`);
      if (result.marks === undefined || result.marks === null) errors.push(`Marks are missing for ${result.subject || `result #${index + 1}`}`);
      if (!result.grade) errors.push(`Grade is missing for ${result.subject || `result #${index + 1}`}`);
    });
  }
  
  // Check summary
  if (!data.summary) {
    errors.push('No summary provided');
  } else {
    if (data.summary.averageMarks === undefined) errors.push('Average marks are missing');
    if (data.summary.division === undefined) errors.push('Division is missing');
  }
  
  // Check education level
  if (!data.educationLevel) {
    errors.push('Education level is missing');
  } else if (!['O_LEVEL', 'A_LEVEL'].includes(data.educationLevel)) {
    errors.push(`Invalid education level: ${data.educationLevel}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate class result data
 * @param {Object} data - Class result data
 * @returns {Object} - Validation result
 */
export const validateClassResultData = (data) => {
  const errors = [];
  
  // Check required fields
  if (!data) {
    return { isValid: false, errors: ['No data provided'] };
  }
  
  // Check class details
  if (!data.className) errors.push('Class name is missing');
  
  // Check students
  if (!data.students || !Array.isArray(data.students)) {
    errors.push('No students provided');
  } else if (data.students.length === 0) {
    errors.push('Students array is empty');
  } else {
    // Check each student
    data.students.forEach((student, index) => {
      if (!student.name) errors.push(`Student name is missing for student #${index + 1}`);
      if (student.averageMarks === undefined) errors.push(`Average marks are missing for ${student.name || `student #${index + 1}`}`);
      if (student.division === undefined) errors.push(`Division is missing for ${student.name || `student #${index + 1}`}`);
    });
  }
  
  // Check education level
  if (!data.educationLevel) {
    errors.push('Education level is missing');
  } else if (!['O_LEVEL', 'A_LEVEL'].includes(data.educationLevel)) {
    errors.push(`Invalid education level: ${data.educationLevel}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate A-Level student result data
 * @param {Object} data - A-Level student result data
 * @returns {Object} - Validation result
 */
export const validateALevelStudentResultData = (data) => {
  // First, validate common fields
  const { isValid, errors } = validateStudentResultData(data);
  
  // If not valid, return early
  if (!isValid) {
    return { isValid, errors };
  }
  
  // A-Level specific validation
  const aLevelErrors = [];
  
  // Check education level
  if (data.educationLevel !== 'A_LEVEL') {
    aLevelErrors.push(`Invalid education level for A-Level: ${data.educationLevel}`);
  }
  
  // Check principal and subsidiary subjects
  if (data.principalSubjects && Array.isArray(data.principalSubjects)) {
    if (data.principalSubjects.length < 3) {
      aLevelErrors.push(`Insufficient principal subjects: ${data.principalSubjects.length} (minimum 3 required)`);
    }
  } else if (!data.subjectResults.some(result => result.isPrincipal)) {
    aLevelErrors.push('No principal subjects found');
  }
  
  // Check best three points
  if (data.summary && data.summary.bestThreePoints === undefined) {
    aLevelErrors.push('Best three points are missing');
  }
  
  return {
    isValid: aLevelErrors.length === 0,
    errors: [...errors, ...aLevelErrors]
  };
};

/**
 * Validate O-Level student result data
 * @param {Object} data - O-Level student result data
 * @returns {Object} - Validation result
 */
export const validateOLevelStudentResultData = (data) => {
  // First, validate common fields
  const { isValid, errors } = validateStudentResultData(data);
  
  // If not valid, return early
  if (!isValid) {
    return { isValid, errors };
  }
  
  // O-Level specific validation
  const oLevelErrors = [];
  
  // Check education level
  if (data.educationLevel !== 'O_LEVEL') {
    oLevelErrors.push(`Invalid education level for O-Level: ${data.educationLevel}`);
  }
  
  // Check subject count
  if (data.subjectResults && Array.isArray(data.subjectResults)) {
    if (data.subjectResults.length < 7) {
      oLevelErrors.push(`Insufficient subjects: ${data.subjectResults.length} (minimum 7 recommended)`);
    }
  }
  
  // Check best seven points
  if (data.summary && data.summary.bestSevenPoints === undefined) {
    oLevelErrors.push('Best seven points are missing');
  }
  
  return {
    isValid: oLevelErrors.length === 0,
    errors: [...errors, ...oLevelErrors]
  };
};

/**
 * Validate form data
 * @param {Object} formData - Form data
 * @param {Array} requiredFields - Required fields
 * @returns {Object} - Validation result
 */
export const validateFormData = (formData, requiredFields = []) => {
  const errors = {};
  
  // Check required fields
  requiredFields.forEach(field => {
    if (!formData[field]) {
      errors[field] = `${field} is required`;
    }
  });
  
  // Check specific fields
  Object.entries(formData).forEach(([key, value]) => {
    // Skip if already has error
    if (errors[key]) return;
    
    // Validate based on field name
    switch (key) {
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors[key] = 'Invalid email address';
        }
        break;
        
      case 'phone':
        if (value && !/^\+?[0-9]{10,15}$/.test(value)) {
          errors[key] = 'Invalid phone number';
        }
        break;
        
      case 'marks':
      case 'marksObtained':
        const numValue = Number(value);
        if (isNaN(numValue) || numValue < 0 || numValue > 100) {
          errors[key] = 'Marks must be between 0 and 100';
        }
        break;
        
      default:
        // No validation for other fields
        break;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Get validation error message
 * @param {Object} validationResult - Validation result
 * @returns {string} - Error message
 */
export const getValidationErrorMessage = (validationResult) => {
  if (!validationResult || validationResult.isValid) {
    return '';
  }
  
  if (Array.isArray(validationResult.errors)) {
    return validationResult.errors.join('. ');
  }
  
  if (typeof validationResult.errors === 'object') {
    return Object.values(validationResult.errors).join('. ');
  }
  
  return 'Validation failed';
};
