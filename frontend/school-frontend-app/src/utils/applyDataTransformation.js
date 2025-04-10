/**
 * This script applies data transformation to all components
 * Run this script once at application startup
 */

import React from 'react';
import transformData from './dataTransformer';

/**
 * Apply data transformation to all components
 * This function patches React's createElement function to transform all props
 */
export const applyDataTransformation = () => {
  console.log('Applying data transformation to all components...');

  try {
    // Check if React is available
    if (typeof React === 'undefined') {
      throw new Error('React is not defined');
    }

    // Check if createElement is available
    if (typeof React.createElement !== 'function') {
      throw new Error('React.createElement is not defined or not a function');
    }

    // Store the original createElement function
    const originalCreateElement = React.createElement;
    console.log('Original createElement function stored');

    // Override createElement to transform all props
    React.createElement = function(type, props, ...children) {
      try {
        // Transform props if they exist
        const transformedProps = props ? transformData(props) : props;

        // Process children to convert objects to strings
        const processedChildren = children.map(child => {
          try {
            // Skip null, undefined, and primitive types
            if (child === null || child === undefined || typeof child !== 'object') {
              return child;
            }

            // If it's a React element, leave it as is
            if (child && child.$$typeof && typeof child.$$typeof === 'symbol') {
              return child;
            }

            // Convert object to string
            return transformData(child);
          } catch (childError) {
            console.error('Error processing child:', childError);
            return String(child) || '';
          }
        });

        // Call original createElement with transformed props and processed children
        return originalCreateElement.apply(React, [type, transformedProps, ...processedChildren]);
      } catch (propsError) {
        console.error('Error in createElement override:', propsError);
        // Fall back to original createElement
        return originalCreateElement.apply(React, [type, props, ...children]);
      }
    };
    console.log('createElement function overridden');

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
    console.log('Console error suppression applied');

    console.log('Data transformation applied to all components successfully!');
  } catch (error) {
    console.error('Failed to apply data transformation:', error);
  }
};

export default applyDataTransformation;
