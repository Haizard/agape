import React, { createContext, useContext, useState, useCallback } from 'react';
import assessmentService from '../services/assessmentService';
import { validateAssessmentData, validateTotalWeightage } from '../utils/assessmentValidation';

const AssessmentContext = createContext();

/**
 * Assessment Provider Component
 * Provides assessment-related state and functions to child components
 */
export const AssessmentProvider = ({ children }) => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all assessments
   */
  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    try {
      const result = await assessmentService.getAllAssessments();
      if (result.success) {
        setAssessments(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to fetch assessments');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new assessment
   * @param {Object} assessmentData - The assessment data
   */
  const createAssessment = useCallback(async (assessmentData) => {
    // Validate assessment data
    const validationResult = validateAssessmentData(assessmentData);
    if (!validationResult.isValid) {
      return {
        success: false,
        errors: validationResult.errors
      };
    }

    // Validate total weightage
    const weightageValidation = validateTotalWeightage(assessments, assessmentData);
    if (!weightageValidation.isValid) {
      return {
        success: false,
        errors: { weightage: weightageValidation.error }
      };
    }

    setLoading(true);
    try {
      const result = await assessmentService.createAssessment(assessmentData);
      if (result.success) {
        await fetchAssessments(); // Refresh assessments list
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const error = 'Failed to create assessment';
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [assessments, fetchAssessments]);

  /**
   * Update an existing assessment
   * @param {string} assessmentId - The assessment ID
   * @param {Object} assessmentData - The updated assessment data
   */
  const updateAssessment = useCallback(async (assessmentId, assessmentData) => {
    // Validate assessment data
    const validationResult = validateAssessmentData(assessmentData);
    if (!validationResult.isValid) {
      return {
        success: false,
        errors: validationResult.errors
      };
    }

    // Validate total weightage
    const weightageValidation = validateTotalWeightage(assessments, assessmentData, assessmentId);
    if (!weightageValidation.isValid) {
      return {
        success: false,
        errors: { weightage: weightageValidation.error }
      };
    }

    setLoading(true);
    try {
      const result = await assessmentService.updateAssessment(assessmentId, assessmentData);
      if (result.success) {
        await fetchAssessments(); // Refresh assessments list
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const error = 'Failed to update assessment';
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [assessments, fetchAssessments]);

  /**
   * Delete an assessment
   * @param {string} assessmentId - The assessment ID
   */
  const deleteAssessment = useCallback(async (assessmentId) => {
    setLoading(true);
    try {
      const result = await assessmentService.deleteAssessment(assessmentId);
      if (result.success) {
        await fetchAssessments(); // Refresh assessments list
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const error = 'Failed to delete assessment';
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [fetchAssessments]);

  /**
   * Get assessments for a specific term
   * @param {string} term - The term number
   */
  const getAssessmentsByTerm = useCallback(async (term) => {
    setLoading(true);
    try {
      const result = await assessmentService.getAssessmentsByTerm(term);
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const error = 'Failed to fetch assessments for term';
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Calculate final marks for a set of assessment marks
   * @param {Array} assessmentMarks - Array of assessment marks
   */
  const calculateFinalMarks = useCallback((assessmentMarks) => {
    return assessmentService.calculateFinalMarks(assessmentMarks);
  }, []);

  const value = {
    assessments,
    loading,
    error,
    fetchAssessments,
    createAssessment,
    updateAssessment,
    deleteAssessment,
    getAssessmentsByTerm,
    calculateFinalMarks
  };

  return (
    <AssessmentContext.Provider value={value}>
      {children}
    </AssessmentContext.Provider>
  );
};

/**
 * Custom hook to use assessment context
 * @returns {Object} Assessment context value
 */
export const useAssessment = () => {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error('useAssessment must be used within an AssessmentProvider');
  }
  return context;
};