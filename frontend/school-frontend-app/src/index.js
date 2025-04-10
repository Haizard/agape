import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Provider } from 'react-redux';
import store from './store/index';
import axios from 'axios';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
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
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000'; // Make sure this matches your backend port

// Create the root and render the app
const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <UserProvider>
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <App />
        </ThemeProvider>
      </Provider>
    </UserProvider>
  </React.StrictMode>
);

reportWebVitals();
