/**
 * Prisma Results API Service
 * 
 * This service provides methods for interacting with the Prisma-based results API.
 */

import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

const prismaResultsApi = {
  /**
   * Get results for a student using Prisma backend
   * @param {String} studentId - The student ID
   * @param {String} examId - The exam ID
   * @returns {Promise<Object>} - The student's results
   */
  getStudentResults: async (studentId, examId) => {
    try {
      const response = await api.get(`/api/prisma/results/student/${studentId}/exam/${examId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting student results from Prisma:', error);
      throw error;
    }
  },

  /**
   * Get results for a class using Prisma backend
   * @param {String} classId - The class ID
   * @param {String} examId - The exam ID
   * @returns {Promise<Object>} - The class results
   */
  getClassResults: async (classId, examId) => {
    try {
      const response = await api.get(`/api/prisma/results/class/${classId}/exam/${examId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting class results from Prisma:', error);
      throw error;
    }
  },

  /**
   * Generate student report using Prisma backend
   * @param {String} studentId - The student ID
   * @param {String} examId - The exam ID
   * @returns {Promise<Object>} - The student report
   */
  generateStudentReport: async (studentId, examId) => {
    try {
      const response = await api.get(`/api/prisma/results/report/student/${studentId}/exam/${examId}`);
      return response.data;
    } catch (error) {
      console.error('Error generating student report from Prisma:', error);
      throw error;
    }
  },

  /**
   * Generate class report using Prisma backend
   * @param {String} classId - The class ID
   * @param {String} examId - The exam ID
   * @returns {Promise<Object>} - The class report
   */
  generateClassReport: async (classId, examId) => {
    try {
      const response = await api.get(`/api/prisma/results/report/class/${classId}/exam/${examId}`);
      return response.data;
    } catch (error) {
      console.error('Error generating class report from Prisma:', error);
      throw error;
    }
  },

  /**
   * Get student result report URL
   * @param {String} studentId - The student ID
   * @param {String} examId - The exam ID
   * @returns {String} - The report URL
   */
  getStudentReportUrl: (studentId, examId) => {
    return `${api.defaults.baseURL}/api/prisma/results/report/student/${studentId}/exam/${examId}`;
  },

  /**
   * Get class result report URL
   * @param {String} classId - The class ID
   * @param {String} examId - The exam ID
   * @returns {String} - The report URL
   */
  getClassReportUrl: (classId, examId) => {
    return `${api.defaults.baseURL}/api/prisma/results/report/class/${classId}/exam/${examId}`;
  }
};

export default prismaResultsApi;
