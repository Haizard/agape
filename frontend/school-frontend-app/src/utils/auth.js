/**
 * Authentication utilities
 */

/**
 * Get the authentication token from localStorage
 * @returns {string|null} The authentication token or null if not found
 */
export const getAuthToken = () => {
  return localStorage.getItem('token');
};

/**
 * Set the authentication token in localStorage
 * @param {string} token - The authentication token
 */
export const setAuthToken = (token) => {
  localStorage.setItem('token', token);
};

/**
 * Remove the authentication token from localStorage
 */
export const removeAuthToken = () => {
  localStorage.removeItem('token');
};

/**
 * Check if the user is authenticated
 * @returns {boolean} True if the user is authenticated, false otherwise
 */
export const isAuthenticated = () => {
  return !!getAuthToken();
};

/**
 * Get the user data from localStorage
 * @returns {Object|null} The user data or null if not found
 */
export const getUserData = () => {
  const userData = localStorage.getItem('userData');
  return userData ? JSON.parse(userData) : null;
};

/**
 * Set the user data in localStorage
 * @param {Object} userData - The user data
 */
export const setUserData = (userData) => {
  localStorage.setItem('userData', JSON.stringify(userData));
};

/**
 * Remove the user data from localStorage
 */
export const removeUserData = () => {
  localStorage.removeItem('userData');
};

/**
 * Get the user role from localStorage
 * @returns {string|null} The user role or null if not found
 */
export const getUserRole = () => {
  const userData = getUserData();
  return userData ? userData.role : null;
};

/**
 * Check if the user has a specific role
 * @param {string|Array} roles - The role(s) to check
 * @returns {boolean} True if the user has the role, false otherwise
 */
export const hasRole = (roles) => {
  const userRole = getUserRole();
  if (!userRole) return false;
  
  if (Array.isArray(roles)) {
    return roles.includes(userRole);
  }
  
  return userRole === roles;
};

/**
 * Logout the user by removing the token and user data
 */
export const logout = () => {
  removeAuthToken();
  removeUserData();
};
