import React from 'react';
import PropTypes from 'prop-types';
import { Typography, useTheme } from '@mui/material';

const GradientText = ({ 
  children, 
  variant = 'h1',
  gradient = 'primary',
  animate = false,
  ...props 
}) => {
  const theme = useTheme();
  
  // Define gradient presets
  const getGradient = () => {
    const gradients = {
      primary: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
      secondary: `linear-gradient(45deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.light})`,
      accent: theme.palette.mode === 'dark'
        ? 'linear-gradient(45deg, #f59e0b, #ef4444)'
        : 'linear-gradient(45deg, #f97316, #ec4899)',
      blue: 'linear-gradient(45deg, #3b82f6, #06b6d4)',
      purple: 'linear-gradient(45deg, #8b5cf6, #d946ef)',
      green: 'linear-gradient(45deg, #10b981, #84cc16)',
      rainbow: 'linear-gradient(45deg, #f97316, #ec4899, #8b5cf6, #3b82f6, #10b981)',
    };
    
    return gradients[gradient] || gradient; // Use the preset or the custom gradient string
  };
  
  // Animation styles
  const animationStyle = animate ? {
    backgroundSize: '200% auto',
    animation: 'gradientAnimation 5s ease infinite',
    '@keyframes gradientAnimation': {
      '0%': {
        backgroundPosition: '0% 50%'
      },
      '50%': {
        backgroundPosition: '100% 50%'
      },
      '100%': {
        backgroundPosition: '0% 50%'
      }
    }
  } : {};

  return (
    <Typography
      variant={variant}
      sx={{
        background: getGradient(),
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        textFillColor: 'transparent',
        ...animationStyle,
        ...props.sx
      }}
      {...props}
    >
      {children}
    </Typography>
  );
};

GradientText.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.string,
  gradient: PropTypes.string,
  animate: PropTypes.bool,
  sx: PropTypes.object,
};

export default GradientText;
