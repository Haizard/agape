/**
 * This service provides functions to filter subjects based on teacher assignments
 * It works around backend issues where teachers might be assigned to all subjects
 */

import api from './api';
import teacherAuthService from './teacherAuthService';

/**
 * Get only the subjects a teacher should see for a specific class
 * This function uses multiple strategies to determine the correct subjects
 * @param {string} classId - The ID of the class
 * @returns {Promise<Array>} - Array of subject objects the teacher should see
 */
export const getTeacherFilteredSubjects = async (classId) => {
  try {
    if (!classId) {
      console.error('[TeacherSubjectFilter] No classId provided');
      return [];
    }

    // Check if user is admin - admins see all subjects
    if (teacherAuthService.isAdmin()) {
      console.log(`[TeacherSubjectFilter] User is admin, fetching all subjects for class ${classId}`);
      const response = await api.get(`/api/classes/${classId}/subjects`);
      return response.data || [];
    }

    // Get the teacher's profile to get their ID
    const profileResponse = await api.get('/api/teachers/profile/me');
    const teacherId = profileResponse.data._id;

    if (!teacherId) {
      console.error('[TeacherSubjectFilter] No teacher ID found in profile');
      return [];
    }

    console.log(`[TeacherSubjectFilter] Found teacher ID: ${teacherId}`);

    // STRATEGY 1: Use the teacher-subject-assignments endpoint to get accurate assignments
    try {
      console.log(`[TeacherSubjectFilter] Using teacher-subject-assignments endpoint for teacher ${teacherId} in class ${classId}`);
      const assignmentsResponse = await api.get('/api/teacher-subject-assignments', {
        params: { teacherId, classId }
      });

      const assignments = assignmentsResponse.data || [];
      console.log(`[TeacherSubjectFilter] Found ${assignments.length} subject assignments for teacher ${teacherId} in class ${classId}`);

      // Log the response headers and status for debugging
      console.log('[TeacherSubjectFilter] Response status:', assignmentsResponse.status);
      console.log('[TeacherSubjectFilter] Response headers:', assignmentsResponse.headers);

      // Log the first assignment for debugging
      if (assignments.length > 0) {
        console.log('[TeacherSubjectFilter] First assignment:', assignments[0]);
      } else {
        console.log('[TeacherSubjectFilter] WARNING: No assignments found');
      }

      if (assignments.length > 0) {
        // Extract subject IDs from assignments
        const subjectIds = assignments.map(assignment => {
          if (assignment.subjectId && typeof assignment.subjectId === 'object') {
            return assignment.subjectId._id;
          }
          return assignment.subjectId;
        }).filter(id => id); // Filter out any undefined or null values

        console.log(`[TeacherSubjectFilter] Subject IDs from assignments: ${subjectIds.join(', ')}`);

        // Get details for these subjects
        const subjectsResponse = await api.get(`/api/classes/${classId}/subjects`);
        const allSubjects = subjectsResponse.data || [];

        // Filter to only include subjects the teacher is assigned to
        const assignedSubjects = allSubjects.filter(subject =>
          subjectIds.includes(subject._id)
        );

        console.log(`[TeacherSubjectFilter] Found ${assignedSubjects.length} assigned subjects`);
        return assignedSubjects;
      }
    } catch (error) {
      console.error('[TeacherSubjectFilter] Error using teacher-subject-assignments endpoint:', error);
    }

    // STRATEGY 2: Try the enhanced teachers endpoint
    try {
      console.log(`[TeacherSubjectFilter] Trying enhanced-teachers endpoint for class ${classId}`);
      const enhancedResponse = await api.get(`/api/enhanced-teachers/classes/${classId}/subjects`);

      if (enhancedResponse.data && enhancedResponse.data.subjects) {
        const subjects = enhancedResponse.data.subjects;
        console.log(`[TeacherSubjectFilter] Found ${subjects.length} subjects from enhanced-teachers endpoint`);
        return subjects;
      }
    } catch (error) {
      console.error('[TeacherSubjectFilter] Error using enhanced-teachers endpoint:', error);
    }

    // FALLBACK: If all else fails, use the marks-entry-subjects endpoint
    try {
      console.log('[TeacherSubjectFilter] Falling back to marks-entry-subjects endpoint');
      const response = await api.get('/api/teachers/marks-entry-subjects', {
        params: { classId }
      });
      console.log(`[TeacherSubjectFilter] Found ${response.data ? response.data.length : 0} subjects using fallback endpoint`);
      return response.data || [];
    } catch (error) {
      console.error('[TeacherSubjectFilter] Fallback also failed:', error);
      return [];
    }
  } catch (error) {
    console.error('[TeacherSubjectFilter] Error in getTeacherFilteredSubjects:', error);
    return [];
  }
};

export default {
  getTeacherFilteredSubjects
};
