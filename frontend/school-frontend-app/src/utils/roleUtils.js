/**
 * Utility functions for handling user roles
 */

/**
 * Check if the user has a specific role
 * @param {Object} user - The user object
 * @param {string|Array} roles - The role or roles to check
 * @returns {boolean} - True if the user has the role, false otherwise
 */
export const hasRole = (user, roles) => {
  if (!user || !user.role) {
    console.warn('No user or user role provided to hasRole function');
    return false;
  }

  // Convert roles to array if it's a string
  const roleArray = Array.isArray(roles) ? roles : [roles];
  
  // Normalize roles for case-insensitive comparison
  const userRole = user.role.toLowerCase();
  const normalizedRoles = roleArray.map(role => role.toLowerCase());
  
  return normalizedRoles.includes(userRole);
};

/**
 * Get the user's role from localStorage
 * @returns {string|null} - The user's role or null if not found
 */
export const getUserRole = () => {
  try {
    const userData = localStorage.getItem('user');
    if (!userData) return null;
    
    const user = JSON.parse(userData);
    return user.role || null;
  } catch (error) {
    console.error('Error getting user role from localStorage:', error);
    return null;
  }
};

/**
 * Check if the current user has admin role
 * @returns {boolean} - True if the user is an admin, false otherwise
 */
export const isAdmin = () => {
  const role = getUserRole();
  return role && role.toLowerCase() === 'admin';
};

/**
 * Check if the current user has teacher role
 * @returns {boolean} - True if the user is a teacher, false otherwise
 */
export const isTeacher = () => {
  const role = getUserRole();
  return role && role.toLowerCase() === 'teacher';
};

/**
 * Check if the current user has student role
 * @returns {boolean} - True if the user is a student, false otherwise
 */
export const isStudent = () => {
  const role = getUserRole();
  return role && role.toLowerCase() === 'student';
};

export default {
  hasRole,
  getUserRole,
  isAdmin,
  isTeacher,
  isStudent
};
