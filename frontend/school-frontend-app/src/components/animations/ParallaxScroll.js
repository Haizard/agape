import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { motion, useScroll, useTransform } from 'framer-motion';

const ParallaxScroll = ({ 
  children, 
  speed = 0.5, 
  direction = 'up',
  ...props 
}) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });

  // Calculate transform based on direction and speed
  const getTransform = () => {
    const factor = direction === 'down' ? speed : -speed;
    return useTransform(scrollYProgress, [0, 1], ['0%', `${factor * 100}%`]);
  };

  const y = direction === 'up' || direction === 'down' ? getTransform() : 0;
  const x = direction === 'left' || direction === 'right' ? getTransform() : 0;

  return (
    <div ref={ref} style={{ overflow: 'hidden', position: 'relative' }}>
      <motion.div
        style={{ y, x }}
        {...props}
      >
        {children}
      </motion.div>
    </div>
  );
};

ParallaxScroll.propTypes = {
  children: PropTypes.node.isRequired,
  speed: PropTypes.number,
  direction: PropTypes.oneOf(['up', 'down', 'left', 'right']),
};

export default ParallaxScroll;
