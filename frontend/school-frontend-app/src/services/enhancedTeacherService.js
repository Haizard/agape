/**
 * Enhanced Teacher Service
 *
 * This service provides access to the enhanced teacher API endpoints
 * that use the improved authentication and assignment handling.
 */

import api from './api';

/**
 * Get the current teacher's profile
 * @returns {Promise<Object>} - Teacher profile
 */
const getTeacherProfile = async () => {
  try {
    // First try the enhanced endpoint
    try {
      const response = await api.get('/api/enhanced-teachers/profile');
      return response.data.teacher;
    } catch (enhancedError) {
      console.log('Enhanced endpoint not available, falling back to original endpoint');
      // Fall back to the original endpoint
      const fallbackResponse = await api.get('/api/teachers/profile/me');
      return fallbackResponse.data;
    }
  } catch (error) {
    console.error('Error fetching teacher profile:', error);
    throw error;
  }
};

/**
 * Get classes assigned to the current teacher
 * @returns {Promise<Array>} - Array of classes
 */
const getAssignedClasses = async () => {
  try {
    // First try the enhanced endpoint
    try {
      const response = await api.get('/api/enhanced-teachers/classes');
      return response.data.classes;
    } catch (enhancedError) {
      console.log('Enhanced endpoint not available, falling back to original endpoint');
      // Fall back to the original endpoint
      const fallbackResponse = await api.get('/api/teachers/simple-classes');
      return fallbackResponse.data;
    }
  } catch (error) {
    console.error('Error fetching assigned classes:', error);
    throw error;
  }
};

/**
 * Get subjects assigned to the current teacher in a specific class
 * @param {string} classId - Class ID
 * @param {boolean} autoFix - Whether to automatically fix assignment issues (default: true)
 * @returns {Promise<Array>} - Array of subjects
 */
const getAssignedSubjects = async (classId, autoFix = true) => {
  try {
    // Get the teacher's profile to get their ID
    const profileResponse = await api.get('/api/teachers/profile/me');
    const teacherId = profileResponse.data._id;

    if (!teacherId) {
      console.error('No teacher ID found in profile');
      throw new Error('No teacher ID found in profile');
    }

    console.log(`Getting assigned subjects for teacher ${teacherId} in class ${classId}`);

    // First try the teacher-subject-assignments endpoint
    try {
      console.log(`[EnhancedTeacherService] Calling /api/teacher-subject-assignments with teacherId=${teacherId}, classId=${classId}`);
      const assignmentsResponse = await api.get('/api/teacher-subject-assignments', {
        params: { teacherId, classId }
      });

      const assignments = assignmentsResponse.data || [];
      console.log(`[EnhancedTeacherService] Found ${assignments.length} subject assignments for teacher ${teacherId} in class ${classId}`);

      // Log the first assignment for debugging
      if (assignments.length > 0) {
        console.log('[EnhancedTeacherService] First assignment:', assignments[0]);
      } else {
        console.log('[EnhancedTeacherService] WARNING: No assignments found');
      }

      if (assignments.length > 0) {
        // Extract subject IDs from assignments
        const subjectIds = assignments.map(assignment => {
          if (assignment.subjectId && typeof assignment.subjectId === 'object') {
            return assignment.subjectId._id;
          }
          return assignment.subjectId;
        }).filter(id => id); // Filter out any undefined or null values

        // Get details for these subjects
        const subjectsResponse = await api.get(`/api/classes/${classId}/subjects`);
        const allSubjects = subjectsResponse.data || [];

        // Filter to only include subjects the teacher is assigned to
        const assignedSubjects = allSubjects.filter(subject =>
          subjectIds.includes(subject._id)
        );

        console.log(`Found ${assignedSubjects.length} assigned subjects`);
        return assignedSubjects;
      }
    } catch (assignmentsError) {
      console.log('Teacher-subject-assignments endpoint failed:', assignmentsError.message);
    }

    // Then try the enhanced endpoint
    try {
      const response = await api.get(`/api/enhanced-teachers/classes/${classId}/subjects`);
      console.log(`Found ${response.data.subjects.length} subjects from enhanced endpoint`);
      return response.data.subjects;
    } catch (enhancedError) {
      console.log('Enhanced endpoint not available, falling back to original endpoint');
      // Fall back to the original endpoint
      const fallbackResponse = await api.get('/api/teachers/marks-entry-subjects', {
        params: { classId }
      });
      console.log(`Found ${fallbackResponse.data.length} subjects from fallback endpoint`);
      return fallbackResponse.data;
    }
  } catch (error) {
    console.error('Error fetching assigned subjects:', error);
    throw error;
  }
};

