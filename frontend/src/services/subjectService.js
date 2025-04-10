import axios from 'axios';

const API_URL = '/api/subjects';

/**
 * Service for handling subject operations
 */
const SubjectService = {
  /**
   * Get all subjects
   * @returns {Promise<Array>} - List of all subjects
   */
  getAllSubjects: async () => {
    try {
      const response = await axios.get(API_URL);
      return response.data;
    } catch (error) {
      console.error('Error fetching subjects:', error);
      throw error;
    }
  },

  /**
   * Get subjects assigned to a teacher
   * @param {String} teacherId - The teacher ID
   * @returns {Promise<Array>} - List of subjects assigned to the teacher
   */
  getTeacherSubjects: async (teacherId) => {
    try {
      const response = await axios.get(`${API_URL}/teacher/${teacherId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching teacher subjects:', error);
      throw error;
    }
  },

  /**
   * Get subjects for a specific class
   * @param {String} classId - The class ID
   * @returns {Promise<Array>} - List of subjects for the class
   */
  getClassSubjects: async (classId) => {
    try {
      const response = await axios.get(`${API_URL}/class/${classId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching class subjects:', error);
      throw error;
    }
  },

  /**
   * Get subjects assigned to a teacher for a specific class
   * @param {String} teacherId - The teacher ID
   * @param {String} classId - The class ID
   * @returns {Promise<Array>} - List of subjects assigned to the teacher for the class
   */
  getTeacherClassSubjects: async (teacherId, classId) => {
    try {
      const response = await axios.get(`${API_URL}/teacher/${teacherId}/class/${classId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching teacher class subjects:', error);
      throw error;
    }
  },

  /**
   * Get a subject by ID
   * @param {String} subjectId - The subject ID
   * @returns {Promise<Object>} - The subject
   */
  getSubjectById: async (subjectId) => {
    try {
      const response = await axios.get(`${API_URL}/${subjectId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching subject:', error);
      throw error;
    }
  },

  /**
   * Create a new subject
   * @param {Object} subjectData - The subject data
   * @returns {Promise<Object>} - The created subject
   */
  createSubject: async (subjectData) => {
    try {
      const response = await axios.post(API_URL, subjectData);
      return response.data;
    } catch (error) {
      console.error('Error creating subject:', error);
      throw error;
    }
  },

  /**
   * Update a subject
   * @param {String} subjectId - The subject ID
   * @param {Object} subjectData - The updated subject data
   * @returns {Promise<Object>} - The updated subject
   */
  updateSubject: async (subjectId, subjectData) => {
    try {
      const response = await axios.put(`${API_URL}/${subjectId}`, subjectData);
      return response.data;
    } catch (error) {
      console.error('Error updating subject:', error);
      throw error;
    }
  },

  /**
   * Delete a subject
   * @param {String} subjectId - The subject ID
   * @returns {Promise<Object>} - The response
   */
  deleteSubject: async (subjectId) => {
    try {
      const response = await axios.delete(`${API_URL}/${subjectId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting subject:', error);
      throw error;
    }
  }
};

export default SubjectService;
