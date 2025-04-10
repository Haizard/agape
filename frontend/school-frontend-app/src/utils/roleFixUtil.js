/**
 * Utility functions to fix user role issues
 */

/**
 * Check and fix the user role in localStorage
 * This function ensures that the user role is correctly stored and retrieved
 * @returns {Object|null} The fixed user object or null if no user is found
 */
export const checkAndFixUserRole = () => {
  try {
    // Get user from localStorage
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    const user = JSON.parse(userStr);
    if (!user) return null;
    
    // Check if the user has a role
    if (!user.role) {
      console.error('User has no role:', user);
      return null;
    }
    
    // Normalize the role to lowercase
    const normalizedRole = user.role.toLowerCase();
    
    // Check if the role is valid
    const validRoles = ['admin', 'teacher', 'student', 'parent'];
    if (!validRoles.includes(normalizedRole)) {
      console.error(`Invalid role: ${user.role}`);
      return null;
    }
    
    // If the role is already normalized, return the user
    if (user.role === normalizedRole) {
      return user;
    }
    
    // Fix the role and update localStorage
    console.log(`Fixing user role: ${user.role} -> ${normalizedRole}`);
    user.role = normalizedRole;
    localStorage.setItem('user', JSON.stringify(user));
    
    return user;
  } catch (error) {
    console.error('Error checking and fixing user role:', error);
    return null;
  }
};

/**
 * Force set the user role to admin
 * This function is a temporary fix for the issue where the user is logged in as admin but the system recognizes them as teacher
 * @returns {Object|null} The updated user object or null if no user is found
 */
export const forceSetAdminRole = () => {
  try {
    // Get user from localStorage
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    const user = JSON.parse(userStr);
    if (!user) return null;
    
    // Force set the role to admin
    console.log(`Forcing user role to admin. Previous role: ${user.role}`);
    user.role = 'admin';
    localStorage.setItem('user', JSON.stringify(user));
    
    return user;
  } catch (error) {
    console.error('Error forcing admin role:', error);
    return null;
  }
};

export default {
  checkAndFixUserRole,
  forceSetAdminRole
};
