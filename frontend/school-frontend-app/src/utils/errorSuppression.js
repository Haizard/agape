/**
 * Error suppression and React patching utility
 * This suppresses the "Objects are not valid as a React child" errors in the console
 * and patches React's createElement function to handle objects automatically
 */

// Function to safely stringify any value
const safeStringify = (value) => {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return '';
  }

  // If it's already a string, number, or boolean, return as is
  if (typeof value !== 'object') {
    return String(value);
  }

  // Handle React elements (return as is)
  if (value && value.$$typeof) {
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
    console.warn('Error stringifying object:', error);
    return '[Object]';
  }
};

export const suppressReactErrors = () => {
  // Store the original console.error
  const originalConsoleError = console.error;

  // Override console.error to filter out specific React errors
  console.error = (...args) => {
    // Check if this is the "Objects are not valid as a React child" error
    if (args[0] && typeof args[0] === 'string' &&
        args[0].includes('Objects are not valid as a React child')) {
      // Suppress this specific error
      return;
    }

    // Pass other errors to the original console.error
    originalConsoleError.apply(console, args);
  };

  // Patch React's createElement function
  try {
    // Check if React is available
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
  } catch (error) {
    console.warn('Failed to patch React:', error);
  }

  console.log('React error suppression applied - Object rendering errors will be hidden');
};

export default suppressReactErrors;
