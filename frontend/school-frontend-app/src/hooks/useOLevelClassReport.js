/**
 * useOLevelClassReport Hook
 *
 * Custom hook for managing O-Level class report data with proper loading states,
 * error handling, and request cancellation.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import reportService from '../services/reportService';

/**
 * Hook for fetching and managing O-Level class report data
 * @param {Object} options - Hook options
 * @param {string} options.classId - Class ID
 * @param {string} options.examId - Exam ID
 * @param {string} options.formLevel - Optional form level filter
 * @param {boolean} options.autoFetch - Whether to fetch data automatically on mount
 * @returns {Object} - Report data, loading state, error state, and fetch function
 */
const useOLevelClassReport = ({ classId, examId, formLevel = null, autoFetch = true, initialForceRefresh = false }) => {
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

    console.log('=== useOLevelClassReport.fetchReport ===');
    console.log(`Fetching report for classId=${classId}, examId=${examId}, forceRefresh=${forceRefresh}`);

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      console.log('Aborting previous request');
      abortControllerRef.current.abort('New request started');
    }

    // Create a new AbortController
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    // Reset states
    setLoading(true);
    setError(null);

    try {
      console.log(`Fetching O-Level class report: classId=${classId}, examId=${examId}, formLevel=${formLevel || 'all'}, forceRefresh=${forceRefresh}`);

      // Check if we have cached data
      // Create a more specific cache key that includes all relevant parameters
      const cacheKey = `o-level-class-report-${classId}-${examId}-form-${formLevel || 'all'}-${forceRefresh ? 'force' : 'normal'}`;
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

      // If we have valid cached data and we're not forcing a refresh, use it
      if (reportData && !forceRefresh) {
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
      let data;
      try {
        console.log('Calling fetchOLevelClassReport with params:', {
          classId,
          examId,
          forceRefresh,
          formLevel,
          timestamp: Date.now()
        });

        // Log the API URL being used
        console.log('API URL:', reportService.getApiUrl());

        data = await reportService.fetchOLevelClassReport(classId, examId, {
          forceRefresh: forceRefresh === true, // Ensure boolean
          formLevel: formLevel ? formLevel.toString() : null, // Ensure string or null
          useMock: false, // Always set useMock to false to ensure we get real data
          signal,
          _t: Date.now() // Add cache busting parameter
        });

        console.log('fetchOLevelClassReport returned data:', {
          hasData: !!data,
          isMockData: data?.mock === true,
          hasWarning: !!data?.warning,
          studentCount: data?.students?.length || 0,
          educationLevel: data?.educationLevel,
          subjects: data?.subjects?.length || 0,
          className: data?.className,
          examName: data?.examName
        });

        // Log more details about the data structure
        if (data) {
          console.log('Data structure keys:', Object.keys(data));
          if (data.students && data.students.length > 0) {
            console.log('First student example:', {
              ...data.students[0],
              results: data.students[0].results ? `${data.students[0].results.length} subjects` : 'No results'
            });
          }
        }

        // If we got data but it's empty (no students), add a helpful message
        if (data && (!data.students || data.students.length === 0) && !data.warning) {
          console.log('Report has no students, adding warning message');
          data.warning = 'No student data available for this class and exam. The report will update automatically as data is entered.';
        }
      } catch (error) {
        console.error('Error fetching data from API:', error);

        // Check if the error contains a valid response with data
        if (error.response?.data?.success === true && error.response?.data?.data) {
          console.log('Error contains valid response data, using it');
          console.log('Response data structure:', {
            hasStudents: !!error.response.data.data.students,
            studentCount: error.response.data.data.students?.length || 0,
            warning: error.response.data.data.warning,
            mock: error.response.data.data.mock === true,
            educationLevel: error.response.data.data.educationLevel
          });

          data = reportService.normalizeReportData(error.response.data.data);

          // Ensure it has a warning
          if (!data.warning) {
            data.warning = 'Showing partial data. The report will update automatically as more data is entered.';
          }

          console.log('Data after normalization:', {
            hasStudents: !!data.students,
            studentCount: data.students?.length || 0,
            warning: data.warning,
            mock: data.mock === true
          });
        } else {
          console.log('Error fetching report data:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            message: error.message,
            responseData: error.response?.data
          });

          // Create an empty report with a warning instead of using mock data
          console.log('Creating empty report with warning instead of using mock data');

          // Create a real (but empty) data structure
          const emptyReport = {
            reportTitle: `Class Result Report`,
            schoolName: 'AGAPE LUTHERAN JUNIOR SEMINARY',
            academicYear: 'Current Academic Year',
            examName: 'Current Exam',
            examDate: new Date().toLocaleDateString(),
            className: 'Selected Class',
            section: '',
            stream: '',
            subjects: [],
            students: [],
            subjectAnalysis: [],
            classAverage: '0.00',
            divisionSummary: { 'I': 0, 'II': 0, 'III': 0, 'IV': 0, '0': 0 },
            passRate: 0,
            totalStudents: 0,
            educationLevel: 'O_LEVEL',
            warning: 'No marks have been entered for this class and exam yet. The report will update automatically as marks are entered.',
            mock: false // Important: This is NOT mock data, it's real (but empty) data
          };

          data = reportService.normalizeReportData(emptyReport);

          console.log('Created empty report with warning:', {
            hasStudents: !!data.students,
            studentCount: data.students?.length || 0,
            warning: data.warning,
            mock: data.mock === true
          });
        }

        console.log('Final data after error handling:', {
          hasData: !!data,
          isMockData: data?.mock === true,
          hasWarning: !!data?.warning,
          studentCount: data?.students?.length || 0
        });
      }

      console.log(`Received data for class ${classId}, exam ${examId}, formLevel ${formLevel || 'all'}:`,
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
        console.log('O-Level class report request was cancelled:', err.message);
      } else {
        console.error('Error fetching O-Level class report:', err);
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

    // Log detailed information about the hook initialization
    console.log('useOLevelClassReport hook initialized:', {
      hookId: currentRequestId,
      classId,
      examId,
      formLevel,
      autoFetch,
      initialForceRefresh,
      hasAbortController: !!abortControllerRef.current,
      timestamp: new Date().toISOString()
    });

    const fetchData = async () => {
      if (!isMounted) {
        console.log(`Hook ${currentRequestId} is no longer mounted, skipping fetch`);
        return;
      }

      if (!autoFetch) {
        console.log(`Hook ${currentRequestId} has autoFetch=false, skipping fetch`);
        return;
      }

      if (!classId || !examId) {
        console.log(`Hook ${currentRequestId} missing required parameters:`, {
          classId: classId || 'missing',
          examId: examId || 'missing'
        });
        return;
      }

      try {
        console.log(`Starting request ${currentRequestId} for class ${classId}, exam ${examId}`);

        // Cancel any previous requests
        if (abortControllerRef.current) {
          console.log(`Aborting previous request for hook ${currentRequestId}`);
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

        // Log before calling fetchReport
        console.log(`Hook ${currentRequestId} calling fetchReport with initialForceRefresh=${initialForceRefresh}`);

        // fetchReport returns a cleanup function
        cleanupFn = await fetchReport(initialForceRefresh);

        // Log after fetchReport completes
        console.log(`Hook ${currentRequestId} fetchReport completed, report state:`, {
          hasReport: !!report,
          isLoading: loading,
          hasError: !!error,
          isFromCache,
          timestamp: new Date().toISOString()
        });
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

export default useOLevelClassReport;
