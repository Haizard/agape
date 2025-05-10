import axios from 'axios';
import { getAuthToken, storeAuthToken, logout } from '../utils/authUtils';

// Set the API URL based on environment
const getBaseUrl = () => {
  // Consolidated environment configuration
  return process.env.REACT_APP_API_BASE_URL ||
    (process.env.NODE_ENV === 'development'
      ? 'http://localhost:5000'
      : 'https://agape-render.onrender.com');
};

const baseURL = getBaseUrl();
console.log('API Service: Using base URL:', baseURL || 'proxy in development');

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  },
  timeout: 60000 // Increased timeout for file uploads
});

// Add request interceptor to add auth token and handle caching
api.interceptors.request.use(
  (config) => {
    // Get token using our utility function
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Ensure URL starts with /api and prevent duplication
    // First, remove any duplicate /api segments
    let cleanedPath = config.url;
    while (cleanedPath.includes('/api/api')) {
      cleanedPath = cleanedPath.replace('/api/api', '/api');
    }

    // Then ensure it starts with /api if needed
    config.url = cleanedPath.startsWith('/api')
      ? cleanedPath
      : `/api${cleanedPath}`;

    // Don't set Content-Type for FormData (file uploads)
    // Let the browser set it automatically with the correct boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
      console.log('FormData detected, Content-Type header removed to allow correct multipart boundary');
    }

    // Add timestamp to prevent caching
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: new Date().getTime()
      };
    }

    // Log request details
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`, {
      params: config.params,
      data: config.data
    });

    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) {
      console.error('Network error:', error);
      return Promise.reject({
        message: 'Network error. Please check your connection.'
      });
    }

    // Handle authentication errors
    if (error.response.status === 401) {
      if (!error.config.url.includes('/login')) {
        logout();
        window.location.href = '/login';
      }
    }

    // Log error details
    console.error('API Error:', {
      url: error.config.url,
      method: error.config.method,
      status: error.response.status,
      data: error.response.data
    });

    return Promise.reject(error.response.data);
  }
);

export default api;


