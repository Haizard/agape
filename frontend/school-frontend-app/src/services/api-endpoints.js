/**
 * Centralized API endpoints for the application
 * This file serves as a single source of truth for all API endpoints
 * to prevent URL typos and ensure consistency across the application.
 */

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/users/login',
    PROFILE: '/api/users/profile',
  },
  
  TEACHER: {
    PROFILE: '/api/teachers/profile/me',
    CLASSES: '/api/teacher-classes/my-classes',
    SUBJECTS: '/api/teacher-classes/my-subjects',
    ENHANCED: {
      O_LEVEL: {
        SUBJECTS: (classId) => `/api/enhanced-teachers/o-level/classes/${classId}/subjects`,
        STUDENTS: (classId, subjectId = 'any') => 
          `/api/enhanced-teachers/o-level/classes/${classId}/subjects/${subjectId}/students`
      }
    }
  },
  
  CLASSES: {
    LIST: '/api/classes',
    DETAILS: (classId) => `/api/classes/${classId}`,
    STUDENTS: (classId) => `/api/classes/${classId}/students`,
  },
  
  SUBJECTS: {
    LIST: '/api/subjects',
    DETAILS: (subjectId) => `/api/subjects/${subjectId}`,
  },
  
  EXAMS: {
    LIST: '/api/exams',
    DETAILS: (examId) => `/api/exams/${examId}`,
  },
  
  MARKS: {
    O_LEVEL: {
      CHECK: '/api/o-level/marks/check',
      BATCH: '/api/o-level/marks/batch',
    },
    LEGACY: {
      CHECK: '/api/check-marks/check-existing',
    }
  },
  
  STUDENT_SELECTIONS: {
    BY_CLASS: (classId) => `/api/student-subject-selections/class/${classId}`,
  }
};

/**
 * Helper function to get an endpoint with proper error handling
 * @param {Function|string} endpoint - The endpoint function or string
 * @param {...any} args - Arguments to pass to the endpoint function
 * @returns {string} The formatted endpoint URL
 */
export const getEndpoint = (endpoint, ...args) => {
  try {
    if (typeof endpoint === 'function') {
      return endpoint(...args);
    }
    return endpoint;
  } catch (error) {
    console.error('Error formatting API endpoint:', error);
    // Return a fallback or throw an error based on your error handling strategy
    throw new Error(`Failed to format API endpoint: ${error.message}`);
  }
};

export default ENDPOINTS;
