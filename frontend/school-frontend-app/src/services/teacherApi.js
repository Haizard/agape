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
        console.log('[TeacherAPI] No classId provided to getAssignedSubjects');
        return [];
      }

      // Check if user is admin
      const isAdmin = localStorage.getItem('role') === 'admin';

      if (isAdmin) {
        // Admins can see all subjects in the class
        console.log(`[TeacherAPI] User is admin, fetching all subjects for class ${classId}`);
        try {
          const response = await api.get(`/api/classes/${classId}/subjects`);
          console.log(`[TeacherAPI] Admin found ${response.data ? response.data.length : 0} subjects for class ${classId}`);
          return response.data || [];
        } catch (error) {
          console.error('[TeacherAPI] Error fetching subjects for admin:', error);
          return [];
        }
      } else {
        // For teachers, use a reliable method to get only assigned subjects
        console.log(`[TeacherAPI] Fetching subjects for class ${classId} that the teacher is strictly assigned to teach`);

        // Get the teacher's profile to get their ID
        try {
          const profileResponse = await api.get('/api/teachers/profile/me');
          const teacherId = profileResponse.data._id;

          if (!teacherId) {
            console.error('[TeacherAPI] No teacher ID found in profile');
            return [];
          }

          console.log(`[TeacherAPI] Found teacher ID: ${teacherId}`);

          // Get teacher-subject assignments directly from the assignments collection
          // This is the most reliable way to get only subjects the teacher is assigned to
          try {
            const assignmentsResponse = await api.get('/api/teacher-subject-assignments', {
              params: { teacherId, classId }
            });

            const assignments = assignmentsResponse.data || [];
            console.log(`[TeacherAPI] Found ${assignments.length} subject assignments for teacher ${teacherId} in class ${classId}`);

            if (assignments.length === 0) {
              console.log('[TeacherAPI] No subject assignments found, returning empty array');
              return [];
            }

            // Extract subject IDs from assignments
            const subjectIds = assignments.map(assignment => assignment.subjectId);
            console.log(`[TeacherAPI] Subject IDs from assignments: ${subjectIds.join(', ')}`);

            // Get details for these subjects
            const subjectsResponse = await api.get(`/api/classes/${classId}/subjects`);
            const allSubjects = subjectsResponse.data || [];

            // Filter to only include subjects the teacher is assigned to
            const assignedSubjects = allSubjects.filter(subject =>
              subjectIds.includes(subject._id)
            );

            console.log(`[TeacherAPI] Final filtered assigned subjects: ${assignedSubjects.length}`);
            return assignedSubjects;
          } catch (error) {
            console.error('[TeacherAPI] Error fetching teacher-subject assignments:', error);

            // Try fallback methods if the direct approach fails
            try {
              // First try the enhanced-teachers endpoint
              console.log(`[TeacherAPI] Trying enhanced-teachers endpoint for class ${classId}`);
              const enhancedResponse = await api.get(`/api/enhanced-teachers/o-level/classes/${classId}/subjects`);

              if (enhancedResponse.data && Array.isArray(enhancedResponse.data.subjects)) {
                console.log(`[TeacherAPI] Found ${enhancedResponse.data.subjects.length} subjects using enhanced endpoint`);
                return enhancedResponse.data.subjects;
              }

              // Then try the marks-entry-subjects endpoint
              console.log(`[TeacherAPI] Trying marks-entry-subjects endpoint for class ${classId}`);
              const marksEntryResponse = await api.get('/api/teachers/marks-entry-subjects', {
                params: { classId }
              });

              console.log(`[TeacherAPI] Found ${marksEntryResponse.data ? marksEntryResponse.data.length : 0} subjects using marks-entry endpoint`);
              return marksEntryResponse.data || [];
            } catch (fallbackError) {
              console.error('[TeacherAPI] All fallback methods failed:', fallbackError);
              return [];
            }
          }
        } catch (profileError) {
          console.error('[TeacherAPI] Error fetching teacher profile:', profileError);
          return [];
        }
      }
    } catch (error) {
      console.error('[TeacherAPI] Error fetching assigned subjects:', error);
      // Return empty array instead of throwing to prevent component crashes
      return [];
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
        console.log('[TeacherAPI] No classId provided to getAssignedStudents');
        return [];
      }

      // Check if user is admin
      const isAdmin = localStorage.getItem('role') === 'admin';

      if (isAdmin) {
        // Admins can see all students in the class
        console.log(`[TeacherAPI] User is admin, fetching all students for class ${classId}`);
        try {
          const response = await api.get(`/api/students/class/${classId}`);
          console.log(`[TeacherAPI] Admin found ${response.data ? response.data.length : 0} students for class ${classId}`);
          return response.data || [];
        } catch (error) {
          console.error('[TeacherAPI] Error fetching students for admin:', error);
          return [];
        }
      } else {
        // For teachers, strictly use the teacher-specific endpoint
        console.log(`[TeacherAPI] Fetching students for class ${classId} who are taking subjects the teacher is assigned to teach`);
        try {
          // First try the O-Level specific endpoint for O-Level classes
          try {
            // Check if this is an O-Level class
            const classResponse = await api.get(`/api/classes/${classId}`);
            const isOLevel = classResponse.data && classResponse.data.educationLevel === 'O_LEVEL';

            if (isOLevel) {
              console.log(`[TeacherAPI] Class ${classId} is an O-Level class, using O-Level specific endpoint`);
              try {
                // Try the enhanced O-Level endpoint
                const oLevelResponse = await api.get(`/api/enhanced-teachers/o-level/classes/${classId}/subjects/any/students`);
                console.log(`[TeacherAPI] Found ${oLevelResponse.data.students ? oLevelResponse.data.students.length : 0} students using O-Level specific endpoint`);
                if (oLevelResponse.data && Array.isArray(oLevelResponse.data.students)) {
                  return oLevelResponse.data.students;
                }
              } catch (oLevelError) {
                console.log(`[TeacherAPI] O-Level specific endpoint failed:`, oLevelError);
                // Continue to regular endpoint
              }
            }
          } catch (classError) {
            console.log(`[TeacherAPI] Error checking class education level:`, classError);
            // Continue to regular endpoint
          }

          // This endpoint returns students who are taking subjects the teacher is assigned to teach
          console.log(`[TeacherAPI] Using regular endpoint for class ${classId}`);
          const response = await api.get(`/api/teachers/classes/${classId}/students`);

          // Check if the response has a students array (new format)
          if (response.data && Array.isArray(response.data.students)) {
            console.log(`[TeacherAPI] Found ${response.data.students.length} students for class ${classId} (new format)`);
            return response.data.students || [];
          }

          // Otherwise, assume the response is the array itself (old format)
          console.log(`[TeacherAPI] Found ${response.data ? response.data.length : 0} students for class ${classId} (old format)`);
          return response.data || [];
        } catch (error) {
          console.error('[TeacherAPI] Error fetching from teacher-specific endpoint:', error);

          // Try the fallback endpoint
          try {
            console.log(`[TeacherAPI] Falling back to general students endpoint for class ${classId}`);
            const fallbackResponse = await api.get(`/api/students/class/${classId}`);
            console.log(`[TeacherAPI] Found ${fallbackResponse.data ? fallbackResponse.data.length : 0} students from fallback endpoint`);
            return fallbackResponse.data || [];
          } catch (fallbackError) {
            console.error('[TeacherAPI] Error fetching from fallback endpoint:', fallbackError);
          }

          // For 403/401 errors, log a clear message and return empty array
          if (error.response && (error.response.status === 403 || error.response.status === 401)) {
            console.log('[TeacherAPI] Teacher is not authorized to access students in this class');
            return [];
          }

          // For other errors, return empty array
          console.log('[TeacherAPI] Returning empty array due to error');
          return [];
        }
      }
    } catch (error) {
      console.error('[TeacherAPI] Error fetching assigned students:', error);
      // Return empty array instead of throwing to prevent component crashes
      return [];
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
   * Get subjects for a specific student that the teacher is assigned to teach
   * @param {string} studentId - Student ID
   * @param {string} classId - Class ID
   * @returns {Promise<Array>} - Array of subjects
   */
  async getAssignedSubjectsForStudent(studentId, classId) {
    try {
      if (!studentId || !classId) {
        console.log('[TeacherAPI] Missing studentId or classId in getAssignedSubjectsForStudent');
        return [];
      }

      // Check if user is admin
      const isAdmin = localStorage.getItem('role') === 'admin';

      if (isAdmin) {
        // Admins can see all subjects for the student
        console.log(`[TeacherAPI] User is admin, fetching all subjects for student ${studentId}`);
        try {
          const response = await api.get(`/api/students/${studentId}/subjects`);
          console.log(`[TeacherAPI] Admin found ${response.data ? response.data.length : 0} subjects for student ${studentId}`);
          return response.data || [];
        } catch (error) {
          console.error('[TeacherAPI] Error fetching subjects for admin:', error);
          return [];
        }
      } else {
        // For teachers, strictly use the teacher-specific endpoint
        console.log(`[TeacherAPI] Fetching subjects for student ${studentId} in class ${classId} that the teacher is assigned to teach`);
        try {
          // This endpoint returns subjects for a specific student that the teacher is assigned to teach
          const response = await api.get(`/api/teachers/students/${studentId}/subjects`, {
            params: { classId }
          });

          console.log(`[TeacherAPI] Found ${response.data ? response.data.length : 0} subjects for student ${studentId} taught by the teacher`);
          return response.data || [];
        } catch (error) {
          console.error('[TeacherAPI] Error fetching from teacher-specific endpoint:', error);

          // Try the fallback endpoint
          try {
            console.log(`[TeacherAPI] Falling back to general subjects endpoint for student ${studentId}`);
            const fallbackResponse = await api.get(`/api/students/${studentId}/subjects`);
            console.log(`[TeacherAPI] Found ${fallbackResponse.data ? fallbackResponse.data.length : 0} subjects from fallback endpoint`);
            return fallbackResponse.data || [];
          } catch (fallbackError) {
            console.error('[TeacherAPI] Error fetching from fallback endpoint:', fallbackError);
          }

          // For 403/401 errors, log a clear message and return empty array
          if (error.response && (error.response.status === 403 || error.response.status === 401)) {
            console.log(`[TeacherAPI] Teacher is not authorized to access subjects for student ${studentId}`);
            return [];
          }

          // For other errors, return empty array
          console.log('[TeacherAPI] Returning empty array due to error');
          return [];
        }
      }
    } catch (error) {
      console.error(`[TeacherAPI] Error fetching assigned subjects for student ${studentId}:`, error);
      // Return empty array instead of throwing to prevent component crashes
      return [];
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
