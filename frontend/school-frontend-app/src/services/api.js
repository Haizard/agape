import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
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
    const token = localStorage.getItem('token');
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
      console.warn('No token found in localStorage');
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
      // You could redirect to login or clear token here
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


