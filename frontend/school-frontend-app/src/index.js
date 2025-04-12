import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Provider } from 'react-redux';
import store from './store/index';
import axios from 'axios';
import ThemeProvider from './theme/ThemeProvider';
import { UserProvider } from './contexts/UserContext';
// The fix for React object rendering errors is applied in index.html
// This ensures that all objects are safely rendered
console.log('Using the fix from index.html');

// Configure axios defaults
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common.Authorization = `Bearer ${token}`;
}

// Configure axios base URL
let baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
// Remove trailing slash if present
if (baseURL.endsWith('/')) {
  baseURL = baseURL.slice(0, -1);
}

// Check if we're running on Netlify
const isNetlify = window.location.hostname.includes('netlify.app');

// Use a CORS proxy for Netlify deployment
if (isNetlify) {
  console.log('Running on Netlify, using CORS proxy');
  // Use a CORS proxy service
  baseURL = 'https://cors-anywhere.herokuapp.com/' + baseURL;

  // Add default headers for CORS proxy
  axios.defaults.headers.common['Origin'] = 'https://agape-seminary-school-system.netlify.app';
}

console.log('Global Axios: Using base URL:', baseURL);
axios.defaults.baseURL = baseURL;

// Create the root and render the app
const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <UserProvider>
      <Provider store={store}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </Provider>
    </UserProvider>
  </React.StrictMode>
);

reportWebVitals();
