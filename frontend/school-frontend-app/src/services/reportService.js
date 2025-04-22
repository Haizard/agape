/**
 * Report Service
 *
 * Provides a centralized service for fetching and managing report data
 * with consistent error handling, data normalization, and request cancellation.
 */
import axios from 'axios';
import api from '../utils/api';
import { normalizeALevelClassReport } from '../utils/aLevelReportDataNormalizer';
import { getAuthToken } from '../utils/authUtils';

/**
 * Normalize API response data to ensure consistent property names
 * @param {Object} data - Raw API response data
 * @returns {Object} - Normalized data
 */
const normalizeReportData = (data) => {
  console.log('normalizeReportData called with:', {
    hasData: !!data,
    dataType: data ? typeof data : 'null',
    isArray: Array.isArray(data),
    keys: data ? Object.keys(data) : [],
    mock: data?.mock,
    warning: data?.warning
  });

  if (!data) {
    console.error('normalizeReportData received null or undefined data');
    return null;
  }

  try {
    // Normalize student details
    const studentDetails = data.studentDetails || {};

    // Normalize subject results
    const subjectResults = (data.subjectResults || []).map(result => {
      // Log the result structure to help debug
      console.log('Subject result structure:', {
        subject: result.subject,
        marks: result.marks,
        marksObtained: result.marksObtained,
        score: result.score,
        grade: result.grade,
        points: result.points
      });

      return {
        subject: result.subject,
        code: result.code || '',
        // Try all possible property names for marks
        marks: result.marks || result.marksObtained || result.score || 0,
        grade: result.grade || '-',
        points: result.points || 0,
        remarks: result.remarks || '',
        isPrincipal: result.isPrincipal || false,
        isCompulsory: result.isCompulsory || false
      };
    });

    // Normalize summary
    const summary = data.summary || {};

    // Ensure division is consistently formatted
    if (summary.division && !summary.division.startsWith('Division')) {
      summary.division = `Division ${summary.division}`;
    }

    // Ensure students array exists and is properly formatted
    const students = data.students || [];
    if (students.length > 0) {
      // Ensure each student has a results array
      for (const student of students) {
        if (!student.results) {
          student.results = [];
        }
      }
    }

    // Preserve mock flag and warning message
    const mock = data.mock === true;
    const warning = data.warning || '';

    // Return normalized data
    const normalizedData = {
      ...data,
      studentDetails,
      subjectResults,
      summary,
      students,
      mock,
      warning,
      // Ensure we have both principal and subsidiary subjects arrays
      principalSubjects: data.principalSubjects || subjectResults.filter(r => r.isPrincipal),
      subsidiarySubjects: data.subsidiarySubjects || subjectResults.filter(r => !r.isPrincipal)
    };

    console.log('normalizeReportData returning:', {
      hasData: true,
      studentCount: normalizedData.students?.length || 0,
      mock: normalizedData.mock,
      warning: normalizedData.warning
    });

    return normalizedData;
  } catch (error) {
    console.error('Error in normalizeReportData:', error);
    // Return the original data if normalization fails
    return data;
  }
};

/**
 * Fetch A-Level student report
 * @param {string} studentId - Student ID
 * @param {string} examId - Exam ID
 * @param {Object} options - Additional options
 * @param {boolean} options.forceRefresh - Whether to bypass cache
 * @param {AbortSignal} options.signal - AbortController signal for cancellation
 * @returns {Promise<Object>} - Normalized report data
 */
const fetchALevelStudentReport = async (studentId, examId, options = {}) => {
  const { forceRefresh = false, signal } = options;

  try {
    // Add cache-busting parameter if forcing refresh
    const params = forceRefresh ? { _t: Date.now() } : {};

    try {
      // Make the API request with cancellation support
      console.log(`Fetching A-Level student report for student ${studentId}, exam ${examId}`);
      // Log the full URL for debugging
      const endpoint = `/api/a-level-reports/student/${studentId}/${examId}`;
      console.log('Full API URL for student report:', api.defaults.baseURL + endpoint);

      // Get the authentication token
      const token = getAuthToken();

      const response = await api.get(
        endpoint,
        {
          params,
          signal,
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined
          }
        }
      );

      // Check if the response has the expected structure
      if (!response.data || !response.data.success) {
        console.error('API response does not have expected structure:', response.data);
        throw new Error(response.data?.message || 'Failed to fetch report data');
      }

      console.log('API response has expected structure');

      // If the response data has a warning but no mock flag, explicitly set mock to false
      // This ensures the frontend knows this is real data (even if empty)
      if (response.data.data && response.data.data.warning && response.data.data.mock === undefined) {
        console.log('Setting mock=false explicitly for data with warning');
        response.data.data.mock = false;
      }

      // Normalize the data
      const normalizedData = normalizeReportData(response.data.data);

      return normalizedData;
    } catch (apiError) {
      // Log detailed error information
      console.error('API Error Details for student report:', {
        message: apiError.message,
        status: apiError.response?.status,
        statusText: apiError.response?.statusText,
        data: apiError.response?.data,
        url: apiError.config?.url,
        method: apiError.config?.method
      });

      // Check for authentication errors
      if (apiError.response && apiError.response.status === 401) {
        console.error('Authentication error: Token missing or invalid');
        // In production, you might want to redirect to login
        // window.location.href = '/login';
      }

      // Check for CORS errors (typically no response)
      if (!apiError.response) {
        console.error('Possible CORS or network error - no response received');
      }

      // If the API returns a 404, log the error but don't automatically use mock data
      if (apiError.response && apiError.response.status === 404) {
        console.log('API returned 404 for A-Level student report');
        console.error('Error details:', {
          url: apiError.config?.url,
          method: apiError.config?.method,
          status: apiError.response?.status,
          statusText: apiError.response?.statusText,
          data: apiError.response?.data
        });

        // Don't automatically return mock data
        // Instead, throw the error so the UI can handle it appropriately
        throw new Error('Student report not found. Please check if the student and exam exist.');
      }

      // Don't automatically fall back to mock data in development
      // This was causing the issue with always showing demo data
      console.log('API error occurred:', apiError.message);
      console.error('Full error details:', {
        url: apiError.config?.url,
        method: apiError.config?.method,
        status: apiError.response?.status,
        statusText: apiError.response?.statusText,
        data: apiError.response?.data
      });

      // Re-throw other errors
      throw apiError;
    }
  } catch (error) {
    // Handle request cancellation
    if (axios.isCancel(error)) {
      console.log('Request cancelled:', error.message);
      throw new Error('Report request was cancelled');
    }

    // Handle other errors
    console.error('Error fetching A-Level student report:', error);
    throw error;
  }
};

