import { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * Custom hook to fetch classes from the API
 * @param {Object} options - Options for the query
 * @param {boolean} options.enabled - Whether the query is enabled (default: true)
 * @param {string} options.educationLevel - Filter by education level (optional)
 * @returns {Object} - Query result object
 */
export const useClassesQuery = (options = {}) => {
  const { enabled = true, educationLevel } = options;
  
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!enabled) return;
    
    const fetchClasses = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Build query parameters
        const params = {};
        if (educationLevel) {
          params.educationLevel = educationLevel;
        }
        
        const response = await api.get('/api/classes', { params });
        setData(response.data);
      } catch (error) {
        console.error('Error fetching classes:', error);
        setError(error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClasses();
  }, [enabled, educationLevel]);
  
  return { data, isLoading, error };
};
