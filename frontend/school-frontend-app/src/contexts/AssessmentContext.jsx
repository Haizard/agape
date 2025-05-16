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
  const [activeAssessments, setActiveAssessments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Keep track of visible assessments in order
  const [visibleAssessments, setVisibleAssessments] = useState([]);

  /**
   * Fetch all assessments
   */
  const fetchAssessments = useCallback(async () => {
    const sortByDisplayOrder = (a, b) => a.displayOrder - b.displayOrder;
    setLoading(true);
    try {
      console.log('Fetching assessments...');
      const result = await assessmentService.getAllAssessments();
      console.log('Assessment API response:', result);

      if (result.success) {
        // Extract the actual assessment array from the response
        const allAssessments = Array.isArray(result.data) ? result.data : [];
        console.log('Processed assessments:', allAssessments);
        setAssessments(allAssessments);
        
        // Filter active and visible assessments
        const active = allAssessments.filter(a => a.status === 'active');
        console.log('Active assessments:', active);
        setActiveAssessments(active.sort(sortByDisplayOrder));
        
        // Filter visible assessments
        const visible = active.filter(a => a.isVisible);
        console.log('Visible assessments:', visible);
        setVisibleAssessments(visible.sort(sortByDisplayOrder));
        
        setError(null);
      } else {
        console.error('API returned error:', result.data.error);
        setError(result.data.error);
        // Set empty arrays on error
        setAssessments([]);
        setActiveAssessments([]);
        setVisibleAssessments([]);
      }
    } catch (err) {
      console.error('Error fetching assessments:', err);
      setError('Failed to fetch assessments');
      // Set empty arrays on error
      setAssessments([]);
      setActiveAssessments([]);
      setVisibleAssessments([]);
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

  // Toggle assessment visibility
  const toggleAssessmentVisibility = useCallback(async (assessmentId, isVisible) => {
    setLoading(true);
    try {
      const result = await assessmentService.updateAssessment(assessmentId, { isVisible });
      if (result.success) {
        await fetchAssessments();
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const error = 'Failed to toggle assessment visibility';
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [fetchAssessments]);

  // Update assessment display order
  const updateAssessmentOrder = useCallback(async (assessmentId, displayOrder) => {
    setLoading(true);
    try {
      const result = await assessmentService.updateAssessment(assessmentId, { displayOrder });
      if (result.success) {
        await fetchAssessments();
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const error = 'Failed to update assessment order';
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [fetchAssessments]);

  const value = {
    assessments,
    activeAssessments,
    visibleAssessments,
    loading,
    error,
    fetchAssessments,
    createAssessment,
    updateAssessment,
    deleteAssessment,
    getAssessmentsByTerm,
    calculateFinalMarks,
    toggleAssessmentVisibility,
    updateAssessmentOrder
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