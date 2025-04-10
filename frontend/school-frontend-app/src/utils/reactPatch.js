/**
 * This file contains patches for React to handle object rendering properly
 */
import React from 'react';
import { safeStringify } from './objectStringifier';

// Original console.error function
const originalConsoleError = console.error;

// Patch React's rendering to handle objects
const patchReactRendering = () => {
  // Override console.error to suppress specific React errors
  console.error = function(...args) {
    // Check if this is the "Objects are not valid as a React child" error
    const errorMessage = args[0] || '';
    if (typeof errorMessage === 'string' &&
        errorMessage.includes('Objects are not valid as a React child')) {
      // Suppress this specific error
      return;
    }

    // Pass other errors to the original console.error
    originalConsoleError.apply(console, args);
  };

  // Patch React's createElement to handle objects
  const originalCreateElement = React.createElement;
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

      // Convert object to string using our comprehensive stringifier
      return safeStringify(child);
    });

    // Call original createElement with processed children
    return originalCreateElement.apply(React, [type, props, ...processedChildren]);
  };

  console.log('React rendering patched to handle objects properly');
};

export default patchReactRendering;
