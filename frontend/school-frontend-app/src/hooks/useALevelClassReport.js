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
    // Use a local variable to track if this specific request instance is still valid
    let isRequestValid = true;

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort('New request started');
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
      // Create a more specific cache key that includes all relevant parameters
      const cacheKey = `a-level-class-report-${classId}-${examId}-form-${formLevel || 'all'}-${forceRefresh ? 'force' : 'normal'}`;
      console.log(`Using cache key: ${cacheKey}`);
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

      // Add a delay to prevent rapid requests
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if this request is still valid
      if (!isRequestValid) {
        console.log('Request no longer valid, aborting');
        return null;
      }

      // Fetch data from API with explicit parameters
      const data = await reportService.fetchALevelClassReport(classId, examId, {
        forceRefresh: forceRefresh === true, // Ensure boolean
        formLevel: formLevel ? formLevel.toString() : null, // Ensure string or null
        useMock: false, // Always set useMock to false to ensure we get real data
        signal,
        _t: Date.now() // Add cache busting parameter
      });

      console.log(`Received data from API for class ${classId}, exam ${examId}, formLevel ${formLevel || 'all'}:`,
                 data ? 'Data received successfully' : 'No data received');

      // Check if this request is still valid before updating state
      if (!isRequestValid) {
        console.log('Request completed but is no longer valid, discarding results');
        return null;
      }

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
      if (err.name === 'AbortError' || err.message === 'Class report request was cancelled' || err.message === 'canceled') {
        console.log('A-Level class report request was cancelled:', err.message);
      } else {
        console.error('Error fetching A-Level class report:', err);
        // Only set error if this request is still valid
        if (isRequestValid) {
          setError(err);
        }
      }
      return null;
    } finally {
      // Only update loading state if this request is still valid
      if (isRequestValid) {
        setLoading(false);
      }

      // Set up cleanup for this specific request
      return () => {
        isRequestValid = false;
      };
    }
  }, [classId, examId, formLevel]);

  // Use a ref to track the latest request ID
  const requestIdRef = useRef(0);

  // Fetch data on mount if autoFetch is true
  useEffect(() => {
    let isMounted = true;
    let cleanupFn = null;

    // Generate a unique request ID for this effect instance
    const currentRequestId = ++requestIdRef.current;

    const fetchData = async () => {
      if (!isMounted) return;
      if (!autoFetch || !classId || !examId) return;

      try {
        console.log(`Starting request ${currentRequestId} for class ${classId}, exam ${examId}`);

        // Cancel any previous requests
        if (abortControllerRef.current) {
          abortControllerRef.current.abort(`New request ${currentRequestId} started`);
        }

        // Create a new abort controller for this request
        abortControllerRef.current = new AbortController();

        // Add a small delay to prevent rapid requests
        await new Promise(resolve => setTimeout(resolve, 50));

        // Check if this is still the current request
        if (requestIdRef.current !== currentRequestId || !isMounted) {
          console.log(`Request ${currentRequestId} is no longer current, aborting`);
          return;
        }

        // fetchReport returns a cleanup function
        cleanupFn = await fetchReport(initialForceRefresh);
      } catch (err) {
        if (isMounted && requestIdRef.current === currentRequestId) {
          console.error(`Error in fetchData (request ${currentRequestId}):`, err);
        }
      }
    };

    // Start the fetch process
    fetchData();

    // Cleanup function to cancel any in-flight request on unmount
    return () => {
      console.log(`Component unmounting, cleaning up request ${currentRequestId}`);
      isMounted = false;

      // Call the cleanup function from fetchReport if it exists
      if (typeof cleanupFn === 'function') {
        cleanupFn();
      }

      // Abort any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort(`Component unmounted (request ${currentRequestId})`);
      }
    };
  }, [autoFetch, classId, examId, fetchReport, initialForceRefresh]);

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
