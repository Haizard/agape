import axios from 'axios';

// Create a base axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: parseInt(process.env.REACT_APP_TIMEOUT || '30000'),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Log the backend URL for debugging
console.log('API configured with base URL:', process.env.REACT_APP_API_URL || '/api');
console.log('Backend URL:', process.env.REACT_APP_BACKEND_URL || 'Not set');

// Add request interceptor
api.interceptors.request.use(
  config => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = Bearer \;
    }
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    // Handle errors
    if (error.response) {
      // Server responded with an error status
      console.error('API Error:', error.response.status, error.response.data);
      
      // Handle authentication errors
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirect to login page if not already there
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('API No Response:', error.request);
    } else {
      // Something else happened
      console.error('API Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
