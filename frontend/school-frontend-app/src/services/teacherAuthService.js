import api from '../utils/api';

/**
 * Service for handling teacher authorization and access control
 */
const teacherAuthService = {
  /**
   * Get classes assigned to the current teacher
   * @returns {Promise<Array>} - Array of classes assigned to the teacher
   */
  async getAssignedClasses() {
    try {
      const response = await api.get('/api/teachers/simple-classes');
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

      // Check if user is admin
      if (this.isAdmin()) {
        console.log(`[TeacherAuthService] User is admin, fetching all subjects for class ${classId}`);
        const response = await api.get(`/api/classes/${classId}/subjects`);
        console.log(`[TeacherAuthService] Admin found ${response.data ? response.data.length : 0} subjects for class ${classId}`);
        return response.data || [];
      }

      // For teachers, strictly use the teacher-specific endpoint
      console.log(`[TeacherAuthService] Fetching subjects for class ${classId} using strict endpoint`);
      try {
        const response = await api.get('/api/teachers/marks-entry-subjects', {
          params: { classId }
        });
        console.log(`[TeacherAuthService] Found ${response.data ? response.data.length : 0} subjects for class ${classId}`);
        return response.data || [];
      } catch (error) {
        console.error('[TeacherAuthService] Error fetching assigned subjects:', error);
        // For all errors, return an empty array to enforce strict access control
        console.log('[TeacherAuthService] Returning empty array due to error');
        return [];
      }
    } catch (error) {
      console.error('[TeacherAuthService] Error in getAssignedSubjects:', error);
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
        return [];
      }
      console.log(`[TeacherAuthService] Fetching students for class ${classId} using teacher-specific endpoint`);
      const response = await api.get(`/api/teachers/classes/${classId}/students`);
      console.log(`[TeacherAuthService] Found ${response.data ? response.data.length : 0} students for class ${classId}`);
      return response.data || [];
    } catch (error) {
      console.error('[TeacherAuthService] Error fetching assigned students:', error);
      // If there's a 403 error, return an empty array instead of throwing
      if (error.response && error.response.status === 403) {
        console.log('[TeacherAuthService] Teacher is not authorized for this class, returning empty array');
        return [];
      }
      throw error;
    }
  },

  /**
   * Check if the current teacher is authorized to access a specific class
   * @param {string} classId - Class ID
   * @returns {Promise<boolean>} - True if authorized, false otherwise
   */
  async isAuthorizedForClass(classId) {
    try {
      if (!classId) {
        return false;
      }
      const assignedClasses = await this.getAssignedClasses();
      return assignedClasses.some(cls => cls._id === classId);
    } catch (error) {
      console.error('Error checking class authorization:', error);
      return false;
    }
  },

  /**
   * Check if the current teacher is authorized to access a specific subject in a class
   * @param {string} classId - Class ID
   * @param {string} subjectId - Subject ID
   * @returns {Promise<boolean>} - True if authorized, false otherwise
   */
  async isAuthorizedForSubject(classId, subjectId) {
    try {
      if (!classId || !subjectId) {
        return false;
      }

      // Check if this is an A-Level class
      try {
        const response = await api.get(`/api/classes/${classId}`);
        const classData = response.data;

        // Check if this is an A-Level class
        const isALevelClass = classData && (
          classData.form === 5 ||
          classData.form === 6 ||
          classData.educationLevel === 'A_LEVEL' ||
          (classData.name && (
            classData.name.toUpperCase().includes('FORM 5') ||
            classData.name.toUpperCase().includes('FORM 6') ||
            classData.name.toUpperCase().includes('FORM V') ||
            classData.name.toUpperCase().includes('FORM VI') ||
            classData.name.toUpperCase().includes('A-LEVEL') ||
            classData.name.toUpperCase().includes('A LEVEL')
          ))
        );

        // If this is an A-Level class, bypass the authorization check
        if (isALevelClass) {
          console.log(`[TeacherAuthService] Bypassing authorization check for A-Level class ${classId}`);
          return true;
        }
      } catch (error) {
        console.error('[TeacherAuthService] Error checking if class is A-Level:', error);
        // Continue with normal authorization check
      }

      // Normal authorization check
      const assignedSubjects = await this.getAssignedSubjects(classId);
      return assignedSubjects.some(subject => subject._id === subjectId);
    } catch (error) {
      console.error('Error checking subject authorization:', error);
      return false;
    }
  },

  /**
   * Check if the current teacher is authorized to access a specific student
   * @param {string} classId - Class ID
   * @param {string} studentId - Student ID
   * @returns {Promise<boolean>} - True if authorized, false otherwise
   */
  async isAuthorizedForStudent(classId, studentId) {
    try {
      if (!classId || !studentId) {
        return false;
      }

      // Check if this is an A-Level class
      try {
        const response = await api.get(`/api/classes/${classId}`);
        const classData = response.data;

        // Check if this is an A-Level class
        const isALevelClass = classData && (
          classData.form === 5 ||
          classData.form === 6 ||
          classData.educationLevel === 'A_LEVEL' ||
          (classData.name && (
            classData.name.toUpperCase().includes('FORM 5') ||
            classData.name.toUpperCase().includes('FORM 6') ||
            classData.name.toUpperCase().includes('FORM V') ||
            classData.name.toUpperCase().includes('FORM VI') ||
            classData.name.toUpperCase().includes('A-LEVEL') ||
            classData.name.toUpperCase().includes('A LEVEL')
          ))
        );

        // If this is an A-Level class, bypass the authorization check
        if (isALevelClass) {
          console.log(`[TeacherAuthService] Bypassing student authorization check for A-Level class ${classId}`);
          return true;
        }
      } catch (error) {
        console.error('[TeacherAuthService] Error checking if class is A-Level:', error);
        // Continue with normal authorization check
      }

      // Normal authorization check
      const assignedStudents = await this.getAssignedStudents(classId);
      return assignedStudents.some(student => student._id === studentId);
    } catch (error) {
      console.error('Error checking student authorization:', error);
      return false;
    }
  },

  /**
   * Get the current user's role
   * @returns {string|null} - User role or null if not available
   */
  getUserRole() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;

      // Decode JWT token to get user role
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`;
      }).join(''));

      const payload = JSON.parse(jsonPayload);
      return payload.role;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  },

  /**
   * Check if the current user is an admin
   * @returns {boolean} - True if admin, false otherwise
   */
  isAdmin() {
    const role = this.getUserRole();
    return role === 'admin';
  },

  /**
   * Check if the current user is a teacher
   * @returns {boolean} - True if teacher, false otherwise
   */
  isTeacher() {
    const role = this.getUserRole();
    return role === 'teacher';
  }
};

export default teacherAuthService;
