import React from 'react';
import PropTypes from 'prop-types';

const StaggerContainer = ({
  children,
  staggerDelay = 0.1,
  initialDelay = 0,
  threshold = 0.1,
  once = true,
  ...props
}) => {
  return (
    <div
      className="stagger-container"
      style={{
        opacity: 1,
        transition: `opacity 0.5s ease ${initialDelay}s`,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

StaggerContainer.propTypes = {
  children: PropTypes.node.isRequired,
  staggerDelay: PropTypes.number,
  initialDelay: PropTypes.number,
  threshold: PropTypes.number,
  once: PropTypes.bool,
};

export default StaggerContainer;
