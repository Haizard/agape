import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

const StaggerItem = ({
  children,
  duration = 0.5,
  direction = null,
  distance = 50,
  ...props
}) => {
  // Define animation variants based on direction
  const getVariants = () => {
    // Base fade animation
    if (!direction) {
      return {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            duration,
            ease: "easeOut" // Standard easing
          }
        }
      };
    }

    // Direction-based animations
    const directionMap = {
      up: { y: distance },
      down: { y: -distance },
      left: { x: distance },
      right: { x: -distance }
    };

    return {
      hidden: {
        opacity: 0,
        ...directionMap[direction]
      },
      visible: {
        opacity: 1,
        x: 0,
        y: 0,
        transition: {
          duration,
          ease: "easeOut" // Standard easing
        }
      }
    };
  };

  return (
    <motion.div
      variants={getVariants()}
      {...props}
    >
      {children}
    </motion.div>
  );
};

StaggerItem.propTypes = {
  children: PropTypes.node.isRequired,
  duration: PropTypes.number,
  direction: PropTypes.oneOf([null, 'up', 'down', 'left', 'right']),
  distance: PropTypes.number,
};

export default StaggerItem;
