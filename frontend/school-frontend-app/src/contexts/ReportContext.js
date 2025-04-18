import React, { createContext, useContext, useReducer, useMemo, useCallback } from 'react';
import axios from 'axios';

// Create context
const ReportContext = createContext();

// Action types
const ACTIONS = {
  FETCH_START: 'FETCH_START',
  FETCH_SUCCESS: 'FETCH_SUCCESS',
  FETCH_ERROR: 'FETCH_ERROR',
  RESET_STATE: 'RESET_STATE',
  UPDATE_REPORT_DATA: 'UPDATE_REPORT_DATA'
};

// Initial state
const initialState = {
  report: null,
  loading: false,
  error: null,
  isFromCache: false,
  isMockData: false,
  lastFetchTime: null
};

// Reducer function
const reportReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.FETCH_START:
      return {
        ...state,
        loading: true,
        error: null
      };
    case ACTIONS.FETCH_SUCCESS:
      return {
        ...state,
        report: action.payload.data,
        loading: false,
        error: null,
        isFromCache: action.payload.isFromCache,
        isMockData: action.payload.isMockData,
        lastFetchTime: Date.now()
      };
    case ACTIONS.FETCH_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload,
        lastFetchTime: Date.now()
      };
    case ACTIONS.RESET_STATE:
      return initialState;
    case ACTIONS.UPDATE_REPORT_DATA:
      return {
        ...state,
        report: {
          ...state.report,
          ...action.payload
        }
      };
    default:
      return state;
  }
};

/**
 * Default cache expiration time (24 hours in milliseconds)
 * @type {number}
 */
const DEFAULT_CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

/**
 * Cache prefix for all cached items
 * @type {string}
 */
const CACHE_PREFIX = 'agape_report_';

/**
 * Generates a cache key for a specific resource
 * @param {string} reportType - Type of report
 * @param {Object} params - Report parameters
 * @returns {string} Cache key
 */
const generateCacheKey = (reportType, params) => {
  // Ensure params is an object
  if (!params || typeof params !== 'object') {
    return `${CACHE_PREFIX}${reportType}`;
  }

  const paramsString = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return `${CACHE_PREFIX}${reportType}_${paramsString}`;
};

/**
 * Saves data to localStorage
 * @param {string} key - Cache key
 * @param {*} data - Data to cache
 * @param {number} [expiration=DEFAULT_CACHE_EXPIRATION] - Cache expiration time in milliseconds
 * @returns {boolean} Whether the data was successfully cached
 */
