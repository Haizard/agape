/**
 * @fileoverview Comprehensive error handling utilities for the Agape system
 * This file contains utilities for handling errors consistently across the application,
 * with special handling for education level mismatches and API failures.
 */

/**
 * Error types for the application
 * @enum {string}
 */
export const ErrorTypes = {
  API_ERROR: 'API_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  EDUCATION_LEVEL_MISMATCH: 'EDUCATION_LEVEL_MISMATCH',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

/**
 * Creates a standardized error object
 * @param {string} message - Error message
 * @param {ErrorTypes} type - Error type
 * @param {Object} [details={}] - Additional error details
 * @returns {Object} Standardized error object
 */
export const createError = (message, type, details = {}) => ({
  message,
  type,
  details,
  timestamp: new Date().toISOString()
});

/**
 * Handles education level mismatch errors
 * @param {string} expectedLevel - Expected education level ('O_LEVEL' or 'A_LEVEL')
 * @param {string} actualLevel - Actual education level
 * @param {Object} [additionalDetails={}] - Additional error details
 * @returns {Object} Standardized error object
 */
export const handleEducationLevelMismatch = (expectedLevel, actualLevel, additionalDetails = {}) => {
  const message = `Education level mismatch: Expected ${expectedLevel}, but got ${actualLevel || 'undefined'}`;
  
  // Log the error for debugging
  console.error(message, additionalDetails);
  
  return createError(
    message,
    ErrorTypes.EDUCATION_LEVEL_MISMATCH,
    {
      expectedLevel,
      actualLevel,
      ...additionalDetails
    }
  );
};

/**
 * Handles API errors with appropriate recovery suggestions
 * @param {Error} error - The original error object
 * @param {string} endpoint - The API endpoint that failed
 * @param {Object} [requestData={}] - The data that was sent with the request
 * @returns {Object} Standardized error object with recovery suggestions
 */
export const handleApiError = (error, endpoint, requestData = {}) => {
  // Extract status code and response data if available
  const status = error.response?.status;
  const responseData = error.response?.data;
  
  // Determine error type based on status code
  let errorType = ErrorTypes.API_ERROR;
  if (status === 401 || status === 403) {
    errorType = ErrorTypes.AUTHENTICATION_ERROR;
  } else if (!error.response && error.message.includes('Network Error')) {
    errorType = ErrorTypes.NETWORK_ERROR;
  }
  
  // Create appropriate error message
  let message = 'An error occurred while fetching data';
  if (status) {
    message = `API Error (${status}): ${responseData?.message || error.message}`;
  } else if (errorType === ErrorTypes.NETWORK_ERROR) {
    message = 'Network error: Please check your internet connection';
  }
  
  // Log the error for debugging
  console.error(`${message} - Endpoint: ${endpoint}`, error);
  
  // Generate recovery suggestions
  const recoverySuggestions = generateRecoverySuggestions(errorType, status);
  
  return createError(
    message,
    errorType,
    {
      endpoint,
      status,
      responseData,
      requestData,
      recoverySuggestions,
      originalError: error.message
    }
  );
};

/**
 * Generates recovery suggestions based on error type and status
 * @param {ErrorTypes} errorType - The type of error
 * @param {number} [status] - HTTP status code (if applicable)
 * @returns {string[]} Array of recovery suggestions
 */
const generateRecoverySuggestions = (errorType, status) => {
  const suggestions = [];
  
  switch (errorType) {
    case ErrorTypes.AUTHENTICATION_ERROR:
      suggestions.push('Try logging out and logging back in');
      suggestions.push('Your session may have expired');
      break;
    case ErrorTypes.NETWORK_ERROR:
      suggestions.push('Check your internet connection');
      suggestions.push('The server may be temporarily unavailable');
      suggestions.push('Try again in a few minutes');
      break;
    case ErrorTypes.EDUCATION_LEVEL_MISMATCH:
      suggestions.push('Make sure you are viewing the correct student or class');
      suggestions.push('Check if the student\'s education level is set correctly');
      break;
    case ErrorTypes.API_ERROR:
      suggestions.push('Try refreshing the page');
      if (status === 404) {
        suggestions.push('The requested resource may not exist');
      } else if (status === 500) {
        suggestions.push('There may be a server issue, please try again later');
      }
      break;
    default:
      suggestions.push('Try refreshing the page');
      suggestions.push('If the problem persists, contact support');
  }
  
  return suggestions;
};

/**
 * Validates education level data and ensures it matches the expected level
 * @param {Object} data - The data object to validate
 * @param {string} expectedLevel - Expected education level ('O_LEVEL' or 'A_LEVEL')
 * @param {Function} [onError] - Optional callback for handling errors
 * @returns {Object} Object with validation result and error if applicable
 */
export const validateEducationLevel = (data, expectedLevel, onError) => {
  // Check if data exists
  if (!data) {
    const error = createError(
      'No data available to validate',
      ErrorTypes.VALIDATION_ERROR
    );
    if (onError) onError(error);
    return { isValid: false, error };
  }
  
  // Check if education level exists in the data
  const actualLevel = data.educationLevel;
  if (!actualLevel) {
    const error = createError(
      'Education level not specified in data',
      ErrorTypes.VALIDATION_ERROR,
      { data }
    );
    if (onError) onError(error);
    return { isValid: false, error };
  }
  
  // Check if education level matches expected level
  if (actualLevel !== expectedLevel) {
    const error = handleEducationLevelMismatch(expectedLevel, actualLevel, { data });
    if (onError) onError(error);
    return { isValid: false, error };
  }
  
  // All checks passed
  return { isValid: true };
};

/**
 * Higher-order function that adds error handling to an async function
 * @param {Function} asyncFn - The async function to wrap
 * @param {Object} options - Options for error handling
 * @param {Function} options.onError - Function to call when an error occurs
 * @param {Function} options.onSuccess - Function to call when the function succeeds
 * @param {Function} options.onFinally - Function to call after the function completes (success or error)
 * @returns {Function} Wrapped function with error handling
 */
export const withErrorHandling = (asyncFn, { onError, onSuccess, onFinally } = {}) => {
  return async (...args) => {
    try {
      const result = await asyncFn(...args);
      if (onSuccess) onSuccess(result);
      return result;
    } catch (error) {
      const handledError = handleApiError(
        error,
        error.config?.url || 'unknown endpoint',
        error.config?.data
      );
      if (onError) onError(handledError);
      throw handledError;
    } finally {
      if (onFinally) onFinally();
    }
  };
};

/**
 * Displays user-friendly error messages based on error type
 * @param {Object} error - The error object
 * @returns {string} User-friendly error message
 */
export const getUserFriendlyErrorMessage = (error) => {
  if (!error) return 'An unknown error occurred';
  
  switch (error.type) {
    case ErrorTypes.EDUCATION_LEVEL_MISMATCH:
      return `This report is for ${error.details.actualLevel || 'a different'} education level. Please use the appropriate report component.`;
    case ErrorTypes.AUTHENTICATION_ERROR:
      return 'You are not authorized to access this resource. Please log in again.';
    case ErrorTypes.NETWORK_ERROR:
      return 'Network error: Please check your internet connection and try again.';
    case ErrorTypes.API_ERROR:
      return `Error fetching data: ${error.message}`;
    default:
      return error.message || 'An unknown error occurred';
  }
};

/**
 * Checks if an error is recoverable and provides recovery options
 * @param {Object} error - The error object
 * @returns {Object} Object with isRecoverable flag and recovery options
 */
export const getErrorRecoveryOptions = (error) => {
  if (!error) return { isRecoverable: false };
  
  const isRecoverable = error.type !== ErrorTypes.AUTHENTICATION_ERROR;
  
  return {
    isRecoverable,
    suggestions: error.details?.recoverySuggestions || [],
    canRetry: error.type === ErrorTypes.NETWORK_ERROR || error.type === ErrorTypes.API_ERROR,
    canUseOfflineData: error.type === ErrorTypes.NETWORK_ERROR,
    canRedirect: error.type === ErrorTypes.EDUCATION_LEVEL_MISMATCH,
    redirectUrl: error.type === ErrorTypes.EDUCATION_LEVEL_MISMATCH 
      ? getRedirectUrlForEducationLevel(error.details.expectedLevel, error.details.actualLevel)
      : null
  };
};

/**
 * Gets the appropriate redirect URL for education level mismatch
 * @param {string} expectedLevel - Expected education level
 * @param {string} actualLevel - Actual education level
 * @returns {string|null} Redirect URL or null if not applicable
 */
const getRedirectUrlForEducationLevel = (expectedLevel, actualLevel) => {
  // Extract student and exam IDs from the current URL
  const urlParts = window.location.pathname.split('/');
  const studentId = urlParts[urlParts.length - 2];
  const examId = urlParts[urlParts.length - 1];
  
  if (expectedLevel === 'O_LEVEL' && actualLevel === 'A_LEVEL') {
    return `/results/a-level/${studentId}/${examId}`;
  } else if (expectedLevel === 'A_LEVEL' && actualLevel === 'O_LEVEL') {
    return `/results/o-level/${studentId}/${examId}`;
  }
  
  return null;
};
