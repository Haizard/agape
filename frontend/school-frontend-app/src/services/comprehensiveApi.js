import axios from 'axios';

// Check if we should use fallback mode
const useFallback = process.env.REACT_APP_FALLBACK_TO_STATIC === 'true';

// Get the API URL and ensure it ends with a slash
let baseURL = process.env.REACT_APP_API_URL || '/api';
if (!baseURL.endsWith('/')) {
  baseURL = `${baseURL}/`;
}

// Create a base axios instance
const api = axios.create({
  baseURL: baseURL,
  timeout: parseInt(process.env.REACT_APP_TIMEOUT || '30000'),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Log configuration for debugging
console.log('API Configuration:');
console.log('- Base URL:', baseURL);
console.log('- Backend URL:', process.env.REACT_APP_BACKEND_URL || 'Not set');
console.log('- Fallback Mode:', useFallback ? 'Enabled' : 'Disabled');

// Static fallback data for offline/static mode
const FALLBACK_DATA = {
  // User data
  "currentUser": {
    "id": "123",
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin",
    "name": "Admin User"
  },

  // Common API responses
  "apiResponses": {
    "/api/users/login": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsInVzZXJuYW1lIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjE2MTYyMjIwLCJleHAiOjE2MTYyNDg2MjB9.7M8V3XFjTRRrKDYLT5a9xIb0jLDTGMBIGGSLIL9pMTo",
      "user": {
        "id": "123",
        "username": "admin",
        "email": "admin@example.com",
        "role": "admin",
        "name": "Admin User"
      }
    },
    "/api/users/profile": {
      "id": "123",
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin",
      "name": "Admin User"
    },
    "/api/dashboard/stats": {
      "totalStudents": 250,
      "totalTeachers": 25,
      "totalClasses": 15,
      "recentActivity": [
        { "type": "login", "user": "admin", "timestamp": "2023-04-12T10:30:00Z" },
        { "type": "grade_entry", "user": "teacher1", "timestamp": "2023-04-12T09:15:00Z" },
        { "type": "attendance", "user": "teacher2", "timestamp": "2023-04-12T08:00:00Z" }
      ]
    }
  }
};

// Helper function to get fallback data for a specific endpoint
const getFallbackData = (url) => {
  // Extract the API path
  const apiPath = url.split('?')[0]; // Remove query parameters

  // Check if we have fallback data for this API path
  for (const mockPath in FALLBACK_DATA.apiResponses) {
    if (apiPath.includes(mockPath)) {
      console.log(`[Fallback] Using fallback data for: ${mockPath}`);
      return FALLBACK_DATA.apiResponses[mockPath];
    }
  }

  // Default fallback data
  return { success: true, data: [] };
};

// Add request interceptor
api.interceptors.request.use(
  config => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor with fallback capability
api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    // Handle errors with fallback if enabled
    if (useFallback && error.config && !error.config.__isRetry) {
      console.log(`[Fallback] API request failed, using fallback data for: ${error.config.url}`);

      // Get fallback data for this endpoint
      const fallbackData = getFallbackData(error.config.url);

      // Return a successful response with the fallback data
      return Promise.resolve({
        data: fallbackData,
        status: 200,
        statusText: 'OK (Fallback)',
        headers: {},
        config: error.config
      });
    }

    // Handle errors normally if fallback is disabled or already tried
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

// Auto-login function for development/testing
export const autoLogin = () => {
  if (useFallback && !localStorage.getItem('token')) {
    console.log('[Fallback] Auto-login initialized');

    // Store the token and user data in localStorage
    localStorage.setItem('token', "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsInVzZXJuYW1lIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjE2MTYyMjIwLCJleHAiOjE2MTYyNDg2MjB9.7M8V3XFjTRRrKDYLT5a9xIb0jLDTGMBIGGSLIL9pMTo");
    localStorage.setItem('user', JSON.stringify(FALLBACK_DATA.currentUser));

    console.log('[Fallback] User automatically logged in');
    return true;
  }
  return false;
};

export default api;
