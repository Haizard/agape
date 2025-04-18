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
  if (!data) return null;

  // Normalize student details
  const studentDetails = data.studentDetails || {};

  // Normalize subject results
  const subjectResults = (data.subjectResults || []).map(result => ({
    subject: result.subject,
    code: result.code || '',
    marks: result.marks || result.marksObtained || 0,
    grade: result.grade || '-',
    points: result.points || 0,
    remarks: result.remarks || '',
    isPrincipal: result.isPrincipal || false,
    isCompulsory: result.isCompulsory || false
  }));

  // Normalize summary
  const summary = data.summary || {};

  // Ensure division is consistently formatted
  if (summary.division && !summary.division.startsWith('Division')) {
    summary.division = `Division ${summary.division}`;
  }

  // Return normalized data
  return {
    ...data,
    studentDetails,
    subjectResults,
    summary,
    // Ensure we have both principal and subsidiary subjects arrays
    principalSubjects: data.principalSubjects || subjectResults.filter(r => r.isPrincipal),
    subsidiarySubjects: data.subsidiarySubjects || subjectResults.filter(r => !r.isPrincipal)
  };
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
        throw new Error(response.data?.message || 'Failed to fetch report data');
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

      // If the API returns a 404, use mock data instead
      if (apiError.response && apiError.response.status === 404) {
        console.log('API returned 404, using mock student report data instead');

        // Return mock data
        return getMockStudentReport(studentId, examId);
      }

      // For development purposes, always fall back to mock data if there's any error
      if (process.env.NODE_ENV === 'development') {
        console.log('Development environment detected, falling back to mock student data');
        return getMockStudentReport(studentId, examId);
      }

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
    // Add cache-busting parameter if forcing refresh
    const params = forceRefresh ? { _t: Date.now() } : {};

    // Add form level filter if provided
    if (formLevel && (formLevel === '5' || formLevel === '6' || formLevel === 5 || formLevel === 6)) {
      params.formLevel = formLevel.toString();
    }

    // Determine the endpoint based on whether form level is provided
    let endpoint = `/api/a-level-reports/class/${classId}/${examId}`;

    // Log the full URL for debugging
    console.log('Full API URL:', api.defaults.baseURL + endpoint);
    console.log('API baseURL:', api.defaults.baseURL);
    console.log('API endpoint:', endpoint);

    try {
      // Make the API request with cancellation support
      console.log(`Fetching A-Level class report from: ${endpoint}`, params);
      // Get the authentication token
      const token = getAuthToken();

      // Ensure we're using the full URL
      const fullUrl = api.defaults.baseURL.endsWith('/')
        ? api.defaults.baseURL + endpoint.replace(/^\//, '')
        : api.defaults.baseURL + endpoint;

      console.log('Making API request to full URL:', fullUrl);

      // Use fetch directly for debugging
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
      }

      // Check for network errors
      if (apiError.message === 'Network Error') {
        console.error('Network Error: Check if the backend server is running');
      }

      // If the API returns a 404, use mock data instead
      if (apiError.response && apiError.response.status === 404) {
        console.log('API returned 404, using mock data instead');

        // Return normalized mock data
        const mockData = getMockClassReport(classId, examId, formLevel);
        return normalizeALevelClassReport(mockData);
      }

      // For development purposes, always fall back to mock data if there's any error
      if (process.env.NODE_ENV === 'development') {
        console.log('Development environment detected, falling back to mock data');
        const mockData = getMockClassReport(classId, examId, formLevel);
        return normalizeALevelClassReport(mockData);
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

// Create the service object
const reportService = {
  fetchALevelStudentReport,
  fetchALevelClassReport,
  sendALevelReportSMS
};

// Export the service
export default reportService;
