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
        console.error('[TeacherAuthService] No classId provided to getAssignedSubjects');
        return [];
      }

      // Check if user is admin
      if (this.isAdmin()) {
        console.log(`[TeacherAuthService] User is admin, fetching all subjects for class ${classId}`);
        const response = await api.get(`/api/classes/${classId}/subjects`);
        console.log(`[TeacherAuthService] Admin found ${response.data ? response.data.length : 0} subjects for class ${classId}`);
        return response.data || [];
      }

      // For teachers, use a reliable method to get only assigned subjects
      console.log(`[TeacherAuthService] Teacher user, fetching strictly assigned subjects for class ${classId}`);

      // Get the teacher's profile to get their ID
      const profileResponse = await api.get('/api/teachers/profile/me');
      const teacherId = profileResponse.data._id;
      
      // Log successful profile fetch
      console.log('[TeacherAuthService] Successfully fetched teacher profile:', profileResponse.data);

      if (!teacherId) {
        console.error('[TeacherAuthService] No teacher ID found in profile');
        return [];
      }

      console.log(`[TeacherAuthService] Found teacher ID: ${teacherId}`);

      // Get teacher-subject assignments directly from the assignments collection
      // This is the most reliable way to get only subjects the teacher is assigned to
      try {
        console.log(`[TeacherAuthService] Calling /api/teacher-subject-assignments with teacherId=${teacherId}, classId=${classId}`);
        const assignmentsResponse = await api.get('/api/teacher-subject-assignments', {
          params: { teacherId, classId }
        });

        const assignments = assignmentsResponse.data || [];
        console.log(`[TeacherAuthService] Found ${assignments.length} subject assignments for teacher ${teacherId} in class ${classId}`);

        // Log the first assignment for debugging
        if (assignments.length > 0) {
          console.log('[TeacherAuthService] First assignment:', assignments[0]);
        }

        if (assignments.length === 0) {
          console.log('[TeacherAuthService] No subject assignments found, returning empty array');
          return [];
        }

        // Extract subject IDs from assignments
        const subjectIds = [];

        // Log the raw assignments for debugging
        console.log('[TeacherAuthService] Raw assignments:', JSON.stringify(assignments, null, 2));

        assignments.forEach(assignment => {
          let subjectId = null;

          // Handle different formats of subjectId
          if (assignment.subjectId) {
            if (typeof assignment.subjectId === 'object') {
              if (assignment.subjectId._id) {
                subjectId = assignment.subjectId._id.toString();
                console.log(`[TeacherAuthService] Extracted subject ID from object._id: ${subjectId}`);
              } else {
                // Try to stringify the object to see what's in it
                console.log(`[TeacherAuthService] Subject ID is an object without _id:`, JSON.stringify(assignment.subjectId));
                // Try to extract ID if it's a MongoDB ObjectId stringified
                if (assignment.subjectId.toString().includes('"_id"')) {
                  try {
                    const parsed = JSON.parse(assignment.subjectId.toString());
                    if (parsed._id) {
                      subjectId = parsed._id.toString();
                      console.log(`[TeacherAuthService] Extracted subject ID from parsed object: ${subjectId}`);
                    }
                  } catch (e) {
                    console.log('[TeacherAuthService] Failed to parse subject ID object:', e);
                  }
                }
              }
            } else if (typeof assignment.subjectId === 'string') {
              subjectId = assignment.subjectId;
              console.log(`[TeacherAuthService] Subject ID is already a string: ${subjectId}`);
            } else {
              // For any other type, try toString()
              try {
                subjectId = assignment.subjectId.toString();
                console.log(`[TeacherAuthService] Converted subject ID to string: ${subjectId}`);
              } catch (e) {
                console.log('[TeacherAuthService] Failed to convert subject ID to string:', e);
              }
            }
          }

          if (subjectId) {
            subjectIds.push(subjectId);
          }
        });

        // Log each ID separately for better debugging
        console.log(`[TeacherAuthService] Found ${subjectIds.length} subject IDs from assignments`);
        subjectIds.forEach((id, index) => {
          console.log(`[TeacherAuthService] Subject ID ${index + 1}: ${id}`);
        });

        // Get details for these subjects
        const subjectsResponse = await api.get(`/api/classes/${classId}/subjects`);
        const allSubjects = subjectsResponse.data || [];

        // Filter to only include subjects the teacher is assigned to
        const assignedSubjects = allSubjects.filter(subject => {
          // Ensure we have a valid subject with an ID
          if (!subject || !subject._id) {
            console.log(`[TeacherAuthService] Invalid subject without ID:`, subject);
            return false;
          }

          // Convert subject ID to string for comparison
          const currentSubjectIdStr = subject._id.toString();

          // Check if this subject ID is in our list of assigned subject IDs
          const isAssigned = subjectIds.some(id => {
            const match = id === currentSubjectIdStr;
            if (match) {
              console.log(`[TeacherAuthService] Found match: ${id} === ${currentSubjectIdStr}`);
            }
            return match;
          });

          console.log(`[TeacherAuthService] Subject ${subject.name} (${currentSubjectIdStr}) assigned: ${isAssigned}`);
          return isAssigned;
        });

        console.log(`[TeacherAuthService] Final filtered assigned subjects: ${assignedSubjects.length}`);
        return assignedSubjects;
      } catch (error) {
        console.error('[TeacherAuthService] Error fetching teacher-subject assignments:', error);

        // As a fallback, try the marks-entry-subjects endpoint which should be filtered
        try {
          console.log('[TeacherAuthService] Trying fallback to marks-entry-subjects endpoint');
          const response = await api.get('/api/teachers/marks-entry-subjects', {
            params: { classId }
          });
          console.log(`[TeacherAuthService] Found ${response.data ? response.data.length : 0} subjects using fallback endpoint`);
          return response.data || [];
        } catch (fallbackError) {
          console.error('[TeacherAuthService] Fallback also failed:', fallbackError);
          return [];
        }
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

      // Check if this is an O-Level class
      try {
        const response = await api.get(`/api/classes/${classId}`);
        const classData = response.data;

        // Check if this is an O-Level class
        const isOLevelClass = classData && (
          classData.educationLevel === 'O_LEVEL' ||
          (classData.name && (
            classData.name.toUpperCase().includes('O-LEVEL') ||
            classData.name.toUpperCase().includes('O LEVEL')
          ))
        );

        // For O-Level classes, use strict authorization
        if (isOLevelClass) {
          console.log(`[TeacherAuthService] Using strict authorization for O-Level class ${classId}`);
          // Check if the teacher has any assigned subjects in this class
          const assignedSubjects = await this.getAssignedSubjects(classId);
          if (assignedSubjects.length > 0) {
            console.log(`[TeacherAuthService] Teacher has ${assignedSubjects.length} assigned subjects in O-Level class ${classId}`);
            return true;
          } else {
            console.log(`[TeacherAuthService] Teacher has no assigned subjects in O-Level class ${classId}`);
            return false;
          }
        }
      } catch (error) {
        console.error('[TeacherAuthService] Error checking if class is O-Level:', error);
        // Continue with normal authorization check
      }

      // Normal authorization check
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
        console.error('[TeacherAuthService] Missing classId or subjectId in isAuthorizedForSubject');
        return false;
      }

      // Check if user is admin
      if (this.isAdmin()) {
        console.log(`[TeacherAuthService] User is admin, authorized for subject ${subjectId} in class ${classId}`);
        return true;
      }

      console.log(`[TeacherAuthService] Checking authorization for subject ${subjectId} in class ${classId}`);

      // The most reliable way to check authorization is to get the teacher's assigned subjects
      // and check if the requested subject is in that list
      const assignedSubjects = await this.getAssignedSubjects(classId);

      // Log the assigned subjects for debugging
      console.log(`[TeacherAuthService] Teacher has ${assignedSubjects.length} assigned subjects in class ${classId}:`,
        assignedSubjects.map(s => ({ id: s._id, name: s.name })));

      // Check if the subject is in the assigned subjects list
      const isAuthorized = assignedSubjects.some(subject => {
        // Ensure we have a valid subject with an ID
        if (!subject || !subject._id) {
          console.log(`[TeacherAuthService] Invalid subject without ID in authorization check:`, subject);
          return false;
        }

        // Convert both to string for comparison
        const assignedSubjectId = subject._id.toString();
        const requestedSubjectId = subjectId.toString();

        const match = assignedSubjectId === requestedSubjectId;
        if (match) {
          console.log(`[TeacherAuthService] Found subject match for authorization: ${assignedSubjectId} === ${requestedSubjectId}`);
        }

        return match;
      });

      if (isAuthorized) {
        console.log(`[TeacherAuthService] Teacher is authorized for subject ${subjectId} in class ${classId}`);
      } else {
        console.log(`[TeacherAuthService] Teacher is NOT authorized for subject ${subjectId} in class ${classId}`);
      }

      return isAuthorized;
    } catch (error) {
      console.error('[TeacherAuthService] Error checking subject authorization:', error);
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

      // Check if this is an O-Level or A-Level class
      try {
        const response = await api.get(`/api/classes/${classId}`);
        const classData = response.data;

        // Check if this is an O-Level class
        const isOLevelClass = classData && (
          classData.educationLevel === 'O_LEVEL' ||
          (classData.name && (
            classData.name.toUpperCase().includes('O-LEVEL') ||
            classData.name.toUpperCase().includes('O LEVEL')
          ))
        );

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

        // For O-Level classes, use strict authorization
        if (isOLevelClass) {
          console.log(`[TeacherAuthService] Using strict student authorization for O-Level class ${classId}`);
          // Check if the teacher has any assigned subjects in this class
          const assignedSubjects = await this.getAssignedSubjects(classId);
          if (assignedSubjects.length > 0) {
            // Check if the student is in the class
            const assignedStudents = await this.getAssignedStudents(classId);
            const isStudentInClass = assignedStudents.some(student => student._id.toString() === studentId.toString());
            if (isStudentInClass) {
              console.log(`[TeacherAuthService] Teacher is authorized for student ${studentId} in O-Level class ${classId}`);
              return true;
            } else {
              console.log(`[TeacherAuthService] Student ${studentId} not found in O-Level class ${classId}`);
              return false;
            }
          } else {
            console.log(`[TeacherAuthService] Teacher has no assigned subjects in O-Level class ${classId}`);
            return false;
          }
        }
        // For A-Level classes, use the same strict authorization
        if (isALevelClass) {
          console.log(`[TeacherAuthService] Using strict student authorization for A-Level class ${classId}`);
          // Check if the teacher has any assigned subjects in this class
          const assignedSubjects = await this.getAssignedSubjects(classId);
          if (assignedSubjects.length > 0) {
            // Check if the student is in the class
            const assignedStudents = await this.getAssignedStudents(classId);
            const isStudentInClass = assignedStudents.some(student => student._id.toString() === studentId.toString());
            if (isStudentInClass) {
              console.log(`[TeacherAuthService] Teacher is authorized for student ${studentId} in A-Level class ${classId}`);
              return true;
            } else {
              console.log(`[TeacherAuthService] Student ${studentId} not found in A-Level class ${classId}`);
              return false;
            }
          } else {
            console.log(`[TeacherAuthService] Teacher has no assigned subjects in A-Level class ${classId}`);
            return false;
          }
        }
      } catch (error) {
        console.error('[TeacherAuthService] Error checking class education level:', error);
        // Continue with normal authorization check
      }

      // Normal authorization check
      const assignedStudents = await this.getAssignedStudents(classId);
      return assignedStudents.some(student => student._id.toString() === studentId.toString());
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
