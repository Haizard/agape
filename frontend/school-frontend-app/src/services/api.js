import axios from 'axios';
import { getAuthToken, storeAuthToken, logout } from '../utils/authUtils';

// Set the API URL based on environment
const getBaseUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    return '';
  }
  return 'https://agape-render.onrender.com';
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
  timeout: 30000
});

// Add request interceptor to add auth token and handle caching
api.interceptors.request.use(
  (config) => {
    // Get token using our utility function
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Ensure URL starts with /api
    if (!config.url.startsWith('/api/')) {
      config.url = `/api${config.url.startsWith('/') ? config.url : `/${config.url}`}`;
    }

    // Remove duplicate /api/ in URL
    config.url = config.url.replace(/\/api\/api\//g, '/api/');

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


