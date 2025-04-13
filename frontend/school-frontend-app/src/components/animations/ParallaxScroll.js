import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

const ParallaxScroll = ({
  children,
  speed = 0.5,
  direction = 'up',
  ...props
}) => {
  const ref = useRef(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate transform based on direction and speed
  const getTransformValue = () => {
    if (!ref.current) return 0;

    const rect = ref.current.getBoundingClientRect();
    const scrollProgress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
    const factor = direction === 'down' ? speed : -speed;
    return scrollProgress * factor * 100;
  };

  const transformValue = getTransformValue();
  const y = direction === 'up' || direction === 'down' ? `${transformValue}px` : 0;
  const x = direction === 'left' || direction === 'right' ? `${transformValue}px` : 0;

  return (
    <div ref={ref} style={{ overflow: 'hidden', position: 'relative' }}>
      <div
        style={{
          transform: `translate(${x}, ${y})`,
          transition: 'transform 0.1s ease-out'
        }}
        {...props}
      >
        {children}
      </div>
    </div>
  );
};

ParallaxScroll.propTypes = {
  children: PropTypes.node.isRequired,
  speed: PropTypes.number,
  direction: PropTypes.oneOf(['up', 'down', 'left', 'right']),
};

export default ParallaxScroll;
