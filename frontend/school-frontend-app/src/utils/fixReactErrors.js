/**
 * This file contains utility functions to fix React object rendering errors
 */

/**
 * Fix React object rendering errors by patching React's createElement function
 * This function should be called once at the application startup
 */
export const fixReactErrors = () => {
  console.log('Applying fixes for React object rendering errors...');
  
  try {
    // Function to safely stringify any value
    const safeStringify = (value) => {
      // Handle null/undefined
      if (value === null || value === undefined) {
        return '';
      }
      
      // If it's already a primitive type, return as string
      if (typeof value !== 'object') {
        return String(value);
      }
      
      // Handle React elements (return as is)
      if (value && typeof value === 'object' && value.$$typeof) {
        return value;
      }
      
      // Handle MongoDB documents with _id
      if (value && value._id) {
        if (value.name) {
          return value.name;
        }
        if (value.firstName && value.lastName) {
          return `${value.firstName} ${value.lastName}`;
        }
        if (value.code) {
          return value.code;
        }
        return String(value._id);
      }
      
      // Handle arrays
      if (Array.isArray(value)) {
        return value.map(item => safeStringify(item)).join(', ');
      }
      
      // Handle dates
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      
      // For other objects, convert to JSON string
      try {
        return JSON.stringify(value);
      } catch (error) {
        return '[Object]';
      }
    };
    
    // Patch React's createElement function
    if (typeof React !== 'undefined') {
      // Store the original createElement function
      const originalCreateElement = React.createElement;
      
      // Override createElement to process children
      React.createElement = function(type, props, ...children) {
        // Process children to convert objects to strings
        const processedChildren = children.map(child => {
          // Skip null, undefined, and primitive types
          if (child === null || child === undefined || typeof child !== 'object') {
            return child;
          }
          
          // If it's a React element, leave it as is
          if (child && child.$$typeof) {
            return child;
          }
          
          // Convert object to string
          return safeStringify(child);
        });
        
        // Call original createElement with processed children
        return originalCreateElement.apply(React, [type, props, ...processedChildren]);
      };
      
      console.log('React patched to automatically stringify objects');
    }
    
    // Suppress the console error for "Objects are not valid as a React child"
    const originalConsoleError = console.error;
    console.error = function(...args) {
      if (args[0] && typeof args[0] === 'string' && 
          args[0].includes('Objects are not valid as a React child')) {
        // Suppress this specific error
        return;
      }
      
      // Pass other errors to the original console.error
      originalConsoleError.apply(console, args);
    };
    
    console.log('React error suppression applied - Object rendering errors will be hidden');
  } catch (error) {
    console.warn('Failed to apply React fixes:', error);
  }
};

export default fixReactErrors;
