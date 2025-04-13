import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import modernTheme from './modernTheme';

// Define custom colors from the theme
const primaryColor = '#1e88e5'; // Modern blue
const primaryLight = '#6ab7ff';
const primaryDark = '#005cb2';
const secondaryColor = '#ff6d00'; // Vibrant orange
const secondaryLight = '#ff9e40';
const secondaryDark = '#c43c00';
const successColor = '#43a047';
const errorColor = '#e53935';
const warningColor = '#ffa000';
const infoColor = '#039be5';

const ThemeProvider = ({ children }) => {
  // Set CSS variables when the component mounts
  useEffect(() => {
    // Add CSS variables for easy access in components
    document.documentElement.style.setProperty('--primary-color', primaryColor);
    document.documentElement.style.setProperty('--primary-light', primaryLight);
    document.documentElement.style.setProperty('--primary-dark', primaryDark);
    document.documentElement.style.setProperty('--secondary-color', secondaryColor);
    document.documentElement.style.setProperty('--secondary-light', secondaryLight);
    document.documentElement.style.setProperty('--secondary-dark', secondaryDark);
    document.documentElement.style.setProperty('--success-color', successColor);
    document.documentElement.style.setProperty('--error-color', errorColor);
    document.documentElement.style.setProperty('--warning-color', warningColor);
    document.documentElement.style.setProperty('--info-color', infoColor);
    document.documentElement.style.setProperty('--radius-sm', '4px');
    document.documentElement.style.setProperty('--radius-md', '8px');
    document.documentElement.style.setProperty('--radius-lg', '12px');
    document.documentElement.style.setProperty('--radius-xl', '16px');
    document.documentElement.style.setProperty('--shadow-sm', '0 2px 8px rgba(0,0,0,0.08)');
    document.documentElement.style.setProperty('--shadow-md', '0 4px 16px rgba(0,0,0,0.08)');
    document.documentElement.style.setProperty('--shadow-lg', '0 8px 24px rgba(0,0,0,0.08)');
    document.documentElement.style.setProperty('--shadow-xl', '0 12px 32px rgba(0,0,0,0.08)');
  }, []);

  return (
    <MuiThemeProvider theme={modernTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default ThemeProvider;