/**
 * Fetch A-Level class report
 * @param {string} classId - Class ID
 * @param {string} examId - Exam ID
 * @param {Object} options - Additional options
 * @param {boolean} options.forceRefresh - Whether to bypass cache
 * @param {string} options.formLevel - Form level filter (5 or 6)
 * @param {AbortSignal} options.signal - AbortController signal for cancellation
 * @returns {Promise<Object>} - Normalized report data
 */
const fetchALevelClassReport = async (classId, examId, options = {}) => {
  const { forceRefresh = false, formLevel = null, signal } = options;

  try {
    // Create a more robust params object with explicit types
    const params = {
      // Always add cache-busting parameter
      _t: Date.now(),

      // Add form level filter if provided (with explicit string conversion)
      formLevel: formLevel ? formLevel.toString() : undefined,

      // Add forceRefresh and useMock parameters if forcing refresh
      forceRefresh: forceRefresh ? 'true' : undefined,
      useMock: 'false' // Always set useMock to false to ensure we get real data
    };

    // Log the parameters for debugging
    console.log('Request parameters:', JSON.stringify(params, null, 2));
    console.log(`Adding formLevel parameter: ${params.formLevel || 'none'}`);

    if (forceRefresh) {
      console.log('Adding forceRefresh=true and useMock=false parameters');
    }

    // Determine the endpoint based on whether form level is provided
    let endpoint = `api/a-level-reports/class/${classId}/${examId}`;

    // Log the full URL for debugging
    console.log('Full API URL:', api.defaults.baseURL + endpoint);
    console.log('API baseURL:', api.defaults.baseURL);
    console.log('API endpoint:', endpoint);

    try {
      // Make the API request with cancellation support
      console.log(`Fetching A-Level class report from: ${endpoint}`, params);
      console.log('Request parameters:', {
        classId,
        examId,
        formLevel,
        forceRefresh,
        params
      });
      // Get the authentication token
      const token = getAuthToken();

      // Ensure we're using the full URL
      const fullUrl = api.defaults.baseURL.endsWith('/')
        ? api.defaults.baseURL + endpoint.replace(/^\//, '')
        : api.defaults.baseURL + endpoint;

      console.log('Making API request to full URL:', fullUrl);

      // We used to use fetch directly for debugging, but this was causing issues with request cancellation
      // Now we'll rely solely on the axios request below
      /*
      try {
        const fetchResponse = await fetch(fullUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : undefined
          }
        });
        console.log('Fetch response status:', fetchResponse.status);
        if (fetchResponse.ok) {
          const fetchData = await fetchResponse.json();
          console.log('Fetch response data:', fetchData);
        } else {
          console.log('Fetch error response:', await fetchResponse.text());
        }
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
      }
      */

      const response = await api.get(
        endpoint,
        {
          params,
          signal,
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined
          }
        }
      );

      console.log('A-Level class report response:', response.data);

      // Check if the response has the expected structure
      if (!response.data) {
        console.error('Empty response data');
        throw new Error('No data received from server');
      }

      if (!response.data.success) {
        console.error('Invalid response structure:', response.data);
        throw new Error(response.data?.message || 'Failed to fetch class report data');
      }

      // If we get here, we have valid data from the API
      // Normalize the data before returning
      return normalizeALevelClassReport(response.data.data);
    } catch (apiError) {
      // Log detailed error information
      console.error('API Error Details:', {
        message: apiError.message,
        status: apiError.response?.status,
        statusText: apiError.response?.statusText,
        data: apiError.response?.data,
        url: apiError.config?.url,
        method: apiError.config?.method
      });

      // Check for authentication errors
      if (apiError.response && apiError.response.status === 401) {
        console.error('Authentication error: Token missing or invalid');
        // In production, you might want to redirect to login
        // window.location.href = '/login';
      }

      // Check for CORS errors (typically no response)
      if (!apiError.response) {
        console.error('Possible CORS or network error - no response received');
        console.error('CORS Error Details:', {
          message: apiError.message,
          name: apiError.name,
          stack: apiError.stack
        });
        console.log('Will attempt to use mock data due to CORS/network error');
      }

      // Check for network errors
      if (apiError.message === 'Network Error') {
        console.error('Network Error: Check if the backend server is running');
        console.log('Will attempt to use mock data due to network error');
      }

      // If the API returns a 404, use mock data instead
      if (apiError.response && apiError.response.status === 404) {
        console.log('API returned 404, using mock data instead');
        console.log('404 response details:', {
          url: apiError.config?.url,
          method: apiError.config?.method,
          data: apiError.response?.data
        });

        // Return normalized mock data
        const mockData = getMockClassReport(classId, examId, formLevel);
        return normalizeALevelClassReport(mockData);
      }

      // For development purposes, we used to fall back to mock data if there's any error
      // This is now permanently disabled to ensure we see real errors
      /*
      if (process.env.NODE_ENV === 'development') {
        console.log('Development environment detected, falling back to mock data');
        const mockData = getMockClassReport(classId, examId, formLevel);
        return normalizeALevelClassReport(mockData);
      }
      */

      // Re-throw other errors
      throw apiError;
    }

  } catch (error) {
    // Handle request cancellation
    if (axios.isCancel(error)) {
      console.log('Request cancelled:', error.message);
      throw new Error('Class report request was cancelled');
    }

    // Handle other errors
    console.error('Error fetching A-Level class report:', error);
    throw error;
  }
};

