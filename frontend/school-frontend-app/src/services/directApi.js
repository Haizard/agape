/**
 * Direct API Service
 * 
 * This service provides direct access to the API without going through the fix-api-url.js script.
 * It's useful for debugging authentication issues.
 */
import axios from 'axios';
import { getAuthToken, isTokenValid } from '../utils/authUtils';
import { refreshToken } from '../utils/loginUtils';

// Determine the base URL
const isLocalDevelopment = process.env.NODE_ENV === 'development';
const baseURL = isLocalDevelopment 
  ? 'http://localhost:5000' 
  : 'https://agape-render.onrender.com';

console.log(`Direct API Service: Using base URL: ${baseURL}`);

// Create an axios instance
const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the token to all requests
api.interceptors.request.use(
  async (config) => {
    // Get the token
    let token = getAuthToken();
    
    // Check if the token is valid
    const tokenValid = isTokenValid();
    
    // If the token is not valid, try to refresh it
    if (token && !tokenValid) {
      try {
        console.log('Token is invalid or expired, attempting to refresh...');
        await refreshToken();
        token = getAuthToken(); // Get the new token
      } catch (error) {
        console.error('Failed to refresh token:', error);
      }
    }
    
    // Add the token to the headers if it exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      
      // Log the token format (without exposing the full token)
      const tokenPreview = token.length > 20 
        ? `${token.substring(0, 10)}...${token.substring(token.length - 5)}` 
        : '[INVALID TOKEN FORMAT]';
      console.log(`Direct API: Using token: ${tokenPreview}`);
    } else {
      console.warn('Direct API: No token available');
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses
    console.log(`Direct API: ${response.config.method.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  async (error) => {
    // Log error responses
    console.error(`Direct API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status}`);
    
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      console.error('Unauthorized request. Token may be invalid or expired.');
      
      // Try to refresh the token
      try {
        await refreshToken();
        
        // Retry the request with the new token
        const token = getAuthToken();
        if (token) {
          error.config.headers.Authorization = `Bearer ${token}`;
          return api(error.config);
        }
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
      }
    }
    
    // Handle 403 Forbidden errors
    if (error.response && error.response.status === 403) {
      console.error('Forbidden request. You may not have permission to access this resource.');
      console.error('Response data:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

/**
 * Get academic years
 * @returns {Promise<Array>} The academic years
 */
export const getAcademicYears = async () => {
  try {
    // Try the new endpoint first
    try {
      console.log('Fetching academic years from new endpoint...');
      const response = await api.get('/api/new-academic-years');

      console.log('New endpoint response:', response);
      console.log('New endpoint data:', response.data);
      return response.data;
    } catch (newApiErr) {
      console.log('Falling back to original API endpoint');
      const response = await api.get('/api/academic-years');
      console.log('Original endpoint response:', response);
      console.log('Original endpoint data:', response.data);
      return response.data;
    }
  } catch (error) {
    console.error('Error fetching academic years:', error);
    console.error('Error details:', error.response?.data);
    throw error;
  }
};

/**
 * Create an academic year
 * @param {Object} data - The academic year data
 * @returns {Promise<Object>} The created academic year
 */
export const createAcademicYear = async (data) => {
  try {
    // Try the new endpoint first
    try {
      console.log('Creating academic year with new endpoint...');
      const response = await api.post('/api/new-academic-years', data);
      return response.data;
    } catch (newApiErr) {
      console.log('Falling back to original API endpoint');
      const response = await api.post('/api/academic-years', data);
      return response.data;
    }
  } catch (error) {
    console.error('Error creating academic year:', error);
    throw error;
  }
};

/**
 * Update an academic year
 * @param {string} id - The academic year ID
 * @param {Object} data - The academic year data
 * @returns {Promise<Object>} The updated academic year
 */
export const updateAcademicYear = async (id, data) => {
  try {
    // Try the new endpoint first
    try {
      console.log(`Updating academic year ${id} with new endpoint...`);
      const response = await api.put(`/api/new-academic-years/${id}`, data);
      return response.data;
    } catch (newApiErr) {
      console.log('Falling back to original API endpoint');
      const response = await api.put(`/api/academic-years/${id}`, data);
      return response.data;
    }
  } catch (error) {
    console.error('Error updating academic year:', error);
    throw error;
  }
};

/**
 * Delete an academic year
 * @param {string} id - The academic year ID
 * @returns {Promise<Object>} The deleted academic year
 */
export const deleteAcademicYear = async (id) => {
  try {
    // Try the new endpoint first
    try {
      console.log(`Deleting academic year ${id} with new endpoint...`);
      const response = await api.delete(`/api/new-academic-years/${id}`);
      return response.data;
    } catch (newApiErr) {
      console.log('Falling back to original API endpoint');
      const response = await api.delete(`/api/academic-years/${id}`);
      return response.data;
    }
  } catch (error) {
    console.error('Error deleting academic year:', error);
    throw error;
  }
};

/**
 * Set an academic year as active
 * @param {string} id - The academic year ID
 * @param {Object} data - The academic year data
 * @returns {Promise<Object>} The updated academic year
 */
export const setActiveAcademicYear = async (id, data) => {
  try {
    // Try the new endpoint first
    try {
      console.log(`Setting academic year ${id} as active with new endpoint...`);
      const response = await api.put(`/api/new-academic-years/${id}`, {
        ...data,
        isActive: true
      });
      return response.data;
    } catch (newApiErr) {
      console.log('Falling back to original API endpoint');
      const response = await api.put(`/api/academic-years/${id}`, {
        ...data,
        isActive: true
      });
      return response.data;
    }
  } catch (error) {
    console.error('Error setting active academic year:', error);
    throw error;
  }
};

export default {
  getAcademicYears,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  setActiveAcademicYear
};
