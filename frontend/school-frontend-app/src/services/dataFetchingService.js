import axios from 'axios';
import { useCachedData } from '../hooks/useCachedData';
import resultApi from './resultApi';

/**
 * Custom hook for fetching A-Level student reports
 * @param {string} studentId - Student ID
 * @param {string} examId - Exam ID
 * @returns {Object} - Hook result with data, loading, error, etc.
 */
export const useALevelStudentReport = (studentId, examId) => {
  return useCachedData({
    fetchFn: async () => {
      const reportUrl = resultApi.getALevelStudentReportUrl(studentId, examId);
      const response = await axios.get(reportUrl);
      return response.data;
    },
    resourceType: 'a-level-student-result',
    resourceId: `${studentId}_${examId}`,
    params: { educationLevel: 'A_LEVEL' }
  });
};

/**
 * Custom hook for fetching A-Level class reports
 * @param {string} classId - Class ID
 * @param {string} examId - Exam ID
 * @returns {Object} - Hook result with data, loading, error, etc.
 */
export const useALevelClassReport = (classId, examId) => {
  return useCachedData({
    fetchFn: async () => {
      const reportUrl = resultApi.getALevelClassReportUrl(classId, examId);
      const response = await axios.get(reportUrl);
      return response.data;
    },
    resourceType: 'a-level-class-result',
    resourceId: `${classId}_${examId}`,
    params: { educationLevel: 'A_LEVEL' }
  });
};

/**
 * Custom hook for fetching form-specific reports
 * @param {string|number} form - Form level (5 or 6)
 * @param {string} classId - Class ID
 * @param {string} examId - Exam ID
 * @returns {Object} - Hook result with data, loading, error, etc.
 */
export const useFormSpecificReport = (form, classId, examId) => {
  return useCachedData({
    fetchFn: async () => {
      const formLevel = form === 5 || form === '5' ? 'form5' : 'form6';
      const reportUrl = `/api/a-level-results/${formLevel}/class/${classId}/${examId}`;
      const response = await axios.get(reportUrl);
      return response.data;
    },
    resourceType: 'form-specific-result',
    resourceId: `${form}_${classId}_${examId}`,
    params: { educationLevel: 'A_LEVEL', form }
  });
};

/**
 * Custom hook for fetching form-specific student reports
 * @param {string|number} form - Form level (5 or 6)
 * @param {string} studentId - Student ID
 * @param {string} examId - Exam ID
 * @returns {Object} - Hook result with data, loading, error, etc.
 */
export const useFormStudentReport = (form, studentId, examId) => {
  return useCachedData({
    fetchFn: async () => {
      const formLevel = form === 5 || form === '5' ? 'form5' : 'form6';
      const reportUrl = `/api/a-level-results/${formLevel}/student/${studentId}/${examId}`;
      const response = await axios.get(reportUrl);
      return response.data;
    },
    resourceType: 'form-student-result',
    resourceId: `${form}_${studentId}_${examId}`,
    params: { educationLevel: 'A_LEVEL', form }
  });
};

/**
 * Custom hook for fetching O-Level student reports
 * @param {string} studentId - Student ID
 * @param {string} examId - Exam ID
 * @returns {Object} - Hook result with data, loading, error, etc.
 */
export const useOLevelStudentReport = (studentId, examId) => {
  return useCachedData({
    fetchFn: async () => {
      const reportUrl = resultApi.getOLevelStudentReportUrl(studentId, examId);
      const response = await axios.get(reportUrl);
      return response.data;
    },
    resourceType: 'o-level-student-result',
    resourceId: `${studentId}_${examId}`,
    params: { educationLevel: 'O_LEVEL' }
  });
};

/**
 * Custom hook for fetching O-Level class reports
 * @param {string} classId - Class ID
 * @param {string} examId - Exam ID
 * @returns {Object} - Hook result with data, loading, error, etc.
 */
export const useOLevelClassReport = (classId, examId) => {
  return useCachedData({
    fetchFn: async () => {
      const reportUrl = resultApi.getOLevelClassReportUrl(classId, examId);
      const response = await axios.get(reportUrl);
      return response.data;
    },
    resourceType: 'o-level-class-result',
    resourceId: `${classId}_${examId}`,
    params: { educationLevel: 'O_LEVEL' }
  });
};

/**
 * Custom hook for fetching classes
 * @param {string} educationLevel - Education level (O_LEVEL or A_LEVEL)
 * @returns {Object} - Hook result with data, loading, error, etc.
 */
export const useClasses = (educationLevel) => {
  return useCachedData({
    fetchFn: async () => {
      const url = educationLevel 
        ? `/api/classes?educationLevel=${educationLevel}`
        : '/api/classes';
      const response = await axios.get(url);
      return response.data;
    },
    resourceType: 'classes',
    resourceId: educationLevel || 'all',
    params: { educationLevel }
  });
};

/**
 * Custom hook for fetching exams
 * @param {string} classId - Class ID
 * @returns {Object} - Hook result with data, loading, error, etc.
 */
export const useExams = (classId) => {
  return useCachedData({
    fetchFn: async () => {
      if (!classId) return [];
      const response = await axios.get(`/api/exams?class=${classId}`);
      return response.data;
    },
    resourceType: 'exams',
    resourceId: classId || 'all',
    params: { classId },
    enabled: !!classId
  });
};

/**
 * Custom hook for fetching students
 * @param {string} classId - Class ID
 * @param {string|number} form - Form level (optional)
 * @returns {Object} - Hook result with data, loading, error, etc.
 */
export const useStudents = (classId, form) => {
  return useCachedData({
    fetchFn: async () => {
      if (!classId) return [];
      const response = await axios.get(`/api/students?class=${classId}`);
      
      // Filter by form if provided
      if (form) {
        const formNumber = typeof form === 'string' ? parseInt(form.replace('Form ', ''), 10) : form;
        return response.data.filter(student => 
          student.form === formNumber || 
          student.form === formNumber.toString() ||
          student.form === `Form ${formNumber}`
        );
      }
      
      return response.data;
    },
    resourceType: 'students',
    resourceId: form ? `${classId}_form${form}` : classId,
    params: { classId, form },
    enabled: !!classId
  });
};
