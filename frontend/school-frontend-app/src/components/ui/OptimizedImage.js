import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, Skeleton } from '@mui/material';

/**
 * OptimizedImage - A component for rendering optimized images with lazy loading
 * 
 * Features:
 * - Lazy loading
 * - Loading skeleton
 * - Responsive sizing
 * - Various fit modes
 * - Optional overlay effects
 */
const OptimizedImage = ({
  src,
  alt,
  width = '100%',
  height = 'auto',
  fit = 'cover',
  position = 'center',
  borderRadius,
  overlay,
  overlayColor = 'rgba(0, 0, 0, 0.4)',
  overlayGradient,
  hoverEffect = false,
  hoverScale = 1.05,
  hoverOverlay,
  hoverOverlayColor = 'rgba(0, 0, 0, 0.6)',
  sx = {},
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Reset loaded state when src changes
  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [src]);

  // Handle image load
  const handleLoad = () => {
    setLoaded(true);
  };

  // Handle image error
  const handleError = () => {
    setError(true);
    setLoaded(true); // Consider it "loaded" to remove skeleton
  };

  // Base styles for the container
  const containerStyles = {
    position: 'relative',
    width,
    height,
    borderRadius,
    overflow: 'hidden',
    ...sx,
  };

  // Styles for the image
  const imageStyles = {
    width: '100%',
    height: '100%',
    objectFit: fit,
    objectPosition: position,
    transition: 'transform 0.5s ease',
    ...(hoverEffect && {
      '&:hover': {
        transform: `scale(${hoverScale})`,
      },
    }),
    ...(error && {
      // Fallback for error
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
    }),
  };

  // Styles for the overlay
  const overlayStyles = overlay ? {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: overlayColor,
    background: overlayGradient,
    zIndex: 1,
  } : {};

  // Styles for hover overlay
  const hoverOverlayStyles = hoverOverlay ? {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    transition: 'background-color 0.3s ease',
    zIndex: 2,
    '&:hover': {
      backgroundColor: hoverOverlayColor,
    },
  } : {};

  return (
    <Box sx={containerStyles} {...props}>
      {!loaded && (
        <Skeleton 
          variant="rectangular" 
          width="100%" 
          height="100%" 
          animation="wave"
        />
      )}
      
      <Box
        component="img"
        src={src}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        sx={imageStyles}
        loading="lazy"
      />
      
      {overlay && <Box sx={overlayStyles} />}
      {hoverOverlay && <Box sx={hoverOverlayStyles} />}
    </Box>
  );
};

OptimizedImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  fit: PropTypes.oneOf(['cover', 'contain', 'fill', 'none', 'scale-down']),
  position: PropTypes.string,
  borderRadius: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  overlay: PropTypes.bool,
  overlayColor: PropTypes.string,
  overlayGradient: PropTypes.string,
  hoverEffect: PropTypes.bool,
  hoverScale: PropTypes.number,
  hoverOverlay: PropTypes.bool,
  hoverOverlayColor: PropTypes.string,
  sx: PropTypes.object,
};

export default OptimizedImage;
