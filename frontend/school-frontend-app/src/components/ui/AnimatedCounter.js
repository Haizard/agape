import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Typography, Box, useTheme } from '@mui/material';
import { useInView } from 'framer-motion';

const AnimatedCounter = ({ 
  end, 
  start = 0,
  duration = 2,
  delay = 0,
  prefix = '',
  suffix = '',
  variant = 'h3',
  color = 'primary',
  ...props 
}) => {
  const [count, setCount] = useState(start);
  const countRef = useRef(null);
  const isInView = useInView(countRef, { once: true, amount: 0.5 });
  const theme = useTheme();
  
  useEffect(() => {
    let startTime;
    let animationFrame;
    
    if (isInView) {
      // Add delay before starting animation
      const timer = setTimeout(() => {
        const animate = (timestamp) => {
          if (!startTime) startTime = timestamp;
          const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
          
          // Easing function for smoother animation
          const easeOutQuart = 1 - Math.pow(1 - progress, 4);
          
          setCount(Math.floor(start + (end - start) * easeOutQuart));
          
          if (progress < 1) {
            animationFrame = requestAnimationFrame(animate);
          }
        };
        
        animationFrame = requestAnimationFrame(animate);
      }, delay * 1000);
      
      return () => {
        clearTimeout(timer);
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
        }
      };
    }
  }, [isInView, start, end, duration, delay]);

  return (
    <Box ref={countRef}>
      <Typography
        variant={variant}
        color={color}
        sx={{
          fontWeight: 700,
          ...props.sx
        }}
        {...props}
      >
        {prefix}{count.toLocaleString()}{suffix}
      </Typography>
    </Box>
  );
};

AnimatedCounter.propTypes = {
  end: PropTypes.number.isRequired,
  start: PropTypes.number,
  duration: PropTypes.number,
  delay: PropTypes.number,
  prefix: PropTypes.string,
  suffix: PropTypes.string,
  variant: PropTypes.string,
  color: PropTypes.string,
  sx: PropTypes.object,
};

export default AnimatedCounter;
