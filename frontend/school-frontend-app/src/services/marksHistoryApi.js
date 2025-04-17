/**
 * Marks History API Service
 *
 * This service provides direct access to the marks history API endpoints.
 */
import axios from 'axios';
import { getAuthToken, isTokenValid } from '../utils/authUtils';

// Determine the base URL
const isLocalDevelopment = process.env.NODE_ENV === 'development';
const baseURL = isLocalDevelopment
  ? 'http://localhost:5000'
  : 'https://agape-render.onrender.com';

console.log(`Marks History API Service: Using base URL: ${baseURL}`);

// Create an axios instance
const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the token to all requests
api.interceptors.request.use(
  async (config) => {
    // Get the token
    let token = getAuthToken();

    // Check if the token is valid
    const tokenValid = isTokenValid();

    // Add the token to the headers if it exists
    if (token && tokenValid) {
      config.headers.Authorization = `Bearer ${token}`;

      // Log the token format (without exposing the full token)
      const tokenPreview = token.length > 20
        ? `${token.substring(0, 10)}...${token.substring(token.length - 5)}`
        : '[INVALID TOKEN FORMAT]';
      console.log(`Marks History API: Using token: ${tokenPreview}`);
    } else {
      console.warn('Marks History API: No valid token available');
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses
    console.log(`Marks History API: ${response.config.method.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    // Log error responses
    console.error(`Marks History API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status}`);

    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      console.error('Unauthorized request. Token may be invalid or expired.');
    }

    // Handle 403 Forbidden errors
    if (error.response && error.response.status === 403) {
      console.error('Forbidden request. You may not have permission to access this resource.');
      console.error('Response data:', error.response.data);
    }

    // Handle 404 Not Found errors
    if (error.response && error.response.status === 404) {
      console.error('Resource not found. The requested endpoint may not exist.');
      console.error('Response data:', error.response.data);
    }

    return Promise.reject(error);
  }
);

/**
 * Get marks history for a result
 * @param {string} resultId - The result ID
 * @param {string} resultModel - The result model (OLevelResult or ALevelResult)
 * @returns {Promise<Object>} The marks history
 */
export const getResultHistory = async (resultId, resultModel = 'OLevelResult') => {
  try {
    console.log(`Fetching marks history for result: ${resultId} (${resultModel})`);
    const response = await api.get(`marks-history/result/${resultId}?resultModel=${resultModel}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching result history:', error);
    throw error;
  }
};

/**
 * Get marks history for a student
 * @param {string} studentId - The student ID
 * @returns {Promise<Object>} The marks history
 */
export const getStudentHistory = async (studentId) => {
  try {
    console.log(`Fetching marks history for student: ${studentId}`);
    const response = await api.get(`marks-history/student/${studentId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching student history:', error);
    throw error;
  }
};

/**
 * Get marks history for a subject
 * @param {string} subjectId - The subject ID
 * @returns {Promise<Object>} The marks history
 */
export const getSubjectHistory = async (subjectId) => {
  try {
    console.log(`Fetching marks history for subject: ${subjectId}`);
    const response = await api.get(`marks-history/subject/${subjectId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching subject history:', error);
    throw error;
  }
};

/**
 * Get marks history for an exam
 * @param {string} examId - The exam ID
 * @returns {Promise<Object>} The marks history
 */
export const getExamHistory = async (examId) => {
  try {
    console.log(`Fetching marks history for exam: ${examId}`);
    const response = await api.get(`marks-history/exam/${examId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching exam history:', error);
    throw error;
  }
};

/**
 * Revert to a previous version
 * @param {string} historyId - The history entry ID
 * @param {string} reason - The reason for reverting
 * @returns {Promise<Object>} The revert response
 */
export const revertToVersion = async (historyId, reason = '') => {
  try {
    console.log(`Reverting to history entry: ${historyId}`);
    const response = await api.post(`marks-history/revert/${historyId}`, { reason });
    return response.data;
  } catch (error) {
    console.error('Error reverting to version:', error);
    throw error;
  }
};

export default {
  getResultHistory,
  getStudentHistory,
  getSubjectHistory,
  getExamHistory,
  revertToVersion
};
