import React from 'react';
import PropTypes from 'prop-types';
import { Button, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

/**
 * ArtisticButton - A highly customizable button component with intentional design choices
 *
 * Features:
 * - Multiple design variants (solid, outline, ghost, gradient, etc.)
 * - Customizable hover and press effects
 * - Intentional shadows and borders
 * - Smooth animations
 */
const ArtisticButton = ({
  children,
  variant = 'contained',
  color = 'primary',
  size = 'medium',
  shape = 'rounded',
  hoverEffect = 'lift',
  pressEffect = true,
  gradient,
  glowOnHover = false,
  glowColor,
  borderWidth = 2,
  shadowDepth = 'small',
  hoverShadowDepth = 'medium',
  textGradient,
  ...props
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Determine button shape (border radius)
  const getButtonShape = () => {
    const shapeMap = {
      square: 0,
      rounded: theme.shape.components.button || theme.shape.borderRadiusMedium,
      pill: theme.shape.borderRadiusPill,
    };

    return shapeMap[shape] || shape;
  };

  // Determine shadow
  const getShadow = (depth = shadowDepth) => {
    const shadowMap = {
      none: 'none',
      xsmall: theme.shadows[1],
      small: theme.shadows[2],
      medium: theme.shadows[3],
      large: theme.shadows[4],
    };

    return shadowMap[depth] || depth;
  };

  // Determine hover animation
  const getHoverAnimation = () => {
    switch (hoverEffect) {
      case 'none':
        return {};
      case 'lift':
        return {
          y: -4,
          boxShadow: getShadow(hoverShadowDepth),
          transition: {
            duration: 0.2,
            ease: 'easeOut',
          }
        };
      case 'scale':
        return {
          scale: 1.05,
          boxShadow: getShadow(hoverShadowDepth),
          transition: {
            duration: 0.2,
            ease: 'easeOut',
          }
        };
      case 'glow':
        return {
          boxShadow: `0 0 15px ${glowColor || theme.palette[color].main}`,
          transition: {
            duration: 0.2,
            ease: 'easeOut',
          }
        };
      default:
        return {};
    }
  };

  // Determine press animation
  const getPressAnimation = () => {
    return pressEffect ? { scale: 0.97 } : {};
  };

  // Get custom styles based on variant
  const getCustomStyles = () => {
    // Base styles
    const baseStyles = {
      textTransform: 'none',
      fontWeight: 600,
      borderRadius: getButtonShape(),
      boxShadow: getShadow(),
      transition: 'all 300ms ease-in-out',
    };

    // Size-specific padding
    const sizeStyles = {
      small: {
        px: 2.5,
        py: 0.75,
        fontSize: '0.8125rem',
      },
      medium: {
        px: 3,
        py: 1,
        fontSize: '0.875rem',
      },
      large: {
        px: 4,
        py: 1.5,
        fontSize: '1rem',
      },
    };

    // Variant-specific styles
    const variantStyles = {
      // Gradient variant
      gradient: {
        background: gradient || `linear-gradient(45deg, ${theme.palette[color].main} 0%, ${theme.palette[color].light} 100%)`,
        color: theme.palette[color].contrastText,
        border: 'none',
        boxShadow: getShadow('medium'),
      },
      // Ghost variant
      ghost: {
        backgroundColor: 'transparent',
        color: theme.palette[color].main,
        boxShadow: 'none',
        '&:hover': {
          backgroundColor: isDark
            ? `rgba(${hexToRgb(theme.palette[color].main)}, 0.15)`
            : `rgba(${hexToRgb(theme.palette[color].main)}, 0.08)`,
        },
      },
      // Soft variant
      soft: {
        backgroundColor: isDark
          ? `rgba(${hexToRgb(theme.palette[color].main)}, 0.2)`
          : `rgba(${hexToRgb(theme.palette[color].main)}, 0.1)`,
        color: theme.palette[color].main,
        boxShadow: 'none',
        '&:hover': {
          backgroundColor: isDark
            ? `rgba(${hexToRgb(theme.palette[color].main)}, 0.3)`
            : `rgba(${hexToRgb(theme.palette[color].main)}, 0.2)`,
        },
      },
      // Outlined variant customization
      outlined: {
        borderWidth: borderWidth,
        '&:hover': {
          borderWidth: borderWidth,
        },
      },
    };

    // Text gradient (if specified)
    const textGradientStyle = textGradient ? {
      background: textGradient,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      textFillColor: 'transparent',
    } : {};

    return {
      ...baseStyles,
      ...sizeStyles[size],
      ...(variantStyles[variant] || {}),
      ...textGradientStyle,
    };
  };

  // Helper function to convert hex to rgb
  const hexToRgb = (hexColor) => {
    // Default fallback if conversion fails
    if (!hexColor || typeof hexColor !== 'string') return '0, 0, 0';

    // Remove # if present
    const cleanHex = hexColor.replace('#', '');

    // Convert 3-digit hex to 6-digit
    const fullHex = cleanHex.length === 3
      ? cleanHex.split('').map(char => char + char).join('')
      : cleanHex;

    // Convert hex to rgb
    const r = Number.parseInt(fullHex.substring(0, 2), 16);
    const g = Number.parseInt(fullHex.substring(2, 4), 16);
    const b = Number.parseInt(fullHex.substring(4, 6), 16);

    return `${r}, ${g}, ${b}`;
  };

  // Determine which MUI variant to use
  const getMuiVariant = () => {
    const variantMap = {
      gradient: 'contained',
      ghost: 'text',
      soft: 'contained',
    };

    return variantMap[variant] || variant;
  };

  return (
    <Button
      component={motion.button}
      variant={getMuiVariant()}
      color={color}
      size={size}
      whileHover={getHoverAnimation()}
      whileTap={getPressAnimation()}
      sx={getCustomStyles()}
      disableElevation={variant === 'ghost' || variant === 'soft'}
      {...props}
    >
      {children}
    </Button>
  );
};

ArtisticButton.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['contained', 'outlined', 'text', 'gradient', 'ghost', 'soft']),
  color: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  shape: PropTypes.oneOf(['square', 'rounded', 'pill']),
  hoverEffect: PropTypes.oneOf(['none', 'lift', 'scale', 'glow']),
  pressEffect: PropTypes.bool,
  gradient: PropTypes.string,
  glowOnHover: PropTypes.bool,
  glowColor: PropTypes.string,
  borderWidth: PropTypes.number,
  shadowDepth: PropTypes.oneOf(['none', 'xsmall', 'small', 'medium', 'large']),
  hoverShadowDepth: PropTypes.oneOf(['none', 'xsmall', 'small', 'medium', 'large']),
  textGradient: PropTypes.string,
};

export default ArtisticButton;
