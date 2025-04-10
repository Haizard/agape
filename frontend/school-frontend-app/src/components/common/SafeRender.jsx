import React from 'react';
import PropTypes from 'prop-types';

/**
 * A simple component that just renders its children
 * This is a placeholder that doesn't modify the children
 * We'll rely on the global React patch instead
 */
const SafeRender = ({ children }) => {
  return <>{children}</>;
};

SafeRender.propTypes = {
  children: PropTypes.node
};

export default SafeRender;
