import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Custom hook for fetching classes
 * @param {Object} options - Hook options
 * @param {string} options.educationLevel - Education level filter (O_LEVEL or A_LEVEL)
 * @returns {Object} - Classes data, loading state, and error state
 */
const useClasses = (options = {}) => {
  const { educationLevel } = options;
  
  // State for classes data
  const [classes, setClasses] = useState([]);
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch classes on mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Build URL with education level filter if provided
        const url = educationLevel 
          ? `/api/classes?educationLevel=${educationLevel}`
          : '/api/classes';
        
        // Fetch classes from API
        const response = await axios.get(url);
        
        // Update state with fetched data
        setClasses(response.data || []);
      } catch (err) {
        console.error('Error fetching classes:', err);
        setError('Failed to fetch classes. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    // Execute the fetch function
    fetchClasses();
  }, [educationLevel]);
  
  // Return hook data
  return {
    classes,
    loading,
    error
  };
};

export default useClasses;
