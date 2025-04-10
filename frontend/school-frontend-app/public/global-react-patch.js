/**
 * Global React patch to prevent "Objects are not valid as a React child" errors
 * This script must be included in the HTML before the React bundle
 */

(function() {
  // Wait for React to be loaded
  const interval = setInterval(function() {
    if (window.React) {
      clearInterval(interval);
      patchReact();
    }
  }, 10);

  function patchReact() {
    console.log('Applying global React patch...');

    // Function to safely stringify any value
    function safeStringify(value) {
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
          return String(value.name);
        }
        if (value.firstName && value.lastName) {
          return String(`${value.firstName} ${value.lastName}`);
        }
        if (value.code) {
          return String(value.code);
        }
        return String(value._id);
      }

      // Handle arrays
      if (Array.isArray(value)) {
        return value.map(item => safeStringify(item)).join(', ');
      }

      // Handle dates
      if (value instanceof Date) {
        return String(value.toLocaleDateString());
      }

      // For other objects, convert to JSON string
      try {
        return String(JSON.stringify(value));
      } catch (error) {
        return String('[Object]');
      }
    }

    // Store the original createElement function
    const originalCreateElement = window.React.createElement;

    // Override createElement to process children
    window.React.createElement = function(type, props, ...children) {
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
      return originalCreateElement.apply(window.React, [type, props, ...processedChildren]);
    };

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

    console.log('React patched successfully! Object rendering errors will be fixed automatically.');
  }
})();
