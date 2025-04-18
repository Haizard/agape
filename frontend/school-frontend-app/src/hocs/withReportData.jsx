import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useParams, useLocation } from 'react-router-dom';

// Request cache to prevent duplicate requests
const requestCache = new Map();

/**
 * HOC that provides report data fetching capabilities to components
 *
 * @param {React.Component} WrappedComponent - The component to wrap
 * @param {Object} options - Configuration options
 * @param {string} options.reportType - Type of report to fetch (e.g., 'a-level-student', 'o-level-student')
 * @param {boolean} options.shouldRefetchOnParamsChange - Whether to refetch when params change
 * @param {boolean} options.useMockOnError - Whether to use mock data on error
 * @returns {React.Component} - The wrapped component with report data
 */
const withReportData = (WrappedComponent, options = {}) => {
  const {
    reportType = 'student',
    shouldRefetchOnParamsChange = true,
    useMockOnError = true
  } = options;

  const WithReportData = (props) => {
    const params = useParams();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);

    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFromCache, setIsFromCache] = useState(false);
    const [isMockData, setIsMockData] = useState(false);

    // Use refs to track mounted state and prevent memory leaks
    const isMounted = useRef(true);
    const abortControllerRef = useRef(null);
    const fetchAttemptRef = useRef(0);

    // Extract relevant params based on report type
    const getEndpointParams = useCallback(() => {
      const { studentId, examId, classId } = params;
      const academicYear = queryParams.get('academicYear') || 'current';
      const term = queryParams.get('term') || 'current';

      return {
        studentId,
        examId,
        classId,
        academicYear,
        term
      };
    }, [params, queryParams]);

    // Generate a cache key for the current request
    const getCacheKey = useCallback(() => {
      const endpointParams = getEndpointParams();
      // Safely create cache key, handling null or undefined endpointParams
      return `${reportType}_${endpointParams ? JSON.stringify(endpointParams) : 'default'}`;
    }, [reportType, getEndpointParams]);

    // Check local storage for cached data
    const getFromCache = useCallback(() => {
      try {
        const cacheKey = getCacheKey();
        const cachedData = localStorage.getItem(`report_${cacheKey}`);

        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          const cacheAge = Date.now() - timestamp;

          // Cache is valid for 5 minutes (300000 ms)
          if (cacheAge < 300000) {
            console.log(`Using cached data for ${cacheKey}, age: ${cacheAge}ms`);
            return data;
          } else {
            console.log(`Cache expired for ${cacheKey}, age: ${cacheAge}ms`);
            localStorage.removeItem(`report_${cacheKey}`);
          }
        }
      } catch (error) {
        console.error('Error reading from cache:', error);
      }

      return null;
    }, [getCacheKey]);

    // Save data to local storage cache
    const saveToCache = useCallback((data) => {
      try {
        const cacheKey = getCacheKey();
        const cacheData = {
          data,
          timestamp: Date.now()
        };

        localStorage.setItem(`report_${cacheKey}`, JSON.stringify(cacheData));
        console.log(`Saved data to cache: ${cacheKey}`);
      } catch (error) {
        console.error('Error saving to cache:', error);
      }
    }, [getCacheKey]);

    // Generate mock data for testing or when API fails
    const generateMockData = useCallback(() => {
      console.log('Generating mock data for', reportType);

      // Get endpoint params safely
      const endpointParams = getEndpointParams() || {};

      // Basic mock data structure
      const mockData = {
        reportTitle: 'Mock Report',
        schoolName: 'Agape Lutheran Junior Seminary',
        academicYear: '2023-2024',
        examName: 'Mock Examination',
        examDate: '2023-10-15',
        studentDetails: {
          _id: 'mock-student',
          name: 'Mock Student',
          admissionNumber: 'MOCK-001',
          gender: 'Male',
          form: 5,
          combination: {
            _id: 'mock-combination',
            code: 'PCM',
            name: 'Physics, Chemistry, Mathematics'
          }
        },
        subjectResults: [],
        summary: {
          averageMarks: '65.5',
          totalPoints: 12,
          bestThreePoints: 6,
          division: 'II',
          rank: '5',
          totalStudents: '25',
          gradeDistribution: { A: 1, B: 2, C: 1, D: 0, E: 0, S: 0, F: 0 }
        },
        characterAssessment: {
          discipline: 'Good',
          attendance: 'Regular',
          attitude: 'Positive',
          comments: 'A dedicated student who shows great potential.'
        },
        educationLevel: reportType.includes('a-level') ? 'A_LEVEL' : 'O_LEVEL',
        formLevel: 5
      };

      // Add subject results based on report type
      if (reportType.includes('a-level')) {
        mockData.principalSubjects = [
          {
            subject: 'Physics',
            code: 'PHY',
            marksObtained: 85,
            grade: 'B',
            points: 2,
            isPrincipal: true,
            remarks: 'Good performance'
          },
          {
            subject: 'Chemistry',
            code: 'CHE',
            marksObtained: 78,
            grade: 'B',
            points: 2,
            isPrincipal: true,
            remarks: 'Satisfactory'
          },
          {
            subject: 'Mathematics',
            code: 'MAT',
            marksObtained: 92,
            grade: 'A',
            points: 1,
            isPrincipal: true,
            remarks: 'Excellent performance'
          }
        ];

        mockData.subsidiarySubjects = [
          {
            subject: 'General Studies',
            code: 'GS',
            marksObtained: 75,
            grade: 'B',
            points: 2,
            isPrincipal: false,
            remarks: 'Good effort'
          }
        ];

        mockData.subjectResults = [...mockData.principalSubjects, ...mockData.subsidiarySubjects];
      } else {
        // O-Level subjects
        mockData.subjectResults = [
          {
            subject: 'Mathematics',
            code: 'MAT',
            marksObtained: 85,
            grade: 'A',
            points: 1,
            remarks: 'Excellent'
          },
          {
            subject: 'English',
            code: 'ENG',
            marksObtained: 78,
            grade: 'B',
            points: 2,
            remarks: 'Good'
          },
          {
            subject: 'Physics',
            code: 'PHY',
            marksObtained: 72,
            grade: 'B',
            points: 2,
            remarks: 'Good'
          },
          {
            subject: 'Chemistry',
            code: 'CHE',
            marksObtained: 65,
            grade: 'C',
            points: 3,
            remarks: 'Average'
          }
        ];
      }

      return mockData;
    }, [reportType]);

    // Fetch report data from API
    const fetchReport = useCallback(async (forceFetch = false) => {
      // Don't fetch if component is unmounted
      if (!isMounted.current) return;

      // Get cache key for this request
      const cacheKey = getCacheKey();

      // Check if this request is already in progress
      if (requestCache.has(cacheKey) && !forceFetch) {
        console.log(`Request already in progress for ${cacheKey}`);
        return;
      }

      // Check cache first if not forcing a fetch
      if (!forceFetch) {
        const cachedData = getFromCache();
        if (cachedData) {
          setReport(cachedData);
          setLoading(false);
          setError(null);
          setIsFromCache(true);
          setIsMockData(false);
          return;
        }
      }

      // Mark this request as in progress
      requestCache.set(cacheKey, true);

      // Create a new abort controller for this request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setLoading(true);
      setError(null);
      setIsFromCache(false);
      setIsMockData(false);

      // Increment fetch attempt counter
      fetchAttemptRef.current += 1;
      const currentAttempt = fetchAttemptRef.current;

      try {
        const { studentId, examId, classId, academicYear, term } = getEndpointParams();

        // Determine the endpoint based on report type
        let endpoint = '';

        if (reportType === 'a-level-student') {
          endpoint = `/api/a-level-results/student/${studentId}/${examId}?academicYear=${academicYear}&term=${term}`;
          console.log(`Fetching A-Level student report: ${endpoint}`);
        } else if (reportType === 'o-level-student') {
          endpoint = `/api/o-level-results/student/${studentId}/${examId}?academicYear=${academicYear}&term=${term}`;
          console.log(`Fetching O-Level student report: ${endpoint}`);
        } else if (reportType === 'a-level-comprehensive') {
          endpoint = `/api/a-level-comprehensive/student/${studentId}/${examId}?academicYear=${academicYear}&term=${term}`;
          console.log(`Fetching A-Level comprehensive report: ${endpoint}`);
        } else if (reportType === 'class-report') {
          endpoint = `/api/results/class/${classId}/${examId}?academicYear=${academicYear}&term=${term}`;
          console.log(`Fetching class report: ${endpoint}`);
        } else {
          throw new Error(`Unknown report type: ${reportType}`);
        }

        // Make the API request
        const response = await axios.get(endpoint, {
          signal: abortControllerRef.current.signal,
          timeout: 10000 // 10 second timeout
        });

        // Only update state if this is still the current request
        if (isMounted.current && currentAttempt === fetchAttemptRef.current) {
          const data = response.data;

          // Save to cache
          saveToCache(data);

          // Update state
          setReport(data);
          setLoading(false);
          setError(null);
          setIsFromCache(false);
          setIsMockData(false);
        }
      } catch (error) {
        // Only update state if this is still the current request and component is mounted
        if (isMounted.current && currentAttempt === fetchAttemptRef.current) {
          console.error(`Error fetching ${reportType} report:`, error);

          // Handle different error types
          if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
            setError({ message: 'Request timed out. Please try again.' });
          } else if (error.response) {
            // Server responded with an error status
            const status = error.response.status;
            const errorData = error.response.data;

            if (status === 400 && errorData.educationLevel) {
              // Education level mismatch
              setError({
                message: errorData.message || 'Education level mismatch',
                educationLevel: errorData.educationLevel,
                suggestion: errorData.suggestion
              });
            } else {
              setError({
                message: errorData.message || `Server error: ${status}`,
                status
              });
            }
          } else if (error.request) {
            // Request was made but no response received
            setError({ message: 'No response from server. Please check your connection.' });
          } else {
            // Something else went wrong
            setError({ message: error.message || 'An unknown error occurred' });
          }

          // Use mock data if enabled
          if (useMockOnError) {
            const mockData = generateMockData();
            setReport(mockData);
            setIsMockData(true);
          }

          setLoading(false);
        }
      } finally {
        // Remove this request from the cache
        if (isMounted.current && currentAttempt === fetchAttemptRef.current) {
          requestCache.delete(cacheKey);
        }
      }
    }, [
      getCacheKey,
      getEndpointParams,
      getFromCache,
      saveToCache,
      generateMockData,
      reportType,
      useMockOnError
    ]);

    // Refetch data (force refresh)
    const refetch = useCallback(() => {
      fetchReport(true);
    }, [fetchReport]);

    // Initial fetch and cleanup
    useEffect(() => {
      // Set mounted flag
      isMounted.current = true;

      // Fetch data
      fetchReport();

      // Cleanup function
      return () => {
        isMounted.current = false;

        // Abort any in-progress requests
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    }, [fetchReport]);

    // Refetch when params change if enabled
    useEffect(() => {
      if (shouldRefetchOnParamsChange) {
        fetchReport();
      }
    }, [shouldRefetchOnParamsChange, fetchReport]);

    // Pass all props to the wrapped component
    return (
      <WrappedComponent
        {...props}
        report={report}
        loading={loading}
        error={error}
        isFromCache={isFromCache}
        isMockData={isMockData}
        refetch={refetch}
      />
    );
  };

  // Set display name for debugging
  WithReportData.displayName = `withReportData(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithReportData;
};

export default withReportData;
