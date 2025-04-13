import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

const StaggerContainer = ({ 
  children, 
  staggerDelay = 0.1, 
  initialDelay = 0,
  threshold = 0.1,
  once = true,
  ...props 
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: initialDelay,
        staggerChildren: staggerDelay
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, threshold }}
      variants={containerVariants}
      {...props}
    >
      {children}
    </motion.div>
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
