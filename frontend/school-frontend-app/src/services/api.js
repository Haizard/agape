import axios from 'axios';
import { getAuthToken, storeAuthToken, logout } from '../utils/authUtils';

// Set the API URL to the backend server
let baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Ensure the baseURL ends with a trailing slash
if (!baseURL.endsWith('/')) {
  baseURL = `${baseURL}/`;
}

// Ensure the baseURL does NOT include /api/ since we add it in the API calls
if (baseURL.includes('/api/')) {
  // Remove /api/ from the URL
  baseURL = baseURL.replace(/\/api\/?$/, '/');
  console.log('Removed /api/ from baseURL:', baseURL);
}

// Force the baseURL to be the render.com URL in production
if (process.env.NODE_ENV === 'production') {
  baseURL = 'https://agape-render.onrender.com/';
  console.log('Production environment detected, forcing API URL to:', baseURL);
}

// Log the base URL for debugging
console.log('API Service: Using base URL:', baseURL);

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  },
  timeout: 30000, // 30 seconds timeout
  // Retry configuration
  retry: 3, // Number of retry attempts
  retryDelay: 1000, // Delay between retries in ms
  // Set withCredentials to false for cross-origin requests without cookies
  withCredentials: false,
  // Proxy configuration (uncomment if needed)
  // proxy: {
  //   host: 'localhost',
  //   port: 5000
  // }
});

// Add request interceptor to add auth token and handle caching
api.interceptors.request.use(
  (config) => {
    // Validate URL to prevent requests with undefined or null IDs
    if (config.url) {
      // Check for undefined or null in URL
      if (config.url.includes('/undefined') || config.url.includes('/null')) {
        console.error('Invalid URL detected:', config.url);
        // Reject the request with a clear error message
        return Promise.reject(new Error(`Invalid URL: ${config.url} - Contains undefined or null ID`));
      }
    }

    // Get token using our utility function
    const token = getAuthToken();
    if (token) {
      // Ensure Authorization header is properly set
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`Added token to request: ${token.substring(0, 10)}...`);

      // Log the full request configuration for debugging
      console.log('Request config:', {
        url: config.url,
        method: config.method,
        headers: { ...config.headers, Authorization: 'Bearer [REDACTED]' },
        data: config.data
      });
    } else {
      console.warn('No token found in storage');
    }

    // Add timestamp to prevent caching
    if (config.method && config.method.toLowerCase() === 'get') {
      config.params = config.params || {};
      config.params._t = new Date().getTime();
    }

    // Add request timestamp for tracking
    config.metadata = { startTime: new Date() };

    // For debugging
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`, {
      headers: { ...config.headers, Authorization: config.headers.Authorization ? 'Bearer [REDACTED]' : undefined },
      data: config.data,
      baseURL: config.baseURL,
      params: config.params
    });

    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token errors and implement retry logic
api.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const config = response.config;
    if (config.metadata) {
      const endTime = new Date();
      const duration = endTime - config.metadata.startTime;
      console.log(`Response: ${config.method.toUpperCase()} ${config.url} - ${response.status} (${duration}ms)`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log detailed error information
    console.error('Response error:', {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.response?.data?.message || error.message,
      data: error.response?.data,
      code: error.code,
      network: navigator.onLine ? 'online' : 'offline'
    });

    // Check if the server is reachable
    if (!navigator.onLine) {
      console.error('Network is offline. Please check your internet connection.');
    }

    // Handle authentication errors
    if (error.response?.status === 403 || error.response?.status === 401) {
      console.log('Authentication error detected');

      // Check if this is a login request or direct student registration
      if (originalRequest.url.includes('/login') || originalRequest.url.includes('/direct-student-register')) {
        console.log('Login or student registration request failed with auth error');
        return Promise.reject(error);
      }

      // For other requests, try to refresh token or logout
      try {
        // Attempt to refresh token (if you have a refresh token endpoint)
        // const refreshResponse = await axios.post('/api/refresh-token');
        // if (refreshResponse.data.token) {
        //   const newToken = refreshResponse.data.token;
        //   storeAuthToken(newToken);
        //   originalRequest.headers.Authorization = `Bearer ${newToken}`;
        //   return axios(originalRequest);
        // }

        // If no refresh token or refresh failed, logout
        console.log('Authentication failed, logging out');
        logout();

        // Redirect to login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } catch (refreshError) {
        console.error('Error during token refresh:', refreshError);
        logout();
        window.location.href = '/login';
      }
    }

    // Implement retry logic for network errors and 5xx errors
    const retryCount = originalRequest?.retryCount || 0;
    if (
      originalRequest && // Make sure originalRequest exists
      (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || !error.response || error.response.status >= 500) &&
      retryCount < (originalRequest.retry || api.defaults.retry || 3)
    ) {
      originalRequest.retryCount = retryCount + 1;
      const delay = originalRequest.retryDelay || api.defaults.retryDelay || 1000;

      // Use exponential backoff for retries
      const backoffDelay = delay * Math.pow(2, retryCount - 1);
      console.log(`Retrying request (${originalRequest.retryCount}/${originalRequest.retry || api.defaults.retry || 3}) after ${backoffDelay}ms...`);

      // Try the direct endpoint if available
      if (originalRequest.url.startsWith('/api/classes') && !originalRequest.url.includes('-direct')) {
        console.log('Trying direct classes endpoint...');
        originalRequest.url = originalRequest.url.replace('/api/classes', '/api/classes-direct');
      } else if (originalRequest.url.startsWith('/api/exams') && !originalRequest.url.includes('-direct')) {
        console.log('Trying direct exams endpoint...');
        originalRequest.url = originalRequest.url.replace('/api/exams', '/api/exams-direct');
      }

      return new Promise(resolve => {
        setTimeout(() => resolve(axios(originalRequest)), backoffDelay);
      });
    }

    // Special handling for network errors
    if (error.code === 'ERR_NETWORK') {
      console.error('Network error detected. The server might be down or unreachable.');
      // You could dispatch a global notification here
    }

    return Promise.reject(error);
  }
);

export default api;


