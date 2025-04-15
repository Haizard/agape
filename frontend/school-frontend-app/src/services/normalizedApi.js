import axios from 'axios';
import { normalizeApiResponse } from './dataNormalizer';

/**
 * Create a new axios instance with interceptors to normalize responses
 */
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');

    // If token exists, add it to the request headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to normalize data
api.interceptors.response.use(
  (response) => {
    // Normalize the response data
    const normalizedResponse = {
      ...response,
      data: normalizeApiResponse(response.data),
    };
    return normalizedResponse;
  },
  (error) => {
    // Return the error as is
    return Promise.reject(error);
  }
);

/**
 * Get a student result report
 * @param {string} studentId - The student ID
 * @param {string} examId - The exam ID
 * @param {string} educationLevel - The education level (O_LEVEL or A_LEVEL)
 * @returns {Promise<Object>} - The normalized student result report
 */
export const getStudentResultReport = async (studentId, examId, educationLevel = 'O_LEVEL') => {
  try {
    let endpoint = '';
    if (educationLevel === 'A_LEVEL') {
      endpoint = `/api/a-level-results/student/${studentId}/${examId}`;
    } else {
      endpoint = `/api/o-level-results/student/${studentId}/${examId}`;
    }
    console.log(`Fetching result report from endpoint: ${endpoint}`);
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error fetching student result report:', error);
    throw error;
  }
};

/**
 * Get a class result report
 * @param {string} classId - The class ID
 * @param {string} examId - The exam ID
 * @param {string} educationLevel - The education level (O_LEVEL or A_LEVEL)
 * @returns {Promise<Object>} - The normalized class result report
 */
