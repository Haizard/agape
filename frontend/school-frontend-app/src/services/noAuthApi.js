import axios from 'axios';

// Set the API URL to the backend server
let baseURL = process.env.REACT_APP_API_URL || 'https://agape-render.onrender.com/';

// Ensure the baseURL ends with a trailing slash
if (!baseURL.endsWith('/')) {
  baseURL = baseURL + '/';
}

// Force the baseURL to be the render.com URL in production
if (process.env.NODE_ENV === 'production') {
  baseURL = 'https://agape-render.onrender.com/';
  console.log('Production environment detected, forcing API URL to:', baseURL);
}

// For local development, use localhost
if (process.env.NODE_ENV === 'development') {
  baseURL = 'http://localhost:5000/api/';
  console.log('Development environment detected, using local API URL:', baseURL);
}

// Log the base URL for debugging
console.log('No Auth API Service: Using base URL:', baseURL);

// Create an axios instance without authentication
const noAuthApi = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  },
  timeout: 30000, // 30 seconds timeout
});

// Add request interceptor for logging
noAuthApi.interceptors.request.use(
  (config) => {
    console.log(`No Auth API Request: ${config.method.toUpperCase()} ${config.url}`, {
      headers: { ...config.headers },
      data: config.data,
      params: config.params
    });
    return config;
  },
  (error) => {
    console.error('No Auth API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
noAuthApi.interceptors.response.use(
  (response) => {
    console.log(`No Auth API Response: ${response.config.method.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    console.error('No Auth API Response Error:', error);
    return Promise.reject(error);
  }
);

export default noAuthApi;
