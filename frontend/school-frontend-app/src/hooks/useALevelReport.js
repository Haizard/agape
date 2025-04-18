/**
 * useALevelReport Hook
 * 
 * Custom hook for managing A-Level report data with proper loading states,
 * error handling, and request cancellation.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import reportService from '../services/reportService';

/**
 * Hook for fetching and managing A-Level student report data
 * @param {Object} options - Hook options
 * @param {string} options.studentId - Student ID
 * @param {string} options.examId - Exam ID
 * @param {boolean} options.autoFetch - Whether to fetch data automatically on mount
 * @returns {Object} - Report data, loading state, error state, and fetch function
 */
const useALevelReport = ({ studentId, examId, autoFetch = true }) => {
  // State for report data
  const [report, setReport] = useState(null);
  
  // Loading and error states
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);
  
  // Cache state
  const [isFromCache, setIsFromCache] = useState(false);
  
  // AbortController reference
  const abortControllerRef = useRef(null);
  
  // Function to fetch report data
  const fetchReport = useCallback(async (forceRefresh = false) => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create a new AbortController
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;
    
    // Reset states
    setLoading(true);
    setError(null);
    
    try {
      // Check if we have cached data
      const cacheKey = `a-level-report-${studentId}-${examId}`;
      let reportData = null;
      
      // Try to get from sessionStorage if not forcing refresh
      if (!forceRefresh) {
        const cachedData = sessionStorage.getItem(cacheKey);
        if (cachedData) {
          try {
            const { data, timestamp } = JSON.parse(cachedData);
            const cacheAge = Date.now() - timestamp;
            
            // Use cache if it's less than 5 minutes old
            if (cacheAge < 5 * 60 * 1000) {
              reportData = data;
              setIsFromCache(true);
            }
          } catch (e) {
            console.error('Error parsing cached report data:', e);
          }
        }
      }
      
      // If we have valid cached data, use it
      if (reportData) {
        setReport(reportData);
        setLoading(false);
        return reportData;
      }
      
      // Otherwise, fetch from API
      setIsFromCache(false);
      
      // Fetch data from API
      const data = await reportService.fetchALevelStudentReport(studentId, examId, {
        forceRefresh,
        signal
      });
      
      // Update state with fetched data
      setReport(data);
      
      // Cache the data in sessionStorage
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.error('Error caching report data:', e);
      }
      
      return data;
    } catch (err) {
      // Don't set error state if the request was cancelled
      if (err.message !== 'Report request was cancelled') {
        setError(err);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [studentId, examId]);
  
  // Fetch data on mount if autoFetch is true
  useEffect(() => {
    if (autoFetch && studentId && examId) {
      fetchReport();
    }
    
    // Cleanup function to cancel any in-flight request on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [autoFetch, studentId, examId, fetchReport]);
  
  // Return the hook API
  return {
    report,
    loading,
    error,
    isFromCache,
    fetchReport,
    // Helper function to refresh the data
    refreshReport: () => fetchReport(true)
  };
};

export default useALevelReport;
