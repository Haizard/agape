/**
 * Authentication Utilities
 *
 * This file contains utility functions for authentication and role management.
 */

/**
 * Store the authentication token
 * @param {string} token - The JWT token to store
 * @returns {boolean} True if successful, false otherwise
 */
export const storeAuthToken = (token) => {
  if (!token) return false;

  try {
    localStorage.setItem('token', token);
    return true;
  } catch (error) {
    console.error('Error storing auth token:', error);
    return false;
  }
};

/**
 * Get the authentication token
 * @returns {string|null} The stored token or null if not found
 */
export const getAuthToken = () => {
  try {
    const token = localStorage.getItem('token');

    // Log token status for debugging (without exposing the full token)
    if (token) {
      const tokenPreview = token.length > 20
        ? `${token.substring(0, 10)}...${token.substring(token.length - 5)}`
        : '[INVALID TOKEN FORMAT]';
      console.log(`Token found: ${tokenPreview}`);
    } else {
      console.warn('No authentication token found in localStorage');
    }

    return token;
  } catch (error) {
    console.error('Error retrieving auth token:', error);
    return null;
  }
};

/**
 * Remove the authentication token (for logout)
 * @returns {boolean} True if successful, false otherwise
 */
export const removeAuthToken = () => {
  try {
    localStorage.removeItem('token');
    return true;
  } catch (error) {
    console.error('Error removing auth token:', error);
    return false;
  }
};

/**
 * Store user data
 * @param {Object} userData - The user data to store
 * @returns {boolean} True if successful, false otherwise
 */
export const storeUserData = (userData) => {
  if (!userData) return false;

  try {
    localStorage.setItem('user', JSON.stringify(userData));
    return true;
  } catch (error) {
    console.error('Error storing user data:', error);
    return false;
  }
};

/**
 * Remove user data (for logout)
 * @returns {boolean} True if successful, false otherwise
 */
export const removeUserData = () => {
  try {
    localStorage.removeItem('user');
    return true;
  } catch (error) {
    console.error('Error removing user data:', error);
    return false;
  }
};

/**
 * Full logout (remove both token and user data)
 */
export const logout = () => {
  removeAuthToken();
  removeUserData();
};

/**
 * Get the current user from localStorage
 * @returns {Object|null} The current user or null if not logged in
 */
export const getCurrentUser = () => {
  try {
    const token = getAuthToken();
    if (!token) return null;

    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Get the current user's role
 * @returns {string|null} The current user's role or null if not logged in
 */
export const getCurrentRole = () => {
  const user = getCurrentUser();
  return user?.role || null;
};

/**
 * Get the user's role from multiple sources for reliability
 * @returns {string|null} The user's role or null if not found
 */
export const getUserRole = () => {
  try {
    // First try to get from JWT token (most reliable)
    const tokenInfo = getUserFromToken();
    if (tokenInfo && tokenInfo.role) {
      return tokenInfo.role;
    }

    // Then try to get from current user in localStorage
    const userRole = getCurrentRole();
    if (userRole) {
      return userRole;
    }

    // Finally try to get from userRole in localStorage (legacy)
    const storedRole = localStorage.getItem('userRole');
    if (storedRole) {
      return storedRole;
    }

    return null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

/**
 * Check if the current user has a specific role
 * @param {string|Array} roles - The role or roles to check
 * @returns {boolean} True if the user has the role, false otherwise
 */
export const hasRole = (roles) => {
  const currentRole = getCurrentRole();
  if (!currentRole) return false;

  // Convert roles to array if it's a string
  const roleArray = Array.isArray(roles) ? roles : [roles];

  // Normalize roles for case-insensitive comparison
  const normalizedCurrentRole = currentRole.toLowerCase();
  const normalizedRoles = roleArray.map(role => role.toLowerCase());

  return normalizedRoles.includes(normalizedCurrentRole);
};

/**
 * Check if the current user is an admin
 * @returns {boolean} True if the user is an admin, false otherwise
 */
export const isAdmin = () => {
  return hasRole(['admin']);
};

/**
 * Check if the current user is a teacher
 * @returns {boolean} True if the user is a teacher, false otherwise
 */
export const isTeacher = () => {
  return hasRole(['teacher']);
};

/**
 * Check if the current user is a student
 * @returns {boolean} True if the user is a student, false otherwise
 */
export const isStudent = () => {
  return hasRole(['student']);
};

/**
 * Check if the current user is a parent
 * @returns {boolean} True if the user is a parent, false otherwise
 */
export const isParent = () => {
  return hasRole(['parent']);
};

/**
 * Get the appropriate route for the current user's role
 * @returns {string} The route for the current user's role
 */
export const getRoleRoute = () => {
  if (isAdmin()) return '/admin';
  if (isTeacher()) return '/teacher';
  if (isStudent()) return '/student';
  if (isParent()) return '/parent';
  return '/';
};

/**
 * Check if the token is valid (not expired)
 * @returns {boolean} True if the token is valid, false otherwise
 */
export const isTokenValid = () => {
  try {
    const token = getAuthToken();
    if (!token) return false;

    // JWT tokens are in the format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('Token is not in valid JWT format');
      return false;
    }

    // Decode the payload (middle part)
    const payload = JSON.parse(atob(parts[1]));

    // Check if the token has an expiration time
    if (!payload.exp) {
      console.warn('Token does not have an expiration time');
      return true; // Assume valid if no expiration
    }

    // Check if the token is expired
    const now = Math.floor(Date.now() / 1000);
    const isExpired = payload.exp < now;

    if (isExpired) {
      console.warn(`Token expired at ${new Date(payload.exp * 1000).toLocaleString()}`);
    } else {
      const expiresIn = payload.exp - now;
      console.log(`Token valid for ${Math.floor(expiresIn / 60)} minutes and ${expiresIn % 60} seconds`);
    }

    return !isExpired;
  } catch (error) {
    console.error('Error checking token validity:', error);
    return false;
  }
};

/**
 * Get user information from the token
 * @returns {Object|null} User information or null if token is invalid
 */
export const getUserFromToken = () => {
  try {
    const token = getAuthToken();
    if (!token) return null;

    // JWT tokens are in the format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Decode the payload (middle part)
    const payload = JSON.parse(atob(parts[1]));

    return {
      id: payload.id || payload.sub,
      email: payload.email,
      role: payload.role,
      exp: payload.exp
    };
  } catch (error) {
    console.error('Error extracting user from token:', error);
    return null;
  }
};

export default {
  // Token management
  storeAuthToken,
  getAuthToken,
  removeAuthToken,
  isTokenValid,
  getUserFromToken,

  // User data management
  storeUserData,
  removeUserData,
  logout,

  // User and role utilities
  getCurrentUser,
  getCurrentRole,
  getUserRole,
  hasRole,
  isAdmin,
  isTeacher,
  isStudent,
  isParent,
  getRoleRoute
};
