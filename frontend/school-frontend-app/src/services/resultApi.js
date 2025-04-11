import api from './api';

/**
 * Service for interacting with the new result API endpoints
 */
const resultApi = {
  /**
   * Create a new result
   * @param {Object} resultData - The result data
   * @returns {Promise<Object>} - The created result
   */
  createResult: async (resultData) => {
    try {
      const response = await api.post('/api/v2/results', resultData);
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
      const response = await api.post('/api/v2/results/enter-marks', marksData);
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
      const response = await api.post('/api/v2/results/enter-batch-marks', { marksData });
      return response.data;
    } catch (error) {
      console.error('Error entering batch marks:', error);
      throw error;
    }
  },

  /**
   * Get results for a student
   * @param {String} studentId - The student ID
   * @param {Object} filters - Optional filters (examId, academicYearId, examTypeId)
   * @returns {Promise<Array>} - The student's results
   */
  getStudentResults: async (studentId, filters = {}) => {
    try {
      // Build query string
      const queryParams = new URLSearchParams();
      if (filters.examId) queryParams.append('examId', filters.examId);
      if (filters.academicYearId) queryParams.append('academicYearId', filters.academicYearId);
      if (filters.examTypeId) queryParams.append('examTypeId', filters.examTypeId);

      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const response = await api.get(`/api/v2/results/student/${studentId}${queryString}`);
      return response.data;
    } catch (error) {
      console.error('Error getting student results:', error);
      throw error;
    }
  },

  /**
   * Get results for a class
   * @param {String} classId - The class ID
   * @param {Object} filters - Optional filters (examId, academicYearId, examTypeId)
   * @returns {Promise<Array>} - The class results
   */
  getClassResults: async (classId, filters = {}) => {
    try {
      // Build query string
      const queryParams = new URLSearchParams();
      if (filters.examId) queryParams.append('examId', filters.examId);
      if (filters.academicYearId) queryParams.append('academicYearId', filters.academicYearId);
      if (filters.examTypeId) queryParams.append('examTypeId', filters.examTypeId);

      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const response = await api.get(`/api/v2/results/class/${classId}${queryString}`);
      return response.data;
    } catch (error) {
      console.error('Error getting class results:', error);
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
    return `${api.defaults.baseURL}/api/v2/results/report/student/${studentId}/${examId}`;
  },

  /**
   * Get class result report URL
   * @param {String} classId - The class ID
   * @param {String} examId - The exam ID
   * @returns {String} - The report URL
   */
  getClassReportUrl: (classId, examId) => {
    return `${api.defaults.baseURL}/api/v2/results/report/class/${classId}/${examId}`;
  },

  /**
   * Get A-Level student result report URL
   * @param {String} studentId - The student ID
   * @param {String} examId - The exam ID
   * @returns {String} - The report URL
   */
  getALevelStudentReportUrl: (studentId, examId) => {
    return `${api.defaults.baseURL}/api/a-level-results/student/${studentId}/${examId}`;
  },

  /**
   * Get A-Level class result report URL
   * @param {String} classId - The class ID
   * @param {String} examId - The exam ID
   * @returns {String} - The report URL
   */
  getALevelClassReportUrl: (classId, examId) => {
    return `${api.defaults.baseURL}/api/a-level-results/class/${classId}/${examId}`;
  },

  /**
   * Get O-Level student result report URL
   * @param {String} studentId - The student ID
   * @param {String} examId - The exam ID
   * @returns {String} - The report URL
   */
  getOLevelStudentReportUrl: (studentId, examId) => {
    // Use the dedicated API endpoint for O-Level results
    return `${api.defaults.baseURL}/api/o-level-results/student/${studentId}/${examId}`;
  },

  /**
   * Get O-Level class result report URL
   * @param {String} classId - The class ID
   * @param {String} examId - The exam ID
   * @returns {String} - The report URL
   */
  getOLevelClassReportUrl: (classId, examId) => {
    // Use the dedicated API endpoint for O-Level results
    return `${api.defaults.baseURL}/api/o-level-results/class/${classId}/${examId}`;
  },

  /**
   * Update a result
   * @param {String} resultId - The result ID
   * @param {Object} resultData - The updated result data
   * @returns {Promise<Object>} - The updated result
   */
  updateResult: async (resultId, resultData) => {
    try {
      const response = await api.put(`/api/v2/results/${resultId}`, resultData);
      return response.data;
    } catch (error) {
      console.error('Error updating result:', error);
      throw error;
    }
  },

  /**
   * Delete a result
   * @param {String} resultId - The result ID
   * @param {String} educationLevel - The education level ('O_LEVEL' or 'A_LEVEL')
   * @returns {Promise<Object>} - The response
   */
  deleteResult: async (resultId, educationLevel) => {
    try {
      const response = await api.delete(`/api/v2/results/${resultId}?educationLevel=${educationLevel}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting result:', error);
      throw error;
    }
  }
};

export default resultApi;