/**
 * Get subjects assigned to the current teacher in a specific O-Level class
 * @param {string} classId - Class ID
 * @returns {Promise<Array>} - Array of subjects
 */
const getOLevelAssignedSubjects = async (classId) => {
  try {
    // For O-Level classes, we use the same function as for A-Level classes
    // The backend now handles both education levels consistently
    console.log(`Getting O-Level assigned subjects for class ${classId}`);
    return await getAssignedSubjects(classId);
  } catch (error) {
    console.error('Error fetching O-Level assigned subjects:', error);
    throw error;
  }
};

/**
 * Get students in a class for a subject the teacher is assigned to
 * @param {string} classId - Class ID
 * @param {string} subjectId - Subject ID
 * @param {string} educationLevel - Education level (optional)
 * @returns {Promise<Array>} - Array of students
 */
const getStudentsForSubject = async (classId, subjectId, educationLevel) => {
  try {
    // First try the enhanced endpoint
    try {
      // If this is an O-Level class, use the O-Level specific endpoint
      if (educationLevel === 'O_LEVEL') {
        console.log('Getting O-Level students using O-Level specific endpoint');
        try {
          const response = await api.get(`/api/enhanced-teachers/o-level/classes/${classId}/subjects/${subjectId}/students`);
          return response.data.students;
        } catch (oLevelError) {
          console.log('O-Level specific endpoint failed, falling back to general endpoint');
          // Fall back to the general endpoint
        }
      }

      const response = await api.get(`/api/enhanced-teachers/classes/${classId}/subjects/${subjectId}/students`);
      return response.data.students;
    } catch (enhancedError) {
      console.log('Enhanced endpoint not available, falling back to original endpoint');
      // Fall back to the original endpoint
      const fallbackResponse = await api.get(`/api/teachers/classes/${classId}/students`);
      return fallbackResponse.data;
    }
  } catch (error) {
    console.error('Error fetching students for subject:', error);

    // Last resort fallback - try to get all students in the class
    try {
      console.log('Trying last resort fallback to get all students in class');
      const lastResortResponse = await api.get(`/api/students/class/${classId}`);
      return lastResortResponse.data;
    } catch (fallbackError) {
      console.error('Last resort fallback also failed:', fallbackError);
      throw error; // Throw the original error
    }
  }
};

/**
 * Enter marks for a subject the teacher is assigned to
 * @param {string} classId - Class ID
 * @param {string} subjectId - Subject ID
 * @param {string} examId - Exam ID
 * @param {Array} marks - Array of mark objects
 * @returns {Promise<Object>} - Result object
 */
const enterMarks = async (classId, subjectId, examId, marks) => {
  try {
    // First try the enhanced endpoint
    try {
      const response = await api.post(`/api/enhanced-teachers/classes/${classId}/subjects/${subjectId}/marks`, {
        examId,
        marks
      });
      return response.data;
    } catch (enhancedError) {
      console.log('Enhanced endpoint not available, falling back to original endpoint');
      // Fall back to the original endpoint
      const fallbackResponse = await api.post('/api/results/enter-marks/batch', {
        classId,
        subjectId,
        examId,
        marks
      });
      return fallbackResponse.data;
    }
  } catch (error) {
    console.error('Error entering marks:', error);
    throw error;
  }
};

/**
 * Diagnose and fix teacher assignments
 * @param {string} teacherId - Teacher ID
 * @param {string} classId - Class ID
 * @returns {Promise<Object>} - Diagnostic result
 */
const diagnoseAndFixAssignments = async (teacherId, classId) => {
  try {
    // Use the fix-teacher API for this
    const response = await api.post('/api/fix-teacher/diagnose-and-fix', {
      teacherId,
      classId
    });
    return response.data;
  } catch (error) {
    console.error('Error diagnosing assignments:', error);
    throw error;
  }
};

export default {
  getTeacherProfile,
  getAssignedClasses,
  getAssignedSubjects,
  getOLevelAssignedSubjects,
  getStudentsForSubject,
  enterMarks,
  diagnoseAndFixAssignments
};
