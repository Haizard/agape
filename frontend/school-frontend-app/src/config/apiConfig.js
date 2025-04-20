/**
 * API Configuration
 *
 * This file contains the API URL configuration for the frontend application.
 */

// Set the API URL to the backend server
let apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Ensure the API_URL ends with a trailing slash
if (!apiUrl.endsWith('/')) {
  apiUrl = `${apiUrl}/`;
}

// Force the API_URL to be the render.com URL in production
if (process.env.NODE_ENV === 'production') {
  apiUrl = 'https://agape-render.onrender.com/';
  console.log('Production environment detected, forcing API URL to:', apiUrl);
}

// For local development, use localhost if not specified
if (process.env.NODE_ENV === 'development' && !process.env.REACT_APP_API_URL) {
  apiUrl = 'http://localhost:5000/';
  console.log('Development environment detected, using local API URL:', apiUrl);
}

// Export the API base URL
export const API_BASE_URL = apiUrl;

export default {
  API_BASE_URL
};
