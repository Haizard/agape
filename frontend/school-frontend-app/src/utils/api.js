import axios from 'axios';
import { API_URL } from '../config/index';

// Log the API URL for debugging
console.log('API URL in api.js:', API_URL);

// Create an axios instance with the API URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Log the baseURL for debugging
console.log('Axios instance created with baseURL:', api.defaults.baseURL);

// Add a request interceptor to add the token to all requests
api.interceptors.request.use(
  (config) => {
    console.log('Making API request:', {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      headers: config.headers
    });

    // Get the token from localStorage
    const token = localStorage.getItem('token');
    console.log('Token from localStorage:', token ? 'Present' : 'Not found');

    // If token exists, add it to the headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      console.error('Unauthorized request. Token may be invalid or expired.');
      // You could redirect to login page or refresh token here
    }

    // Log detailed error information for debugging
    if (error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        url: error.config.url,
        method: error.config.method,
        data: error.response.data
      });
    } else if (error.request) {
      console.error('API Error Request:', {
        url: error.config.url,
        method: error.config.method,
        noResponse: true
      });
    } else {
      console.error('API Error:', error.message);
    }

    return Promise.reject(error);
  }
);

// Utility function to ensure API URLs are correctly formatted
export const constructApiUrl = (endpoint) => {
  // If the endpoint already starts with http:// or https://, return it as is
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }

  // Ensure the endpoint starts with a slash
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // If the endpoint already includes /api/, don't add it again
  if (formattedEndpoint.includes('/api/')) {
    // Remove duplicate /api/ prefixes
    return formattedEndpoint.replace(/\/api\/api\//, '/api/');
  }

  // Add /api/ prefix if it's missing
  return `/api${formattedEndpoint}`;
};

export default api;
