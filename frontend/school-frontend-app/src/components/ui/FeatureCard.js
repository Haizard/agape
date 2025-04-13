import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Card, CardContent, CardActions, Button, useTheme, alpha } from '@mui/material';
import OptimizedImage from './OptimizedImage';

/**
 * FeatureCard - A component for displaying feature cards with images
 * 
 * Features:
 * - Image with hover effects
 * - Consistent styling with the design system
 * - Optional action button
 * - Multiple layout variants
 */
const FeatureCard = ({
  image,
  title,
  description,
  actionText,
  actionLink,
  onActionClick,
  variant = 'vertical',
  imageHeight = variant === 'vertical' ? 200 : '100%',
  imageWidth = variant === 'horizontal' ? '40%' : '100%',
  hoverEffect = true,
  elevation = 2,
  sx = {},
  ...props
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Default border radius
  const borderRadius = theme.shape?.borderRadius || 8;
  
  // Card styles based on variant
  const getCardStyles = () => {
    const baseStyles = {
      display: 'flex',
      flexDirection: variant === 'horizontal' ? 'row' : 'column',
      height: '100%',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      borderRadius,
      backgroundColor: isDark 
        ? alpha(theme.palette?.background?.paper || '#1E293B', 0.8)
        : theme.palette?.background?.paper || '#FFFFFF',
      '&:hover': hoverEffect ? {
        transform: 'translateY(-5px)',
        boxShadow: isDark
          ? '0 8px 25px rgba(0, 0, 0, 0.3)'
          : '0 8px 25px rgba(0, 0, 0, 0.1)',
      } : {},
      ...sx,
    };

    return baseStyles;
  };

  return (
    <Card
      elevation={elevation}
      sx={getCardStyles()}
      {...props}
    >
      {/* Image */}
      <Box
        sx={{
          width: imageWidth,
          height: imageHeight,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <OptimizedImage
          src={image}
          alt={title}
          width="100%"
          height="100%"
          fit="cover"
          hoverEffect={hoverEffect}
          hoverScale={1.1}
        />
      </Box>

      {/* Content */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          justifyContent: 'space-between',
          width: variant === 'horizontal' ? '60%' : '100%',
        }}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography 
            variant="h5" 
            component="h3" 
            gutterBottom
            sx={{ 
              fontWeight: 600,
              color: theme.palette?.primary?.main || '#3B82F6',
            }}
          >
            {title}
          </Typography>
          
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ 
              mb: 2,
              lineHeight: 1.6,
            }}
          >
            {description}
          </Typography>
        </CardContent>

        {actionText && (
          <CardActions sx={{ p: 2, pt: 0 }}>
            <Button 
              size="medium" 
              color="primary"
              href={actionLink}
              onClick={onActionClick}
              sx={{
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: alpha(theme.palette?.primary?.main || '#3B82F6', 0.08),
                },
              }}
            >
              {actionText}
            </Button>
          </CardActions>
        )}
      </Box>
    </Card>
  );
};

FeatureCard.propTypes = {
  image: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  actionText: PropTypes.string,
  actionLink: PropTypes.string,
  onActionClick: PropTypes.func,
  variant: PropTypes.oneOf(['vertical', 'horizontal']),
  imageHeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  imageWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  hoverEffect: PropTypes.bool,
  elevation: PropTypes.number,
  sx: PropTypes.object,
};

export default FeatureCard;
