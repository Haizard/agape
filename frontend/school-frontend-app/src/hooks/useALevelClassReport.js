/**
 * useALevelClassReport Hook
 *
 * Custom hook for managing A-Level class report data with proper loading states,
 * error handling, and request cancellation.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import reportService from '../services/reportService';

/**
 * Hook for fetching and managing A-Level class report data
 * @param {Object} options - Hook options
 * @param {string} options.classId - Class ID
 * @param {string} options.examId - Exam ID
 * @param {string} options.formLevel - Optional form level filter (5 or 6)
 * @param {boolean} options.autoFetch - Whether to fetch data automatically on mount
 * @returns {Object} - Report data, loading state, error state, and fetch function
 */
const useALevelClassReport = ({ classId, examId, formLevel = null, autoFetch = true, initialForceRefresh = false }) => {
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
      console.log(`Fetching A-Level class report: classId=${classId}, examId=${examId}, formLevel=${formLevel || 'all'}, forceRefresh=${forceRefresh}`);

      // Check if we have cached data
      const cacheKey = `a-level-class-report-${classId}-${examId}${formLevel ? `-form-${formLevel}` : ''}`;
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
              console.log(`Using cached data for ${cacheKey}, age: ${cacheAge}ms`);
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
      const data = await reportService.fetchALevelClassReport(classId, examId, {
        forceRefresh,
        formLevel,
        signal,
        _t: Date.now() // Add cache busting parameter
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
      if (err.name === 'AbortError' || err.message === 'Class report request was cancelled') {
        console.log('A-Level class report request was cancelled');
      } else {
        console.error('Error fetching A-Level class report:', err);
        setError(err);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [classId, examId, formLevel]);

  // Fetch data on mount if autoFetch is true
  useEffect(() => {
    if (autoFetch && classId && examId) {
      fetchReport(initialForceRefresh);
    }

    // Cleanup function to cancel any in-flight request on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [autoFetch, classId, examId, formLevel, fetchReport, initialForceRefresh]);

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

export default useALevelClassReport;
