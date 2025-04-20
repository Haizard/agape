import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Custom hook for fetching exams
 * @param {Object} options - Hook options
 * @param {string} options.classId - Class ID filter
 * @returns {Object} - Exams data, loading state, and error state
 */
const useExams = (options = {}) => {
  const { classId } = options;
  
  // State for exams data
  const [exams, setExams] = useState([]);
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch exams on mount or when classId changes
  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Build URL with class ID filter if provided
        const url = classId 
          ? `/api/exams?class=${classId}`
          : '/api/exams';
        
        // Fetch exams from API
        const response = await axios.get(url);
        
        // Update state with fetched data
        setExams(response.data || []);
      } catch (err) {
        console.error('Error fetching exams:', err);
        setError('Failed to fetch exams. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    // Execute the fetch function
    fetchExams();
  }, [classId]);
  
  // Return hook data
  return {
    exams,
    loading,
    error
  };
};

export default useExams;
