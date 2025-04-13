import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import OptimizedImage from './OptimizedImage';

/**
 * FormIllustration - A component for adding illustrations to forms
 * 
 * Features:
 * - Responsive design
 * - Optional text overlay
 * - Consistent styling with the design system
 */
const FormIllustration = ({
  image = '/assets/images/backgrounds/about-bg.jpg',
  alt = 'Form Illustration',
  title,
  subtitle,
  height = { xs: 200, md: 300, lg: '100%' },
  overlay = true,
  overlayColor,
  overlayGradient,
  borderRadius,
  sx = {},
  ...props
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Default overlay based on theme
  const defaultOverlay = isDark
    ? 'rgba(0, 0, 0, 0.5)'
    : 'rgba(0, 0, 0, 0.3)';

  // Default gradient based on theme
  const defaultGradient = isDark
    ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)'
    : 'linear-gradient(135deg, rgba(59, 130, 246, 0.7) 0%, rgba(37, 99, 235, 0.8) 100%)';

  return (
    <Box
      sx={{
        position: 'relative',
        height,
        width: '100%',
        overflow: 'hidden',
        borderRadius: borderRadius || (theme.shape?.borderRadius ? theme.shape.borderRadius : 8),
        ...sx,
      }}
      {...props}
    >
      {/* Background Image */}
      <OptimizedImage
        src={image}
        alt={alt}
        width="100%"
        height="100%"
        fit="cover"
        overlay={overlay}
        overlayColor={overlayColor || defaultOverlay}
        overlayGradient={overlayGradient || defaultGradient}
      />

      {/* Content Overlay */}
      {(title || subtitle) && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 3,
            zIndex: 2,
            textAlign: 'center',
          }}
        >
          {title && (
            <Typography
              variant="h4"
              component="h2"
              color="white"
              sx={{
                fontWeight: 700,
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                mb: 2,
              }}
            >
              {title}
            </Typography>
          )}
          
          {subtitle && (
            <Typography
              variant="body1"
              color="white"
              sx={{
                fontWeight: 400,
                textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                opacity: 0.9,
                maxWidth: '80%',
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

FormIllustration.propTypes = {
  image: PropTypes.string,
  alt: PropTypes.string,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  height: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.object,
  ]),
  overlay: PropTypes.bool,
  overlayColor: PropTypes.string,
  overlayGradient: PropTypes.string,
  borderRadius: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  sx: PropTypes.object,
};

export default FormIllustration;
