import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { Box, Container, useTheme, alpha } from '@mui/material';
import OptimizedImage from './OptimizedImage';

/**
 * SectionBackground - A component for creating sections with background images
 *
 * Features:
 * - Background image with overlay
 * - Customizable padding and spacing
 * - Container width control
 * - Optional parallax effect
 */
const SectionBackground = forwardRef((
  {
    backgroundImage,
    backgroundPosition = 'center',
    overlay = true,
    overlayColor,
    overlayGradient,
    parallax = false,
    height = 'auto',
    minHeight,
    py = { xs: 6, md: 10 },
    px,
    maxWidth = 'lg',
    children,
    sx = {},
    ...props
  }, ref) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Default overlay based on theme
  const defaultOverlay = isDark
    ? 'rgba(0, 0, 0, 0.7)'
    : 'rgba(0, 0, 0, 0.5)';

  // Parallax effect styles
  const parallaxStyles = parallax ? {
    backgroundAttachment: 'fixed',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
  } : {};

  return (
    <Box
      ref={ref}
      sx={{
        position: 'relative',
        height,
        minHeight,
        width: '100%',
        overflow: 'hidden',
        py,
        px,
        ...sx,
      }}
      {...props}
    >
      {/* Background Image */}
      {backgroundImage && (
        <OptimizedImage
          src={backgroundImage}
          alt="Section Background"
          width="100%"
          height="100%"
          fit="cover"
          position={backgroundPosition}
          overlay={overlay}
          overlayColor={overlayColor || defaultOverlay}
          overlayGradient={overlayGradient}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: -1,
            ...parallaxStyles,
          }}
        />
      )}

      {/* Content */}
      <Container
        maxWidth={maxWidth}
        sx={{
          position: 'relative',
          zIndex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </Container>
    </Box>
  );
});

SectionBackground.propTypes = {
  backgroundImage: PropTypes.string,
  backgroundPosition: PropTypes.string,
  overlay: PropTypes.bool,
  overlayColor: PropTypes.string,
  overlayGradient: PropTypes.string,
  parallax: PropTypes.bool,
  height: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.object,
  ]),
  minHeight: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.object,
  ]),
  py: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.object,
  ]),
  px: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.object,
  ]),
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', false]),
  children: PropTypes.node,
  sx: PropTypes.object,
};

export default SectionBackground;
