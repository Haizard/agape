import React from 'react';
import PropTypes from 'prop-types';

const StaggerItem = ({
  children,
  duration = 0.5,
  direction = null,
  distance = 50,
  ...props
}) => {
  // Get transform based on direction
  const getTransform = () => {
    if (!direction) return '';

    const directionMap = {
      up: `translateY(${distance}px)`,
      down: `translateY(-${distance}px)`,
      left: `translateX(${distance}px)`,
      right: `translateX(-${distance}px)`
    };

    return directionMap[direction];
  };

  return (
    <div
      className="stagger-item"
      style={{
        opacity: 1,
        transform: 'none',
        transition: `opacity ${duration}s ease, transform ${duration}s ease`,
        animationDelay: `${Math.random() * 0.5}s`
      }}
      {...props}
    >
      {children}
    </div>
  );
};

StaggerItem.propTypes = {
  children: PropTypes.node.isRequired,
  duration: PropTypes.number,
  direction: PropTypes.oneOf([null, 'up', 'down', 'left', 'right']),
  distance: PropTypes.number,
};

export default StaggerItem;
