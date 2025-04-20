/**
 * Custom error classes and error handling utilities
 */

/**
 * API Error class for handling API-specific errors
 */
export class ApiError extends Error {
  constructor(message, statusCode, originalError = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.originalError = originalError;
  }
}

/**
 * Authorization Error class for handling permission issues
 */
export class AuthorizationError extends Error {
  constructor(message, resource = null, originalError = null) {
    super(message);
    this.name = 'AuthorizationError';
    this.resource = resource;
    this.originalError = originalError;
  }
}

/**
 * Data Validation Error class for handling invalid data
 */
export class ValidationError extends Error {
  constructor(message, fields = [], originalError = null) {
    super(message);
    this.name = 'ValidationError';
    this.fields = fields;
    this.originalError = originalError;
  }
}

/**
 * Handles API errors and converts them to appropriate custom error types
 * @param {Error} error - The original error object
 * @returns {Error} A custom error object with more context
 */
export const handleApiError = (error) => {
  // If it's already a custom error, return it
  if (error instanceof ApiError || 
      error instanceof AuthorizationError || 
      error instanceof ValidationError) {
    return error;
  }
  
  // Check if it's an Axios error with a response
  if (error.response) {
    const { status, data } = error.response;
    
    // Handle different status codes
    switch (status) {
      case 401:
      case 403:
        return new AuthorizationError(
          data?.message || 'You do not have permission to access this resource',
          data?.resource,
          error
        );
        
      case 400:
      case 422:
        return new ValidationError(
          data?.message || 'Invalid data provided',
          data?.fields || [],
          error
        );
        
      case 404:
        return new ApiError(
          data?.message || 'Resource not found',
          status,
          error
        );
        
      case 500:
      case 502:
      case 503:
        return new ApiError(
          data?.message || 'Server error occurred',
          status,
          error
        );
        
      default:
        return new ApiError(
          data?.message || error.message || 'An unknown error occurred',
          status,
          error
        );
    }
  }
  
  // Network errors or other non-response errors
  if (error.request) {
    return new ApiError(
      'Network error - unable to connect to the server',
      0,
      error
    );
  }
  
  // Default case for other types of errors
  return new Error(error.message || 'An unknown error occurred');
};

/**
 * Logs an error with context information
 * @param {Error} error - The error to log
 * @param {Object} context - Additional context information
 */
export const logError = (error, context = {}) => {
  const errorInfo = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...context
  };
  
  // Add specific properties based on error type
  if (error instanceof ApiError) {
    errorInfo.statusCode = error.statusCode;
  } else if (error instanceof AuthorizationError) {
    errorInfo.resource = error.resource;
  } else if (error instanceof ValidationError) {
    errorInfo.fields = error.fields;
  }
  
  // Log to console in development
  console.error('Error:', errorInfo);
  
  // In production, you would send this to your error tracking service
  // Example: Sentry.captureException(error, { extra: errorInfo });
};

export default {
  ApiError,
  AuthorizationError,
  ValidationError,
  handleApiError,
  logError
};
