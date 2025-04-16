import api from './api';

/**
 * Service for teacher-related API endpoints
 */
const teacherApi = {
  /**
   * Get classes assigned to the current teacher
   * @returns {Promise<Array>} - Array of classes assigned to the teacher
   */
  async getAssignedClasses() {
    try {
      const response = await api.get('/api/teacher-classes/my-classes');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching assigned classes:', error);
      throw error;
    }
  },

  /**
   * Get subjects assigned to the current teacher for a specific class
   * @param {string} classId - Class ID
   * @returns {Promise<Array>} - Array of subjects assigned to the teacher for the class
   */
  async getAssignedSubjects(classId) {
    try {
      if (!classId) {
        return [];
      }
      try {
        // Use the strict endpoint for marks entry
        console.log(`Fetching subjects for class ${classId} that the teacher is assigned to teach`);
        const response = await api.get('/api/teachers/marks-entry-subjects', {
          params: { classId }
        });

        // Check if the response has a subjects array (new format)
        if (response.data && Array.isArray(response.data.subjects)) {
          return response.data.subjects || [];
        }

        // Otherwise, assume the response is the array itself (old format)
        return response.data || [];
      } catch (error) {
        console.error('Error fetching from teacher-specific endpoint:', error);

        if (error.response && error.response.status === 403) {
          // If the teacher is not authorized for this class, return empty array
          console.log('Teacher is not authorized to teach subjects in this class');
          return [];
        }

        // If that fails, try the general endpoint but only for admins
        // For teachers, we should respect the authorization check
        if (localStorage.getItem('role') === 'admin') {
          console.log('User is admin, falling back to general subjects endpoint');
          const fallbackResponse = await api.get(`/api/classes/${classId}/subjects`);
          return fallbackResponse.data || [];
        }

        // For teachers, return empty array
        console.log('Teacher is not authorized, returning empty array');
        return [];
      }
    } catch (error) {
      console.error('Error fetching assigned subjects:', error);
      throw error;
    }
  },

  /**
   * Get students assigned to the current teacher for a specific class
   * @param {string} classId - Class ID
   * @returns {Promise<Array>} - Array of students in the class
   */
  async getAssignedStudents(classId) {
    try {
      if (!classId) {
        return [];
      }

      try {
        // First try the teacher-specific endpoint
        const response = await api.get(`/api/teachers/classes/${classId}/students`);

        // Check if the response has a students array (new format)
        if (response.data && Array.isArray(response.data.students)) {
          return response.data.students || [];
        }

        // Otherwise, assume the response is the array itself (old format)
        return response.data || [];
      } catch (error) {
        console.error('Error fetching from teacher-specific endpoint:', error);

        if (error.response && error.response.status === 403) {
          // If the teacher is not authorized for this class, return empty array
          console.log('Teacher is not authorized for this class');
          return [];
        }

        // If that fails, try the general endpoint
        console.log('Falling back to general students endpoint');
        const fallbackResponse = await api.get(`/api/students/class/${classId}`);
        return fallbackResponse.data || [];
      }
    } catch (error) {
      console.error('Error fetching assigned students:', error);
      throw error;
    }
  },

  /**
   * Get all students for a teacher (across all assigned classes)
   * @returns {Promise<Array>} - Array of students
   */
  async getAllAssignedStudents() {
    try {
      // Get the teacher's classes first
      const classesResponse = await api.get('/api/teacher-classes/my-classes');
      const classes = classesResponse.data || [];

      // Extract students from all classes
      const students = [];
      for (const cls of classes) {
        if (cls.students && Array.isArray(cls.students)) {
          students.push(...cls.students);
        }
      }

      return students;
    } catch (error) {
      console.error('Error fetching all assigned students:', error);
      throw error;
    }
  },

  /**
   * Get all subjects for a teacher (across all assigned classes)
   * @returns {Promise<Array>} - Array of subjects
   */
  async getAllAssignedSubjects() {
    try {
      // Get the teacher's subjects from the my-subjects endpoint
      const response = await api.get('/api/teacher-classes/my-subjects');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching all assigned subjects:', error);
      throw error;
    }
  },

  /**
   * Enter marks for a subject
   * @param {Object} marksData - Marks data
   * @returns {Promise<Object>} - Response data
   */
  async enterMarks(marksData) {
    try {
      const response = await api.post('/api/marks/enter', marksData);
      return response.data;
    } catch (error) {
      console.error('Error entering marks:', error);
      throw error;
    }
  },

  /**
   * Enter bulk marks for multiple students
   * @param {Object} bulkMarksData - Bulk marks data
   * @returns {Promise<Object>} - Response data
   */
  async enterBulkMarks(bulkMarksData) {
    try {
      const response = await api.post('/api/marks/bulk-enter', bulkMarksData);
      return response.data;
    } catch (error) {
      console.error('Error entering bulk marks:', error);
      throw error;
    }
  },

  /**
   * Get marks for a subject
   * @param {string} classId - Class ID
   * @param {string} subjectId - Subject ID
   * @param {string} examId - Exam ID
   * @returns {Promise<Array>} - Array of marks
   */
  async getMarks(classId, subjectId, examId) {
    try {
      if (!classId || !subjectId || !examId) {
        return [];
      }
      const response = await api.get('/api/marks', {
        params: { classId, subjectId, examId }
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching marks:', error);
      throw error;
    }
  },

  /**
   * Get exams for a class
   * @param {string} classId - Class ID
   * @returns {Promise<Array>} - Array of exams
   */
  async getExams(classId) {
    try {
      if (!classId) {
        return [];
      }
      const response = await api.get('/api/exams', {
        params: { classId }
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching exams:', error);
      throw error;
    }
  }
};

export default teacherApi;
