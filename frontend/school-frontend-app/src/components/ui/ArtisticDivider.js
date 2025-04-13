import React from 'react';
import PropTypes from 'prop-types';
import { Box, Divider, useTheme } from '@mui/material';

/**
 * ArtisticDivider - A highly customizable divider component with intentional design choices
 *
 * Features:
 * - Multiple design variants (solid, dashed, dotted, gradient, etc.)
 * - Customizable thickness, width, and spacing
 * - Optional decorative elements
 */
const ArtisticDivider = ({
  variant = 'solid',
  orientation = 'horizontal',
  thickness = 1,
  length = '100%',
  color,
  gradient,
  spacing = 2,
  opacity = 1,
  withText,
  textPosition = 'center',
  withIcon,
  iconPosition = 'center',
  decorative = false,
  decorativeStyle = 'dots',
  decorativeCount = 3,
  decorativeSpacing = 4,
  decorativeSize = 4,
  ...props
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Get color from theme or use custom color
  const getColor = () => {
    if (color) return theme.palette[color]?.main || color;
    return isDark ? theme.palette.divider : theme.palette.divider;
  };

  // Get gradient style
  const getGradientStyle = () => {
    if (variant !== 'gradient' && !gradient) return {};

    return {
      background: gradient || `linear-gradient(${orientation === 'horizontal' ? '90deg' : '180deg'}, transparent, ${getColor()}, transparent)`,
    };
  };

  // Get border style based on variant
  const getBorderStyle = () => {
    const borderStyles = {
      solid: 'solid',
      dashed: 'dashed',
      dotted: 'dotted',
      double: 'double',
      groove: 'groove',
      ridge: 'ridge',
      inset: 'inset',
      outset: 'outset',
    };

    return borderStyles[variant] || 'solid';
  };

  // Get decorative elements
  const getDecorativeElements = () => {
    if (!decorative) return null;

    const elements = [];

    for (let i = 0; i < decorativeCount; i++) {
      let element;

      switch (decorativeStyle) {
        case 'dots':
          element = (
            <Box
              key={i}
              sx={{
                width: decorativeSize,
                height: decorativeSize,
                borderRadius: '50%',
                backgroundColor: getColor(),
                opacity,
              }}
            />
          );
          break;
        case 'squares':
          element = (
            <Box
              key={i}
              sx={{
                width: decorativeSize,
                height: decorativeSize,
                backgroundColor: getColor(),
                opacity,
              }}
            />
          );
          break;
        case 'diamonds':
          element = (
            <Box
              key={i}
              sx={{
                width: decorativeSize,
                height: decorativeSize,
                backgroundColor: getColor(),
                opacity,
                transform: 'rotate(45deg)',
              }}
            />
          );
          break;
        case 'lines':
          element = (
            <Box
              key={i}
              sx={{
                width: orientation === 'horizontal' ? 1 : decorativeSize,
                height: orientation === 'horizontal' ? decorativeSize : 1,
                backgroundColor: getColor(),
                opacity,
              }}
            />
          );
          break;
        default:
          element = (
            <Box
              key={i}
              sx={{
                width: decorativeSize,
                height: decorativeSize,
                borderRadius: '50%',
                backgroundColor: getColor(),
                opacity,
              }}
            />
          );
      }

      elements.push(element);
    }

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: orientation === 'horizontal' ? 'row' : 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: decorativeSpacing,
          my: orientation === 'horizontal' ? spacing : 0,
          mx: orientation === 'vertical' ? spacing : 0,
        }}
      >
        {elements}
      </Box>
    );
  };

  // Render divider with text
  if (withText) {
    return (
      <Divider
        textAlign={textPosition}
        sx={{
          '&::before, &::after': {
            borderColor: getColor(),
            borderTopStyle: getBorderStyle(),
            borderTopWidth: thickness,
            opacity,
            ...getGradientStyle(),
          },
          my: orientation === 'horizontal' ? spacing : 0,
          mx: orientation === 'vertical' ? spacing : 0,
          ...props.sx,
        }}
        {...props}
      >
        {withText}
      </Divider>
    );
  }

  // Render divider with icon
  if (withIcon) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          width: orientation === 'horizontal' ? length : 'auto',
          height: orientation === 'vertical' ? length : 'auto',
          my: orientation === 'horizontal' ? spacing : 0,
          mx: orientation === 'vertical' ? spacing : 0,
          ...props.sx,
        }}
      >
        {iconPosition !== 'start' && (
          <Divider
            orientation={orientation}
            flexItem
            sx={{
              flex: iconPosition === 'center' ? 1 : 2,
              borderColor: getColor(),
              borderStyle: getBorderStyle(),
              borderWidth: thickness,
              opacity,
              ...getGradientStyle(),
            }}
          />
        )}
        <Box sx={{ px: orientation === 'horizontal' ? 2 : 0, py: orientation === 'vertical' ? 2 : 0 }}>
          {withIcon}
        </Box>
        {iconPosition !== 'end' && (
          <Divider
            orientation={orientation}
            flexItem
            sx={{
              flex: iconPosition === 'center' ? 1 : 2,
              borderColor: getColor(),
              borderStyle: getBorderStyle(),
              borderWidth: thickness,
              opacity,
              ...getGradientStyle(),
            }}
          />
        )}
      </Box>
    );
  }

  // Render decorative divider
  if (decorative) {
    return getDecorativeElements();
  }

  // Render standard divider
  return (
    <Divider
      orientation={orientation}
      sx={{
        width: orientation === 'horizontal' ? length : thickness,
        height: orientation === 'vertical' ? length : thickness,
        borderColor: getColor(),
        borderStyle: getBorderStyle(),
        borderWidth: thickness,
        opacity,
        my: orientation === 'horizontal' ? spacing : 0,
        mx: orientation === 'vertical' ? spacing : 0,
        ...getGradientStyle(),
        ...props.sx,
      }}
      {...props}
    />
  );
};

ArtisticDivider.propTypes = {
  variant: PropTypes.oneOf(['solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset', 'gradient']),
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  thickness: PropTypes.number,
  length: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.object]),
  color: PropTypes.string,
  gradient: PropTypes.string,
  spacing: PropTypes.number,
  opacity: PropTypes.number,
  withText: PropTypes.node,
  textPosition: PropTypes.oneOf(['center', 'left', 'right']),
  withIcon: PropTypes.node,
  iconPosition: PropTypes.oneOf(['center', 'start', 'end']),
  decorative: PropTypes.bool,
  decorativeStyle: PropTypes.oneOf(['dots', 'squares', 'diamonds', 'lines']),
  decorativeCount: PropTypes.number,
  decorativeSpacing: PropTypes.number,
  decorativeSize: PropTypes.number,
  sx: PropTypes.object,
};

export default ArtisticDivider;
