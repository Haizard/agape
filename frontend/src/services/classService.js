import axios from 'axios';

const API_URL = '/api/classes';

/**
 * Service for handling class operations
 */
const ClassService = {
  /**
   * Get all classes
   * @returns {Promise<Array>} - List of all classes
   */
  getAllClasses: async () => {
    try {
      const response = await axios.get(API_URL);
      return response.data;
    } catch (error) {
      console.error('Error fetching classes:', error);
      throw error;
    }
  },

  /**
   * Get classes assigned to a teacher
   * @param {String} teacherId - The teacher ID
   * @returns {Promise<Array>} - List of classes assigned to the teacher
   */
  getTeacherClasses: async (teacherId) => {
    try {
      const response = await axios.get(`${API_URL}/teacher/${teacherId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching teacher classes:', error);
      throw error;
    }
  },

  /**
   * Get a class by ID
   * @param {String} classId - The class ID
   * @returns {Promise<Object>} - The class
   */
  getClassById: async (classId) => {
    try {
      const response = await axios.get(`${API_URL}/${classId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching class:', error);
      throw error;
    }
  },

  /**
   * Create a new class
   * @param {Object} classData - The class data
   * @returns {Promise<Object>} - The created class
   */
  createClass: async (classData) => {
    try {
      const response = await axios.post(API_URL, classData);
      return response.data;
    } catch (error) {
      console.error('Error creating class:', error);
      throw error;
    }
  },

  /**
   * Update a class
   * @param {String} classId - The class ID
   * @param {Object} classData - The updated class data
   * @returns {Promise<Object>} - The updated class
   */
  updateClass: async (classId, classData) => {
    try {
      const response = await axios.put(`${API_URL}/${classId}`, classData);
      return response.data;
    } catch (error) {
      console.error('Error updating class:', error);
      throw error;
    }
  },

  /**
   * Delete a class
   * @param {String} classId - The class ID
   * @returns {Promise<Object>} - The response
   */
  deleteClass: async (classId) => {
    try {
      const response = await axios.delete(`${API_URL}/${classId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting class:', error);
      throw error;
    }
  },

  /**
   * Assign subjects to a class
   * @param {String} classId - The class ID
   * @param {Array} subjectIds - Array of subject IDs
   * @returns {Promise<Object>} - The response
   */
  assignSubjectsToClass: async (classId, subjectIds) => {
    try {
      const response = await axios.post(`${API_URL}/${classId}/subjects`, { subjectIds });
      return response.data;
    } catch (error) {
      console.error('Error assigning subjects to class:', error);
      throw error;
    }
  },

  /**
   * Get subjects assigned to a class
   * @param {String} classId - The class ID
   * @returns {Promise<Array>} - List of subjects assigned to the class
   */
  getClassSubjects: async (classId) => {
    try {
      const response = await axios.get(`${API_URL}/${classId}/subjects`);
      return response.data;
    } catch (error) {
      console.error('Error fetching class subjects:', error);
      throw error;
    }
  }
};

export default ClassService;