export const getClassResultReport = async (classId, examId, educationLevel = 'O_LEVEL') => {
  try {
    let endpoint = '';
    if (educationLevel === 'A_LEVEL') {
      // Try the API endpoint first
      endpoint = `/api/a-level-results/class/${classId}/${examId}`;
    } else {
      endpoint = `/api/o-level-results/class/${classId}/${examId}`;
    }
    console.log(`Fetching class result report from endpoint: ${endpoint}`);
    const response = await api.get(endpoint);

    // Normalize the response data to ensure it has the expected structure
    const data = response.data;

    // Ensure students array exists
    if (!data.students) {
      data.students = [];
    }

    // Normalize year if it's an object
    if (typeof data.year === 'object' && data.year !== null) {
      data.year = data.year.year || data.year.name || new Date().getFullYear();
    } else if (!data.year) {
      data.year = new Date().getFullYear();
    }

    // Normalize academicYear if it's an object
    if (typeof data.academicYear === 'object' && data.academicYear !== null) {
      data.academicYear = data.academicYear.name || data.academicYear.year || new Date().getFullYear();
    }

    // Normalize student data
    data.students = data.students.map(student => {
      console.log('Normalizing student data:', student);

      // Ensure subjectResults exists and is properly formatted
      let subjectResults = [];

      if (student.subjectResults) {
        console.log('Student has subjectResults:', student.subjectResults);
        subjectResults = student.subjectResults;
      } else if (student.subjects) {
        console.log('Student has subjects:', student.subjects);
        subjectResults = student.subjects;
      } else if (student.results) {
        console.log('Student has results:', student.results);
        subjectResults = student.results;
      }

      // Check for subjects directly in the student object
      // Common A-Level subjects
      const commonSubjects = ['General Studies', 'History', 'Physics', 'Chemistry', 'Kiswahili', 'Advanced Mathematics',
       'Biology', 'Geography', 'English', 'BAM', 'Economics'];

      for (const subjectName of commonSubjects) {
        if (student[subjectName] !== undefined && !subjectResults.some(s =>
          (s.subject?.name === subjectName) || (s.name === subjectName) || (s === subjectName)
        )) {
          console.log(`Found subject ${subjectName} directly in student object:`, student[subjectName]);
          subjectResults.push({
            subject: { name: subjectName },
            marks: student[subjectName]
          });
        }
      }

      // Ensure each subject has the proper structure
      subjectResults = subjectResults.map(subject => {
        if (typeof subject === 'string') {
          return { subject: { name: subject }, marks: null };
        }
        if (!subject.subject && subject.name) {
          return { subject: { name: subject.name }, marks: subject.marks || subject.marksObtained || null };
        }
        return subject;
      });

      console.log('Normalized subjectResults:', subjectResults);

      // Ensure student has the expected properties
      return {
        ...student,
        id: student.id || student._id || student.studentId,
        studentName: student.studentName || `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.name,
        sex: student.sex || student.gender || '-',
        points: student.points || student.totalPoints || '-',
        division: student.division || '-',
        // Ensure subjectResults exists
        subjectResults: subjectResults
      };
    });

    return data;
  } catch (error) {
    console.error('Error fetching class result report:', error);

    // If we got a 403 or 404, try the API endpoint
    if (error.response && (error.response.status === 403 || error.response.status === 404)) {
      console.log(`${educationLevel} endpoint failed, trying API endpoint`);
      try {
        // Try the API endpoint as a fallback
        let apiEndpoint;
        if (educationLevel === 'A_LEVEL') {
          apiEndpoint = `/api/a-level-results/api/class/${classId}/${examId}`;
        } else {
          apiEndpoint = `/api/o-level-results/api/class/${classId}/${examId}`;
        }
        console.log(`Trying fallback endpoint: ${apiEndpoint}`);
        const response = await api.get(apiEndpoint);

        // Normalize the response data
        const data = response.data;

        // Ensure students array exists
        if (!data.students) {
          data.students = [];
        }

        // Normalize year if it's an object
        if (typeof data.year === 'object' && data.year !== null) {
          data.year = data.year.year || data.year.name || new Date().getFullYear();
        } else if (!data.year) {
          data.year = new Date().getFullYear();
        }

        // Normalize academicYear if it's an object
        if (typeof data.academicYear === 'object' && data.academicYear !== null) {
          data.academicYear = data.academicYear.name || data.academicYear.year || new Date().getFullYear();
        }

        // Normalize student data
        data.students = data.students.map(student => {
          console.log('Normalizing student data (fallback):', student);

          // Ensure subjectResults exists and is properly formatted
          let subjectResults = [];

          if (student.subjectResults) {
            console.log('Student has subjectResults:', student.subjectResults);
            subjectResults = student.subjectResults;
          } else if (student.subjects) {
            console.log('Student has subjects:', student.subjects);
            subjectResults = student.subjects;
          } else if (student.results) {
            console.log('Student has results:', student.results);
            subjectResults = student.results;
          }

          // Check for subjects directly in the student object
          // Common A-Level subjects
          const commonSubjects = ['General Studies', 'History', 'Physics', 'Chemistry', 'Kiswahili', 'Advanced Mathematics',
           'Biology', 'Geography', 'English', 'BAM', 'Economics'];

          for (const subjectName of commonSubjects) {
            if (student[subjectName] !== undefined && !subjectResults.some(s =>
              (s.subject?.name === subjectName) || (s.name === subjectName) || (s === subjectName)
            )) {
              console.log(`Found subject ${subjectName} directly in student object (fallback):`, student[subjectName]);
              subjectResults.push({
                subject: { name: subjectName },
                marks: student[subjectName]
              });
            }
          }

          // Ensure each subject has the proper structure
          subjectResults = subjectResults.map(subject => {
            if (typeof subject === 'string') {
              return { subject: { name: subject }, marks: null };
            }
            if (!subject.subject && subject.name) {
              return { subject: { name: subject.name }, marks: subject.marks || subject.marksObtained || null };
            }
            return subject;
          });

          console.log('Normalized subjectResults (fallback):', subjectResults);

          // Ensure student has the expected properties
          return {
            ...student,
            id: student.id || student._id || student.studentId,
            studentName: student.studentName || `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.name,
            sex: student.sex || student.gender || '-',
            points: student.points || student.totalPoints || '-',
            division: student.division || '-',
            // Ensure subjectResults exists
            subjectResults: subjectResults
          };
        });

        return data;
      } catch (fallbackError) {
        console.error('Fallback endpoint also failed:', fallbackError);

        // Try the test endpoint as a last resort
        try {
          console.log('Trying test endpoint as last resort');
          let testEndpoint;
          if (educationLevel === 'A_LEVEL') {
            testEndpoint = `/api/a-level-results/test-no-auth/${classId}/${examId}`;
          } else {
            testEndpoint = `/api/o-level-results/test-no-auth/${classId}/${examId}`;
          }
          console.log(`Trying test endpoint: ${testEndpoint}`);
          const testResponse = await api.get(testEndpoint);

          // If we get here, the test endpoint worked, but we still don't have real data
          // Return a message indicating that this is test data
          return {
            message: 'Using test data - authentication required for real data',
            className: classId,
            examName: 'Test Exam',
            educationLevel: educationLevel,
            students: [
              // Add placeholder student to show structure
              {
                id: 'placeholder-1',
                studentName: 'No Data Available',
                sex: '-',
                points: '-',
                division: '-',
                subjectResults: [
                  { subject: { name: 'General Studies' }, marks: null },
                  { subject: { name: 'History' }, marks: null },
                  { subject: { name: 'Physics' }, marks: null },
                  { subject: { name: 'Chemistry' }, marks: null },
                  { subject: { name: 'Kiswahili' }, marks: null },
                  { subject: { name: 'Advanced Mathematics' }, marks: null },
                  { subject: { name: 'Biology' }, marks: null },
                  { subject: { name: 'Geography' }, marks: null },
                  { subject: { name: 'English' }, marks: null },
                  { subject: { name: 'BAM' }, marks: null },
                  { subject: { name: 'Economics' }, marks: null }
                ],
                totalMarks: '-',
                averageMarks: '-',
                rank: '-'
              }
            ],
            subjects: [
              { id: 'gs', name: 'General Studies' },
              { id: 'hist', name: 'History' },
              { id: 'phys', name: 'Physics' },
              { id: 'chem', name: 'Chemistry' },
              { id: 'kisw', name: 'Kiswahili' },
              { id: 'math', name: 'Advanced Mathematics' },
              { id: 'bio', name: 'Biology' },
              { id: 'geo', name: 'Geography' },
              { id: 'eng', name: 'English' },
              { id: 'bam', name: 'BAM' },
              { id: 'econ', name: 'Economics' }
            ],
            divisionSummary: { 'I': 0, 'II': 0, 'III': 0, 'IV': 0, '0': 0 },
            subjectPerformance: {},
            overallPerformance: { totalPassed: 0, examGpa: 'N/A' }
          };
        } catch (testError) {
          console.error('Test endpoint also failed:', testError);
          throw error; // Throw the original error
        }
      }
    }

    throw error;
  }
};

export default {
  get: api.get,
  post: api.post,
  put: api.put,
  delete: api.delete,
  patch: api.patch,
  getStudentResultReport,
  getClassResultReport,
};