/**
 * Get mock data for A-Level class report
 * @param {string} classId - Class ID
 * @param {string} examId - Exam ID
 * @param {string|number} formLevel - Form level (5 or 6)
 * @returns {Object} - Mock class report data
 */
const getMockClassReport = (classId, examId, formLevel) => {
  console.log(`Generating mock A-Level class report for class ${classId}, exam ${examId}, formLevel ${formLevel || 'all'}`);

  // Convert formLevel to string for consistency
  const formLevelStr = formLevel ? formLevel.toString() : 'all';

  // Create a more comprehensive mock data set
  const students = [
    {
      id: 'student1',
      name: 'John Smith',
      rollNumber: 'F5S001',
      sex: 'M',
      results: [
        { subject: 'Physics', code: 'PHY', marks: 85, grade: 'A', points: 1, remarks: 'Excellent', isPrincipal: true },
        { subject: 'Chemistry', code: 'CHE', marks: 78, grade: 'B', points: 2, remarks: 'Good', isPrincipal: true },
        { subject: 'Mathematics', code: 'MAT', marks: 92, grade: 'A', points: 1, remarks: 'Excellent', isPrincipal: true },
        { subject: 'General Studies', code: 'GS', marks: 75, grade: 'B', points: 2, remarks: 'Good', isPrincipal: false }
      ],
      totalMarks: 330,
      averageMarks: '82.50',
      totalPoints: 6,
      bestThreePoints: 4,
      division: 'I',
      rank: 1
    },
    {
      id: 'student2',
      name: 'Jane Doe',
      rollNumber: 'F5S002',
      sex: 'F',
      results: [
        { subject: 'Physics', code: 'PHY', marks: 92, grade: 'A', points: 1, remarks: 'Excellent', isPrincipal: true },
        { subject: 'Chemistry', code: 'CHE', marks: 88, grade: 'A', points: 1, remarks: 'Excellent', isPrincipal: true },
        { subject: 'Mathematics', code: 'MAT', marks: 95, grade: 'A', points: 1, remarks: 'Excellent', isPrincipal: true },
        { subject: 'General Studies', code: 'GS', marks: 82, grade: 'A', points: 1, remarks: 'Excellent', isPrincipal: false }
      ],
      totalMarks: 357,
      averageMarks: '89.25',
      totalPoints: 4,
      bestThreePoints: 3,
      division: 'I',
      rank: 2
    },
    {
      id: 'student3',
      name: 'Michael Johnson',
      rollNumber: 'F5S003',
      sex: 'M',
      results: [
        { subject: 'Physics', code: 'PHY', marks: 65, grade: 'C', points: 3, remarks: 'Average', isPrincipal: true },
        { subject: 'Chemistry', code: 'CHE', marks: 72, grade: 'B', points: 2, remarks: 'Good', isPrincipal: true },
        { subject: 'Mathematics', code: 'MAT', marks: 68, grade: 'C', points: 3, remarks: 'Average', isPrincipal: true },
        { subject: 'General Studies', code: 'GS', marks: 70, grade: 'B', points: 2, remarks: 'Good', isPrincipal: false }
      ],
      totalMarks: 275,
      averageMarks: '68.75',
      totalPoints: 10,
      bestThreePoints: 8,
      division: 'II',
      rank: 3
    },
    {
      id: 'student4',
      name: 'Emily Wilson',
      rollNumber: 'F5S004',
      sex: 'F',
      results: [
        { subject: 'Physics', code: 'PHY', marks: 58, grade: 'D', points: 4, remarks: 'Below Average', isPrincipal: true },
        { subject: 'Chemistry', code: 'CHE', marks: 62, grade: 'C', points: 3, remarks: 'Average', isPrincipal: true },
        { subject: 'Mathematics', code: 'MAT', marks: 55, grade: 'D', points: 4, remarks: 'Below Average', isPrincipal: true },
        { subject: 'General Studies', code: 'GS', marks: 68, grade: 'C', points: 3, remarks: 'Average', isPrincipal: false }
      ],
      totalMarks: 243,
      averageMarks: '60.75',
      totalPoints: 14,
      bestThreePoints: 11,
      division: 'II',
      rank: 4
    },
    {
      id: 'student5',
      name: 'David Brown',
      rollNumber: 'F5S005',
      sex: 'M',
      results: [
        { subject: 'Physics', code: 'PHY', marks: 45, grade: 'E', points: 5, remarks: 'Poor', isPrincipal: true },
        { subject: 'Chemistry', code: 'CHE', marks: 52, grade: 'D', points: 4, remarks: 'Below Average', isPrincipal: true },
        { subject: 'Mathematics', code: 'MAT', marks: 48, grade: 'E', points: 5, remarks: 'Poor', isPrincipal: true },
        { subject: 'General Studies', code: 'GS', marks: 55, grade: 'D', points: 4, remarks: 'Below Average', isPrincipal: false }
      ],
      totalMarks: 200,
      averageMarks: '50.00',
      totalPoints: 18,
      bestThreePoints: 14,
      division: 'III',
      rank: 5
    }
  ];

  // Calculate class average
  const totalAverage = students.reduce((sum, student) => sum + parseFloat(student.averageMarks), 0);
  const classAverage = (totalAverage / students.length).toFixed(2);

  // Calculate division distribution
  const divisionDistribution = { 'I': 0, 'II': 0, 'III': 0, 'IV': 0, '0': 0 };
  students.forEach(student => {
    const divKey = student.division.toString().replace('Division ', '');
    divisionDistribution[divKey] = (divisionDistribution[divKey] || 0) + 1;
  });

  return {
    classId,
    examId,
    className: formLevelStr === '6' ? 'Form 6 Science' : 'Form 5 Science',
    examName: 'Mid-Term Exam 2023',
    academicYear: '2023-2024',
    formLevel: formLevelStr,
    students,
    divisionDistribution,
    educationLevel: 'A_LEVEL',
    classAverage,
    totalStudents: students.length,
    absentStudents: 1, // Mock data for absent students
    subjectCombination: {
      name: 'PCM',
      code: 'PCM',
      subjects: [
        { name: 'Physics', code: 'PHY', isPrincipal: true },
        { name: 'Chemistry', code: 'CHE', isPrincipal: true },
        { name: 'Mathematics', code: 'MAT', isPrincipal: true },
        { name: 'General Studies', code: 'GS', isPrincipal: false }
      ]
    }
  };
};

