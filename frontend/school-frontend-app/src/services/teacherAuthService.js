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
      const response = await api.get('/api/teachers/my-subjects', {
        params: { classId }
      });
      return response.data || [];
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
      const response = await api.get(`/api/classes/${classId}/students`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching assigned students:', error);
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
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
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
