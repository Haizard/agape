import api from '../utils/api';

/**
 * Assessment Service
 * Handles all assessment-related API calls
 */
const assessmentService = {
  /**
   * Get all assessments
   * @returns {Promise} Promise object represents the assessments
   */
  getAllAssessments: async () => {
    try {
      console.log('Making API request to /api/assessments');
      const response = await api.get('/api/assessments');
      console.log('API Response:', response);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('API Error:', error);
      console.error('Error Response:', error.response);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch assessments'
      };
    }
  },

  /**
   * Create a new assessment
   * @param {Object} assessmentData - The assessment data
   * @returns {Promise} Promise object represents the created assessment
   */
  createAssessment: async (assessmentData) => {
    try {
      const response = await api.post('/api/assessments', assessmentData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create assessment'
      };
    }
  },

  /**
   * Update an existing assessment
   * @param {string} assessmentId - The assessment ID
   * @param {Object} assessmentData - The updated assessment data
   * @returns {Promise} Promise object represents the updated assessment
   */
  updateAssessment: async (assessmentId, assessmentData) => {
    try {
      const response = await api.put(`/api/assessments/${assessmentId}`, assessmentData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update assessment'
      };
    }
  },

  /**
   * Delete an assessment
   * @param {string} assessmentId - The assessment ID
   * @returns {Promise} Promise object represents the deletion status
   */
  deleteAssessment: async (assessmentId) => {
    try {
      await api.delete(`/api/assessments/${assessmentId}`);
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete assessment'
      };
    }
  },

  /**
   * Get assessments by term
   * @param {string} term - The term number
   * @returns {Promise} Promise object represents the assessments for the term
   */
  getAssessmentsByTerm: async (term) => {
    try {
      const response = await api.get(`/api/assessments/term/${term}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch assessments for term'
      };
    }
  },

  /**
   * Validate assessment weightage total
   * @param {Array} assessments - List of assessments
   * @param {Object} newAssessment - New assessment to be added/updated
   * @param {string} excludeId - ID of assessment to exclude from total (for updates)
   * @returns {Object} Validation result
   */
  validateWeightageTotal: (assessments, newAssessment, excludeId = null) => {
    const totalWeightage = assessments.reduce((sum, assessment) => {
      if (excludeId && assessment._id === excludeId) {
        return sum;
      }
      return sum + Number(assessment.weightage);
    }, Number(newAssessment.weightage));

    return {
      valid: totalWeightage <= 100,
      total: totalWeightage,
      remaining: 100 - totalWeightage
    };
  },

  /**
   * Calculate final marks based on assessment weightages
   * @param {Array} assessmentMarks - Array of assessment marks
   * @returns {number} Calculated final marks
   */
  calculateFinalMarks: (assessmentMarks) => {
    return assessmentMarks.reduce((total, mark) => {
      const weightedMark = (mark.marksObtained / mark.maxMarks) * mark.weightage;
      return total + weightedMark;
    }, 0);
  }
};

export default assessmentService;