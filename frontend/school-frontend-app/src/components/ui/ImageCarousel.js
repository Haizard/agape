import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, IconButton, useTheme, alpha, Typography } from '@mui/material';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import OptimizedImage from './OptimizedImage';

/**
 * ImageCarousel - A component for displaying image carousels
 *
 * Features:
 * - Smooth transitions
 * - Auto-play option
 * - Navigation controls
 * - Caption support
 * - Responsive design
 */
const ImageCarousel = ({
  images = [
    { src: '/assets/images/carousel/slide1.jpg', alt: 'Slide 1', caption: 'Slide 1 Caption' },
    { src: '/assets/images/carousel/slide2.jpg', alt: 'Slide 2', caption: 'Slide 2 Caption' },
    { src: '/assets/images/carousel/slide3.jpg', alt: 'Slide 3', caption: 'Slide 3 Caption' },
  ],
  height = { xs: '300px', sm: '400px', md: '500px' },
  autoPlay = true,
  interval = 5000,
  showArrows = true,
  showDots = true,
  showCaptions = true,
  overlay = true,
  overlayGradient = 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%)',
  borderRadius,
  sx = {},
  ...props
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, images.length, isPaused]);

  // Navigation handlers
  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const handleDotClick = (index) => {
    setCurrentIndex(index);
  };

  // Pause auto-play on hover
  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        height,
        width: '100%',
        overflow: 'hidden',
        borderRadius,
        ...sx,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {/* Slides */}
      <AnimatePresence initial={false}>
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{ height: '100%', width: '100%' }}
        >
          <OptimizedImage
            src={images[currentIndex].src}
            alt={images[currentIndex].alt || `Slide ${currentIndex + 1}`}
            width="100%"
            height="100%"
            fit="cover"
            overlay={overlay}
            overlayGradient={overlayGradient}
          />
        </motion.div>
      </AnimatePresence>

      {/* Captions */}
      {showCaptions && images[currentIndex].caption && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: { xs: 2, md: 3 },
            zIndex: 2,
          }}
        >
          <Typography
            variant="h5"
            component="div"
            color="white"
            sx={{
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              fontWeight: 600,
            }}
          >
            {images[currentIndex].caption}
          </Typography>
          {images[currentIndex].description && (
            <Typography
              variant="body1"
              color="white"
              sx={{
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                opacity: 0.9,
                mt: 1,
              }}
            >
              {images[currentIndex].description}
            </Typography>
          )}
        </Box>
      )}

      {/* Navigation Arrows */}
      {showArrows && (
        <>
          <IconButton
            onClick={handlePrev}
            sx={{
              position: 'absolute',
              left: { xs: 8, md: 16 },
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: alpha(theme.palette.common.black, 0.5),
              color: theme.palette.common.white,
              '&:hover': {
                backgroundColor: alpha(theme.palette.common.black, 0.7),
              },
              zIndex: 2,
            }}
            aria-label="Previous slide"
          >
            <KeyboardArrowLeft />
          </IconButton>
          <IconButton
            onClick={handleNext}
            sx={{
              position: 'absolute',
              right: { xs: 8, md: 16 },
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: alpha(theme.palette.common.black, 0.5),
              color: theme.palette.common.white,
              '&:hover': {
                backgroundColor: alpha(theme.palette.common.black, 0.7),
              },
              zIndex: 2,
            }}
            aria-label="Next slide"
          >
            <KeyboardArrowRight />
          </IconButton>
        </>
      )}

      {/* Dots */}
      {showDots && (
        <Box
          sx={{
            position: 'absolute',
            bottom: showCaptions ? { xs: 60, sm: 70 } : 16,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: 1,
            zIndex: 2,
          }}
        >
          {images.map((_, index) => (
            <Box
              key={index}
              onClick={() => handleDotClick(index)}
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: index === currentIndex
                  ? theme.palette.primary.main
                  : alpha(theme.palette.common.white, 0.5),
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: index === currentIndex
                    ? theme.palette.primary.main
                    : alpha(theme.palette.common.white, 0.8),
                  transform: 'scale(1.2)',
                },
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

ImageCarousel.propTypes = {
  images: PropTypes.arrayOf(
    PropTypes.shape({
      src: PropTypes.string.isRequired,
      alt: PropTypes.string,
      caption: PropTypes.string,
      description: PropTypes.string,
    })
  ),
  height: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.object,
  ]),
  autoPlay: PropTypes.bool,
  interval: PropTypes.number,
  showArrows: PropTypes.bool,
  showDots: PropTypes.bool,
  showCaptions: PropTypes.bool,
  overlay: PropTypes.bool,
  overlayGradient: PropTypes.string,
  borderRadius: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  sx: PropTypes.object,
};

export default ImageCarousel;
