/**
 * Enhanced Teacher API Service
 *
 * This service provides direct access to the enhanced teacher routes
 * for improved O-Level handling.
 */

import axios from 'axios';
// Get auth token from localStorage directly
const getAuthToken = () => localStorage.getItem('token');

// Create an axios instance with default config
const api = axios.create({
  baseURL: '/',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add auth token to all requests
api.interceptors.request.use(
  config => {
    const token = getAuthToken();
    if (token) {
      console.log('Added token to request:', token.substring(0, 10) + '...');
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Request config:', config);
    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging and fallback handling
api.interceptors.response.use(
  response => {
    console.log(`Response: ${response.config.method.toUpperCase()} ${response.config.url} - ${response.status} (${response.config.duration || 'unknown'}ms)`);
    return response;
  },
  error => {
    console.error('Response error:', error.config || error);

    // Check if this is a 404 error (endpoint not found)
    if (error.response && error.response.status === 404) {
      console.log('Enhanced endpoint not available, falling back to original endpoint');

      // Return a rejected promise with a special flag to indicate fallback is needed
      return Promise.reject({
        ...error,
        needsFallback: true,
        originalError: error
      });
    }

    return Promise.reject(error);
  }
);

/**
 * Get the current teacher's profile
 * @returns {Promise<Object>} - Teacher profile
 */
const getTeacherProfile = async () => {
  try {
    try {
      console.log('Getting teacher profile using enhanced API service');
      const response = await api.get('/api/enhanced-teachers/profile');
      return response.data.teacher;
    } catch (error) {
      // Check if we need to fall back to the original endpoint
      if (error.needsFallback) {
        console.log('Enhanced endpoint not available, falling back to original endpoint');
        // Fall back to the original endpoint
        const fallbackResponse = await api.get('/api/teachers/profile/me');
        return fallbackResponse.data;
      }

      // If it's not a fallback error, rethrow it
      throw error;
    }
  } catch (error) {
    console.error('Error fetching teacher profile:', error);
    throw error;
  }
};

/**
 * Get classes assigned to the current teacher
 * @returns {Promise<Array>} - Array of classes
 */
const getAssignedClasses = async () => {
  try {
    const response = await api.get('/api/enhanced-teachers/classes');
    return response.data.classes;
  } catch (error) {
    console.error('Error fetching assigned classes:', error);
    throw error;
  }
};

/**
 * Get subjects assigned to the current teacher in a specific class
 * @param {string} classId - Class ID
 * @returns {Promise<Array>} - Array of subjects
 */
const getAssignedSubjects = async (classId) => {
  try {
    const response = await api.get(`/api/enhanced-teachers/classes/${classId}/subjects`);
    return response.data.subjects;
  } catch (error) {
    console.error('Error fetching assigned subjects:', error);
    throw error;
  }
};

/**
 * Get subjects assigned to the current teacher in a specific O-Level class
 * @param {string} classId - Class ID
 * @returns {Promise<Array>} - Array of subjects
 */
const getOLevelAssignedSubjects = async (classId) => {
  try {
    const response = await api.get(`/api/enhanced-teachers/o-level/classes/${classId}/subjects`);
    return response.data.subjects;
  } catch (error) {
    console.error('Error fetching O-Level assigned subjects:', error);
    throw error;
  }
};

/**
 * Get students in a class for a subject the teacher is assigned to
 * @param {string} classId - Class ID
 * @param {string} subjectId - Subject ID
 * @param {string} educationLevel - Education level (optional)
 * @returns {Promise<Array>} - Array of students
 */
const getStudentsForSubject = async (classId, subjectId, educationLevel) => {
  try {
    try {
      // If this is an O-Level class, use the O-Level specific endpoint
      if (educationLevel === 'O_LEVEL') {
        console.log('Getting O-Level students using O-Level specific endpoint');
        try {
          const response = await api.get(`/api/enhanced-teachers/o-level/classes/${classId}/subjects/${subjectId}/students`);
          return response.data.students;
        } catch (oLevelError) {
          console.log('O-Level specific endpoint failed, falling back to general endpoint');
          // Fall back to the general endpoint
        }
      }

      console.log('Getting students using enhanced API service');
      const response = await api.get(`/api/enhanced-teachers/classes/${classId}/subjects/${subjectId}/students`);
      return response.data.students;
    } catch (error) {
      // Check if we need to fall back to the original endpoint
      if (error.needsFallback || error.response?.status === 403) {
        console.log('Enhanced endpoint not available or returned 403, falling back to original endpoint');
        // Fall back to the original endpoint
        const fallbackResponse = await api.get(`/api/teachers/classes/${classId}/students`);
        return fallbackResponse.data;
      }

      // If it's not a fallback error, rethrow it
      throw error;
    }
  } catch (error) {
    console.error('Error fetching students for subject:', error);

    // Last resort fallback - try to get all students in the class
    try {
      console.log('Trying last resort fallback to get all students in class');
      // First try our direct class-students endpoint
      try {
        const directResponse = await api.get(`/api/enhanced-teachers/class-students/${classId}`);
        return directResponse.data.students;
      } catch (directError) {
        console.log('Direct class-students endpoint failed, trying student API');
        // Fall back to the students API
        const lastResortResponse = await api.get(`/api/students/class/${classId}`);
        return lastResortResponse.data;
      }
    } catch (fallbackError) {
      console.error('All fallback attempts failed:', fallbackError);
      throw error; // Throw the original error
    }
  }
};

/**
 * Enter marks for a subject the teacher is assigned to
 * @param {string} classId - Class ID
 * @param {string} subjectId - Subject ID
 * @param {string} examId - Exam ID
 * @param {Array} marks - Array of mark objects
 * @returns {Promise<Object>} - Result object
 */
const enterMarks = async (classId, subjectId, examId, marks) => {
  try {
    const response = await api.post(`/api/enhanced-teachers/classes/${classId}/subjects/${subjectId}/marks`, {
      examId,
      marks
    });
    return response.data;
  } catch (error) {
    console.error('Error entering marks:', error);
    throw error;
  }
};

/**
 * Diagnose and fix teacher assignments
 * @param {string} teacherId - Teacher ID
 * @param {string} classId - Class ID
 * @returns {Promise<Object>} - Result object
 */
const diagnoseAndFixAssignments = async (teacherId, classId) => {
  try {
    try {
      console.log('Diagnosing assignments using enhanced API service');
      const response = await api.post('/api/enhanced-teachers/diagnose-and-fix', {
        teacherId,
        classId
      });
      return response.data;
    } catch (error) {
      // Check if we need to fall back to the original endpoint
      if (error.needsFallback) {
        console.log('Enhanced endpoint not available, falling back to original endpoint');
        // Fall back to the original endpoint
        const fallbackResponse = await api.post('/api/fix-teacher/diagnose-and-fix', {
          teacherId,
          classId
        });
        return fallbackResponse.data;
      }

      // If it's not a fallback error, rethrow it
      throw error;
    }
  } catch (error) {
    console.error('Error diagnosing assignments:', error);
    throw error;
  }
};

export default {
  getTeacherProfile,
  getAssignedClasses,
  getAssignedSubjects,
  getOLevelAssignedSubjects,
  getStudentsForSubject,
  enterMarks,
  diagnoseAndFixAssignments
};
