/**
 * Unified Teacher Assignment Service
 * 
 * This service provides a centralized way to handle teacher assignments
 * that preserves existing assignments and works correctly for both admin users and teachers.
 */

import api from './api';
import { getUserRole } from '../utils/authUtils';

/**
 * Get the current user's role from the JWT token
 * @returns {string|null} The user's role or null if not found
 */
const getCurrentUserRole = () => {
  try {
    // Try to get the role from the JWT token
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    const payload = JSON.parse(jsonPayload);
    return payload.role;
  } catch (error) {
    console.error('Error getting user role from token:', error);
    return null;
  }
};

/**
 * Get the current teacher's ID
 * @returns {Promise<string|null>} The teacher's ID or null if not found
 */
const getCurrentTeacherId = async () => {
  try {
    const response = await api.get('/api/teachers/profile/me');
    return response.data._id;
  } catch (error) {
    console.error('Error getting current teacher ID:', error);
    return null;
  }
};

/**
 * Assign teachers to subjects in a class
 * @param {string} classId - The ID of the class
 * @param {Object} subjectTeachers - Map of subject IDs to teacher IDs
 * @param {boolean} forceAdminEndpoint - Force using the admin endpoint even for teachers
 * @returns {Promise<Object>} The response from the API
 */
export const assignTeachersToSubjects = async (classId, subjectTeachers, forceAdminEndpoint = false) => {
  try {
    console.log('Unified Teacher Assignment Service - Assigning teachers to subjects');
    console.log('Class ID:', classId);
    console.log('Subject-Teacher assignments:', subjectTeachers);
    
    // Get the current user's role
    const userRole = getCurrentUserRole();
    console.log('Current user role:', userRole);
    
    // Format the subjects array with subject and teacher IDs
    const subjectsArray = Object.entries(subjectTeachers).map(([subjectId, teacherId]) => ({
      subject: subjectId,
      teacher: teacherId || null
    }));
    
    console.log('Initial subjects array:', subjectsArray);
    
    // First, get the current class data to ensure we have all subjects
    console.log(`Fetching current class data for class ${classId}`);
    const classResponse = await api.get(`/api/classes/${classId}`);
    const classData = classResponse.data;
    const currentSubjects = classData.subjects || [];
    
    console.log('Current subjects in class:', currentSubjects.map(s => ({
      subject: s.subject?._id || s.subject,
      teacher: s.teacher?._id || s.teacher
    })));
    
    // Create a map of all existing subject assignments to preserve them
    const allSubjectAssignments = {};
    for (const subjectAssignment of currentSubjects) {
      const subjectId = subjectAssignment.subject?._id || subjectAssignment.subject;
      if (subjectId) {
        // Keep the existing teacher assignment if not being modified
        allSubjectAssignments[subjectId] = {
          subject: subjectId,
          teacher: subjectAssignment.teacher?._id || subjectAssignment.teacher
        };
      }
    }
    
    console.log('Initial subject assignments map:', allSubjectAssignments);
    
    // Update with our new assignments
    for (const assignment of subjectsArray) {
      console.log(`Processing assignment for subject ${assignment.subject}: teacher=${assignment.teacher || 'null'}`);
      if (allSubjectAssignments[assignment.subject]) {
        console.log(`Updating existing assignment for subject ${assignment.subject}:`, {
          from: allSubjectAssignments[assignment.subject].teacher,
          to: assignment.teacher
        });
        allSubjectAssignments[assignment.subject].teacher = assignment.teacher;
      } else {
        console.log(`Creating new assignment for subject ${assignment.subject} with teacher ${assignment.teacher || 'null'}`);
        allSubjectAssignments[assignment.subject] = assignment;
      }
    }
    
    // Convert to array for the API
    const completeSubjectsArray = Object.values(allSubjectAssignments);
    
    console.log('Complete subjects array to save:', completeSubjectsArray);
    
    // Determine which endpoint to use based on user role and forceAdminEndpoint flag
    if (userRole === 'admin' || forceAdminEndpoint) {
      // Admin users use the class subjects endpoint
      console.log('Using admin endpoint to update all subjects');
      const response = await api.put(`/api/classes/${classId}/subjects`, {
        subjects: completeSubjectsArray
      });
      
      console.log('Admin endpoint response:', response.data);
      return response.data;
    } else {
      // Teachers use the self-assignment endpoint
      console.log('Using teacher self-assignment endpoint');
      
      // Get the current teacher's ID
      const teacherId = await getCurrentTeacherId();
      console.log('Current teacher ID:', teacherId);
      
      if (!teacherId) {
        throw new Error('Could not determine current teacher ID');
      }
      
      // Collect only the subjects this teacher is assigning themselves to
      const selfAssignedSubjectIds = [];
      for (const [subjectId, assignedTeacherId] of Object.entries(subjectTeachers)) {
        if (assignedTeacherId === teacherId) {
          selfAssignedSubjectIds.push(subjectId);
        }
      }
      
      console.log('Self-assigned subject IDs:', selfAssignedSubjectIds);
      
      if (selfAssignedSubjectIds.length === 0) {
        throw new Error('No subjects selected for self-assignment');
      }
      
      const response = await api.post('/api/teachers/self-assign-subjects', {
        classId,
        subjectIds: selfAssignedSubjectIds
      });
      
      console.log('Teacher endpoint response:', response.data);
      return response.data;
    }
  } catch (error) {
    console.error('Error in unified teacher assignment service:', error);
    throw error;
  }
};

/**
 * Check if a teacher is an admin user
 * @param {string} teacherId - The ID of the teacher
 * @returns {Promise<boolean>} True if the teacher is an admin user
 */
export const isTeacherAdmin = async (teacherId) => {
  try {
    if (!teacherId) return false;
    
    const response = await api.get(`/api/teachers/${teacherId}`);
    const teacher = response.data;
    
    if (!teacher || !teacher.userId) return false;
    
    // If the teacher has an isAdmin flag, use that
    if (teacher.isAdmin === true) return true;
    
    // Otherwise, check the user's role
    const userResponse = await api.get(`/api/users/${teacher.userId}`);
    const user = userResponse.data;
    
    return user && user.role === 'admin';
  } catch (error) {
    console.error('Error checking if teacher is admin:', error);
    return false;
  }
};

export default {
  assignTeachersToSubjects,
  getCurrentUserRole,
  getCurrentTeacherId,
  isTeacherAdmin
};
