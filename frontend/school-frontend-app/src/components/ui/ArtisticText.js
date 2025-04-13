import React from 'react';
import PropTypes from 'prop-types';
import { Typography, Box, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

/**
 * ArtisticText - A highly customizable text component with intentional design choices
 *
 * Features:
 * - Multiple text effects (gradient, outlined, shadow, etc.)
 * - Customizable animations
 * - Intentional typography choices
 */
const ArtisticText = ({
  children,
  variant = 'h1',
  color,
  effect = 'none',
  gradient,
  gradientDirection = 45,
  gradientAnimation = false,
  outlined = false,
  outlineColor,
  outlineWidth = 1,
  shadow = false,
  shadowColor,
  shadowBlur = 4,
  shadowOffset = 2,
  highlight = false,
  highlightColor,
  letterSpacing,
  lineHeight,
  fontWeight,
  fontStyle,
  textTransform,
  animate = false,
  animationVariant = 'fadeIn',
  animationDelay = 0,
  animationDuration = 0.5,
  ...props
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Get color from theme or use custom color
  const getColor = () => {
    if (!color) return 'inherit';
    return theme.palette[color]?.main || color;
  };

  // Get gradient style
  const getGradientStyle = () => {
    if (effect !== 'gradient' && !gradient) return {};

    const defaultGradient = gradient || `linear-gradient(${gradientDirection}deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`;

    const gradientStyle = {
      background: defaultGradient,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      textFillColor: 'transparent',
    };

    if (gradientAnimation) {
      return {
        ...gradientStyle,
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
      };
    }

    return gradientStyle;
  };

  // Get outlined text style
  const getOutlinedStyle = () => {
    if (effect !== 'outlined' && !outlined) return {};

    const outlineColorValue = outlineColor || (isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)');

    return {
      WebkitTextStroke: `${outlineWidth}px ${outlineColorValue}`,
      WebkitTextFillColor: 'transparent',
      textShadow: 'none',
    };
  };

  // Get shadow style
  const getShadowStyle = () => {
    if (effect !== 'shadow' && !shadow) return {};

    const shadowColorValue = shadowColor || (isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.3)');

    return {
      textShadow: `${shadowOffset}px ${shadowOffset}px ${shadowBlur}px ${shadowColorValue}`,
    };
  };

  // Get highlight style
  const getHighlightStyle = () => {
    if (effect !== 'highlight' && !highlight) return {};

    const highlightColorValue = highlightColor || (isDark ? theme.palette.primary.dark : theme.palette.primary.light);

    return {
      display: 'inline',
      boxDecorationBreak: 'clone',
      background: highlightColorValue,
      padding: '0.2em 0.4em',
      borderRadius: '0.2em',
    };
  };

  // Get glitch effect style
  const getGlitchStyle = () => {
    if (effect !== 'glitch') return {};

    return {
      position: 'relative',
      '&::before, &::after': {
        content: 'attr(data-text)',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      },
      '&::before': {
        left: '2px',
        textShadow: '-2px 0 #ff00c1',
        animation: 'glitch-anim-1 2s infinite linear alternate-reverse',
      },
      '&::after': {
        left: '-2px',
        textShadow: '2px 0 #00fff9',
        animation: 'glitch-anim-2 3s infinite linear alternate-reverse',
      },
      '@keyframes glitch-anim-1': {
        '0%': { clipPath: 'inset(20% 0 30% 0)' },
        '20%': { clipPath: 'inset(65% 0 13% 0)' },
        '40%': { clipPath: 'inset(43% 0 1% 0)' },
        '60%': { clipPath: 'inset(25% 0 58% 0)' },
        '80%': { clipPath: 'inset(13% 0 75% 0)' },
        '100%': { clipPath: 'inset(0% 0 98% 0)' },
      },
      '@keyframes glitch-anim-2': {
        '0%': { clipPath: 'inset(80% 0 5% 0)' },
        '20%': { clipPath: 'inset(24% 0 60% 0)' },
        '40%': { clipPath: 'inset(13% 0 33% 0)' },
        '60%': { clipPath: 'inset(80% 0 5% 0)' },
        '80%': { clipPath: 'inset(47% 0 44% 0)' },
        '100%': { clipPath: 'inset(0% 0 98% 0)' },
      },
    };
  };

  // Get animation variants
  const getAnimationVariants = () => {
    const baseVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          duration: animationDuration,
          delay: animationDelay,
          ease: 'easeOut',
        }
      }
    };

    const variantsMap = {
      fadeIn: baseVariants,
      fadeInUp: {
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: animationDuration,
            delay: animationDelay,
            ease: 'easeOut',
          }
        }
      },
      fadeInDown: {
        hidden: { opacity: 0, y: -20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: animationDuration,
            delay: animationDelay,
            ease: 'easeOut',
          }
        }
      },
      fadeInLeft: {
        hidden: { opacity: 0, x: -20 },
        visible: {
          opacity: 1,
          x: 0,
          transition: {
            duration: animationDuration,
            delay: animationDelay,
            ease: 'easeOut',
          }
        }
      },
      fadeInRight: {
        hidden: { opacity: 0, x: 20 },
        visible: {
          opacity: 1,
          x: 0,
          transition: {
            duration: animationDuration,
            delay: animationDelay,
            ease: 'easeOut',
          }
        }
      },
      zoomIn: {
        hidden: { opacity: 0, scale: 0.9 },
        visible: {
          opacity: 1,
          scale: 1,
          transition: {
            duration: animationDuration,
            delay: animationDelay,
            ease: 'easeOut',
          }
        }
      },
      typewriter: {
        hidden: { width: 0 },
        visible: {
          width: '100%',
          transition: {
            duration: animationDuration * 2,
            delay: animationDelay,
            ease: 'linear',
          }
        }
      },
    };

    return variantsMap[animationVariant] || baseVariants;
  };

  // Combine all styles
  const combinedStyles = {
    color: getColor(),
    letterSpacing: letterSpacing,
    lineHeight: lineHeight,
    fontWeight: fontWeight,
    fontStyle: fontStyle,
    textTransform: textTransform,
    ...getGradientStyle(),
    ...getOutlinedStyle(),
    ...getShadowStyle(),
    ...getHighlightStyle(),
    ...getGlitchStyle(),
    ...props.sx,
  };

  // Special case for typewriter animation
  if (animate && animationVariant === 'typewriter') {
    return (
      <Box
        sx={{
          display: 'inline-block',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
      >
        <Typography
          component={motion.div}
          variant={variant}
          initial="hidden"
          animate="visible"
          variants={getAnimationVariants()}
          data-text={children}
          sx={combinedStyles}
          {...props}
        >
          {children}
        </Typography>
      </Box>
    );
  }

  return (
    <Typography
      component={animate ? motion.div : 'div'}
      variant={variant}
      initial={animate ? "hidden" : undefined}
      animate={animate ? "visible" : undefined}
      variants={animate ? getAnimationVariants() : undefined}
      data-text={children}
      sx={combinedStyles}
      {...props}
    >
      {children}
    </Typography>
  );
};

ArtisticText.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.string,
  color: PropTypes.string,
  effect: PropTypes.oneOf(['none', 'gradient', 'outlined', 'shadow', 'highlight', 'glitch']),
  gradient: PropTypes.string,
  gradientDirection: PropTypes.number,
  gradientAnimation: PropTypes.bool,
  outlined: PropTypes.bool,
  outlineColor: PropTypes.string,
  outlineWidth: PropTypes.number,
  shadow: PropTypes.bool,
  shadowColor: PropTypes.string,
  shadowBlur: PropTypes.number,
  shadowOffset: PropTypes.number,
  highlight: PropTypes.bool,
  highlightColor: PropTypes.string,
  letterSpacing: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  lineHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  fontWeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  fontStyle: PropTypes.string,
  textTransform: PropTypes.string,
  animate: PropTypes.bool,
  animationVariant: PropTypes.oneOf(['fadeIn', 'fadeInUp', 'fadeInDown', 'fadeInLeft', 'fadeInRight', 'zoomIn', 'typewriter']),
  animationDelay: PropTypes.number,
  animationDuration: PropTypes.number,
  sx: PropTypes.object,
};

export default ArtisticText;