/**
 * Get mock data for A-Level student report
 * @param {string} studentId - Student ID
 * @param {string} examId - Exam ID
 * @param {string|number} formLevel - Form level (5 or 6)
 * @returns {Object} - Mock student report data
 */
const getMockStudentReport = (studentId, examId, formLevel = 5) => {
  console.log(`Generating mock A-Level student report for student ${studentId}, exam ${examId}, formLevel ${formLevel || 5}`);

  // Convert formLevel to string for consistency
  const formLevelStr = formLevel ? formLevel.toString() : '5';

  return {
    studentId,
    examId,
    studentDetails: {
      name: 'John Smith',
      rollNumber: 'F5S001',
      class: formLevelStr === '6' ? 'Form 6 Science' : 'Form 5 Science',
      gender: 'male',
      rank: 1,
      totalStudents: 25,
      form: parseInt(formLevelStr, 10)
    },
    examName: 'Mid-Term Exam 2023',
    academicYear: '2023-2024',
    examDate: '2023-06-15 - 2023-06-30',
    subjectCombination: {
      name: 'PCM',
      code: 'PCM',
      subjects: [
        { name: 'Physics', code: 'PHY', isPrincipal: true },
        { name: 'Chemistry', code: 'CHE', isPrincipal: true },
        { name: 'Mathematics', code: 'MAT', isPrincipal: true },
        { name: 'General Studies', code: 'GS', isPrincipal: false }
      ]
    },
    form5Results: formLevelStr === '6' ? {
      averageMarks: '78.50',
      bestThreePoints: 5,
      division: 'II',
      examName: 'Final Exam 2022'
    } : null,
    characterAssessment: {
      punctuality: 'Excellent',
      discipline: 'Good',
      respect: 'Excellent',
      leadership: 'Good',
      participation: 'Excellent',
      overallAssessment: 'Excellent',
      comments: 'John is a dedicated student who shows great potential.',
      assessedBy: 'Mr. Johnson'
    },
    subjectResults: [
      { subject: 'Physics', code: 'PHY', marks: 85, grade: 'A', points: 1, remarks: 'Excellent', isPrincipal: true },
      { subject: 'Chemistry', code: 'CHE', marks: 78, grade: 'B', points: 2, remarks: 'Good', isPrincipal: true },
      { subject: 'Mathematics', code: 'MAT', marks: 92, grade: 'A', points: 1, remarks: 'Excellent', isPrincipal: true },
      { subject: 'General Studies', code: 'GS', marks: 75, grade: 'B', points: 2, remarks: 'Good', isPrincipal: false }
    ],
    principalSubjects: [
      { subject: 'Physics', code: 'PHY', marks: 85, grade: 'A', points: 1, remarks: 'Excellent', isPrincipal: true },
      { subject: 'Chemistry', code: 'CHE', marks: 78, grade: 'B', points: 2, remarks: 'Good', isPrincipal: true },
      { subject: 'Mathematics', code: 'MAT', marks: 92, grade: 'A', points: 1, remarks: 'Excellent', isPrincipal: true }
    ],
    subsidiarySubjects: [
      { subject: 'General Studies', code: 'GS', marks: 75, grade: 'B', points: 2, remarks: 'Good', isPrincipal: false }
    ],
    summary: {
      totalMarks: 330,
      averageMarks: '82.50',
      totalPoints: 6,
      bestThreePoints: 4,
      division: 'I',
      rank: 1,
      totalStudents: 25,
      gradeDistribution: { 'A': 2, 'B': 2, 'C': 0, 'D': 0, 'E': 0, 'S': 0, 'F': 0 }
    },
    educationLevel: 'A_LEVEL'
  };
};

