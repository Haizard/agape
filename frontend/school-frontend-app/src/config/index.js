/**
 * Application Configuration
 *
 * This file contains global configuration for the frontend application.
 */

// Set the API URL to the backend server
let apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Ensure the API_URL ends with a trailing slash
if (!apiUrl.endsWith('/')) {
  apiUrl = `${apiUrl}/`;
}

// Ensure the API_URL does NOT include /api/ since we add it in the API calls
if (apiUrl.includes('/api')) {
  // Remove /api/ from the URL
  apiUrl = apiUrl.replace(/\/api\/?$/, '/');
  console.log('Removed /api/ from API_URL:', apiUrl);
}

// Force the API_URL to be the render.com URL in production
if (process.env.NODE_ENV === 'production') {
  apiUrl = 'https://agape-render.onrender.com/';
  console.log('Production environment detected, forcing API URL to:', apiUrl);
}

// For local development, use localhost if not specified
if (process.env.NODE_ENV === 'development' && !process.env.REACT_APP_API_URL) {
  apiUrl = 'http://localhost:5000/';
  console.log('Development environment detected, using proxy API URL:', apiUrl);
}

// Export configuration
export const API_URL = apiUrl;

// School configuration
export const SCHOOL_CONFIG = {
  name: 'St. John Vianney School Management System',
  shortName: 'SJVSMS',
  address: {
    street: 'P.O.BOX 8882',
    city: 'Moshi',
    country: 'Tanzania'
  },
  contact: {
    phone: '+255 123 456 789',
    email: 'info@agapelutheran.ac.tz',
    website: 'www.agapelutheran.ac.tz'
  },
  logo: '/assets/logo.png',
  motto: 'Education for Service',
  organization: 'Evangelical Lutheran Church in Tanzania - Northern Diocese'
};

// Feature flags
export const FEATURES = {
  useMockData: process.env.REACT_APP_USE_MOCK_DATA === 'true',
  enableOfflineMode: process.env.REACT_APP_ENABLE_OFFLINE_MODE === 'true',
  enableDebugMode: process.env.REACT_APP_ENABLE_DEBUG_MODE === 'true'
};

// Default timeout for API requests (in milliseconds)
export const DEFAULT_TIMEOUT = parseInt(process.env.REACT_APP_TIMEOUT || '30000', 10);

export default {
  API_URL,
  SCHOOL_CONFIG,
  FEATURES,
  DEFAULT_TIMEOUT
};
