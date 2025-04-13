import React from 'react';
import PropTypes from 'prop-types';
import { Box, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

const GlassmorphicCard = ({ 
  children, 
  blur = 10,
  opacity = 0.7,
  border = true,
  borderColor,
  hoverEffect = true,
  ...props 
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  // Default border color based on theme
  const defaultBorderColor = isDark 
    ? 'rgba(255, 255, 255, 0.1)' 
    : 'rgba(255, 255, 255, 0.5)';
  
  // Background color based on theme
  const bgColor = isDark 
    ? `rgba(30, 41, 59, ${opacity})` 
    : `rgba(255, 255, 255, ${opacity})`;
  
  return (
    <Box
      component={motion.div}
      whileHover={hoverEffect ? { 
        y: -5,
        boxShadow: isDark 
          ? '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
          : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      } : {}}
      sx={{
        backdropFilter: `blur(${blur}px)`,
        backgroundColor: bgColor,
        borderRadius: 'var(--radius-lg)',
        boxShadow: isDark 
          ? '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
          : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        border: border ? `1px solid ${borderColor || defaultBorderColor}` : 'none',
        transition: 'all 0.3s ease',
        overflow: 'hidden',
        ...props.sx
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

GlassmorphicCard.propTypes = {
  children: PropTypes.node.isRequired,
  blur: PropTypes.number,
  opacity: PropTypes.number,
  border: PropTypes.bool,
  borderColor: PropTypes.string,
  hoverEffect: PropTypes.bool,
  sx: PropTypes.object,
};

export default GlassmorphicCard;
