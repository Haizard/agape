/**
 * Authentication helper functions
 */

// Store user data in localStorage
export const storeUserData = (userData) => {
  if (!userData) return false;
  
  try {
    // Store the complete user object
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Store token separately for easier access
    if (userData.token) {
      localStorage.setItem('token', userData.token);
    }
    
    return true;
  } catch (error) {
    console.error('Error storing user data:', error);
    return false;
  }
};

// Get user data from localStorage
export const getUserData = () => {
  try {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error retrieving user data:', error);
    return null;
  }
};

// Get authentication token from localStorage
export const getToken = () => {
  return localStorage.getItem('token');
};

// Clear user data from localStorage
export const clearUserData = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getToken();
};

// Get user role
export const getUserRole = () => {
  const userData = getUserData();
  return userData ? userData.role : null;
};

// Check if user has a specific role
export const hasRole = (role) => {
  const userRole = getUserRole();
  return userRole === role;
};

// Set authorization header for axios
export const setAuthHeader = (axios) => {
  const token = getToken();
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Handle authentication errors
export const handleAuthError = (error) => {
  if (error.response && (error.response.status === 401 || error.response.status === 403)) {
    // Clear user data and redirect to login page
    clearUserData();
    window.location.href = '/login';
  }
  return Promise.reject(error);
};
