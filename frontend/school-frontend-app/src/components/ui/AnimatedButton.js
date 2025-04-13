import React from 'react';
import PropTypes from 'prop-types';
import { Button, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

const AnimatedButton = ({ 
  children, 
  variant = 'contained',
  color = 'primary',
  size = 'medium',
  effect = 'scale',
  ...props 
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  // Define animation effects
  const getAnimationProps = () => {
    const baseProps = {
      whileTap: { scale: 0.97 }
    };
    
    switch (effect) {
      case 'scale':
        return {
          ...baseProps,
          whileHover: { scale: 1.05 }
        };
      case 'lift':
        return {
          ...baseProps,
          whileHover: { 
            y: -5,
            boxShadow: isDark 
              ? '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
              : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }
        };
      case 'pulse':
        return {
          ...baseProps,
          whileHover: { 
            scale: [1, 1.05, 1.03],
            transition: {
              duration: 0.6,
              repeat: Infinity,
              repeatType: 'reverse'
            }
          }
        };
      case 'glow':
        return {
          ...baseProps,
          whileHover: { 
            boxShadow: `0 0 20px ${theme.palette[color].main}`
          }
        };
      default:
        return baseProps;
    }
  };

  return (
    <Button
      component={motion.button}
      variant={variant}
      color={color}
      size={size}
      {...getAnimationProps()}
      sx={{
        borderRadius: 'var(--radius-md)',
        textTransform: 'none',
        fontWeight: 600,
        ...props.sx
      }}
      {...props}
    >
      {children}
    </Button>
  );
};

AnimatedButton.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['contained', 'outlined', 'text']),
  color: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  effect: PropTypes.oneOf(['scale', 'lift', 'pulse', 'glow']),
  sx: PropTypes.object,
};

export default AnimatedButton;
