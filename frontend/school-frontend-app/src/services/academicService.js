/**
 * Academic Year Service
 *
 * This service provides methods for interacting with the academic year API endpoints.
 */
import axios from 'axios';

const API_URL = '/api/academic-years';

/**
 * Get all academic years
 * @returns {Promise<Array>} Array of academic years
 */
export const getAcademicYears = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching academic years:', error);
    throw error;
  }
};

/**
 * Get a single academic year by ID
 * @param {string} id - Academic year ID
 * @returns {Promise<Object>} Academic year object
 */
export const getAcademicYearById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching academic year ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new academic year
 * @param {Object} academicYearData - Academic year data
 * @returns {Promise<Object>} Created academic year
 */
export const createAcademicYear = async (academicYearData) => {
  try {
    const response = await axios.post(API_URL, academicYearData);
    return response.data;
  } catch (error) {
    console.error('Error creating academic year:', error);
    throw error;
  }
};

/**
 * Update an existing academic year
 * @param {string} id - Academic year ID
 * @param {Object} academicYearData - Updated academic year data
 * @returns {Promise<Object>} Updated academic year
 */
export const updateAcademicYear = async (id, academicYearData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, academicYearData);
    return response.data;
  } catch (error) {
    console.error(`Error updating academic year ${id}:`, error);
    throw error;
  }
};

/**
 * Delete an academic year
 * @param {string} id - Academic year ID
 * @returns {Promise<Object>} Response data
 */
export const deleteAcademicYear = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting academic year ${id}:`, error);
    throw error;
  }
};

/**
 * Set an academic year as active
 * @param {string} id - Academic year ID
 * @returns {Promise<Object>} Updated academic year
 */
export const setActiveAcademicYear = async (id) => {
  try {
    // First get the current academic year data
    const academicYear = await getAcademicYearById(id);

    // Then update it to be active
    const response = await axios.put(`${API_URL}/${id}`, {
      ...academicYear,
      isActive: true
    });

    return response.data;
  } catch (error) {
    console.error(`Error setting academic year ${id} as active:`, error);
    throw error;
  }
};

/**
 * Get the current active academic year
 * @returns {Promise<Object|null>} Active academic year or null if none is active
 */
export const getActiveAcademicYear = async () => {
  try {
    const response = await axios.get(`${API_URL}/active`);
    return response.data;
  } catch (error) {
    console.error('Error fetching active academic year:', error);
    throw error;
  }
};

export default {
  getAcademicYears,
  getAcademicYearById,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  setActiveAcademicYear,
  getActiveAcademicYear
};
