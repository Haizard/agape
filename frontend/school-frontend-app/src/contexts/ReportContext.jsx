import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';

// Create context
const ReportContext = createContext();

/**
 * Provider component for report data
 */
export const ReportProvider = ({ children }) => {
  const params = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  // State for report data
  const [reportData, setReportData] = useState({
    data: null,
    loading: true,
    error: null,
    isFromCache: false,
    isMockData: false
  });

  // Extract params
  const { studentId, examId, classId } = params;
  const academicYear = queryParams.get('academicYear') || 'current';
  const term = queryParams.get('term') || 'current';

  // Memoize params to prevent unnecessary re-renders
  const requestParams = useMemo(() => ({
    studentId,
    examId,
    classId,
    academicYear,
    term
  }), [studentId, examId, classId, academicYear, term]);

  // Fetch report data
  const fetchReport = useCallback(async (reportType, forceFetch = false) => {
    // Check cache first if not forcing a fetch
    if (!forceFetch) {
      // Safely create cache key, handling null or undefined requestParams
      const cacheKey = `report_${reportType}_${requestParams ? JSON.stringify(requestParams) : 'default'}`;
      const cachedData = localStorage.getItem(cacheKey);

      if (cachedData) {
        try {
          const { data, timestamp } = JSON.parse(cachedData);
          const cacheAge = Date.now() - timestamp;

          // Cache is valid for 5 minutes (300000 ms)
          if (cacheAge < 300000) {
            console.log(`Using cached data for ${cacheKey}, age: ${cacheAge}ms`);
            setReportData({
              data,
              loading: false,
              error: null,
              isFromCache: true,
              isMockData: false
            });
            return;
          } else {
            console.log(`Cache expired for ${cacheKey}, age: ${cacheAge}ms`);
            localStorage.removeItem(cacheKey);
          }
        } catch (error) {
          console.error('Error reading from cache:', error);
        }
      }
    }

    // Start loading
    setReportData(prev => ({
      ...prev,
      loading: true,
      error: null
    }));

    try {
      // Determine the endpoint based on report type
      let endpoint = '';

      if (reportType === 'a-level-student') {
        endpoint = `/api/a-level-reports/student/${requestParams.studentId}/${requestParams.examId}?academicYear=${requestParams.academicYear}&term=${requestParams.term}`;
      } else if (reportType === 'o-level-student') {
        endpoint = `/api/o-level-results/student/${requestParams.studentId}/${requestParams.examId}?academicYear=${requestParams.academicYear}&term=${requestParams.term}`;
      } else if (reportType === 'a-level-comprehensive') {
        endpoint = `/api/a-level-comprehensive/student/${requestParams.studentId}/${requestParams.examId}?academicYear=${requestParams.academicYear}&term=${requestParams.term}`;
      } else if (reportType === 'class-report') {
        endpoint = `/api/results/class/${requestParams.classId}/${requestParams.examId}?academicYear=${requestParams.academicYear}&term=${requestParams.term}`;
      } else {
        console.warn(`Unknown report type: ${reportType}, using default endpoint`);
        // Use a default endpoint based on available parameters
        if (requestParams.studentId && requestParams.examId) {
          endpoint = `/api/a-level-reports/student/${requestParams.studentId}/${requestParams.examId}?academicYear=${requestParams.academicYear}&term=${requestParams.term}`;
        } else if (requestParams.classId && requestParams.examId) {
          endpoint = `/api/a-level-reports/class/${requestParams.classId}/${requestParams.examId}?academicYear=${requestParams.academicYear}&term=${requestParams.term}`;
        } else {
          throw new Error(`Unknown report type: ${reportType} and insufficient parameters`);
        }
      }

      console.log(`Fetching ${reportType} report:`, endpoint);

      // Make the API request
      const response = await axios.get(endpoint, {
        timeout: 10000 // 10 second timeout
      });

      const data = response.data;

      // Save to cache
      // Safely create cache key, handling null or undefined requestParams
      const cacheKey = `report_${reportType}_${requestParams ? JSON.stringify(requestParams) : 'default'}`;
      const cacheData = {
        data,
        timestamp: Date.now()
      };

      try {
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        console.log(`Saved data to cache: ${cacheKey}`);
      } catch (error) {
        console.error('Error saving to cache:', error);
      }

      // Update state
      setReportData({
        data,
        loading: false,
        error: null,
        isFromCache: false,
        isMockData: false
      });
    } catch (error) {
      console.error(`Error fetching ${reportType} report:`, error);

      // Handle different error types
      let errorObj = null;

      if (error.code === 'ECONNABORTED') {
        errorObj = { message: 'Request timed out. Please try again.' };
      } else if (error.response) {
        // Server responded with an error status
        const status = error.response.status;
        const errorData = error.response.data;

        if (status === 400 && errorData.educationLevel) {
          // Education level mismatch
          errorObj = {
            message: errorData.message || 'Education level mismatch',
            educationLevel: errorData.educationLevel,
            suggestion: errorData.suggestion
          };
        } else {
          errorObj = {
            message: errorData.message || `Server error: ${status}`,
            status
          };
        }
      } else if (error.request) {
        // Request was made but no response received
        errorObj = { message: 'No response from server. Please check your connection.' };
      } else {
        // Something else went wrong
        errorObj = { message: error.message || 'An unknown error occurred' };
      }

      // Update state with error
      setReportData({
        data: null,
        loading: false,
        error: errorObj,
        isFromCache: false,
        isMockData: false
      });

      // Try to generate mock data
      const mockData = generateMockData(reportType);
      if (mockData) {
        setReportData({
          data: mockData,
          loading: false,
          error: errorObj,
          isFromCache: false,
          isMockData: true
        });
      }
    }
  }, [requestParams]);

  // Generate mock data
  const generateMockData = useCallback((reportType) => {
    console.log('Generating mock data for', reportType);

    // Use requestParams safely
    const safeParams = requestParams || {};

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
    if (reportType.includes('a-level') || reportType === 'a-level-comprehensive') {
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
  }, []);

  // Context value
  const contextValue = useMemo(() => ({
    ...reportData,
    fetchReport,
    requestParams
  }), [reportData, fetchReport, requestParams]);

  return (
    <ReportContext.Provider value={contextValue}>
      {children}
    </ReportContext.Provider>
  );
};

/**
 * Hook to use the report context
 */
export const useReport = () => {
  const context = useContext(ReportContext);

  if (!context) {
    throw new Error('useReport must be used within a ReportProvider');
  }

  return context;
};

export default ReportContext;
