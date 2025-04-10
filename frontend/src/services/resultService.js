import axios from 'axios';

const API_URL = '/api/v2/results';

/**
 * Service for handling result operations
 */
const ResultService = {
  /**
   * Create a new result
   * @param {Object} resultData - The result data
   * @returns {Promise<Object>} - The created result
   */
  createResult: async (resultData) => {
    try {
      const response = await axios.post(API_URL, resultData);
      return response.data;
    } catch (error) {
      console.error('Error creating result:', error);
      throw error;
    }
  },

  /**
   * Enter marks for a student
   * @param {Object} marksData - The marks data
   * @returns {Promise<Object>} - The created result
   */
  enterMarks: async (marksData) => {
    try {
      const response = await axios.post(`${API_URL}/enter-marks`, marksData);
      return response.data;
    } catch (error) {
      console.error('Error entering marks:', error);
      throw error;
    }
  },

  /**
   * Enter batch marks
   * @param {Array} marksData - Array of marks data
   * @returns {Promise<Object>} - The created results
   */
  enterBatchMarks: async (marksData) => {
    try {
      const response = await axios.post(`${API_URL}/enter-batch-marks`, { marksData });
      return response.data;
    } catch (error) {
      console.error('Error entering batch marks:', error);
      throw error;
    }
  },

  /**
   * Get results for a student
   * @param {String} studentId - The student ID
   * @param {Object} filters - Additional filters (examId, academicYearId, etc.)
   * @returns {Promise<Array>} - The student's results
   */
  getStudentResults: async (studentId, filters = {}) => {
    try {
      // Build query string
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const response = await axios.get(`${API_URL}/student/${studentId}${queryString}`);
      return response.data;
    } catch (error) {
      console.error('Error getting student results:', error);
      throw error;
    }
  },

  /**
   * Get results for a class
   * @param {String} classId - The class ID
   * @param {Object} filters - Additional filters (examId, academicYearId, etc.)
   * @returns {Promise<Array>} - The class results
   */
  getClassResults: async (classId, filters = {}) => {
    try {
      // Build query string
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const response = await axios.get(`${API_URL}/class/${classId}${queryString}`);
      return response.data;
    } catch (error) {
      console.error('Error getting class results:', error);
      throw error;
    }
  },

  /**
   * Get student result report
   * @param {String} studentId - The student ID
   * @param {String} examId - The exam ID
   * @returns {Promise<Object>} - The report data
   */
  getStudentReport: async (studentId, examId) => {
    try {
      const response = await axios.get(`${API_URL}/report/student/${studentId}/${examId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting student report:', error);
      throw error;
    }
  },

  /**
   * Get class result report
   * @param {String} classId - The class ID
   * @param {String} examId - The exam ID
   * @returns {Promise<Object>} - The report data
   */
  getClassReport: async (classId, examId) => {
    try {
      const response = await axios.get(`${API_URL}/report/class/${classId}/${examId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting class report:', error);
      throw error;
    }
  },

  /**
   * Check for duplicate results
   * @param {Object} params - The check parameters
   * @returns {Promise<Object>} - The check result
   */
  checkDuplicates: async (params) => {
    try {
      const response = await axios.post(`${API_URL}/monitor/check-duplicates`, params);
      return response.data;
    } catch (error) {
      console.error('Error checking duplicates:', error);
      throw error;
    }
  },

  /**
   * Fix duplicate results
   * @param {Object} params - The fix parameters
   * @returns {Promise<Object>} - The fix result
   */
  fixDuplicates: async (params) => {
    try {
      const response = await axios.post(`${API_URL}/monitor/fix-duplicates`, params);
      return response.data;
    } catch (error) {
      console.error('Error fixing duplicates:', error);
      throw error;
    }
  },

  /**
   * Check grade and points
   * @param {Object} params - The check parameters
   * @returns {Promise<Object>} - The check result
   */
  checkGrade: async (params) => {
    try {
      const response = await axios.post(`${API_URL}/monitor/check-grade`, params);
      return response.data;
    } catch (error) {
      console.error('Error checking grade:', error);
      throw error;
    }
  },

  /**
   * Fix grade and points
   * @param {Object} params - The fix parameters
   * @returns {Promise<Object>} - The fix result
   */
  fixGrade: async (params) => {
    try {
      const response = await axios.post(`${API_URL}/monitor/fix-grade`, params);
      return response.data;
    } catch (error) {
      console.error('Error fixing grade:', error);
      throw error;
    }
  }
};

export default ResultService;