/**
 * Send A-Level result report via SMS
 * @param {string} studentId - Student ID
 * @param {string} examId - Exam ID
 * @param {Object} options - Additional options
 * @param {AbortSignal} options.signal - AbortController signal for cancellation
 * @returns {Promise<Object>} - SMS sending result
 */
const sendALevelReportSMS = async (studentId, examId, options = {}) => {
  const { signal } = options;

  try {
    // Make the API request with cancellation support
    console.log(`Sending A-Level report SMS for student ${studentId}, exam ${examId}`);
    // Get the authentication token
    const token = getAuthToken();

    const response = await api.post(
      `/api/a-level-reports/send-sms/${studentId}/${examId}`,
      {},
      {
        signal,
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined
        }
      }
    );

    // Check if the response has the expected structure
    if (!response.data || !response.data.success) {
      throw new Error(response.data?.message || 'Failed to send SMS');
    }

    return response.data;
  } catch (error) {
    // Handle request cancellation
    if (axios.isCancel(error)) {
      console.log('SMS request cancelled:', error.message);
      throw new Error('SMS request was cancelled');
    }

    // Handle other errors
    console.error('Error sending A-Level report SMS:', error);
    throw error;
  }
};

/**
 * Fetch O-Level class report
 * @param {string} classId - Class ID
 * @param {string} examId - Exam ID
 * @param {Object} options - Additional options
 * @param {boolean} options.forceRefresh - Whether to bypass cache
 * @param {string} options.formLevel - Form level filter
 * @param {AbortSignal} options.signal - AbortController signal for cancellation
 * @returns {Promise<Object>} - Normalized report data
 */
