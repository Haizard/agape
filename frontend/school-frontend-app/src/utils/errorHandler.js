/**
 * Error Handler Utility
 *
 * This utility provides standardized error handling functions
 * to ensure consistency across the application.
 */

/**
 * Handle API error
 * @param {Error} error - Error object
 * @param {string} source - Source of the error
 * @param {Object} params - Additional parameters
 * @returns {Object} - Formatted error object
 */
export const handleApiError = (error, source = 'unknown', params = {}) => {
  console.error(`Error in ${source}:`, error);

  // Check for education level mismatch
  if (error.response?.data?.educationLevel) {
    return {
      message: `This is not the correct education level. Expected: ${error.response.data.expectedLevel}, Actual: ${error.response.data.educationLevel}`,
      type: 'EDUCATION_LEVEL_MISMATCH',
      details: error.response.data,
      source
    };
  }

  // Check for form level mismatch
  if (error.response?.data?.form) {
    return {
      message: `This is not the correct form level. Expected: ${error.response.data.expectedForm}, Actual: ${error.response.data.form}`,
      type: 'FORM_LEVEL_MISMATCH',
      details: error.response.data,
      source
    };
  }

  // Check for network errors
  if (error.message === 'Network Error') {
    return {
      message: 'Unable to connect to the server. Please check your internet connection.',
      type: 'NETWORK_ERROR',
      source
    };
  }

  // Check for timeout errors
  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    return {
      message: 'The request timed out. Please try again later.',
      type: 'TIMEOUT_ERROR',
      source
    };
  }

  // Check for authentication errors
  if (error.response?.status === 401) {
    return {
      message: 'Your session has expired. Please log in again.',
      type: 'AUTHENTICATION_ERROR',
      status: 401,
      source
    };
  }

  // Check for authorization errors
  if (error.response?.status === 403) {
    return {
      message: 'You do not have permission to perform this action.',
      type: 'AUTHORIZATION_ERROR',
      status: 403,
      source
    };
  }

  // Check for not found errors
  if (error.response?.status === 404) {
    return {
      message: 'The requested resource was not found.',
      type: 'NOT_FOUND_ERROR',
      status: 404,
      source
    };
  }

  // Check for validation errors
  if (error.response?.status === 422 || error.response?.data?.errors) {
    const validationErrors = error.response.data.errors || {};
    const errorMessages = Object.values(validationErrors).flat();

    return {
      message: errorMessages.length > 0
        ? errorMessages.join('. ')
        : 'Validation failed. Please check your input.',
      type: 'VALIDATION_ERROR',
      status: 422,
      errors: validationErrors,
      source
    };
  }

  // Check for server errors
  if (error.response?.status >= 500) {
    return {
      message: 'An error occurred on the server. Please try again later.',
      type: 'SERVER_ERROR',
      status: error.response.status,
      source
    };
  }

  // Default error
  return {
    message: error.response?.data?.message || error.message || 'An unknown error occurred',
    type: 'UNKNOWN_ERROR',
    status: error.response?.status,
    source
  };
};

/**
 * Validate education level
 * @param {Object} data - Data object
 * @param {string} expectedLevel - Expected education level
 * @param {Function} setError - Function to set error
 * @returns {Object} - Validation result
 */
export const validateEducationLevel = (data, expectedLevel, setError) => {
  if (!data) {
    return { isValid: false, error: 'No data provided' };
  }

  if (!data.educationLevel) {
    return { isValid: false, error: 'Education level not specified in data' };
  }

  if (data.educationLevel !== expectedLevel) {
    const error = {
      message: `This is not a ${expectedLevel} report. Please use the correct component.`,
      type: 'EDUCATION_LEVEL_MISMATCH',
      details: {
        expectedLevel,
        actualLevel: data.educationLevel
      }
    };

    if (setError) {
      setError(error);
    }

    return { isValid: false, error };
  }

  return { isValid: true };
};

/**
 * Validate form level
 * @param {Object} data - Data object
 * @param {number|string} expectedForm - Expected form level
 * @param {Function} setError - Function to set error
 * @returns {Object} - Validation result
 */
export const validateFormLevel = (data, expectedForm, setError) => {
  if (!data || !data.studentDetails) {
    return { isValid: false, error: 'No student details provided' };
  }

  const studentForm = data.studentDetails.form;
  const expectedFormStr = typeof expectedForm === 'number' ? `Form ${expectedForm}` : expectedForm;
  const expectedFormNum = typeof expectedForm === 'string' ? parseInt(expectedForm.replace('Form ', ''), 10) : expectedForm;

  // Check if form matches (handle different formats)
  const isMatch =
    studentForm === expectedForm ||
    studentForm === expectedFormStr ||
    studentForm === expectedFormNum ||
    studentForm === expectedFormNum.toString();

  if (!isMatch) {
    const error = {
      message: `This is not a ${expectedFormStr} student. Please use the correct component.`,
      type: 'FORM_LEVEL_MISMATCH',
      details: {
        expectedForm: expectedFormStr,
        actualForm: studentForm
      }
    };

    if (setError) {
      setError(error);
    }

    return { isValid: false, error };
  }

  return { isValid: true };
};

/**
 * Get user-friendly error message
 * @param {Error|Object} error - Error object
 * @returns {string} - User-friendly error message
 */
export const getUserFriendlyErrorMessage = (error) => {
  if (!error) {
    return 'An unknown error occurred';
  }

  // If it's already a formatted error object
  if (error.type && error.message) {
    return error.message;
  }

  // If it's an Axios error
  if (error.response) {
    return error.response.data?.message ||
      `Server error: ${error.response.status} ${error.response.statusText}`;
  }

  // If it's a standard error
  return error.message || 'An unknown error occurred';
};

/**
 * Get error recovery suggestion
 * @param {Error|Object} error - Error object
 * @returns {string} - Recovery suggestion
 */
export const getErrorRecoverySuggestion = (error) => {
  if (!error || !error.type) {
    return 'Please try again or contact support if the problem persists.';
  }

  switch (error.type) {
    case 'NETWORK_ERROR':
      return 'Please check your internet connection and try again.';

    case 'TIMEOUT_ERROR':
      return 'The server is taking too long to respond. Please try again later.';

    case 'AUTHENTICATION_ERROR':
      return 'Please log in again to continue.';

    case 'AUTHORIZATION_ERROR':
      return 'Please contact an administrator if you need access to this resource.';

    case 'NOT_FOUND_ERROR':
      return 'Please check the URL or navigate back to the previous page.';

    case 'VALIDATION_ERROR':
      return 'Please check your input and try again.';

    case 'SERVER_ERROR':
      return 'Please try again later or contact support if the problem persists.';

    case 'EDUCATION_LEVEL_MISMATCH':
      return `Please use the ${error.details?.expectedLevel || 'correct'} component instead.`;

    case 'FORM_LEVEL_MISMATCH':
      return `Please use the ${error.details?.expectedForm || 'correct'} component instead.`;

    default:
      return 'Please try again or contact support if the problem persists.';
  }
};