import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Card, CardContent, Avatar, useTheme, alpha, IconButton, Stack } from '@mui/material';
import OptimizedImage from './OptimizedImage';

/**
 * ProfileCard - A component for displaying user profiles
 * 
 * Features:
 * - Avatar or profile image
 * - User details
 * - Optional background image
 * - Social media links
 */
const ProfileCard = ({
  name,
  role,
  description,
  avatar,
  backgroundImage,
  socialLinks = [],
  variant = 'standard',
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
      overflow: 'hidden',
      borderRadius,
      backgroundColor: isDark 
        ? alpha(theme.palette?.background?.paper || '#1E293B', 0.8)
        : theme.palette?.background?.paper || '#FFFFFF',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: isDark
          ? '0 8px 25px rgba(0, 0, 0, 0.3)'
          : '0 8px 25px rgba(0, 0, 0, 0.1)',
      },
      ...sx,
    };

    return baseStyles;
  };

  // Compact variant
  if (variant === 'compact') {
    return (
      <Card
        elevation={elevation}
        sx={getCardStyles()}
        {...props}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
          <Avatar
            src={avatar}
            alt={name}
            sx={{
              width: 60,
              height: 60,
              border: `2px solid ${theme.palette?.primary?.main || '#3B82F6'}`,
            }}
          />
          <Box sx={{ ml: 2 }}>
            <Typography variant="h6" component="h3" fontWeight={600}>
              {name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {role}
            </Typography>
            
            {socialLinks.length > 0 && (
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                {socialLinks.map((link, index) => (
                  <IconButton
                    key={index}
                    size="small"
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      color: theme.palette?.primary?.main || '#3B82F6',
                      p: 0.5,
                    }}
                  >
                    {link.icon}
                  </IconButton>
                ))}
              </Stack>
            )}
          </Box>
        </Box>
      </Card>
    );
  }

  // Standard variant
  return (
    <Card
      elevation={elevation}
      sx={getCardStyles()}
      {...props}
    >
      {/* Background Image */}
      {backgroundImage && (
        <Box sx={{ height: 120, position: 'relative' }}>
          <OptimizedImage
            src={backgroundImage}
            alt="Profile Background"
            width="100%"
            height="100%"
            fit="cover"
          />
        </Box>
      )}

      {/* Avatar */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mt: backgroundImage ? -6 : 3,
        }}
      >
        <Avatar
          src={avatar}
          alt={name}
          sx={{
            width: 100,
            height: 100,
            border: `4px solid ${theme.palette?.background?.paper || '#FFFFFF'}`,
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
          }}
        />
      </Box>

      {/* Content */}
      <CardContent sx={{ textAlign: 'center', pt: 2 }}>
        <Typography 
          variant="h5" 
          component="h3" 
          gutterBottom
          sx={{ fontWeight: 600 }}
        >
          {name}
        </Typography>
        
        <Typography 
          variant="subtitle1" 
          color="primary"
          sx={{ 
            mb: 2,
            fontWeight: 500,
          }}
        >
          {role}
        </Typography>
        
        {description && (
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            {description}
          </Typography>
        )}
        
        {socialLinks.length > 0 && (
          <Stack direction="row" spacing={1} justifyContent="center">
            {socialLinks.map((link, index) => (
              <IconButton
                key={index}
                size="small"
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ 
                  color: theme.palette?.primary?.main || '#3B82F6',
                }}
              >
                {link.icon}
              </IconButton>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

ProfileCard.propTypes = {
  name: PropTypes.string.isRequired,
  role: PropTypes.string.isRequired,
  description: PropTypes.string,
  avatar: PropTypes.string,
  backgroundImage: PropTypes.string,
  socialLinks: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.node.isRequired,
      url: PropTypes.string.isRequired,
    })
  ),
  variant: PropTypes.oneOf(['standard', 'compact']),
  elevation: PropTypes.number,
  sx: PropTypes.object,
};

export default ProfileCard;
