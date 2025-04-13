import React from 'react';
import PropTypes from 'prop-types';
import { Box, Paper, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

/**
 * ArtisticCard - A highly customizable card component with intentional design choices
 *
 * Features:
 * - Multiple design variants (glass, elevated, bordered, etc.)
 * - Customizable hover effects
 * - Intentional shadows and borders
 * - Smooth animations
 */
const ArtisticCard = ({
  children,
  variant = 'elevated',
  hoverEffect = 'lift',
  borderAccent = false,
  borderSide = 'left',
  borderWidth = 4,
  borderColor,
  cornerRadius = 'medium',
  glassOpacity = 0.8,
  shadowDepth = 'medium',
  hoverShadowDepth = 'large',
  background,
  backgroundOpacity = 1,
  backgroundGradient,
  clickable = false,
  ...props
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Default border radius values
  const defaultBorderRadius = {
    small: 4,
    medium: 8,
    large: 12,
    xlarge: 16,
    pill: '9999px',
    asymmetric: {
      topLeft: 4,
      topRight: 16,
      bottomRight: 4,
      bottomLeft: 16,
    }
  };

  // Determine corner radius
  const getCornerRadius = () => {
    // Get asymmetric border radius with fallback
    const asymmetricBorderRadius = theme.shape?.borderRadiusAsymmetric || defaultBorderRadius.asymmetric;

    const radiusMap = {
      none: 0,
      small: theme.shape?.borderRadiusSmall || defaultBorderRadius.small,
      medium: theme.shape?.borderRadiusMedium || defaultBorderRadius.medium,
      large: theme.shape?.borderRadiusLarge || defaultBorderRadius.large,
      xlarge: theme.shape?.borderRadiusXLarge || defaultBorderRadius.xlarge,
      pill: theme.shape?.borderRadiusPill || defaultBorderRadius.pill,
      asymmetric: `${asymmetricBorderRadius.topLeft}px
                   ${asymmetricBorderRadius.topRight}px
                   ${asymmetricBorderRadius.bottomRight}px
                   ${asymmetricBorderRadius.bottomLeft}px`,
    };

    return radiusMap[cornerRadius] || cornerRadius;
  };

  // Determine shadow
  const getShadow = (depth = shadowDepth) => {
    // Default shadows if theme values are not available
    const defaultShadows = {
      none: 'none',
      xsmall: '0 1px 2px rgba(0, 0, 0, 0.05)',
      small: '0 1px 3px rgba(0, 0, 0, 0.1)',
      medium: '0 4px 6px rgba(0, 0, 0, 0.1)',
      large: '0 10px 15px rgba(0, 0, 0, 0.1)',
      xlarge: '0 20px 25px rgba(0, 0, 0, 0.15)',
    };

    // Use theme shadows if available, otherwise use defaults
    const shadowMap = {
      none: 'none',
      xsmall: theme.shadows?.[1] || defaultShadows.xsmall,
      small: theme.shadows?.[2] || defaultShadows.small,
      medium: theme.shadows?.[4] || defaultShadows.medium,
      large: theme.shadows?.[8] || defaultShadows.large,
      xlarge: theme.shadows?.[16] || defaultShadows.xlarge,
    };

    return shadowMap[depth] || depth;
  };

  // Determine hover animation
  const getHoverAnimation = () => {
    // Default primary color if not available in theme
    const defaultPrimaryColor = isDark ? '#3B82F6' : '#2563EB';

    // Get primary color from theme or use default
    const primaryMainColor = theme.palette?.primary?.main || defaultPrimaryColor;

    switch (hoverEffect) {
      case 'none':
        return {};
      case 'lift':
        return {
          y: -8,
          boxShadow: getShadow(hoverShadowDepth),
          transition: {
            duration: 0.3,
            ease: "easeOut",
          }
        };
      case 'scale':
        return {
          scale: 1.03,
          boxShadow: getShadow(hoverShadowDepth),
          transition: {
            duration: 0.3,
            ease: "easeOut",
          }
        };
      case 'glow':
        return {
          boxShadow: `0 0 20px ${borderColor || primaryMainColor}`,
          transition: {
            duration: 0.3,
            ease: "easeOut",
          }
        };
      case 'border':
        return {
          borderColor: borderColor || primaryMainColor,
          transition: {
            duration: 0.3,
            ease: "easeOut",
          }
        };
      default:
        return {};
    }
  };

  // Determine background style
  const getBackgroundStyle = () => {
    // Default background colors if not available in theme
    const defaultBackgrounds = {
      paper: isDark ? '#1E293B' : '#FFFFFF',
      default: isDark ? '#0F172A' : '#F8FAFC',
      subtle: isDark ? '#1E293B' : '#F1F5F9',
    };

    // Glass variant
    if (variant === 'glass') {
      return {
        backdropFilter: 'blur(10px)',
        backgroundColor: isDark
          ? `rgba(30, 41, 59, ${glassOpacity})`
          : `rgba(255, 255, 255, ${glassOpacity})`,
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.7)'}`,
      };
    }

    // Custom background
    if (background) {
      return {
        backgroundColor: background,
        opacity: backgroundOpacity,
      };
    }

    // Gradient background
    if (backgroundGradient) {
      return {
        background: backgroundGradient,
      };
    }

    // Get background colors from theme or use defaults
    const paperBg = theme.palette?.background?.paper || defaultBackgrounds.paper;
    const defaultBg = theme.palette?.background?.default || defaultBackgrounds.default;
    const subtleBg = theme.palette?.background?.subtle || defaultBackgrounds.subtle;

    // Default backgrounds based on variant
    const variantBackgrounds = {
      elevated: paperBg,
      flat: defaultBg,
      outlined: 'transparent',
      subtle: subtleBg,
    };

    return {
      backgroundColor: variantBackgrounds[variant] || paperBg,
    };
  };

  // Determine border style
  const getBorderStyle = () => {
    // Default border and primary colors if not available in theme
    const defaultBorderColor = isDark ? 'rgba(203, 213, 225, 0.15)' : 'rgba(148, 163, 184, 0.2)';
    const defaultPrimaryColor = isDark ? '#3B82F6' : '#2563EB';

    // Get border color from theme or use default
    const borderMainColor = theme.palette?.border?.main || defaultBorderColor;
    const primaryMainColor = theme.palette?.primary?.main || defaultPrimaryColor;

    // Outlined variant
    if (variant === 'outlined') {
      return {
        border: `1px solid ${borderMainColor}`,
      };
    }

    // Border accent
    if (borderAccent) {
      const accentColor = borderColor || primaryMainColor;

      const borderStyles = {
        all: {
          border: `${borderWidth}px solid ${accentColor}`,
        },
        left: {
          borderLeft: `${borderWidth}px solid ${accentColor}`,
        },
        right: {
          borderRight: `${borderWidth}px solid ${accentColor}`,
        },
        top: {
          borderTop: `${borderWidth}px solid ${accentColor}`,
        },
        bottom: {
          borderBottom: `${borderWidth}px solid ${accentColor}`,
        },
      };

      return borderStyles[borderSide] || borderStyles.left;
    }

    return {};
  };

  return (
    <Box
      component={motion.div}
      whileHover={hoverEffect !== 'none' ? getHoverAnimation() : undefined}
      whileTap={clickable ? { scale: 0.98 } : undefined}
      sx={{
        overflow: 'hidden',
        height: '100%',
        cursor: clickable ? 'pointer' : 'default',
        ...props.sx
      }}
      {...props}
    >
      <Paper
        elevation={0}
        sx={{
          height: '100%',
          borderRadius: getCornerRadius(),
          boxShadow: getShadow(),
          transition: 'all 300ms ease-in-out',
          overflow: 'hidden',
          position: 'relative',
          ...getBackgroundStyle(),
          ...getBorderStyle(),
        }}
      >
        {children}
      </Paper>
    </Box>
  );
};

ArtisticCard.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['elevated', 'flat', 'outlined', 'glass', 'subtle']),
  hoverEffect: PropTypes.oneOf(['none', 'lift', 'scale', 'glow', 'border']),
  borderAccent: PropTypes.bool,
  borderSide: PropTypes.oneOf(['all', 'left', 'right', 'top', 'bottom']),
  borderWidth: PropTypes.number,
  borderColor: PropTypes.string,
  cornerRadius: PropTypes.oneOfType([
    PropTypes.oneOf(['none', 'small', 'medium', 'large', 'xlarge', 'pill', 'asymmetric']),
    PropTypes.number,
    PropTypes.string,
  ]),
  glassOpacity: PropTypes.number,
  shadowDepth: PropTypes.oneOf(['none', 'xsmall', 'small', 'medium', 'large', 'xlarge']),
  hoverShadowDepth: PropTypes.oneOf(['none', 'xsmall', 'small', 'medium', 'large', 'xlarge']),
  background: PropTypes.string,
  backgroundOpacity: PropTypes.number,
  backgroundGradient: PropTypes.string,
  clickable: PropTypes.bool,
  sx: PropTypes.object,
};

export default ArtisticCard;
