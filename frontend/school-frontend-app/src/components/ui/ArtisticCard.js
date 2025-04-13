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

  // Determine corner radius
  const getCornerRadius = () => {
    const radiusMap = {
      none: 0,
      small: theme.shape.borderRadiusSmall,
      medium: theme.shape.borderRadiusMedium,
      large: theme.shape.borderRadiusLarge,
      xlarge: theme.shape.borderRadiusXLarge,
      pill: theme.shape.borderRadiusPill,
      asymmetric: `${theme.shape.borderRadiusAsymmetric.topLeft}px
                   ${theme.shape.borderRadiusAsymmetric.topRight}px
                   ${theme.shape.borderRadiusAsymmetric.bottomRight}px
                   ${theme.shape.borderRadiusAsymmetric.bottomLeft}px`,
    };

    return radiusMap[cornerRadius] || cornerRadius;
  };

  // Determine shadow
  const getShadow = (depth = shadowDepth) => {
    const shadowMap = {
      none: 'none',
      xsmall: theme.shadows[1],
      small: theme.shadows[2],
      medium: theme.shadows[4],
      large: theme.shadows[8],
      xlarge: theme.shadows[16],
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
          boxShadow: `0 0 20px ${borderColor || theme.palette.primary.main}`,
          transition: {
            duration: 0.3,
            ease: "easeOut",
          }
        };
      case 'border':
        return {
          borderColor: borderColor || theme.palette.primary.main,
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

    // Default backgrounds based on variant
    const variantBackgrounds = {
      elevated: isDark ? theme.palette.background.paper : theme.palette.background.paper,
      flat: isDark ? theme.palette.background.default : theme.palette.background.default,
      outlined: 'transparent',
      subtle: isDark ? theme.palette.background.subtle : theme.palette.background.subtle,
    };

    return {
      backgroundColor: variantBackgrounds[variant] || theme.palette.background.paper,
    };
  };

  // Determine border style
  const getBorderStyle = () => {
    // Outlined variant
    if (variant === 'outlined') {
      return {
        border: `1px solid ${isDark ? theme.palette.border.main : theme.palette.border.main}`,
      };
    }

    // Border accent
    if (borderAccent) {
      const borderStyles = {
        all: {
          border: `${borderWidth}px solid ${borderColor || theme.palette.primary.main}`,
        },
        left: {
          borderLeft: `${borderWidth}px solid ${borderColor || theme.palette.primary.main}`,
        },
        right: {
          borderRight: `${borderWidth}px solid ${borderColor || theme.palette.primary.main}`,
        },
        top: {
          borderTop: `${borderWidth}px solid ${borderColor || theme.palette.primary.main}`,
        },
        bottom: {
          borderBottom: `${borderWidth}px solid ${borderColor || theme.palette.primary.main}`,
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