const fetchOLevelClassReport = async (classId, examId, options = {}) => {
  const { forceRefresh = false, formLevel = null, signal } = options;

  console.log('=== O-LEVEL CLASS REPORT DEBUGGING ===');
  console.log(`fetchOLevelClassReport called with classId=${classId}, examId=${examId}`);
  console.log('Options:', { forceRefresh, formLevel });

  try {
    // Create a more robust params object with explicit types
    const params = {
      // Always add cache-busting parameter
      _t: Date.now(),

      // Add form level filter if provided (with explicit string conversion)
      formLevel: formLevel ? formLevel.toString() : undefined,

      // Add forceRefresh and useMock parameters if forcing refresh
      forceRefresh: forceRefresh ? 'true' : undefined,
      useMock: 'false' // Always set useMock to false to ensure we get real data
    };

    // Log the parameters for debugging
    console.log('Request parameters:', JSON.stringify(params, null, 2));
    console.log(`Adding formLevel parameter: ${params.formLevel || 'none'}`);

    if (forceRefresh) {
      console.log('Adding forceRefresh=true and useMock=false parameters');
    }

    // Determine the endpoint - use the standardized API path
    const endpoint = `api/o-level/reports/class/${classId}/${examId}`;
    console.log('Using standardized O-Level API endpoint:', endpoint);
    console.log('API base URL:', api.defaults.baseURL);

    // Log the full URL for debugging
    console.log('Full API URL:', api.defaults.baseURL + endpoint);

    try {
      // Make the API request with cancellation support
      console.log(`Fetching O-Level class report from: ${endpoint}`, params);

      // Get the authentication token
      const token = getAuthToken();

      // Log the token for debugging
      console.log('Using auth token:', token ? `${token.substring(0, 10)}...` : 'No token');

      // Ensure we're using the correct API instance
      const response = await api.get(
        endpoint,
        {
          params,
          signal,
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );

      // Log the full response for debugging
      console.log('O-Level class report API response:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        hasData: !!response.data,
        success: response.data?.success
      });

      console.log('O-Level class report response:', response.data);

      // Check if the response has the expected structure
      if (!response.data) {
        console.error('Empty response data');
        throw new Error('No data received from server');
      }

      // Even if success is false, try to use the data if it exists
      if (!response.data.success) {
        console.warn('API returned success=false, but checking for usable data:', response.data);

        // If there's data, try to use it anyway
        if (response.data.data) {
          console.log('Found usable data despite success=false, using it with warning');
          const normalizedData = normalizeReportData(response.data.data);
          normalizedData.warning = response.data.message || 'Showing partial data. Some information may be missing.';
          return normalizedData;
        }

        console.error('Invalid response structure with no usable data:', response.data);
        throw new Error(response.data?.message || 'Failed to fetch class report data');
      }

      // If we get here, we have valid data from the API
      // Normalize the data before returning
      const normalizedData = normalizeReportData(response.data.data);

      // Add warning for empty or partial data
      if (!normalizedData.students || normalizedData.students.length === 0) {
        normalizedData.warning = 'No student data available. The report will update as marks are entered.';
      } else if (normalizedData.students.some(student => !student.results || student.results.length === 0)) {
        normalizedData.warning = 'Some students have no results data. Showing partial data where available.';
      }

      return normalizedData;
    } catch (apiError) {
      // Log detailed error information
      console.error('API Error Details:', {
        message: apiError.message,
        status: apiError.response?.status,
        statusText: apiError.response?.statusText,
        data: apiError.response?.data,
        url: apiError.config?.url,
        method: apiError.config?.method,
        baseURL: api.defaults.baseURL,
        fullURL: api.defaults.baseURL + (apiError.config?.url || '')
      });

      // Log network error details
      if (apiError.message === 'Network Error') {
        console.error('NETWORK ERROR DETECTED: This usually indicates one of the following issues:');
        console.error('1. The backend server is not running or not reachable');
        console.error('2. CORS is not properly configured on the backend');
        console.error('3. The API URL is incorrect');
        console.error('Current API URL:', api.defaults.baseURL);
        console.error('Attempted endpoint:', apiError.config?.url);
      }

      // Check for authentication errors
      if (apiError.response && apiError.response.status === 401) {
        console.error('Authentication error: Token missing or invalid');
      }

      // Check for CORS errors (typically no response)
      if (!apiError.response) {
        console.error('Possible CORS or network error - no response received');
      }

      // If the API returns a 404 or there's no data, check the specific error message
      if (apiError.response && (
        apiError.response.status === 404 ||
        apiError.response.data?.message === 'No students found in this class' ||
        apiError.response.data?.message?.includes('No marks data found') ||
        apiError.response.data?.message?.includes('not found') ||
        apiError.response.data?.message?.includes('Frontend build not found')
      )) {
        console.log('API returned error:', apiError.response?.status, apiError.response?.data);

        // Check if the API returned an empty report with a warning
        if (apiError.response?.data?.success === true && apiError.response?.data?.data) {
          console.log('API returned empty report with warning, using it');
          console.log('Empty report details:', {
            hasStudents: !!apiError.response.data.data.students,
            studentCount: apiError.response.data.data.students?.length || 0,
            warning: apiError.response.data.data.warning,
            mock: apiError.response.data.data.mock === true
          });
          return normalizeReportData(apiError.response.data.data);
        }

        // Check if we have a 404 or other error that indicates no data exists yet
        console.log('API error response:', {
          status: apiError.response?.status,
          data: apiError.response?.data,
          message: apiError.message
        });

        // Create an empty report with a warning instead of using mock data
        console.log('Creating empty report with warning instead of using mock data');

        // Get class and exam details if possible
        let className = 'Unknown Class';
        let examName = 'Unknown Exam';

        try {
          // Try to get class name
          const classResponse = await api.get(`/api/classes/${classId}`);
          if (classResponse.data && classResponse.data.name) {
            className = classResponse.data.name;
          }

          // Try to get exam name
          const examResponse = await api.get(`/api/exams/${examId}`);
          if (examResponse.data && examResponse.data.name) {
            examName = examResponse.data.name;
          }
        } catch (detailsError) {
          console.log('Error fetching class/exam details:', detailsError.message);
        }

        // Create a real (but empty) data structure
        const emptyReport = {
          reportTitle: `${examName} Class Result Report`,
          schoolName: 'AGAPE LUTHERAN JUNIOR SEMINARY',
          academicYear: 'Current Academic Year',
          examName: examName,
          examDate: new Date().toLocaleDateString(),
          className: className,
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

        console.log('Created empty report with warning');
        return normalizeReportData(emptyReport);
      }

      // Re-throw other errors
      throw apiError;
    }

  } catch (error) {
    // Handle request cancellation
    if (axios.isCancel(error)) {
      console.log('Request cancelled:', error.message);
      throw new Error('Class report request was cancelled');
    }

    // Handle other errors
    console.error('Error fetching O-Level class report:', error);
    throw error;
  }
};

/**
 * Get mock data for O-Level class report
 * @param {string} classId - Class ID
 * @param {string} examId - Exam ID
 * @param {string|number} formLevel - Form level
 * @returns {Object} - Mock class report data
 */
const getMockOLevelClassReport = (classId, examId, formLevel) => {
  console.log(`Generating mock O-Level class report for class ${classId}, exam ${examId}, formLevel ${formLevel || 'all'}`);

  // Create a more comprehensive mock data set
  const students = [
    {
      id: 'student1',
      name: 'John Smith',
      rollNumber: 'S001',
      sex: 'M',
      results: [
        { subject: 'Mathematics', code: 'MATH', marks: 85, grade: 'A', points: 1, remarks: 'Excellent' },
        { subject: 'English', code: 'ENG', marks: 78, grade: 'B', points: 2, remarks: 'Good' },
        { subject: 'Physics', code: 'PHY', marks: 92, grade: 'A', points: 1, remarks: 'Excellent' },
        { subject: 'Chemistry', code: 'CHEM', marks: 75, grade: 'B', points: 2, remarks: 'Good' },
        { subject: 'Biology', code: 'BIO', marks: 88, grade: 'A', points: 1, remarks: 'Excellent' },
        { subject: 'Geography', code: 'GEO', marks: 82, grade: 'A', points: 1, remarks: 'Excellent' },
        { subject: 'History', code: 'HIST', marks: 79, grade: 'B', points: 2, remarks: 'Good' }
      ],
      totalMarks: 579,
      averageMarks: '82.71',
      totalPoints: 10,
      division: 'I',
      rank: 1
    },
    {
      id: 'student2',
      name: 'Jane Doe',
      rollNumber: 'S002',
      sex: 'F',
      results: [
        { subject: 'Mathematics', code: 'MATH', marks: 92, grade: 'A', points: 1, remarks: 'Excellent' },
        { subject: 'English', code: 'ENG', marks: 88, grade: 'A', points: 1, remarks: 'Excellent' },
        { subject: 'Physics', code: 'PHY', marks: 85, grade: 'A', points: 1, remarks: 'Excellent' },
        { subject: 'Chemistry', code: 'CHEM', marks: 82, grade: 'A', points: 1, remarks: 'Excellent' },
        { subject: 'Biology', code: 'BIO', marks: 90, grade: 'A', points: 1, remarks: 'Excellent' },
        { subject: 'Geography', code: 'GEO', marks: 78, grade: 'B', points: 2, remarks: 'Good' },
        { subject: 'History', code: 'HIST', marks: 85, grade: 'A', points: 1, remarks: 'Excellent' }
      ],
      totalMarks: 600,
      averageMarks: '85.71',
      totalPoints: 8,
      division: 'I',
      rank: 2
    },
    {
      id: 'student3',
      name: 'Michael Johnson',
      rollNumber: 'S003',
      sex: 'M',
      results: [
        { subject: 'Mathematics', code: 'MATH', marks: 65, grade: 'C', points: 3, remarks: 'Average' },
        { subject: 'English', code: 'ENG', marks: 72, grade: 'B', points: 2, remarks: 'Good' },
        { subject: 'Physics', code: 'PHY', marks: 68, grade: 'C', points: 3, remarks: 'Average' },
        { subject: 'Chemistry', code: 'CHEM', marks: 70, grade: 'B', points: 2, remarks: 'Good' },
        { subject: 'Biology', code: 'BIO', marks: 75, grade: 'B', points: 2, remarks: 'Good' },
        { subject: 'Geography', code: 'GEO', marks: 68, grade: 'C', points: 3, remarks: 'Average' },
        { subject: 'History', code: 'HIST', marks: 72, grade: 'B', points: 2, remarks: 'Good' }
      ],
      totalMarks: 490,
      averageMarks: '70.00',
      totalPoints: 17,
      division: 'II',
      rank: 3
    }
  ];

  // Calculate class average
  const totalAverage = students.reduce((sum, student) => sum + parseFloat(student.averageMarks), 0);
  const classAverage = (totalAverage / students.length).toFixed(2);

  // Calculate division distribution
  const divisionDistribution = { 'I': 0, 'II': 0, 'III': 0, 'IV': 0, '0': 0 };
  students.forEach(student => {
    const divKey = student.division.toString().replace('Division ', '');
    divisionDistribution[divKey] = (divisionDistribution[divKey] || 0) + 1;
  });

  return {
    classId,
    examId,
    className: 'Form 3 Science',
    examName: 'Mid-Term Exam 2023',
    academicYear: '2023-2024',
    formLevel: formLevel || 'all',
    students,
    divisionDistribution,
    educationLevel: 'O_LEVEL',
    classAverage,
    totalStudents: students.length,
    absentStudents: 1, // Mock data for absent students
    subjectCombination: {
      name: 'Science',
      code: 'SCI',
      subjects: [
        { name: 'Mathematics', code: 'MATH' },
        { name: 'English', code: 'ENG' },
        { name: 'Physics', code: 'PHY' },
        { name: 'Chemistry', code: 'CHEM' },
        { name: 'Biology', code: 'BIO' },
        { name: 'Geography', code: 'GEO' },
        { name: 'History', code: 'HIST' }
      ]
    }
  };
};

/**
 * Fetch O-Level student report
 * @param {string} studentId - Student ID
 * @param {string} examId - Exam ID
 * @param {Object} options - Additional options
 * @param {boolean} options.forceRefresh - Whether to bypass cache
 * @param {AbortSignal} options.signal - AbortController signal for cancellation
 * @returns {Promise<Object>} - Normalized report data
 */
const fetchOLevelStudentReport = async (studentId, examId, options = {}) => {
  const { forceRefresh = false, signal } = options;

  try {
    // Add cache-busting parameter if forcing refresh
    const params = forceRefresh ? { _t: Date.now() } : {};

    try {
      // Make the API request with cancellation support
      console.log(`Fetching O-Level student report for student ${studentId}, exam ${examId}`);
      // Log the full URL for debugging
      // Use the standardized API endpoint for O-Level student reports
      const endpoint = `/api/o-level/reports/student/${studentId}/${examId}`;

      // Add query parameters if they exist in the URL
      const urlParams = new URL(window.location.href).searchParams;
      const academicYear = urlParams.get('academicYear');
      const term = urlParams.get('term');

      // Build query parameters
      const queryParams = {};
      if (academicYear) queryParams.academicYear = academicYear;
      if (term) queryParams.term = term;
      if (forceRefresh) queryParams._t = Date.now();
      console.log('Full API URL for student report:', api.defaults.baseURL + endpoint);

      // Get the authentication token
      const token = getAuthToken();

      const response = await api.get(
        endpoint,
        {
          params: queryParams,
          signal,
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined
          }
        }
      );

      // Check if the response has the expected structure
      if (!response.data || !response.data.success) {
        console.error('API response does not have expected structure:', response.data);
        throw new Error(response.data?.message || 'Failed to fetch report data');
      }

      console.log('API response has expected structure');

      // If the response data has a warning but no mock flag, explicitly set mock to false
      // This ensures the frontend knows this is real data (even if empty)
      if (response.data.data && response.data.data.warning && response.data.data.mock === undefined) {
        console.log('Setting mock=false explicitly for data with warning');
        response.data.data.mock = false;
      }

      // Normalize the data
      const normalizedData = normalizeReportData(response.data.data);

      return normalizedData;
    } catch (apiError) {
      // Log detailed error information
      console.error('API Error Details for student report:', {
        message: apiError.message,
        status: apiError.response?.status,
        statusText: apiError.response?.statusText,
        data: apiError.response?.data,
        url: apiError.config?.url,
        method: apiError.config?.method
      });

      // Check for authentication errors
      if (apiError.response && apiError.response.status === 401) {
        console.error('Authentication error: Token missing or invalid');
        // In production, you might want to redirect to login
        // window.location.href = '/login';
      }

      // Check for CORS errors (typically no response)
      if (!apiError.response) {
        console.error('Possible CORS or network error - no response received');
      }

      // If the API returns a 404, log the error but don't automatically use mock data
      if (apiError.response && apiError.response.status === 404) {
        console.log('API returned 404 for O-Level student report');
        console.error('Error details:', {
          url: apiError.config?.url,
          method: apiError.config?.method,
          status: apiError.response?.status,
          statusText: apiError.response?.statusText,
          data: apiError.response?.data
        });

        // Don't automatically return mock data
        // Instead, throw the error so the UI can handle it appropriately
        throw new Error('Student report not found. Please check if the student and exam exist.');
      }

      // Don't automatically fall back to mock data in development
      // This was causing the issue with always showing demo data
      console.log('API error occurred:', apiError.message);
      console.error('Full error details:', {
        url: apiError.config?.url,
        method: apiError.config?.method,
        status: apiError.response?.status,
        statusText: apiError.response?.statusText,
        data: apiError.response?.data
      });

      // Re-throw other errors
      throw apiError;
    }
  } catch (error) {
    // Handle request cancellation
    if (axios.isCancel(error)) {
      console.log('Request cancelled:', error.message);
      throw new Error('Report request was cancelled');
    }

    // Handle other errors
    console.error('Error fetching O-Level student report:', error);
    throw error;
  }
};

