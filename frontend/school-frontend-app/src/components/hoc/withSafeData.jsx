import React from 'react';
import transformData from '../../utils/dataTransformer';

/**
 * Higher-Order Component that transforms all props to ensure no objects are passed to React components
 * @param {React.ComponentType} WrappedComponent - The component to wrap
 * @returns {React.ComponentType} - The wrapped component with transformed props
 */
const withSafeData = (WrappedComponent) => {
  const WithSafeData = (props) => {
    // Transform all props
    const safeProps = transformData(props);
    
    // Render the wrapped component with transformed props
    return <WrappedComponent {...safeProps} />;
  };
  
  // Set display name for debugging
  WithSafeData.displayName = `WithSafeData(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  
  return WithSafeData;
};

export default withSafeData;
