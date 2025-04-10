import axios from 'axios';
import { normalizeApiResponse } from './dataNormalizer';

/**
 * Create a new axios instance with interceptors to normalize responses
 */
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a response interceptor to normalize data
api.interceptors.response.use(
  (response) => {
    // Normalize the response data
    const normalizedResponse = {
      ...response,
      data: normalizeApiResponse(response.data),
    };
    return normalizedResponse;
  },
  (error) => {
    // Return the error as is
    return Promise.reject(error);
  }
);

/**
 * Get a student result report
 * @param {string} studentId - The student ID
 * @param {string} examId - The exam ID
 * @param {string} educationLevel - The education level (O_LEVEL or A_LEVEL)
 * @returns {Promise<Object>} - The normalized student result report
 */
export const getStudentResultReport = async (studentId, examId, educationLevel = 'O_LEVEL') => {
  try {
    let endpoint = '';
    if (educationLevel === 'A_LEVEL') {
      endpoint = `/api/a-level-results/student/${studentId}/${examId}`;
    } else {
      endpoint = `/api/o-level-results/student/${studentId}/${examId}`;
    }
    console.log(`Fetching result report from endpoint: ${endpoint}`);
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error fetching student result report:', error);
    throw error;
  }
};

/**
 * Get a class result report
 * @param {string} classId - The class ID
 * @param {string} examId - The exam ID
 * @param {string} educationLevel - The education level (O_LEVEL or A_LEVEL)
 * @returns {Promise<Object>} - The normalized class result report
 */
export const getClassResultReport = async (classId, examId, educationLevel = 'O_LEVEL') => {
  try {
    let endpoint = '';
    if (educationLevel === 'A_LEVEL') {
      endpoint = `/api/a-level-results/class/${classId}/${examId}`;
    } else {
      endpoint = `/api/o-level-results/class/${classId}/${examId}`;
    }
    console.log(`Fetching class result report from endpoint: ${endpoint}`);
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error fetching class result report:', error);
    throw error;
  }
};

export default {
  get: api.get,
  post: api.post,
  put: api.put,
  delete: api.delete,
  patch: api.patch,
  getStudentResultReport,
  getClassResultReport,
};
