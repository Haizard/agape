/**
 * Error suppression script for React object rendering errors
 * Add this to your index.html or paste in browser console
 */

// Store the original console.error
const originalConsoleError = console.error;

// Override console.error to filter out specific React errors
console.error = function(...args) {
  // Check if this is the "Objects are not valid as a React child" error
  if (args[0] && typeof args[0] === 'string' && 
      args[0].includes('Objects are not valid as a React child')) {
    // Suppress this specific error
    return;
  }
  
  // Pass other errors to the original console.error
  originalConsoleError.apply(console, args);
};

// Add a global helper function to safely render objects
window.safeRender = function(value) {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'object') {
    // Handle common object types
    if (value._id) {
      if (value.name) {
        return value.name;
      } else if (value.firstName && value.lastName) {
        return value.firstName + ' ' + value.lastName;
      } else if (value.code) {
        return value.code;
      } else {
        return value._id.toString();
      }
    }
    
    // For other objects, convert to string
    try {
      return JSON.stringify(value);
    } catch (error) {
      return '[Object]';
    }
  }
  
  return String(value);
};

// Monkey patch React's createElement to handle objects
const originalCreateElement = React.createElement;
React.createElement = function(type, props, ...children) {
  // Process children to convert objects to strings
  const processedChildren = children.map(child => {
    if (child === null || child === undefined || typeof child !== 'object') {
      return child;
    }
    
    // If it's a React element, leave it as is
    if (child.$$typeof) {
      return child;
    }
    
    // Convert object to string
    return window.safeRender(child);
  });
  
  // Call original createElement with processed children
  return originalCreateElement.apply(React, [type, props, ...processedChildren]);
};

console.log('Error suppression and safe rendering helpers installed');
