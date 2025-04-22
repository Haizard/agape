/**
 * New A-Level Result Service
 *
 * This service provides functions for interacting with the new A-Level result API.
 */
import api from '../utils/api';

/**
 * Get all A-Level results
 * @returns {Promise<Array>} - Array of A-Level results
 */
const getAllResults = async () => {
  try {
    const response = await api.get('/api/new-a-level/results');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching A-Level results:', error);
    throw error;
  }
};

/**
 * Get A-Level results by student ID
 * @param {string} studentId - Student ID
 * @returns {Promise<Array>} - Array of A-Level results for the student
 */
const getResultsByStudent = async (studentId) => {
  try {
    const response = await api.get(`/api/new-a-level/results/student/${studentId}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching A-Level results for student ${studentId}:`, error);
    throw error;
  }
};

/**
 * Get A-Level results by exam ID
 * @param {string} examId - Exam ID
 * @returns {Promise<Array>} - Array of A-Level results for the exam
 */
const getResultsByExam = async (examId) => {
  try {
    const response = await api.get(`/api/new-a-level/results/exam/${examId}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching A-Level results for exam ${examId}:`, error);
    throw error;
  }
};

/**
 * Get A-Level results by student ID and exam ID
 * @param {string} studentId - Student ID
 * @param {string} examId - Exam ID
 * @returns {Promise<Object>} - Object containing results, total points, and division
 */
const getResultsByStudentAndExam = async (studentId, examId) => {
  try {
    const response = await api.get(`/api/new-a-level/results/student/${studentId}/exam/${examId}`);
    return {
      results: response.data.data,
      totalPoints: response.data.totalPoints,
      division: response.data.division
    };
  } catch (error) {
    console.error(`Error fetching A-Level results for student ${studentId} and exam ${examId}:`, error);
    throw error;
  }
};

/**
 * Create a new A-Level result
 * @param {Object} resultData - Result data
 * @returns {Promise<Object>} - Created result
 */
const createResult = async (resultData) => {
  try {
    const response = await api.post('/api/new-a-level/results', resultData);
    return response.data.data;
  } catch (error) {
    console.error('Error creating A-Level result:', error);
    throw error;
  }
};

/**
 * Update an A-Level result
 * @param {string} id - Result ID
 * @param {Object} resultData - Result data to update
 * @returns {Promise<Object>} - Updated result
 */
const updateResult = async (id, resultData) => {
  try {
    const response = await api.put(`/api/new-a-level/results/${id}`, resultData);
    return response.data.data;
  } catch (error) {
    console.error(`Error updating A-Level result ${id}:`, error);
    throw error;
  }
};

/**
 * Delete an A-Level result
 * @param {string} id - Result ID
 * @returns {Promise<Object>} - Response data
 */
const deleteResult = async (id) => {
  try {
    const response = await api.delete(`/api/new-a-level/results/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting A-Level result ${id}:`, error);
    throw error;
  }
};

/**
 * Batch create A-Level results
 * @param {Array} resultsData - Array of result data
 * @returns {Promise<Object>} - Response data
 */
const batchCreateResults = async (resultsData) => {
  try {
    console.log('Sending marks to API:', JSON.stringify(resultsData, null, 2));
    const response = await api.post('/api/new-a-level/results/batch', resultsData);
    console.log('API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error batch creating A-Level results:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

/**
 * Calculate A-Level grade based on marks
 * @param {number} marks - Marks obtained (0-100)
 * @returns {string} - Grade (A, B, C, D, E, S, F)
 */
const calculateGrade = (marks) => {
  if (marks === null || marks === undefined || marks === '') {
    return '-';
  }

  const numMarks = Number(marks);
  if (isNaN(numMarks)) {
    return '-';
  }

  if (numMarks >= 80) return 'A';
  if (numMarks >= 70) return 'B';
  if (numMarks >= 60) return 'C';
  if (numMarks >= 50) return 'D';
  if (numMarks >= 40) return 'E';
  if (numMarks >= 35) return 'S';
  return 'F';
};

/**
 * Calculate A-Level points based on grade
 * @param {string} grade - Grade (A, B, C, D, E, S, F)
 * @returns {number} - Points (1-7)
 */
const calculatePoints = (grade) => {
  switch (grade) {
    case 'A': return 1;
    case 'B': return 2;
    case 'C': return 3;
    case 'D': return 4;
    case 'E': return 5;
    case 'S': return 6;
    case 'F': return 7;
    default: return 0;
  }
};

/**
 * Calculate A-Level division based on points
 * @param {number} points - Points from best 3 principal subjects
 * @returns {string} - Division (I, II, III, IV, 0)
 */
const calculateDivision = (points) => {
  if (points === null || points === undefined || points === '') {
    return '0';
  }

  const numPoints = Number(points);
  if (isNaN(numPoints)) {
    return '0';
  }

  if (numPoints >= 3 && numPoints <= 9) return 'I';
  if (numPoints >= 10 && numPoints <= 12) return 'II';
  if (numPoints >= 13 && numPoints <= 17) return 'III';
  if (numPoints >= 18 && numPoints <= 19) return 'IV';
  return '0';
};

export default {
  getAllResults,
  getResultsByStudent,
  getResultsByExam,
  getResultsByStudentAndExam,
  createResult,
  updateResult,
  deleteResult,
  batchCreateResults,
  calculateGrade,
  calculatePoints,
  calculateDivision
};
