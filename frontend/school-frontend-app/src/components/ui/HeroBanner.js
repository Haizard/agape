import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Container, Button, useTheme, alpha } from '@mui/material';
import OptimizedImage from './OptimizedImage';

/**
 * HeroBanner - A component for creating hero sections with background images
 * 
 * Features:
 * - Full-width background image
 * - Customizable height
 * - Optional overlay
 * - Responsive text positioning
 * - Call-to-action button
 */
const HeroBanner = ({
  backgroundImage = '/assets/images/backgrounds/hero-bg.jpg',
  height = { xs: '60vh', md: '70vh', lg: '80vh' },
  title,
  subtitle,
  ctaText,
  ctaLink,
  ctaOnClick,
  overlayColor,
  overlayGradient = 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 100%)',
  textPosition = 'center',
  textAlign = 'center',
  textColor = 'white',
  maxWidth = 'md',
  children,
  sx = {},
  ...props
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Default overlay gradient based on theme
  const defaultGradient = isDark
    ? 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.8) 100%)'
    : 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%)';

  // Text position styles
  const getTextPositionStyles = () => {
    const positions = {
      center: {
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      },
      'top-left': {
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        textAlign: 'left',
        pt: { xs: 4, md: 6 },
        pl: { xs: 2, md: 4 },
      },
      'top-center': {
        alignItems: 'flex-start',
        justifyContent: 'center',
        textAlign: 'center',
        pt: { xs: 4, md: 6 },
      },
      'top-right': {
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        textAlign: 'right',
        pt: { xs: 4, md: 6 },
        pr: { xs: 2, md: 4 },
      },
      'bottom-left': {
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
        textAlign: 'left',
        pb: { xs: 4, md: 6 },
        pl: { xs: 2, md: 4 },
      },
      'bottom-center': {
        alignItems: 'flex-end',
        justifyContent: 'center',
        textAlign: 'center',
        pb: { xs: 4, md: 6 },
      },
      'bottom-right': {
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        textAlign: 'right',
        pb: { xs: 4, md: 6 },
        pr: { xs: 2, md: 4 },
      },
    };

    return positions[textPosition] || positions.center;
  };

  return (
    <Box
      sx={{
        position: 'relative',
        height,
        width: '100%',
        overflow: 'hidden',
        ...sx,
      }}
      {...props}
    >
      {/* Background Image */}
      <OptimizedImage
        src={backgroundImage}
        alt="Hero Background"
        width="100%"
        height="100%"
        fit="cover"
        position="center"
        overlay={true}
        overlayGradient={overlayGradient || overlayColor || defaultGradient}
      />

      {/* Content */}
      <Container
        maxWidth={maxWidth}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          ...getTextPositionStyles(),
        }}
      >
        {title && (
          <Typography
            variant="h1"
            component="h1"
            color={textColor}
            sx={{
              fontWeight: 700,
              fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
              textShadow: '0 2px 10px rgba(0,0,0,0.3)',
              mb: 2,
              maxWidth: '800px',
            }}
          >
            {title}
          </Typography>
        )}

        {subtitle && (
          <Typography
            variant="h4"
            component="h2"
            color={textColor}
            sx={{
              fontWeight: 400,
              fontSize: { xs: '1.25rem', md: '1.5rem', lg: '1.75rem' },
              textShadow: '0 2px 8px rgba(0,0,0,0.3)',
              mb: 4,
              maxWidth: '700px',
              opacity: 0.9,
            }}
          >
            {subtitle}
          </Typography>
        )}

        {ctaText && (
          <Button
            variant="contained"
            color="primary"
            size="large"
            href={ctaLink}
            onClick={ctaOnClick}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: theme.shape?.borderRadius || 8,
              fontSize: { xs: '1rem', md: '1.1rem' },
              fontWeight: 600,
              boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            {ctaText}
          </Button>
        )}

        {children}
      </Container>
    </Box>
  );
};

HeroBanner.propTypes = {
  backgroundImage: PropTypes.string,
  height: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.object,
  ]),
  title: PropTypes.string,
  subtitle: PropTypes.string,
  ctaText: PropTypes.string,
  ctaLink: PropTypes.string,
  ctaOnClick: PropTypes.func,
  overlayColor: PropTypes.string,
  overlayGradient: PropTypes.string,
  textPosition: PropTypes.oneOf([
    'center',
    'top-left',
    'top-center',
    'top-right',
    'bottom-left',
    'bottom-center',
    'bottom-right',
  ]),
  textAlign: PropTypes.oneOf(['left', 'center', 'right']),
  textColor: PropTypes.string,
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', false]),
  children: PropTypes.node,
  sx: PropTypes.object,
};

export default HeroBanner;
