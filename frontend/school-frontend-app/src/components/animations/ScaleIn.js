import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

const ScaleIn = ({ 
  children, 
  duration = 0.5, 
  delay = 0, 
  initialScale = 0.9,
  threshold = 0.1,
  once = true,
  ...props 
}) => {
  const variants = {
    hidden: { 
      opacity: 0,
      scale: initialScale
    },
    visible: { 
      opacity: 1,
      scale: 1,
      transition: { 
        duration, 
        delay,
        ease: [0.34, 1.56, 0.64, 1] // Custom spring-like easing
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, threshold }}
      variants={variants}
      {...props}
    >
      {children}
    </motion.div>
  );
};

ScaleIn.propTypes = {
  children: PropTypes.node.isRequired,
  duration: PropTypes.number,
  delay: PropTypes.number,
  initialScale: PropTypes.number,
  threshold: PropTypes.number,
  once: PropTypes.bool,
};

export default ScaleIn;
