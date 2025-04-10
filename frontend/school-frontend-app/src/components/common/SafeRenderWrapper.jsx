import React from 'react';
import PropTypes from 'prop-types';
import { safeRender } from '../../utils/safeRender';

/**
 * A wrapper component that safely renders all children
 * Use this component to prevent "Objects are not valid as a React child" errors
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - The children to render safely
 * @returns {React.ReactElement} - The rendered component
 */
const SafeRenderWrapper = ({ children }) => {
  // Function to process React children recursively
  const processChildren = (child) => {
    // Handle null/undefined
    if (child === null || child === undefined) {
      return null;
    }
    
    // If it's a React element, process its children
    if (React.isValidElement(child)) {
      // Clone the element with processed children
      return React.cloneElement(
        child,
        { ...child.props },
        // Process all children recursively
        React.Children.map(child.props.children, processChildren)
      );
    }
    
    // If it's an array, process each item
    if (Array.isArray(child)) {
      return child.map((item, index) => (
        <React.Fragment key={index}>
          {processChildren(item)}
        </React.Fragment>
      ));
    }
    
    // If it's an object, convert to string
    if (typeof child === 'object') {
      return safeRender(child);
    }
    
    // Return primitives as is
    return child;
  };
  
  return <>{processChildren(children)}</>;
};

SafeRenderWrapper.propTypes = {
  children: PropTypes.node
};

export default SafeRenderWrapper;