const saveToLocalStorage = (key, data, expiration = DEFAULT_CACHE_EXPIRATION) => {
  try {
    // Prepare cache item
    const cacheItem = {
      data,
      timestamp: Date.now(),
      expiration: Date.now() + expiration
    };

    // Save to localStorage
    localStorage.setItem(key, JSON.stringify(cacheItem));

    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
};

/**
 * Gets data from localStorage
 * @param {string} key - Cache key
 * @param {boolean} [ignoreExpiration=false] - Whether to ignore expiration
 * @returns {*} Cached data or null if not found or expired
 */
const getFromLocalStorage = (key, ignoreExpiration = false) => {
  try {
    // Get from localStorage
    const cacheItemString = localStorage.getItem(key);
    if (!cacheItemString) {
      return null;
    }

    // Parse cache item
    const cacheItem = JSON.parse(cacheItemString);

    // Check expiration
    if (!ignoreExpiration && cacheItem.expiration < Date.now()) {
      console.log(`Cache item ${key} has expired`);
      localStorage.removeItem(key);
      return null;
    }

    return cacheItem.data;
  } catch (error) {
    console.error('Error getting from localStorage:', error);
    return null;
  }
};

/**
 * Generates mock data for a report
 * @param {string} reportType - Type of report
 * @param {Object} params - Report parameters
 * @returns {Object} Mock data
 */
const generateMockData = (reportType, params = {}) => {
  // Ensure params is an object to prevent destructuring errors
  const safeParams = params || {};
  const { studentId, examId, classId } = safeParams;

  // Generate mock student data
  const mockStudentData = {
    _id: studentId || 'mock-student-id',
    name: 'Mock Student',
    firstName: 'Mock',
    lastName: 'Student',
    admissionNumber: 'F5-001',
    gender: 'Male',
    form: 5,
    combination: 'PCM',
    combinationName: 'Physics, Chemistry, Mathematics'
  };

  // Generate mock exam data
  const mockExamData = {
    _id: examId || 'mock-exam-id',
    name: 'Mock Exam',
    startDate: '2023-01-01',
    endDate: '2023-01-10',
    term: 'Term 1',
    academicYear: '2023-2024'
  };

  // Generate mock subject results
  const mockSubjectResults = [
    {
      subject: 'Physics',
      code: 'PHY',
      marks: 85,
      grade: 'A',
      points: 1,
      isPrincipal: true
    },
    {
      subject: 'Chemistry',
      code: 'CHE',
      marks: 78,
      grade: 'B',
      points: 2,
      isPrincipal: true
    },
    {
      subject: 'Mathematics',
      code: 'MAT',
      marks: 92,
      grade: 'A',
      points: 1,
      isPrincipal: true
    },
    {
      subject: 'General Studies',
      code: 'GS',
      marks: 75,
      grade: 'B',
      points: 2,
      isPrincipal: false
    }
  ];

  // Calculate summary
  const totalMarks = mockSubjectResults.reduce((sum, result) => sum + result.marks, 0);
  const averageMarks = totalMarks / mockSubjectResults.length;
  const totalPoints = mockSubjectResults.reduce((sum, result) => sum + result.points, 0);
  const principalSubjects = mockSubjectResults.filter(result => result.isPrincipal);
  const bestThreePoints = principalSubjects
    .sort((a, b) => a.points - b.points)
    .slice(0, 3)
    .reduce((sum, result) => sum + result.points, 0);

  // Determine division
  let division = 'N/A';
  if (bestThreePoints >= 3 && bestThreePoints <= 9) division = 'I';
  else if (bestThreePoints >= 10 && bestThreePoints <= 12) division = 'II';
  else if (bestThreePoints >= 13 && bestThreePoints <= 17) division = 'III';
  else if (bestThreePoints >= 18 && bestThreePoints <= 19) division = 'IV';
  else if (bestThreePoints >= 20) division = 'V';

  // Generate mock report based on report type
  switch (reportType) {
    case 'a-level-student':
    case 'a-level-comprehensive':
      return {
        studentId,
        examId,
        studentDetails: mockStudentData,
        examName: mockExamData.name,
        academicYear: mockExamData.academicYear,
        term: mockExamData.term,
        examDate: mockExamData.startDate,
        subjectResults: mockSubjectResults,
        summary: {
          totalMarks,
          averageMarks,
          totalPoints,
          bestThreePoints,
          division,
          rank: 1,
          totalStudents: 20
        },
        characterAssessment: {
          discipline: 'Good',
          attendance: 'Excellent',
          attitude: 'Positive',
          comments: 'A dedicated student who shows great potential.'
        },
        educationLevel: 'A_LEVEL'
      };
    case 'a-level-class':
      // Generate mock students
      const mockStudents = Array.from({ length: 10 }, (_, i) => ({
        _id: `mock-student-${i}`,
        name: `Student ${i + 1}`,
        admissionNumber: `F5-${(i + 1).toString().padStart(3, '0')}`,
        gender: i % 2 === 0 ? 'Male' : 'Female',
        form: 5,
        combination: 'PCM',
        results: mockSubjectResults.map(result => ({
          ...result,
          marks: Math.floor(Math.random() * 30) + 60 // Random marks between 60-90
        })),
        summary: {
          totalMarks: 0, // Will be calculated
          averageMarks: 0, // Will be calculated
          totalPoints: 0, // Will be calculated
          bestThreePoints: 0, // Will be calculated
          division: '', // Will be calculated
          rank: i + 1
        }
      }));

      // Calculate summaries for each student
      mockStudents.forEach(student => {
        const totalMarks = student.results.reduce((sum, result) => sum + result.marks, 0);
        const averageMarks = totalMarks / student.results.length;
        const totalPoints = student.results.reduce((sum, result) => sum + result.points, 0);
        const principalSubjects = student.results.filter(result => result.isPrincipal);
        const bestThreePoints = principalSubjects
          .sort((a, b) => a.points - b.points)
          .slice(0, 3)
          .reduce((sum, result) => sum + result.points, 0);

        // Determine division
        let division = 'N/A';
        if (bestThreePoints >= 3 && bestThreePoints <= 9) division = 'I';
        else if (bestThreePoints >= 10 && bestThreePoints <= 12) division = 'II';
        else if (bestThreePoints >= 13 && bestThreePoints <= 17) division = 'III';
        else if (bestThreePoints >= 18 && bestThreePoints <= 19) division = 'IV';
        else if (bestThreePoints >= 20) division = 'V';

        student.summary = {
          totalMarks,
          averageMarks,
          totalPoints,
          bestThreePoints,
          division,
          rank: student.summary.rank
        };
      });

      return {
        classId,
        examId,
        className: 'Form 5A',
        examName: mockExamData.name,
        academicYear: mockExamData.academicYear,
        term: mockExamData.term,
        examDate: mockExamData.startDate,
        students: mockStudents,
        subjects: mockSubjectResults.map(result => ({
          code: result.code,
          name: result.subject,
          isPrincipal: result.isPrincipal
        })),
        totalStudents: mockStudents.length,
        educationLevel: 'A_LEVEL'
      };
    default:
      return null;
  }
};

// Provider component
export const ReportProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reportReducer, initialState);

  // Save report to localStorage
  const saveReportToLocalStorage = useCallback((reportType, params, data) => {
    try {
      const key = generateCacheKey(reportType, params);
      saveToLocalStorage(key, data);
    } catch (error) {
      console.error('Error saving report to localStorage:', error);
    }
  }, []);

  // Get report from localStorage
  const getReportFromLocalStorage = useCallback((reportType, params) => {
    try {
      const key = generateCacheKey(reportType, params);
      return getFromLocalStorage(key);
    } catch (error) {
      console.error('Error getting report from localStorage:', error);
      return null;
    }
  }, []);

  // Fetch report data
  const fetchReport = useCallback(async (reportType, params, options = {}) => {
    const { forceRefresh = false, useMockOnError = true } = options;

    dispatch({ type: ACTIONS.FETCH_START });

    // Try to get from localStorage first if not forcing refresh
    if (!forceRefresh) {
      const cachedReport = getReportFromLocalStorage(reportType, params);
      if (cachedReport) {
        console.log(`Using cached report from localStorage: ${reportType}`, params);
        dispatch({
          type: ACTIONS.FETCH_SUCCESS,
          payload: {
            data: cachedReport,
            isFromCache: true,
            isMockData: false
          }
        });
        return cachedReport;
      }
    }

    try {
      // Determine API endpoint based on report type
      let url;
      switch (reportType) {
        case 'a-level-student':
          url = `/api/a-level-comprehensive/student/${params.studentId}/${params.examId}`;
          break;
        case 'a-level-class':
          url = `/api/a-level-comprehensive/class/${params.classId}/${params.examId}`;
          break;
        case 'a-level-student-v2':
          url = `/api/a-level-reports/student/${params.studentId}/${params.examId}`;
          break;
        case 'a-level-class-v2':
          url = `/api/a-level-reports/class/${params.classId}/${params.examId}`;
          break;
        case 'a-level-comprehensive':
          url = `/api/a-level-comprehensive/student/${params.studentId}/${params.examId}`;
          break;
        default:
          console.warn(`Unknown report type: ${reportType}, using default endpoint`);
          // Use a default endpoint based on available parameters
          if (params.studentId && params.examId) {
            url = `/api/a-level-reports/student/${params.studentId}/${params.examId}`;
          } else if (params.classId && params.examId) {
            url = `/api/a-level-reports/class/${params.classId}/${params.examId}`;
          } else {
            throw new Error(`Unknown report type: ${reportType} and insufficient parameters`);
          }
      }

      // Add query parameters if provided
      if (params.academicYear || params.term) {
        const queryParams = [];
        if (params.academicYear) queryParams.push(`academicYear=${params.academicYear}`);
        if (params.term) queryParams.push(`term=${params.term}`);
        url += `?${queryParams.join('&')}`;
      }

      console.log(`Fetching report: ${url}`);

      // Fetch data
      const response = await axios.get(url);
      const data = response.data;

      // Validate data
      if (reportType.startsWith('a-level') && (!data.educationLevel || data.educationLevel !== 'A_LEVEL')) {
        console.warn('Report data does not have A_LEVEL education level:', data);
      }

      // Save to localStorage
      saveReportToLocalStorage(reportType, params, data);

      // Update state
      dispatch({
        type: ACTIONS.FETCH_SUCCESS,
        payload: {
          data,
          isFromCache: false,
          isMockData: false
        }
      });

      return data;
    } catch (error) {
      console.error(`Error fetching ${reportType} report:`, error);

      // Try to get expired data from localStorage as fallback
      const expiredData = getFromLocalStorage(generateCacheKey(reportType, params), true);
      if (expiredData) {
        console.log(`Using expired data from localStorage for ${reportType}`, params);
        dispatch({
          type: ACTIONS.FETCH_SUCCESS,
          payload: {
            data: expiredData,
            isFromCache: true,
            isMockData: false
          }
        });
        return expiredData;
      }

      // Generate mock data if enabled
      if (useMockOnError) {
        console.log(`Generating mock data for ${reportType}`, params);
        const mockData = generateMockData(reportType, params);
        if (mockData) {
          dispatch({
            type: ACTIONS.FETCH_SUCCESS,
            payload: {
              data: mockData,
              isFromCache: false,
              isMockData: true
            }
          });
          return mockData;
        }
      }

      // If all else fails, dispatch error
      dispatch({
        type: ACTIONS.FETCH_ERROR,
        payload: error
      });

      throw error;
    }
  }, [getReportFromLocalStorage, saveReportToLocalStorage]);

  // Reset state
  const resetState = useCallback(() => {
    dispatch({ type: ACTIONS.RESET_STATE });
  }, []);

  // Update report data
  const updateReportData = useCallback((data) => {
    dispatch({
      type: ACTIONS.UPDATE_REPORT_DATA,
      payload: data
    });
  }, []);

  // Memoize context value
  const contextValue = useMemo(() => ({
    ...state,
    fetchReport,
    resetState,
    updateReportData
  }), [state, fetchReport, resetState, updateReportData]);

  return (
    <ReportContext.Provider value={contextValue}>
      {children}
    </ReportContext.Provider>
  );
};

// Custom hook
export const useReport = () => {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReport must be used within a ReportProvider');
  }
  return context;
};

export default ReportContext;
