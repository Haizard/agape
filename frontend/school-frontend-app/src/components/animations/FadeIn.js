import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

const FadeIn = ({ 
  children, 
  duration = 0.5, 
  delay = 0, 
  direction = null, 
  distance = 50,
  threshold = 0.1,
  once = true,
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
            delay,
            ease: [0.25, 0.1, 0.25, 1.0] // Custom easing
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
          delay,
          ease: [0.25, 0.1, 0.25, 1.0] // Custom easing
        }
      }
    };
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, threshold }}
      variants={getVariants()}
      {...props}
    >
      {children}
    </motion.div>
  );
};

FadeIn.propTypes = {
  children: PropTypes.node.isRequired,
  duration: PropTypes.number,
  delay: PropTypes.number,
  direction: PropTypes.oneOf([null, 'up', 'down', 'left', 'right']),
  distance: PropTypes.number,
  threshold: PropTypes.number,
  once: PropTypes.bool,
};

export default FadeIn;
