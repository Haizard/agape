import React from 'react';
import PropTypes from 'prop-types';
import { safeStringify } from '../../utils/objectStringifier';

/**
 * A component that safely renders its children, converting any objects to strings
 * Use this to wrap components that might render objects directly
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - The content to render safely
 * @returns {React.ReactElement} - The safely rendered content
 */
const ObjectSafeWrapper = ({ children }) => {
  // Process children recursively
  const processNode = (node) => {
    // Handle null/undefined
    if (node === null || node === undefined) {
      return node;
    }
    
    // Handle arrays (like multiple children)
    if (Array.isArray(node)) {
      return node.map(child => processNode(child));
    }
    
    // Handle React elements
    if (React.isValidElement(node)) {
      // Clone the element with processed children
      return React.cloneElement(
        node,
        node.props,
        ...React.Children.map(node.props.children, child => processNode(child))
      );
    }
    
    // Handle objects (convert to string)
    if (typeof node === 'object') {
      return safeStringify(node);
    }
    
    // Return primitives as is
    return node;
  };
  
  return <>{processNode(children)}</>;
};

ObjectSafeWrapper.propTypes = {
  children: PropTypes.node
};

export default ObjectSafeWrapper;