/**
 * Get mock data for O-Level student report
 * @param {string} studentId - Student ID
 * @param {string} examId - Exam ID
 * @returns {Object} - Mock student report data
 */
const getMockOLevelStudentReport = (studentId, examId) => {
  console.log(`Generating mock O-Level student report for student ${studentId}, exam ${examId}`);

  // Create a comprehensive mock data set
  return {
    studentDetails: {
      id: studentId,
      fullName: 'John Smith',
      rollNumber: 'F2S001',
      gender: 'Male',
      className: 'Form 2',
      stream: 'Science'
    },
    subjectResults: [
      { subject: 'Mathematics', code: 'MAT', marks: 85, grade: 'A', points: 1, remarks: 'Excellent' },
      { subject: 'English', code: 'ENG', marks: 78, grade: 'B', points: 2, remarks: 'Very Good' },
      { subject: 'Kiswahili', code: 'KIS', marks: 92, grade: 'A', points: 1, remarks: 'Excellent' },
      { subject: 'Physics', code: 'PHY', marks: 75, grade: 'B', points: 2, remarks: 'Very Good' },
      { subject: 'Chemistry', code: 'CHE', marks: 80, grade: 'A', points: 1, remarks: 'Excellent' },
      { subject: 'Biology', code: 'BIO', marks: 82, grade: 'A', points: 1, remarks: 'Excellent' },
      { subject: 'History', code: 'HIS', marks: 70, grade: 'B', points: 2, remarks: 'Very Good' },
      { subject: 'Geography', code: 'GEO', marks: 68, grade: 'C', points: 3, remarks: 'Good' },
      { subject: 'Civics', code: 'CIV', marks: 75, grade: 'B', points: 2, remarks: 'Very Good' },
      { subject: 'Bible Knowledge', code: 'BIK', marks: 90, grade: 'A', points: 1, remarks: 'Excellent' }
    ],
    summary: {
      totalMarks: 795,
      averageMarks: '79.50',
      totalPoints: 16,
      bestSevenPoints: 9,
      division: 'I',
      rank: 3,
      totalStudents: 45,
      gradeDistribution: {
        'A': 5,
        'B': 4,
        'C': 1,
        'D': 0,
        'E': 0,
        'F': 0
      }
    },
    characterAssessment: {
      attendance: 'Excellent',
      punctuality: 'Very Good',
      cleanliness: 'Good',
      discipline: 'Excellent',
      responsibility: 'Very Good',
      cooperation: 'Excellent',
      comments: 'John is a hardworking student who shows great potential. He participates actively in class and is always willing to help others.'
    },
    examName: 'Mid Term Examination',
    term: 'Term 1',
    academicYear: '2023-2024',
    educationLevel: 'O_LEVEL',
    mock: true,
    warning: 'This is mock data for demonstration purposes only.'
  };
};

// Create the service object
const reportService = {
  fetchALevelStudentReport,
  fetchALevelClassReport,
  fetchOLevelClassReport,
  fetchOLevelStudentReport,
  sendALevelReportSMS,
  getMockOLevelClassReport,
  getMockOLevelStudentReport,
  normalizeReportData,

  // Helper method to get the API URL for debugging
  getApiUrl: () => {
    return api.defaults.baseURL;
  }
};

// Export the service
export default reportService;
