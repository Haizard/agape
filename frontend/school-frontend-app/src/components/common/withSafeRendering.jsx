import React from 'react';
import { stringifyObject } from '../../utils/stringifyObject';

/**
 * Higher-Order Component that makes any component safe from "Objects are not valid as React child" errors
 * Wrap any component that might render objects directly with this HOC
 * 
 * @param {React.ComponentType} WrappedComponent - The component to wrap
 * @returns {React.ComponentType} - The wrapped component with safe rendering
 */
const withSafeRendering = (WrappedComponent) => {
  const SafeComponent = (props) => {
    // Process all props to ensure no objects are passed directly to render
    const processProps = (obj) => {
      const result = {};
      
      // Process each prop
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        
        // Skip functions and React elements
        if (typeof value === 'function' || React.isValidElement(value)) {
          result[key] = value;
          return;
        }
        
        // Process arrays recursively
        if (Array.isArray(value)) {
          result[key] = value.map(item => 
            typeof item === 'object' && item !== null && !React.isValidElement(item)
              ? stringifyObject(item)
              : item
          );
          return;
        }
        
        // Process objects (except null)
        if (typeof value === 'object' && value !== null) {
          // If it's a plain object (not a special React object), stringify it
          if (!value.$$typeof) {
            result[key] = stringifyObject(value);
          } else {
            result[key] = value;
          }
          return;
        }
        
        // Pass through other values
        result[key] = value;
      });
      
      return result;
    };
    
    // Return the wrapped component with processed props
    return <WrappedComponent {...processProps(props)} />;
  };
  
  // Set display name for debugging
  SafeComponent.displayName = `withSafeRendering(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;
  
  return SafeComponent;
};

export default withSafeRendering;
