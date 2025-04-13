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

  // Default values for theme properties that might be missing
  const defaultBorderRadius = {
    small: 4,
    medium: 8,
    large: 12,
    pill: '9999px',
  };

  // Determine button shape (border radius)
  const getButtonShape = () => {
    // Check if theme.shape.components exists, otherwise use fallbacks
    const buttonRadius = theme.shape?.components?.button ||
                         theme.shape?.borderRadius ||
                         defaultBorderRadius.medium;

    const pillRadius = theme.shape?.borderRadiusPill || defaultBorderRadius.pill;

    const shapeMap = {
      square: 0,
      rounded: buttonRadius,
      pill: pillRadius,
    };

    return shapeMap[shape] || shape;
  };

  // Default shadows if theme values are not available
  const defaultShadows = {
    none: 'none',
    xsmall: '0 1px 2px rgba(0, 0, 0, 0.05)',
    small: '0 1px 3px rgba(0, 0, 0, 0.1)',
    medium: '0 4px 6px rgba(0, 0, 0, 0.1)',
    large: '0 10px 15px rgba(0, 0, 0, 0.1)',
  };

  // Determine shadow
  const getShadow = (depth = shadowDepth) => {
    const shadowMap = {
      none: 'none',
      xsmall: theme.shadows?.[1] || defaultShadows.xsmall,
      small: theme.shadows?.[2] || defaultShadows.small,
      medium: theme.shadows?.[3] || defaultShadows.medium,
      large: theme.shadows?.[4] || defaultShadows.large,
    };

    return shadowMap[depth] || depth;
  };

  // Default color values if theme properties are missing
  const getColorValue = (colorName) => {
    const defaultColors = {
      primary: isDark ? '#3B82F6' : '#2563EB',
      secondary: isDark ? '#A855F7' : '#9333EA',
      error: isDark ? '#F43F5E' : '#E11D48',
      warning: isDark ? '#FB923C' : '#F97316',
      info: isDark ? '#38BDF8' : '#0EA5E9',
      success: isDark ? '#4ADE80' : '#22C55E',
    };

    return theme.palette?.[colorName]?.main || defaultColors[colorName] || defaultColors.primary;
  };

  // Determine hover animation
  const getHoverAnimation = () => {
    // Get the appropriate color value with fallback
    const buttonColor = getColorValue(color);
    const glowColorValue = glowColor || buttonColor;

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
          boxShadow: `0 0 15px ${glowColorValue}`,
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
    // Get the appropriate color values with fallbacks
    const buttonColor = getColorValue(color);
    const buttonLightColor = theme.palette?.[color]?.light || buttonColor;
    const buttonContrastText = theme.palette?.[color]?.contrastText || (isDark ? '#000000' : '#FFFFFF');

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
        background: gradient || `linear-gradient(45deg, ${buttonColor} 0%, ${buttonLightColor} 100%)`,
        color: buttonContrastText,
        border: 'none',
        boxShadow: getShadow('medium'),
      },
      // Ghost variant
      ghost: {
        backgroundColor: 'transparent',
        color: buttonColor,
        boxShadow: 'none',
        '&:hover': {
          backgroundColor: isDark
            ? `rgba(${hexToRgb(buttonColor)}, 0.15)`
            : `rgba(${hexToRgb(buttonColor)}, 0.08)`,
        },
      },
      // Soft variant
      soft: {
        backgroundColor: isDark
          ? `rgba(${hexToRgb(buttonColor)}, 0.2)`
          : `rgba(${hexToRgb(buttonColor)}, 0.1)`,
        color: buttonColor,
        boxShadow: 'none',
        '&:hover': {
          backgroundColor: isDark
            ? `rgba(${hexToRgb(buttonColor)}, 0.3)`
            : `rgba(${hexToRgb(buttonColor)}, 0.2)`,
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
